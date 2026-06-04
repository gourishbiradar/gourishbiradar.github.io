# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is **Threadspool** — a personal portfolio and tech blog at [gourishbiradar.com](https://www.gourishbiradar.com), built with Jekyll and hosted on GitHub Pages. The site uses a fully custom theme (no remote theme); all styles live in `assets/css/main.css` and all layouts are local overrides.

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

### Site Structure

The home page (`index.markdown`, `layout: home`) is a portfolio page, not a post listing. `_layouts/home.html` stitches together include partials in order:

1. `_includes/hero.html` — name, role, tagline, CTAs
2. `_includes/what-i-build.html` — domain focus areas
3. `_includes/featured-work.html` — project cards from `_data/projects.yml`
4. `_includes/opensource.html` — OSS contributions from `_data/opensource.yml`
5. `_includes/experience.html` — work history from `_data/experience.yml`
6. `_includes/writing.html` — latest 3 posts preview, links to `/posts/`
7. `_includes/contact.html` — contact section

Blog posts are at `/posts/` (paginated, 5 per page via `jekyll-paginate`). The `posts/index.html` drives that listing.

### Data Files

All structured content lives in `_data/`:
- `projects.yml` — featured work cards (fields: `id`, `title`, `badge`, `description`, `impact`, `bullets[]`, `tags[]`)
- `experience.yml` — job history (fields: `role`, `company`, `location`, `start`, `end`, `bullets[]`)
- `opensource.yml` — OSS contributions (fields: `name`, `org`, `status`, `repo_url`, `work_github_url`, `description`, `callout`)
- `navigation.yml` — top nav links
- `social.yml` — sidebar social icons

To update portfolio content, edit the data files — no layout changes needed.

### Blog Posts

All posts live in `_posts/` as Markdown files. Required front matter:

```yaml
---
layout: post
title: "Post Title Here"
date: YYYY-MM-DD
categories: [category]
tags: [tag1, tag2, tag3]
---
```

- `categories` and `tags` must be **arrays** (bracket syntax), not plain strings — required for `/categories/` and `/tags/` index pages.
- Filename format: `YYYY-MM-DD-slug.md`.

### Theming

Light/dark mode is driven by `data-theme` attribute on `<html>`. `assets/js/theme.js` reads/writes `localStorage` and toggles the attribute. All colors are CSS custom properties defined in `assets/css/main.css` under `:root` (light) and `[data-theme="dark"]`.

To add a new styled section, follow the CSS custom property pattern (`var(--bg)`, `var(--text)`, `var(--accent)`, etc.) so dark mode is automatic.

### Layouts

- `_layouts/default.html` — base shell (head, nav, main, footer, GA, theme script)
- `_layouts/home.html` — portfolio page (extends default, includes all sections)
- `_layouts/post.html` — individual blog post
- `_layouts/posts.html` — paginated post listing at `/posts/`
- `_layouts/page.html` — generic page (about, categories, tags)
- `_layouts/archive-taxonomies.html` — categories/tags index pages

### Deployment

Pushing to `master` triggers GitHub Pages to build and deploy automatically. The custom domain is configured via `CNAME` (`gourishbiradar.com`). Google Analytics: `G-EWDWYYS1E1` in `_config.yml`.
