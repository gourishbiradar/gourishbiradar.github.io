---
layout: post 
title:  "Max out my code - Part 1"
date:   2021-06-26 18:45:50 +0530
toc: true
tags: [ cpp, thread, future, promise, async]
categories: multithreading 
---
This article is an attempt at using cpp multithreading for faster programs.

When we talked about synchronous vs asynchronous code in terms of the hardware in the previous post. 
We did not talk about how to actually make use of asynchronous code in making our programs run faster.

## Background

Getting the most out of your hardware requires knowing how to schedule tasks appropriately. 
This article will cover parallelism and examples will be in cpp (expect more languages in future articles)

From the earlier article I hope the reader has the low level understanding of how work is scheduled.
Let's see how to max out the performance.

## Code breakdown - Single Threaded code

{% highlight cpp %}
#include <thread>
#include <iostream>
int main(){
	std::thread t([]{std::cout << std::this_thread::get_id() << std::endl;});
	t.join();
	return 0;
}
{% endhighlight %}

Yes, the code looks cryptic. If you are not aware of lambads or std::thread this might seem an alien language. 

The above code snipet needs -std=c++11 flag for g++ compiler to compile. 


Here we are seeing a single thread in action. The std::thread is a class which encapsulates thread managment in modern cpp.

the object 't' takes in a Callable (for now just assume it to be a function pointer/lambda). 
This function is called in the thread 't' and the very next line makes the 'main' thread wait for 't' to complete. 

As you can expect this is pretty useless, you are passing some function to be run and then immediately ask the main thread to wait for the thread to complete it's task. 

Bear with me, as you might notice that the lambda (aka the thing starting with '[]') is printing to standard output. 
The value being printing is the ID of the thread, this can be obtained from std::this_thread.

now onto more useful uses of threads. 

## Classic - std::thread

We can use the above code to do something meaningful, maybe compute the vector addition of a large vector. 

Please note, this code can be ofcourse optimised if you know the hardware has a GPU that can be used for such trivial computations over large data 

{% highlight cpp %}
void vectorSum(const vector<int>& v, long& val){
	for(auto e : v){
		val+=e;
	}
}
int main(){
	vector<int> sampleVec = getLargeVector();
	std::thread t(vectorSum,std::ref(sampleVec),std::ref(val));
	//Other intensive tasks
	t.join();
	cout << "Sum of the sample is " << val << "\n";
	return 0;
}
{% endhighlight %}

As you can notice, this time we are seeing some more keywords we haven't come across before. 
The std::ref is a function declared under <memory> header, for brevitys' sake let's call it a function that get's you the reference of the input object. 

Why do I have to pass this reference? 

We know that the thread created has to have access to the objects it is acting on, in this case the vector and the answer 'val' objects.

We have to pass the reference explicitly for this reason. 

Is this useful ? 

Yes and No, we put the computation in a separate thread but we can do better, since sum of part of vector is indpendent of rest. 
We can always run multiple threads to sum up their own parts of the vector and compute sum of all parts at the end. 

Let's see an example of doing this with a new model of multithreading in cpp

## Potential future - std::future/promise

std::future and std::promise were introduced in c++11 under the <future> header 
These are just abstractions of the asynchronous programming memory model. 

A future object is an object that can be used to fetch a value that has not been yet computed. 
A promise object is the store of the value that has not been computed yet. 

We can imagine the two objects as the two ends of a tunnel. 

Future is on our left end of the tunnel waiting that depends on the value on the right end of the tunnel which is our promise.

When the promise is ready with a value, the future object get's the value (well when we ask it to fetch it). 

How is any of this useful for me ? 
{% highlight cpp %}
void vectorSum(const vector<int>& v, promise<int> val){
	long sum = 0;
	for(auto e : v){
		sum+=e;
	}
	val.set_value(sum); //signals the future object of the promised value being available
}
int main(){
	vector<int> sampleVec = getLargeVector();
	promise<int> promised_sum;
	std::future<int> actual_sum = promised_sum.get_future(); 
	std::thread t(vectorSum,ref(sampleVec),move(promised_sum));
	cout << "Sum of the sample is " << actual_sum.get() << "\n"; //blocking call unless the promise is fulfilled 
	t.join();
	return 0;
}
{% endhighlight %}


As you can see the code for summation using a new thread is simpler now to follow. 

We use a promise object to store the value which has not been computed yet (sum). 
The actual sum is to be stored in the future object. 

When the thread is created we pass the ownership of the promise using std::move
The thread signals the future object of the value being available now using promise.set_value()
The main thread get's the actual sum by using future.get(). 

This is a simple model and more complex solutions can be built on top of it.

## Sick of threads - std::async

std::async is the abstraction of threads we deserve. 
It is an encapsulation of the underlying thread management and the coder has to only pass in the callable with the arguments
It returns a future object (you can use 'auto' for breavity of code as well) and makes it as close the single threaded looking code as possible

### std::launch policies

We have std::launch::async and std::launch::deferred as the two possible options for choosing to run the callable in a separate thread immediately or run it in a separate thread or same thread only when the future value is needed (.get() is called). 
Let's look at a code snippet to understand it better

### Code snippet - encapsulate regular functions
{% highlight cpp %}
long vectorSum(const vector<int>& v){
	long sum = 0;
	for(auto e : v){
		sum+=e;
	}
	return sum;
}
int main(){
	vector<int> sampleVec = getLargeVector();
	std::future<int> actual_sum = std::async(std::launch::async,vectorSum,ref(sampleVec)); 
	cout << "Sum of the sample is " << actual_sum.get() << "\n"; //blocking call unless the promise is fulfilled 
	return 0;
}
{% endhighlight %}

notice how vectorSum function does not look any special, it is what you and I would write for single threaded functions.
The magic of std::async encapsulates the vectorSum function and std::launch::async immediately spawns a thread to execute it. 
We store the actual sum in a future and look for the value when we are printing it by using .get() just like before. 

## Conclusion
We can have multiple models to make our code multithreaded and get the most out of the hardware. 
More modern methods like std::async abstract out the thread management and make it very easy to use.

This article has not covered the problem of data races in multithreaded solutions and we will cover it in the future.

Happy coding 🤓