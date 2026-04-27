---
layout: post
title: "What Nobody Tells You About Taking a Project to CNCF Sandbox"
date: 2026-04-27
categories: open-source
tags: cncf open-source kubernetes community lfx
---

In late 2022, we open-sourced KubeSlice and applied to the CNCF Sandbox. A year later, it was accepted. Here's what that process actually looks like from the inside — the parts the blog posts don't cover.

## Why CNCF?

The Cloud Native Computing Foundation hosts Kubernetes, Prometheus, Envoy, Argo, and dozens of other projects that have become foundational infrastructure for the industry. Getting into CNCF isn't just a badge — it means:

- **Neutral governance**: no single company controls the project
- **Community trust**: enterprises are more willing to adopt a CNCF project than a random GitHub repo
- **Infrastructure**: CI/CD, artifact hosting, security audits, and access to community resources
- **Visibility**: the CNCF landscape, KubeCon talks, and community channels reach exactly the engineers who would use your project

For KubeSlice specifically, CNCF affiliation matters because multi-cluster networking is infrastructure. Companies aren't going to build their production networking on a single-vendor project. The neutral home is a prerequisite for adoption.

## The Application Process: What It Actually Involves

The CNCF Sandbox application is a GitHub PR to the [cncf/toc](https://github.com/cncf/toc) repository with a due diligence document. That document asks you to cover:

- Project description and scope
- Alignment with the CNCF mission and existing projects
- Overlap/differentiation with related projects (Submariner, Liqo, Cilium Cluster Mesh)
- Governance model, code of conduct, contributors
- License (Apache 2.0 required)
- Security posture
- Roadmap

The technical bar for Sandbox is intentionally low — CNCF explicitly says Sandbox is for early-stage projects. What they're evaluating is whether the project is solving a real problem in the cloud-native space, has a clear governance model, and isn't directly duplicative of an existing CNCF project.

The harder part is the **TOC review**. Members of the Technical Oversight Committee will ask detailed questions on the PR. Expect questions like:

- "How does this differ from Submariner?"
- "What's your threat model for the data plane?"
- "How do you handle split-brain scenarios when the management cluster is unreachable?"

You need to have real answers. Vague responses get called out publicly on the PR. Prepare for this like a technical interview, not a marketing exercise.

## What Changes After Acceptance

**The governance overhead is real.** You need a proper MAINTAINERS file, documented governance process, community meetings, and a process for promoting contributors to maintainers. For a project built and maintained primarily by one company, this is a cultural shift. You have to genuinely open up decision-making, not just the code.

**The contributor bar goes up.** Before CNCF, we merged PRs informally. After CNCF, every change needs proper review, DCO sign-off, and CI gates. This is the right way to run open source, but it slows down initial velocity. Worth it for long-term health.

**The community work becomes a full job.** Responding to GitHub issues, reviewing external PRs, answering questions in Slack, attending community meetings, preparing KubeCon proposals — this is easily 30-40% of time if you're the primary community lead. Plan for it.

## LFX Mentorship: The Part I Underestimated

The Linux Foundation's LFX Mentorship program connects CNCF projects with students and early-career engineers for 3-month paid mentorships. I became an LFX Mentor for KubeSlice.

What I didn't expect: how much I'd get out of it.

Being a mentor forces you to articulate things you do intuitively. When a mentee asks "why does the controller use exponential backoff here?" and you have to explain it clearly enough for them to implement it — you develop a much sharper understanding of your own system.

The mentees I worked with brought genuine energy and fresh perspectives. One mentee identified a subtle race condition in our DNS reconciliation logic that had been in the codebase for months. Another built out a test harness for multi-cluster scenarios that became part of our CI pipeline.

If you're a maintainer of any open source project, I'd strongly recommend the LFX program. It's underutilised.

## What Good Open Source Community Looks Like

Three years in, here's what I've observed distinguishes healthy CNCF projects from ones that stall:

**Responsive maintainers.** A first-time contributor who files an issue and hears nothing for two weeks is a lost contributor. We set a policy of responding to all new issues within 48 hours — even if it's just "acknowledged, triaging."

**Clear contribution path.** Issues tagged `good-first-issue` that are actually achievable for someone unfamiliar with the codebase. Not trivial (typos), not overwhelming (refactor the entire control plane). Something meaty that a motivated person can complete in a week.

**Real governance, not theater.** If every architectural decision gets rubber-stamped by the founding company's engineers, contributors notice. The goal is to have contributors who feel ownership, not just permission to submit PRs.

**Meet people in person.** Nothing builds community like KubeCon. The hallway track — conversations that happen between sessions — is where real relationships form. If your project is serious, get to at least one KubeCon a year and host an office hours session.

## The Honest Downsides

**It costs time.** Time that could go to feature development. For a startup-backed project, this is a constant tension. Open source community work is an investment with a long payback period.

**Not all contributors are a net positive.** Some contributors introduce bugs, argue about approach without shipping code, or ask for features that don't align with the roadmap. Managing this diplomatically is a skill that takes time to develop.

**Governance can slow decisions.** When you need community consensus for major architectural changes, you can't just decide and move. This is the point — but it's an adjustment.

## Is It Worth It?

For KubeSlice: yes, unambiguously. The CNCF affiliation has directly driven enterprise evaluations that wouldn't have happened otherwise. The community has contributed code, found bugs, and given us use cases we hadn't considered. The project is better for being open.

But I'd caution against open-sourcing a project primarily as a marketing exercise. The community can tell. Real open source requires genuine commitment to neutral governance, responsive maintenance, and building something the community actually wants. The CNCF brand amplifies a good project. It doesn't rescue a half-hearted one.

---

*KubeSlice is a CNCF Sandbox project. Find it at [github.com/kubeslice](https://github.com/kubeslice). If you're considering applying to CNCF Sandbox, I'm happy to share more about the process.*
