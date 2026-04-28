---
layout: post
title: "Kubernetes Operators: The Mental Model That Finally Made It Click"
date: 2026-04-28
categories: [kubernetes]
tags: [kubernetes,operators,controllers,golang,crd]
---

I've written Kubernetes Operators for four years. For the first six months, I was cargo-culting patterns from examples without really understanding the machinery underneath. This post is the explanation I wish I'd had at the start.

## What an Operator Actually Is

The word "Operator" is overloaded in the Kubernetes ecosystem. Let's be precise.

A Kubernetes **Operator** is a software pattern, not a Kubernetes primitive. It consists of:

1. One or more **Custom Resource Definitions (CRDs)** — extending the Kubernetes API with your own resource types
2. One or more **Controllers** — processes that watch those resources and reconcile the world to match their desired state

That's it. There's no special Kubernetes feature called "Operator." It's just CRDs + Controllers, used together to encode operational knowledge about a specific piece of software.

The canonical example: etcd. Running etcd in production requires understanding leader election, quorum, backup strategies, and upgrade procedures. An etcd Operator encodes all of that knowledge into a controller. You declare `EtcdCluster: size: 3`, and the controller figures out how to make that happen — including handling the death of a member, restoring from backup, or rolling out a version upgrade.

## The Controller Loop: How Reconciliation Works

Every Kubernetes controller runs a reconciliation loop:

```
while true:
    desired_state = read from Kubernetes API
    actual_state  = observe the world
    if desired != actual:
        take action to move actual toward desired
```

The elegant insight of this model: **controllers don't track events, they track state**. It doesn't matter whether a pod died, a user changed a field, or a network partition resolved. The controller just runs, compares desired to actual, and acts. This makes controllers inherently resilient to missed events.

In Go, this looks roughly like:

```go
func (r *MyReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // Step 1: Fetch the resource
    obj := &myv1.MyResource{}
    if err := r.Get(ctx, req.NamespacedName, obj); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    // Step 2: Compute desired state
    desired, err := r.buildDesiredState(obj)
    if err != nil {
        return ctrl.Result{}, err
    }

    // Step 3: Reconcile actual state toward desired
    if err := r.reconcileDeployment(ctx, obj, desired); err != nil {
        // Returning an error causes automatic requeue with backoff
        return ctrl.Result{}, err
    }

    // Step 4: Update status
    obj.Status.Phase = "Ready"
    if err := r.Status().Update(ctx, obj); err != nil {
        return ctrl.Result{}, err
    }

    return ctrl.Result{}, nil
}
```

Notice: no switch statements on event type, no `if event == "DELETED"`. The reconciler just runs and figures out what needs to change. This is the mental shift that unlocked everything for me.

## The Three Questions Every Reconciler Must Answer

When I'm designing a reconciler, I ask three questions:

**1. What is the desired state?**
Derived from the spec of your custom resource, plus any external sources of truth (a config map, a secret, an external API).

**2. What is the actual state?**
What currently exists in the cluster. This means reading Deployments, Services, ConfigMaps, whatever your operator manages. Don't cache this — always read from the API server. The informer cache handles efficiency; you get consistency.

**3. What is the minimal set of actions to move from actual to desired?**
Create missing resources. Update changed resources. Delete resources that should no longer exist. The key word is *minimal* — don't recreate a Deployment if you only need to change an environment variable.

## Finalizers: The Hardest Part

If your operator creates external resources — a cloud load balancer, a DNS record, an entry in an external database — you need **finalizers** to ensure cleanup happens when the resource is deleted.

Without finalizers:

```
User: kubectl delete myresource foo
Kubernetes: okay, deleting the object
[cloud load balancer still exists and is billing you]
```

With finalizers:

```
User: kubectl delete myresource foo
Kubernetes: I'll set a deletionTimestamp but won't delete the object yet
Your controller: sees deletionTimestamp, runs cleanup
Your controller: removes the finalizer
Kubernetes: finalizer list is empty, now I'll delete the object
```

