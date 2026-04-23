---
layout: post
title: "Max out my code - Part 2"
date: 2026-04-23
categories: multithreading
tags: async cpp future promise thread mutex
---

Welcome back! In [Part 1](https://gourishbiradar.com/multithreading/2021/06/26/Max-out-my-code-1.html) we looked at the tools cpp gives us to spawn threads — `std::thread`, `std::future/promise`, and `std::async`. We ran tasks concurrently but never actually made the tasks themselves faster.

In this part we do exactly that. We will:

- Split the work across multiple threads to actually speed up computation
- Walk face-first into the data race problem
- Fix it with `std::mutex` and `std::atomic`
- See when each solution makes sense

## The problem: parallel vector sum

Remember our vector sum from Part 1? One thread, one loop over the whole vector. The observation we left hanging was:

> *"the sum of part of a vector is independent of the rest — we can run multiple threads to sum their own parts and combine at the end"*

Let's do that. The idea is simple:

```
Vector: [1, 2, 3, 4, 5, 6, 7, 8]

Thread 1: sum [1, 2, 3, 4] = 10
Thread 2: sum [5, 6, 7, 8] = 26

Main: 10 + 26 = 36
```

Each thread gets a slice of the vector and is completely independent. No thread needs to know what another is doing. This is the ideal case for parallelism.

Here is a clean implementation using `std::async`:

```cpp
#include <vector>
#include <future>
#include <numeric>
#include <iostream>

long partialSum(const std::vector<int>& v, int start, int end) {
    long sum = 0;
    for (int i = start; i < end; i++) {
        sum += v[i];
    }
    return sum;
}

int main() {
    std::vector<int> sampleVec = getLargeVector(); // say 1 million elements
    int mid = sampleVec.size() / 2;

    auto f1 = std::async(std::launch::async, partialSum, std::ref(sampleVec), 0, mid);
    auto f2 = std::async(std::launch::async, partialSum, std::ref(sampleVec), mid, sampleVec.size());

    long total = f1.get() + f2.get();
    std::cout << "Sum is " << total << "\n";
    return 0;
}
```

Two futures, two threads, each summing half. `f1.get()` and `f2.get()` block until both are done, then we add the results. Clean, correct, and faster.

You can extend this to N threads easily — split the vector into N equal parts and launch N async tasks. In practice, more threads than hardware cores won't help and will start to hurt (context switching overhead). `std::thread::hardware_concurrency()` gives you the number of logical cores available.

## Now let's break it

The example above worked because each thread wrote to its own local `sum` variable. What if instead we had all threads write to a shared variable?

```cpp
long sharedSum = 0;

void unsafeAdd(const std::vector<int>& v, int start, int end) {
    for (int i = start; i < end; i++) {
        sharedSum += v[i]; // DANGER
    }
}

int main() {
    std::vector<int> sampleVec = getLargeVector();
    int mid = sampleVec.size() / 2;

    std::thread t1(unsafeAdd, std::ref(sampleVec), 0, mid);
    std::thread t2(unsafeAdd, std::ref(sampleVec), mid, sampleVec.size());

    t1.join();
    t2.join();

    std::cout << "Sum is " << sharedSum << "\n"; // wrong answer, every time
    return 0;
}
```

Run this and you will get a different (wrong) answer every time. Welcome to your first **data race**.

## What is a data race?

`sharedSum += v[i]` looks like one operation. It is not. At the machine level it is three:

```
1. READ  sharedSum into a register
2. ADD   v[i] to the register  
3. WRITE the register back to sharedSum
```

Now imagine two threads executing this at the same time, with `sharedSum = 10`:

```
Thread 1: READ  → gets 10
Thread 2: READ  → gets 10  (Thread 1 hasn't written back yet!)
Thread 1: ADD 5 → register = 15
Thread 2: ADD 3 → register = 13
Thread 1: WRITE → sharedSum = 15
Thread 2: WRITE → sharedSum = 13  (Thread 1's update is lost!)
```

The correct answer was 18. We got 13. One entire update was silently discarded. This is a data race: two threads accessing the same memory, at least one writing, with no coordination between them.

The nasty part is this doesn't always produce the wrong answer. Sometimes the timing works out and you get the right result. This makes data races hard to reproduce and debug.

## Fix 1: std::mutex

A mutex (mutual exclusion) is a lock. Only one thread can hold it at a time. Any thread that tries to acquire a locked mutex will block until the holding thread releases it.

```cpp
#include <mutex>

long sharedSum = 0;
std::mutex sumMutex;

void safeAdd(const std::vector<int>& v, int start, int end) {
    for (int i = start; i < end; i++) {
        std::lock_guard<std::mutex> lock(sumMutex); // acquire lock
        sharedSum += v[i];
        // lock released here automatically (RAII)
    }
}
```

`std::lock_guard` is the RAII wrapper for mutexes — it acquires the lock on construction and releases it when it goes out of scope. You should always use `lock_guard` or `unique_lock` rather than calling `.lock()` and `.unlock()` manually. Manual unlocking is a bug waiting to happen.

This is now correct. But is it fast?

Not really. We are locking and unlocking the mutex for *every single element*. The overhead of mutex operations dwarfs the cost of the addition itself. We have turned a parallel program into something slower than a single-threaded loop.

The fix: lock once per thread, not once per element.

```cpp
void safeAdd(const std::vector<int>& v, int start, int end) {
    long localSum = 0;
    for (int i = start; i < end; i++) {
        localSum += v[i]; // no lock needed, localSum is thread-local
    }
    std::lock_guard<std::mutex> lock(sumMutex);
    sharedSum += localSum; // one lock acquisition per thread
}
```

Each thread accumulates into its own local variable (no sharing, no race), then acquires the lock once to add its result to the shared total. This is fast and correct.

## Fix 2: std::atomic

For simple types like integers, cpp offers a better tool than a mutex: `std::atomic`.

```cpp
#include <atomic>

std::atomic<long> atomicSum{0};

void atomicAdd(const std::vector<int>& v, int start, int end) {
    long localSum = 0;
    for (int i = start; i < end; i++) {
        localSum += v[i];
    }
    atomicSum += localSum; // atomic operation — no explicit lock needed
}
```

`std::atomic<long>` guarantees that `+=` is performed as a single indivisible operation. No read-modify-write race is possible. Under the hood, the CPU uses special atomic instructions (like `LOCK XADD` on x86) that are cheaper than a mutex.

When should you use atomic vs mutex?

- **atomic**: for simple counters, flags, single values. Fast, low overhead.
- **mutex**: when you need to protect a block of code or a data structure that can't be expressed as a single atomic operation. More flexible.

## Putting it all together

Here is the final version that is both correct and fast:

```cpp
#include <vector>
#include <thread>
#include <atomic>
#include <iostream>

std::atomic<long> totalSum{0};

void parallelSum(const std::vector<int>& v, int start, int end) {
    long localSum = 0;
    for (int i = start; i < end; i++) {
        localSum += v[i];
    }
    totalSum += localSum;
}

int main() {
    std::vector<int> sampleVec = getLargeVector();
    
    int numThreads = std::thread::hardware_concurrency();
    int chunkSize  = sampleVec.size() / numThreads;

    std::vector<std::thread> threads;
    for (int i = 0; i < numThreads; i++) {
        int start = i * chunkSize;
        int end   = (i == numThreads - 1) ? sampleVec.size() : start + chunkSize;
        threads.emplace_back(parallelSum, std::ref(sampleVec), start, end);
    }

    for (auto& t : threads) {
        t.join();
    }

    std::cout << "Sum is " << totalSum.load() << "\n";
    return 0;
}
```

This scales with the number of cores. On an 8-core machine, 8 threads each process one eighth of the vector independently, then atomically contribute their partial sums. The only shared state access is that final `totalSum += localSum` — one atomic operation per thread.

## Conclusion

The progression from Part 1 to here:

1. **Single thread** doing all the work — baseline, correct
2. **Multiple threads** each doing independent work — faster, still correct
3. **Multiple threads sharing state naively** — faster on paper, data race, wrong
4. **Mutex protecting shared state** — correct, but naive placement kills performance
5. **Thread-local work + single atomic write** — correct and fast

The lesson: parallelism is only free when work is truly independent. The moment threads need to communicate, you need synchronisation. The art is minimising how often that happens.

In a future post we will look at the bigger picture — thread pools, work queues, and how to structure programs so that threads spend their time working, not waiting on each other.

Happy coding 🤓
