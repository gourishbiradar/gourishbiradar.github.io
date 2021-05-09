---
layout: post 
title:  "To Sync Or Not To Sync"
date:   2021-05-09 18:45:50 +0530
toc: true
tags: [ programming, TOC, asynchronous, Computer Architecture ]
categories: architecture 
---

Lately I have been working on code that deals with plenty of multithreaded solutions.


Which made me realise how much more goes on behind the scenes to make multi threaded applications work.
This article is meant to go over the details on the architecure that enables multi threaded systems
## One unit at a time 

Computing works in terms of spitting out answers to questions.
How small can these questions get ? 
Somewhere between "is this number even?" to "predict the next stock price that can fetch 500% returns for me?" 

Yeah sounds too abstract right? We can dig deeper, let's treat the smallest question to be one mathematical operation. 

What are these mathematical operations that are supported ? 
That completely depends on the instructurtion set supported by the CPU trying to answer your question. 

The most widly used [ISA][wiki_isa] (Instruction Set Architecture) is [x86][wiki_x86] and the latest one is [RISC-V][wiki_riscv] (more on this in a later post).

### Shuffle those cards

If the smallest question to answer is a mathematical operation. How many of these can I perform at a point in time ? 

Each CPU runs on a (mostly) stable frequency of spitting out answers. We start by answering only one question at a time. 

* Q: is this number 42325 even ? 
* A: No(0)
* Q: How many bits are set in 8?
* A: 1

and so on.... But we can do better. 
We know that doing a bit set operation can be done by one logical unit of CPU at a time, while another unit can fetch data from the registers at the same time and more such independent steps. 

This level of maximal utilization of different logical units requires the questions to be in such order that answer to one is independent of answer to another question. 

This shuffled execution of questions to answer many questions at a time is called [interleaving][wiki_interleaving]

### Sorry for the interruption 

Why do I care about how fast my CPU can answer my question? I just want it to answer as many as I throw at it.

Well there are certain questions that are rehtorical, *Stop! GO READ AT THIS MEMORY* . Yes, some of these questions scream at the CPU. 

These are interrupts, interupts can cause the interleaved instructions to stop their work and go do something else first. 

These usually occur because something is broken or something is now available to use such as some open stream has been closed.
Some buffer is now accesible to the CPU and so on. 

Multithreaded programs usually use some form of interupts (albeit not screaming at the CPU to look at them first) 
The information that this provides comes in handy to solve the next set of questions.

### Am I Stopping you ?

Just like a certain resource has been made available by one thread some other thread might be waiting to use this resource. 
We know that the CPU can run a set of instructions independent of each other.

If instructions from multiple threads are interleaved and one thread is reading a buffer while another thread is writing, 
the CPU executes them in an order that we can not be sure of (non deterministic execution) 

We avoid this confusion of outcomes by ensuring that a thread somehow has ownernship of a resource and stops other threads from interfering.

This cannot be magically handled by the CPU as the CPU does not distinguish between threads they are all questions to it (what an egalitarian :) ) 

Here the poor developer has to ensure threads own a resource exclusively and give up it's ownership appropriately. 
If the thread does not give up ownership at the appropriate time the threads keep waiting.
hence there are certain questions that science has no answers to 🤔. 

With this mental model in mind let's proceed with programming concepts required to implement these in the next post.

[wiki_interleaving]: https://en.wikipedia.org/wiki/Interleaving_(data)
[wiki_isa]: https://simple.wikipedia.org/wiki/Instruction_set
[wiki_x86]: https://en.wikipedia.org/wiki/X86
[wiki_riscv]: https://en.wikipedia.org/wiki/RISC-V