The pattern in Go:

```go
const myFinalizer = "myoperator.example.com/cleanup"

func (r *Reconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    obj := &myv1.MyResource{}
    if err := r.Get(ctx, req.NamespacedName, obj); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    // Object is being deleted
    if !obj.DeletionTimestamp.IsZero() {
        if controllerutil.ContainsFinalizer(obj, myFinalizer) {
            // Run cleanup
            if err := r.cleanupExternalResources(ctx, obj); err != nil {
                return ctrl.Result{}, err
            }
            // Remove finalizer — allows deletion to proceed
            controllerutil.RemoveFinalizer(obj, myFinalizer)
            if err := r.Update(ctx, obj); err != nil {
                return ctrl.Result{}, err
            }
        }
        return ctrl.Result{}, nil
    }

    // Add finalizer if not present
    if !controllerutil.ContainsFinalizer(obj, myFinalizer) {
        controllerutil.AddFinalizer(obj, myFinalizer)
        if err := r.Update(ctx, obj); err != nil {
            return ctrl.Result{}, err
        }
    }

    // Normal reconciliation...
    return ctrl.Result{}, nil
}
```

Common mistake: forgetting to handle the case where cleanup itself fails. If `cleanupExternalResources` returns an error, you must *not* remove the finalizer. Return the error and let the controller retry with backoff. Only remove the finalizer when cleanup is confirmed complete.

## Status Conditions: Communicating State to Users

Your CRD should have a `Status` subresource with a `Conditions` array. This is the standard Kubernetes way of communicating complex state to users and other controllers.

```yaml
status:
  conditions:
  - type: Ready
    status: "True"
    lastTransitionTime: "2026-04-23T10:00:00Z"
    reason: ReconciliationSucceeded
    message: "All resources are healthy"
  - type: GatewayConnected
    status: "False"
    lastTransitionTime: "2026-04-23T09:55:00Z"
    reason: RemoteClusterUnreachable
    message: "Cannot establish tunnel to cluster-b.example.com"
```

The `meta.v1.Condition` type is available in the Kubernetes API machinery. Use it rather than rolling your own. The [KEP-1623](https://github.com/kubernetes/enhancements/tree/master/keps/sig-api-machinery/1623-standardize-conditions) conventions are worth reading.

## Things I Learned the Hard Way

**Watch your RBAC.** Your controller needs RBAC permissions for every resource it reads or writes. It's easy to get this wrong and spend an hour debugging why your controller isn't seeing resources. Use `controller-gen` to generate RBAC manifests from annotations on your reconciler struct.

**Rate limiting matters at scale.** The default work queue rate limiter is fine for development. In production with hundreds of custom resources, you'll hit API server rate limits. Tune `MaxConcurrentReconciles` and the queue rate limiter based on your actual load.

**Test with envtest, not just unit tests.** The `sigs.k8s.io/controller-runtime/pkg/envtest` package spins up a real etcd and API server. Testing reconcilers against this is dramatically more reliable than mocking the Kubernetes client. It catches timing issues, RBAC problems, and admission webhook interactions that unit tests miss.

**The informer cache is eventually consistent.** After you create or update a resource, a subsequent `Get` may return the old version. Use `r.Client.Get` (which goes to the API server) rather than relying on the cache for correctness. The cache is for efficiency, not consistency.

---

Building operators is one of the most satisfying areas of backend engineering I've worked in. You're encoding domain expertise into running software, and when it works — when your controller silently handles the failure that would have woken someone up at 3am — it's deeply satisfying.

If you're getting started, [kubebuilder](https://book.kubebuilder.io/) is the best learning resource. The book is thorough and the scaffolding it generates reflects best practices.

*Have questions about operators? Reach out on [LinkedIn](https://linkedin.com/in/gourishkbiradar) or find me in the CNCF Slack.*
