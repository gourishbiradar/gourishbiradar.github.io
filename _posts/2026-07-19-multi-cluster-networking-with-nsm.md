---
layout: post
title: "Multi-Cluster Networking with NSM: A Practical Guide"
date: 2026-07-19
categories: [kubernetes]
tags: [kubernetes, nsm, networking, kubeslice, cloud-native]
---

I've written about why multi-cluster Kubernetes is hard. This post is about the specific technology we chose for the data plane in KubeSlice — **Network Service Mesh (NSM)** — and the practical realities of getting it to work in production.

Most people I talk to about NSM either haven't heard of it, or they've read the GitHub README and still can't picture how it actually connects pods across clusters. Let me fix that.

## What NSM Actually Is

NSM is a CNCF Incubating project that implements the **request-based model for network connectivity**. Instead of "I'm configuring this interface with these IPs" (the traditional way), NSM says: "I need a network service from point A to point B — give me a connection."

The mental model is closer to a service mesh (like Istio) for the L2/L3 layer rather than L7. A workload requests a connection, and NSM provisions a wire between the two endpoints.

The key components are:

- **NetworkService** — a CRD that defines the type of connectivity you want
- **NSE (Network Service Endpoint)** — the thing that provides the service on one end
- **NSC (Network Service Client)** — the thing that consumes the service on the other end
- **NSMgr (NSM Daemon)** — the control plane agent running on each node, handling connection requests and maintaining the NSM registry socket at `/var/lib/networkservicemesh/nsm.io.sock`
- **Forwarder** — the data plane component that programs kernel interfaces

## How KubeSlice Actually Uses NSM

**KubeSlice uses NSM for intra-cluster connectivity only, not for the cross-cluster link itself.**

The architecture is a hub-and-spoke model:

```
Cluster A                              Cluster B
+-----------------------------+        +-----------------------------+
| App Pod -> [NSM] -> Router |---WG---| Router -> [NSM] -> App Pod |
+-----------------------------+        +-----------------------------+
                    \                    /
                   Slice Gateway      Slice Gateway
                    (WireGuard)       (WireGuard)
```

Within each cluster, NSM connects application pods to a **Slice Router** (which runs as an NSM NSE pod). Between clusters, **WireGuard tunnels** connect the gateways. NSM handles the last mile; WireGuard handles the cross-country.

This was a deliberate architectural choice. Using NSM for the inter-cluster link would have meant running a distributed NSM control plane across clusters — which is exactly the hard distributed systems problem we were trying to avoid reinventing.

## The Connection Path, Step by Step

When the `worker-operator` creates a Slice, it triggers a chain of resources:

**1. A Slice Router pod is deployed** with two containers: `vl3-nse` (the NSM NSE) and a `router-sidecar`. The NSE registers itself for service name `vl3-service-{sliceName}` by connecting to the NSMgr via a Unix socket at `/var/lib/networkservicemesh/nsm.io.sock`.

**2. Application pods are injected with NSM annotations.** The worker-operator labels eligible namespaces, and a webhook injects `ns.networkservicemesh.io` annotations onto pods, linking them to the slice router service.

**3. The NSM kernel forwarder creates `nsm` interfaces.** NSM's kernel forwarder (a forked version at `kubeslice/cmd-forwarder-kernel`) programs the connection between the app pod and the router. It creates interfaces named `nsm0`, `nsm1`, etc. — not veth pairs.

**4. Slice Gateway pods are created per cluster.** Each gateway has two containers: a `gw-sidecar` (manages the routing and tunnel state via gRPC) and a VPN container (WireGuard or OpenVPN depending on configuration).

**5. The gateway sidecar programs routes.** When a remote subnet is added, the sidecar calls `netlink.RouteAdd` to add a route pointing to the remote gateway's VPN IP:

```go
route := netlink.Route{Dst: dstIPNet, Gw: gwIP}
netlink.RouteAdd(&route)
```

The `router-sidecar` separately manages intra-cluster routes (between app pods and the router), reconciling them every 60 seconds on a background loop.

**6. Traffic flows: app -> NSM -> router -> gateway -> WG tunnel -> remote gateway -> remote router -> NSM -> remote app.**

![KubeSlice architecture diagram showing NSM and WireGuard data path across clusters](/assets/images/kubeslice-nsm-architecture.png)

## WireGuard: The Real Workhorse

The WireGuard integration is managed through shell scripts in the `kubeslice/wireguard` repo. The gateway pod runs either a SERVER or CLIENT instance:

```bash
# From the actual entrypoint script
PRIVATE_KEY=$(cat /etc/wireguard/privatekey)
PEER_PUBLIC_KEY=$(cat /etc/wireguard/publickey)

# WG interface with MTU 1300 (accounts for WireGuard overhead)
ip link add dev wg0 type wireguard
ip addr add $WILDCARD_SUBNET dev wg0
ip link set mtu 1300 dev wg0

# Traffic forwarding between wg0 and the NSM nsm0 interface
iptables -A FORWARD -i wg0 -o nsm0 -j ACCEPT
iptables -A FORWARD -i nsm0 -o wg0 -j ACCEPT
iptables -t nat -A POSTROUTING -o wg0 -j MASQUERADE
iptables -t nat -A POSTROUTING -o nsm0 -j MASQUERADE
```

