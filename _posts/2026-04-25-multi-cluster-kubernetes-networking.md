---
layout: post
title: "Why Multi-Cluster Kubernetes is Hard — and How We Solved It"
date: 2026-04-25
categories: [kubernetes]
tags: [kubernetes, multi-cluster, networking, cncf, kubeslice]
---

For a long time, Kubernetes was sold as the solution to distributed systems complexity. And to be fair — for a single cluster, it largely delivers. But the moment you need to run workloads across multiple clusters, across cloud providers, across regions — the abstraction breaks down completely.

This is the problem I've been working on for the past three years at Avesha Systems, building [KubeSlice](https://github.com/kubeslice) — a CNCF Sandbox project for multi-cluster networking. Here's what I learned about why this problem is genuinely hard, and the architectural choices we made.

## The Problem: Kubernetes Networking Stops at the Cluster Boundary

Kubernetes gives you a flat network model within a cluster. Every pod gets an IP. Every pod can talk to every other pod. Service discovery via DNS just works. This is the Contract.

But across clusters? Nothing. The contract ends at the etcd boundary.

If you run a microservice in `cluster-A` and a database in `cluster-B`, you have to solve:

- **Routing**: How does a pod in cluster-A even know how to reach cluster-B?
- **Identity**: Is the traffic from cluster-A trusted by cluster-B?
- **Service discovery**: How does your app in cluster-A find `db.svc.cluster.local` from cluster-B?
- **Policy**: Who controls what's allowed to communicate across the boundary?

Teams typically hack around this with NodePort services, external load balancers, or VPN tunnels. None of these scale. All of them leak cluster internals. Most of them require manual firewall rules.

## The Abstraction: Slices

The core idea in KubeSlice is the **Slice** — a logical network overlay that spans multiple clusters and gives you the flat-network experience of a single cluster, across cluster boundaries.

```
Cluster A                      Cluster B
+-----------+                  +-----------+
| Pod A     |                  | Pod B     |
| 10.1.0.5  | <-- Slice VPN -> | 10.2.0.7  |
+-----------+                  +-----------+
     |                               |
  SliceGW                         SliceGW
  (Gateway pod)                   (Gateway pod)
```

A Slice is a Kubernetes Custom Resource. When you create one, the KubeSlice operator spins up:

1. A **SliceGateway** pod in each participating cluster — this is the data plane, handling encrypted tunnel traffic between clusters
2. A **DNS** configuration that makes services from remote clusters resolvable locally
3. Network policies that enforce which namespaces participate in the slice

The critical insight: **application pods don't know they're in a multi-cluster environment**. They talk to `svc.namespace.svc.cluster.local` as normal. KubeSlice intercepts and routes.

## How the Control Plane Works: Operators All the Way Down

KubeSlice is built on the Kubernetes Operator pattern. There's a hierarchy:

**KubeSlice Controller** (runs on a dedicated management cluster):
- Source of truth for all slice configurations
- Reconciles the desired state of which clusters participate in which slices
- Propagates configurations down to worker clusters

**KubeSlice Operator** (runs on each worker cluster):
- Watches for slice configuration from the controller
- Creates and manages SliceGateway resources locally
- Updates DNS and network policy

**SliceGateway Controller** (runs on each worker cluster):
- Manages the lifecycle of the gateway pod
- Handles key rotation and tunnel re-establishment

The reconciliation loop looks familiar if you've written Kubernetes controllers before:

```go
func (r *SliceReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    slice := &kubeslicev1beta1.Slice{}
    if err := r.Get(ctx, req.NamespacedName, slice); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    // Determine desired state
    desired := r.buildDesiredState(slice)

    // Reconcile gateway
    if err := r.reconcileGateway(ctx, slice, desired); err != nil {
        return ctrl.Result{RequeueAfter: 30 * time.Second}, err
    }

    // Reconcile DNS
    if err := r.reconcileDNS(ctx, slice); err != nil {
        return ctrl.Result{RequeueAfter: 10 * time.Second}, err
    }

    return ctrl.Result{}, nil
}
```

The key challenge with multi-cluster operators is that your controller is watching resources in *its own* cluster but needs to act on resources in *remote* clusters. We solve this by having the management controller write slice configuration as Kubernetes secrets to each worker cluster, and the local operator reads those secrets as its source of truth.

## Security: Zero-Trust Between Clusters

Trust between clusters is the part that most DIY solutions get wrong. VPN tunnels with shared keys, or worse — no encryption at all over a private network that "should be secure".

KubeSlice uses **Network Service Mesh (NSM)** for the data plane and enforces:

- **Mutual TLS** between all slice gateways — both sides present certificates
- **AES-256-GCM** encryption for all data plane traffic
- **Certificate rotation** — keys are rotated on a configurable schedule without dropping connections
- **Network policies** — only pods explicitly added to a slice namespace can participate

The certificate lifecycle is itself managed by a Kubernetes controller. No manual certificate management, no SSH-ing into nodes.

## What I'd Do Differently

Three years in, a few things I'd change:

**1. The management cluster is a single point of failure.** We mitigated this with HA etcd, but the architecture forces you to have a dedicated cluster. A future design might use a gossip protocol for controller coordination.

**2. DNS propagation latency.** When a new service joins a slice, there's a lag before it's resolvable in remote clusters — typically 5-15 seconds. For stateful services this is fine. For highly dynamic microservices this can be painful.

**3. Observability was an afterthought.** We added Prometheus metrics late. It should have been designed in from day one — especially cross-cluster traffic metrics, which are genuinely hard to get right.

## The Takeaway

Multi-cluster Kubernetes isn't a solved problem. The ecosystem is still figuring it out — Submariner, Liqo, Admiralty, KubeSlice all take different approaches. What I've learned is that the hardest part isn't the networking itself. It's the **control plane coordination** — how do you keep desired state consistent across N clusters that can independently fail, that have independent API servers, and that need to make autonomous local decisions when the management plane is unreachable?

That's a distributed systems problem dressed up in Kubernetes clothes. And it's what makes this space genuinely interesting to work in.

---

*KubeSlice is open source and a CNCF Sandbox project. Check it out at [github.com/kubeslice](https://github.com/kubeslice).*
