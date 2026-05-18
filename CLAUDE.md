# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is **Threadspool** — a personal tech blog at [gourishbiradar.com](https://www.gourishbiradar.com), built with Jekyll and hosted on GitHub Pages. The theme is `ngzhio/jekyll-theme-hamilton` pulled via `jekyll-remote-theme`.

## Commands

```bash
# Install dependencies
bundle install

# Serve locally with live reload
bundle exec jekyll serve

# Build static site
bundle exec jekyll build
```

The local dev server runs at `http://localhost:4000`. Changes to `_config.yml` require a server restart; everything else hot-reloads.

## Architecture

### Content

All blog posts live in `_posts/` as Markdown files. The required front matter format for every post:

```yaml
---
layout: post
title: "Post Title Here"
date: YYYY-MM-DD
categories: [category]
tags: [tag1, tag2, tag3]
---
```

- `categories` and `tags` must be **arrays** (bracket syntax), not plain strings — the theme requires this for the `/categories/` and `/tags/` index pages to work.
- Use `pinned: true` in front matter to pin a post to the top of the home feed (rendered with a 📌 prefix by `_layouts/home.html`).
- Filename format: `YYYY-MM-DD-slug.md` (or `.markdown` for older posts).

### Layouts

- `_layouts/home.html` — custom home layout that separates pinned vs. normal posts and renders excerpts. Extends the theme's `default` layout.
- `index.markdown` uses `layout: home`; other pages (`about`, `categories`, `tags`) use `layout: page`.

### Data files

- `_data/navigation.yml` — top nav links (Categories, Tags, About)
- `_data/social.yml` — social icons in the sidebar (GitHub, LinkedIn)

### Theme

The remote theme (`ngzhio/jekyll-theme-hamilton`) provides all base styles and layouts. To override a theme file, create the equivalent path locally (e.g., `_includes/`, `_sass/`). The local `_layouts/home.html` is already one such override.

### Deployment

Pushing to `master` triggers GitHub Pages to build and deploy automatically. The custom domain is configured via `CNAME` (`gourishbiradar.com`). Google Analytics is wired up via `google_analytics: G-EWDWYYS1E1` in `_config.yml`.