Key details from the actual implementation:

- **MTU**: 1300. WireGuard encapsulation overhead is 60 bytes for the outer UDP/IP header plus 32 bytes for the WireGuard header, so 1500 - 92 = 1408 would be the theoretical max. We picked 1300 for safety across different cloud provider network fabrics.
- **PersistentKeepalive**: 25 seconds — keeps NAT bindings alive on cloud load balancers.
- **Keys are loaded from mounted Kubernetes secrets** at `/etc/wireguard/privatekey` and `/etc/wireguard/publickey`, generated during gateway deployment.

## Certificate Rotation (Not WireGuard Key Distribution)

The certificate management story is about **OpenVPN certificates**, not WireGuard keys — and it's fully automated.

The `kubeslice-controller` manages a `VpnKeyRotation` CRD:

```go
type VpnKeyRotation struct {
    RotationInterval       int    // in days
    RotationCount          int
    CertificateCreationTime string
    CertificateExpiryTime   string
}
```

The reconciliation loop:
1. Checks if current time exceeds `CertificateExpiryTime`
2. If expired, builds a cluster-to-gateway mapping
3. Triggers Kubernetes Jobs using `easy-rsa` to regenerate certificates
4. Waits for all jobs to complete
5. Updates the rotation timestamps and increments `RotationCount`

The actual rotation happens via batch Jobs, not inline in the controller. This means the controller doesn't block reconciliation while certificates are being generated — the Jobs run in parallel across gateway pairs.

## Traffic Control and QoS

One detail I haven't seen in other multi-cluster networking solutions: **per-slice QoS at the node level**, enforced via Linux Traffic Control.

Each node runs a `netops` pod that applies HTB (Hierarchical Token Bucket) qdiscs:

```bash
# Root qdisc
tc qdisc add dev {interface} root handle 17: htb default 30

# Parent class for a slice
tc class add dev {interface} parent 17: classid 17:{parentId} \
   htb rate {bwCeiling}kbit burst 64k

# Child class with guaranteed rate
tc class add dev {interface} parent 17:{parentId} classid 17:{childId} \
   htb rate {bwGuaranteed}kbit ceil {bwCeiling}kbit burst 32k

# SFQ for fairness within the slice
tc qdisc add dev {interface} parent 17:{childId} handle {parentId}: sfq perturb 10

# Filter: match traffic by gateway NodePort
tc filter add dev {interface} protocol ip parent 17: prio {prio} \
   u32 match ip dport {remotePort} 0xffff flowid 17:{childId}
```

The root handle is always `17:`. Each slice gets a class ID multiple of 11 (slice 1 gets 17:11, slice 2 gets 17:22, etc.), capped at 100 slices per node. Traffic is classified by the gateway's NodePort — which port the VPN traffic goes out on determines which slice's QoS policy applies.

## Observability: What We Actually Collect

The gateway sidecar runs a status check every **6 seconds** and exposes these metrics via gRPC:

```protobuf
message TunnelInterfaceStatus {
    string netInterface = 1;
    string localIP = 2;
    string peerIP = 3;
    uint64 latency = 4;
    uint64 txRate = 5;
    uint64 rxRate = 6;
    uint64 packetLoss = 7;
    TunnelStatusType status = 8;
}
```

The status monitor reports tunnel health (UP/DOWN), latency, transmit/receive rates, and packet loss. This is exported to Prometheus through the `kubeslice-monitoring` stack. The NSM forwarder also exposes kernel-level interface state.

## The Gateway Edge Pattern

When running on cloud providers that support LoadBalancer services, KubeSlice deploys a **Gateway Edge** pod. This acts as a NAT proxy: it receives traffic on the LoadBalancer's IP and forwards it to the correct VPN server gateway pod based on port mapping. For AWS EKS, it adds NLB annotations for UDP LoadBalancer support — necessary because WireGuard runs over UDP.

## What I'd Do Differently

**1. The hub-and-spoke model is a single point of failure.** The management cluster runs the controller that orchestrates all Slice configurations. If it goes down, no new slices can be created and key rotations are paused. We mitigated this with HA etcd, but the fundamental architecture requires a dedicated management cluster. A gossip-based or CRDT-based approach would be more resilient.

**2. DNS propagation across clusters.** When a new service joins a slice, there's a lag before it's resolvable in remote clusters. The route-sidecar reconciles every 60 seconds, which means up to a minute of black-hole routing after a new application pod starts. A watch-based approach would be faster.

**3. Observability should have been designed in from day one.** The tunnel status check at 6-second intervals was added after the initial rollout. We should have had Prometheus metrics for bytes transferred, connection state, and RTT to peer gateways at launch. The Prometheus integration exists now through `kubeslice-monitoring`, but retrofitting it was harder than necessary.

---

*Building multi-cluster networking in production? I'm happy to talk through the specifics. Reach out on [LinkedIn](https://www.linkedin.com/in/gourishkbiradar). KubeSlice is open source at [github.com/kubeslice](https://github.com/kubeslice).*
