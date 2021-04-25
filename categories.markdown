---
layout:   page
title:    Categories
---
{% comment%}
Here we generate all the categories.
{% endcomment%}

{% assign rawcats = "" %}
{% for post in site.posts %}
{% assign tcats = post.categories | join:'|' | append:'|' %}
{% assign rawcats = rawcats | append:tcats %}
{% endfor %}

{% assign rawcats = rawcats | split:'|' | sort %}

{% assign cats = "" %}

{% for cat in rawcats %}
{% if cat != "" %}

{% if cats == "" %}
{% assign cats = cat | split:'|' %}
{% endif %}

{% unless cats contains cat %}
{% assign cats = cats | join:'|' | append:'|' | append:cat | split:'|' %}
{% endunless %}
{% endif %}
{% endfor %}

<div>
<p>
{% for ct in cats %}
<a href="#{{ ct | slugify }}" style="color:#999;text-decoration: none;"> {{ ct }} </a> &nbsp;&nbsp;
{% endfor %}
<a href="#all" style="color:#999;text-decoration: none;"> All </a> &nbsp;&nbsp;
</p>

{% for ct in cats %}
<h2 id="{{ ct | slugify }}">{{ ct }}</h2>
<ul>
  {% for post in site.posts %}
  {% if post.categories contains ct %}
  <li>
    <h3>
      <a href="{{ post.url }}">
        {{ post.title }}
        <small>{{ post.date | date_to_string }}</small>
      </a>
      {% for tag in post.tags %}
      <a href="/tags/#{{ tag | slugify }}">{{ tag }}</a>
      {% endfor %}
    </h3>
  </li>
  {% endif %}
  {% endfor %}
</ul>
{% endfor %}

<h2 id="all">All</h2>
<ul>
  {% for post in site.posts %}
  {% unless post.category %}
  <li>
    <h3>
      <a href="{{ post.url }}">
        {{ post.title }}
        <small>{{ post.date | date_to_string }}</small>
      </a>
      {% for tag in post.tags %}
      <a href="/tags/#{{ tag | slugify }}">{{ tag }}</a>
      {% endfor %}
    </h3>
  </li>
  {% endunless %}
  {% endfor %}
</ul>

</div>
