---
layout: post
title: "Serving LLMs at Scale: What Nobody Tells You About GPU Infrastructure"
date: 2026-04-26
categories: ai-infrastructure
tags: gpu kubernetes llm inference mlops nvidia
---

Running a large language model locally on your laptop is a weekend project. Running it reliably in production for hundreds of concurrent users is an infrastructure problem that will test every assumption you have about Kubernetes, GPU scheduling, and cost management.

This is what I learned building EGS — Elastic GPU Service — at Avesha Systems: a platform that dynamically provisions GPU nodes for LLM inference workloads and monitors utilisation across NVIDIA and AMD hardware.

## Why GPUs Make Kubernetes Hard

Kubernetes was built for CPU workloads. The scheduler's mental model is: "this pod needs X millicores and Y megabytes of RAM — find a node that has them." Resources are fungible, divisible, and countable.

GPUs break every one of those assumptions:

**GPUs are not fungible.** An A100 and a T4 are both "1 GPU" to the Kubernetes scheduler by default. But the A100 has 80GB of VRAM and can serve a 70B parameter model. The T4 has 16GB and can barely fit a 7B model with quantisation. Treating them as equivalent is a silent correctness bug.

**GPUs are mostly not divisible.** A pod either gets the whole GPU or it doesn't (with some exceptions for MIG partitioning on A100/H100). This means a small model that uses 4GB of a 40GB A100 leaves 36GB completely wasted — on hardware that costs $3/hour on cloud providers.

**GPU nodes are expensive and slow to provision.** A CPU node comes up in 60-90 seconds. A GPU node with the NVIDIA driver stack, CUDA libraries, and device plugin can take 5-10 minutes to be ready for workloads. This changes the entire autoscaling calculus.

## The Architecture of EGS

The core problem EGS solves: a user wants to run inference on a model. They shouldn't need to know which GPU node to use, whether that node exists yet, or how to configure the CUDA runtime. They should get an endpoint.

```
User Request
    |
    v
EGS Controller (Kubernetes Operator)
    |
    |--- Model Registry: "what are the hardware requirements for this model?"
    |
    |--- Node Provisioner: "is there a node with a matching GPU available?"
    |         |
    |         |-- Yes: schedule directly
    |         |-- No:  provision new GPU node via cloud provider API
    |
    |--- Pod Scheduler: create inference pod with correct resource requests
    |
    v
Inference Endpoint (exposed as Kubernetes Service)
```

*Disclaimer*: The code below is a very high level logic and does not represent the enterprise level sophisticated logic used in our product. 

The key insight: the operator needs to be **aware of GPU topology**, not just GPU count. We annotate nodes with GPU model, VRAM and CUDA compute capability. The scheduling logic uses these annotations to match models to appropriate hardware.

```go
type GPUNodeSelector struct {
    GPUModel         string // "A100-SXM4-80GB", "RTX-4090", etc.
    MinVRAMGiB       int
    CUDACapability   string // "8.0", "8.6", etc.
}

func (s *Scheduler) FindSuitableNode(ctx context.Context, req GPUNodeSelector) (*corev1.Node, error) {
    nodes := &corev1.NodeList{}
    if err := s.client.List(ctx, nodes, matchingLabels(req)); err != nil {
        return nil, err
    }

    for _, node := range nodes.Items {
        if isNodeReady(&node) && hasCapacity(&node, req) {
            return &node, nil
        }
    }

    // No suitable node found — trigger provisioning
    return nil, ErrNoSuitableNode
}
```

## Dynamic Node Provisioning

This is where it gets interesting. Most Kubernetes autoscaling (HPA, VPA, Cluster Autoscaler) works reactively: a pod is pending, a node gets added. The problem with GPU workloads is that the provisioning latency is too high. By the time the node is ready, the user has been waiting 8 minutes.

EGS uses **predictive provisioning**: we maintain a warm pool of GPU nodes based on historical demand patterns. When a node is used, we trigger provisioning of a replacement before the pool is empty.

The warm pool size is a tradeoff. Too small and users wait. Too large and you're paying for idle GPU nodes at $3+/hour. We built a simple forecasting model — not ML, just time-series patterns — that adjusts the pool size based on time-of-day and day-of-week demand.

For sudden demand spikes, we still fall back to on-demand provisioning. The UX is honest about it: the API returns a 202 Accepted with an estimated ready time rather than blocking.

## GPU Utilisation Monitoring: Harder Than It Looks

The NVIDIA Device Plugin for Kubernetes exposes GPU count as a resource. It does not tell you what's happening *inside* that GPU. For that you need the **NVIDIA DCGM** (Data Center GPU Manager) and its Kubernetes exporter.

DCGM gives you:
- `DCGM_FI_DEV_GPU_UTIL` — GPU compute utilisation (%)
- `DCGM_FI_DEV_MEM_COPY_UTIL` — Memory bandwidth utilisation (%)
- `DCGM_FI_DEV_FB_USED` — Framebuffer (VRAM) used in MiB
- `DCGM_FI_DEV_POWER_USAGE` — Power draw in watts
- `DCGM_FI_DEV_SM_CLOCK` — SM clock frequency

For AMD GPUs, the equivalent is **ROCm SMI**, which exposes similar metrics but through a different interface. We built an adapter layer so the EGS monitoring stack speaks a unified internal format regardless of GPU vendor.

The metric that matters most for LLM inference is not GPU utilisation — it's **memory utilisation**. An LLM server is usually memory-bandwidth-bound, not compute-bound. A GPU showing 30% compute utilisation but 95% VRAM utilisation is fully saturated. Alerting on compute % alone gives you a false sense of headroom.

## The Cost Problem

GPU infrastructure is brutally expensive. Every architectural decision has a cost implication:

- Leaving GPU nodes idle between requests: $$$
- Provisioning new nodes for every request: slow UX + $$$
- Oversubscribing GPU VRAM: model crashes at runtime

The lever we found most effective: **model quantisation + bin-packing**. A 13B parameter model in FP16 needs ~26GB VRAM. In INT8 quantisation it needs ~13GB. On an A100-40GB you can fit two INT8 instances vs one FP16 instance — and for most inference tasks the quality difference is negligible.

EGS tracks which models have quantised variants in the registry and will prefer them for scheduling when VRAM is the bottleneck. The user specifies their quality requirements; the platform picks the right variant.

## What's Next

The honest state of GPU orchestration in Kubernetes today: it works, but you're constantly fighting the scheduler's CPU-centric assumptions. The ecosystem is improving — **KAI Scheduler** (CNCF Sandbox), MIG support in the device plugin, and **NVIDIA GPU Operator** significantly reduce the operational burden.

The next frontier is **multi-GPU inference** — models too large to fit on a single GPU — where you need tensor parallelism across devices. This requires the scheduler to be aware of NVLink topology, PCIe bandwidth, and inter-node interconnects. Nobody has a clean Kubernetes-native solution for this yet. It's an open problem.

---

*Building GPU infrastructure in production? I'm happy to talk through the specifics. Reach out on [LinkedIn](https://linkedin.com/in/gourishkbiradar).*
