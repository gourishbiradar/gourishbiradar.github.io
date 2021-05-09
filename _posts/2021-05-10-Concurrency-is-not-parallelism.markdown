---
layout: post 
title:  "Concurrency is not parallelism"
date:   2021-05-10 18:45:50 +0530
toc: true
tags: [ programming, concurrency, parallelism]
categories: concurrency 
---
## Concurrency vs multithreading 

{% highlight cpp %}
class Timer {
	public:
		Timer();
		Timer(std::string message);
		~Timer();
	private:
		std::string message_buffer;
		std::chrono::time_point<std::chrono::system_clock> m_start_time;
		std::chrono::time_point<std::chrono::system_clock> m_end_time;
};
{% endhighlight %}

### Concurrency models 

{% highlight cpp %}
bool foundConfig(DBConnection connection) {
	{
		Timer time_me("getConfig took: ");
		ConfigFile file = connection.getConfig();
	}
	if(file != null)
	{
		return true;
	}
	return false;
}
{% endhighlight %}

### Multithreading models 
{% highlight cpp %}
Timer::Timer()
{
	m_start_time = std::chrono::system_clock::now();
	message_buffer = " Time taken: " ;
}

Timer::Timer(std::string message)
{
	message_buffer = message;
	m_start_time = std::chrono::system_clock::now();
}

Timer::~Timer()
{
	m_end_time = std::chrono::system_clock::now(); 
	double delay = std::chrono::duration_cast<std::chrono::milliseconds>(m_end_time - m_start_time).count(); 
	__LOGGER__(message_buffer) << delay;
}
{% endhighlight %}

## Answering the question - sync/async 


