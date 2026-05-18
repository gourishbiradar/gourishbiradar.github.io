# UX Redesign: Portfolio + Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Hamilton remote theme with a fully custom Jekyll layout implementing a single-page portfolio + blog site matching `gourishbiradar.framer.website`.

**Architecture:** Custom HTML layouts in `_layouts/` and `_includes/`, a single `assets/css/main.css` using CSS custom properties for dark/light theming, and vanilla JS in `assets/js/theme.js` for the toggle. Portfolio content is data-driven via `_data/` YAML files. Blog pagination uses `jekyll-paginate` v1 with a `posts/index.html` entrypoint.

**Tech Stack:** Jekyll, GitHub Pages, `jekyll-paginate` v1, Inter (Google Fonts), vanilla CSS with custom properties, vanilla JS.

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Modify | `_config.yml` | Remove remote theme, add paginate config |
| Modify | `Gemfile` | Remove Hamilton/remote-theme gems |
| Create | `assets/css/main.css` | Complete design system + all component styles |
| Create | `assets/js/theme.js` | Dark/light toggle + hamburger menu |
| Create | `_layouts/default.html` | Base shell: head, nav, footer |
| Create | `_layouts/home.html` | Single-page portfolio (wraps all section includes) |
| Create | `_layouts/post.html` | Individual blog post |
| Create | `_layouts/posts.html` | Paginated post listing |
| Create | `_layouts/page.html` | Generic page (About) |
| Create | `_layouts/archive-taxonomies.html` | Categories + Tags pages |
| Create | `_includes/nav.html` | Sticky nav with theme toggle + hamburger |
| Create | `_includes/hero.html` | Hero section |
| Create | `_includes/what-i-build.html` | 2×2 capability tiles |
| Create | `_includes/featured-work.html` | 4 project cards from `_data/projects.yml` |
| Create | `_includes/opensource.html` | KubeSlice highlight block |
| Create | `_includes/experience.html` | Vertical timeline from `_data/experience.yml` |
| Create | `_includes/writing.html` | Latest 3 post previews |
| Create | `_includes/footer.html` | Footer with links |
| Create | `_data/projects.yml` | 4 featured project entries |
| Create | `_data/experience.yml` | 5 experience timeline entries |
| Create | `_data/opensource.yml` | KubeSlice open source entry |
| Create | `posts/index.html` | Pagination entrypoint at `/posts/` |
| Modify | `404.html` | Remove inline CSS conflicting with new design |

**Note:** `index.markdown`, `about.markdown`, `categories.markdown`, `tags.markdown`, and all `_posts/` files require no front matter changes.

**Note on TDD:** This is a static site with no unit-testable logic. Each task's verification step is a visual browser check at `http://localhost:4000`. Run `bundle exec jekyll serve` once after Task 1 and leave it running — Jekyll's watch mode reloads on file changes.

---

## Task 1: Strip Hamilton Theme and Configure Build

**Files:**
- Modify: `_config.yml`
- Modify: `Gemfile`

- [ ] **Step 1: Update `_config.yml`**

Replace the entire `_config.yml` with:

```yaml
title: Threadspool
description: Tech blog with weekly mini topics
location: Bengaluru, India
avatar: /avatar.png
baseurl: ""
url: "https://www.gourishbiradar.com"
github_username: gourishbiradar
google_analytics: G-EWDWYYS1E1

paginate: 5
paginate_path: /posts/page:num/

plugins:
  - jekyll-feed
  - jekyll-paginate
```

- [ ] **Step 2: Update `Gemfile`**

Replace the entire `Gemfile` with:

```ruby
source "https://rubygems.org"

gem "github-pages", "~> 214", group: :jekyll_plugins
gem "webrick"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
  gem "jekyll-paginate"
end

platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", "~> 1.2"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
```

- [ ] **Step 3: Install dependencies**

```bash
bundle install
```

Expected: Gemfile.lock updates, no errors.

- [ ] **Step 4: Start dev server**

```bash
bundle exec jekyll serve
```

Expected: Site builds at `http://localhost:4000`. It will look broken (unstyled) — that's correct at this stage. Confirm there are no build errors in the terminal output.

- [ ] **Step 5: Commit**

```bash
git add _config.yml Gemfile Gemfile.lock
git commit -m "feat: remove Hamilton theme, configure jekyll-paginate"
```

---

## Task 2: CSS Design System

**Files:**
- Create: `assets/css/main.css`

- [ ] **Step 1: Create the assets directory and `main.css`**

```bash
mkdir -p assets/css assets/js
```

- [ ] **Step 2: Write `assets/css/main.css`**

Create `assets/css/main.css` with the full contents below:

```css
/* ============================================================
   CUSTOM PROPERTIES — light mode defaults
   ============================================================ */
:root {
  --bg:         #ffffff;
  --bg-subtle:  #f5f5f5;
  --text:       #111111;
  --text-muted: #666666;
  --border:     #e5e5e5;
  --accent:     #2563eb;

  --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --max-w:      760px;
  --post-max-w: 680px;
  --section-py: 80px;
}

[data-theme="dark"] {
  --bg:         #0f0f0f;
  --bg-subtle:  #1a1a1a;
  --text:       #efefef;
  --text-muted: #888888;
  --border:     #2a2a2a;
  --accent:     #3b82f6;
}

/* ============================================================
   RESET & BASE
   ============================================================ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  font-family: var(--font);
  font-size: 16px;
  line-height: 1.6;
  color: var(--text);
  background: var(--bg);
  transition: background 0.15s ease, color 0.15s ease;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

img { max-width: 100%; display: block; }

/* ============================================================
   LAYOUT UTILITIES
   ============================================================ */
.container {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 0 24px;
}

.section {
  padding: var(--section-py) 0;
  border-bottom: 1px solid var(--border);
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 40px;
  color: var(--text);
}

/* ============================================================
   NAV
   ============================================================ */
nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  transition: background 0.15s ease;
}

.nav-inner {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  font-weight: 700;
  font-size: 16px;
  color: var(--text);
  text-decoration: none;
}
.nav-logo:hover { text-decoration: none; color: var(--accent); }

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
  list-style: none;
}

.nav-links a {
  color: var(--text-muted);
  font-size: 15px;
  text-decoration: none;
}
.nav-links a:hover { color: var(--text); text-decoration: none; }

.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  display: flex;
  align-items: center;
}
.theme-toggle:hover { color: var(--text); }

.hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text);
  padding: 4px;
}

/* ============================================================
   HERO
   ============================================================ */
.hero {
  padding: calc(var(--section-py) * 1.2) 0 var(--section-py);
  border-bottom: 1px solid var(--border);
}

.hero h1 {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 12px;
  color: var(--text);
}

.hero .subtitle {
  font-size: 18px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.hero .tagline {
  font-size: 16px;
  color: var(--text-muted);
  margin-bottom: 32px;
  max-width: 560px;
}

.hero-ctas {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.15s ease, background 0.15s ease;
}
.btn:hover { text-decoration: none; }

.btn-primary { background: var(--accent); color: #ffffff; }
.btn-primary:hover { opacity: 0.88; color: #ffffff; }

.btn-secondary {
  border: 1px solid var(--border);
  color: var(--text);
  background: transparent;
}
.btn-secondary:hover { background: var(--bg-subtle); color: var(--text); }

/* ============================================================
   TILES (WHAT I BUILD)
   ============================================================ */
.tiles-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.tile {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.tile-icon {
  margin-bottom: 12px;
  color: var(--accent);
}

.tile-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text);
}

.tile-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
}

/* ============================================================
   PROJECT CARDS
   ============================================================ */
.project-card {
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 16px;
}

.project-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.project-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
}

.badge {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-subtle);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.project-desc {
  font-size: 15px;
  color: var(--text-muted);
  margin-bottom: 12px;
  line-height: 1.55;
}

.project-bullets {
  list-style: none;
  margin-bottom: 16px;
}

.project-bullets li {
  font-size: 14px;
  color: var(--text-muted);
  padding: 3px 0;
  padding-left: 16px;
  position: relative;
}

.project-bullets li::before {
  content: "→";
  position: absolute;
  left: 0;
  color: var(--accent);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--bg-subtle);
  color: var(--text-muted);
}

/* ============================================================
   OPEN SOURCE
   ============================================================ */
.opensource-block {
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.opensource-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.opensource-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
}

.opensource-callout {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 10px;
  font-style: italic;
}

.opensource-links {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.opensource-links a {
  font-size: 14px;
  color: var(--accent);
}

/* ============================================================
   EXPERIENCE TIMELINE
   ============================================================ */
.timeline {
  list-style: none;
}

.timeline-item {
  padding: 0 0 36px 28px;
  border-left: 2px solid var(--border);
  position: relative;
}

.timeline-item:last-child {
  border-left: 2px solid transparent;
  padding-bottom: 0;
}

.timeline-item::before {
  content: "";
  position: absolute;
  left: -5px;
  top: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
}

.timeline-role {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
}

.timeline-company {
  font-size: 15px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.timeline-dates {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.timeline-bullets {
  list-style: none;
}

.timeline-bullets li {
  font-size: 14px;
  color: var(--text-muted);
  padding: 3px 0;
  padding-left: 14px;
  position: relative;
  line-height: 1.5;
}

.timeline-bullets li::before {
  content: "·";
  position: absolute;
  left: 0;
  color: var(--text-muted);
}

/* ============================================================
   WRITING CARDS
   ============================================================ */
.writing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.writing-card {
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.writing-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.4;
}

.writing-title a { color: var(--text); }
.writing-title a:hover { color: var(--accent); text-decoration: none; }

.writing-meta {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.writing-excerpt {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
}

.view-all {
  font-size: 15px;
  font-weight: 500;
  color: var(--accent);
}
.view-all:hover { text-decoration: underline; }

/* ============================================================
   FOOTER
   ============================================================ */
footer {
  padding: 40px 0;
}

.footer-inner {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-links {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.footer-links a {
  font-size: 14px;
  color: var(--text-muted);
  text-decoration: none;
}
.footer-links a:hover { color: var(--text); }

.footer-copy {
  font-size: 14px;
  color: var(--text-muted);
}

/* ============================================================
   POST LISTING (/posts/)
   ============================================================ */
.posts-header {
  padding: 56px 0 40px;
  border-bottom: 1px solid var(--border);
}

.posts-header h1 {
  font-size: 32px;
  font-weight: 700;
}

.posts-body {
  padding: 0 0 var(--section-py);
}

.posts-list {
  list-style: none;
}

.posts-item {
  padding: 20px 0;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.posts-item:first-child { border-top: 1px solid var(--border); }

.posts-item-title {
  font-size: 16px;
  font-weight: 500;
}

.posts-item-title a { color: var(--text); }
.posts-item-title a:hover { color: var(--accent); text-decoration: none; }

.posts-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.posts-item-date {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 40px;
  flex-wrap: wrap;
}

.pagination a,
.pagination span {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text);
  text-decoration: none;
}

.pagination a:hover {
  background: var(--bg-subtle);
  text-decoration: none;
}

.pagination span {
  color: var(--text-muted);
}

.pagination .current {
  background: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
}

/* ============================================================
   INDIVIDUAL POST PAGE
   ============================================================ */
.post-header {
  padding: 48px 0 32px;
  border-bottom: 1px solid var(--border);
}

.post-back {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 24px;
  display: inline-block;
  text-decoration: none;
}
.post-back:hover { color: var(--text); text-decoration: none; }

.post-title-text {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 16px;
  color: var(--text);
}

.post-meta {
  font-size: 14px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.post-content {
  max-width: var(--post-max-w);
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.post-content h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 40px 0 16px;
  color: var(--text);
}

.post-content h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 32px 0 12px;
  color: var(--text);
}

.post-content h4 {
  font-size: 17px;
  font-weight: 600;
  margin: 24px 0 10px;
  color: var(--text);
}

.post-content p {
  margin-bottom: 20px;
  line-height: 1.75;
}

.post-content ul,
.post-content ol {
  margin: 0 0 20px 24px;
  line-height: 1.75;
}

.post-content li { margin-bottom: 4px; }

.post-content code {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 14px;
  background: var(--bg-subtle);
  padding: 2px 6px;
  border-radius: 3px;
  color: var(--text);
}

.post-content pre {
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 24px;
}

.post-content pre code {
  background: none;
  padding: 0;
  font-size: 14px;
}

.post-content blockquote {
  border-left: 3px solid var(--border);
  padding-left: 20px;
  color: var(--text-muted);
  margin: 0 0 20px;
  font-style: italic;
}

.post-content hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 32px 0;
}

.post-content a { color: var(--accent); }
.post-content a:hover { text-decoration: underline; }

.post-content img {
  border-radius: 8px;
  margin: 24px 0;
}

/* ============================================================
   GENERIC PAGE (About, Categories, Tags)
   ============================================================ */
.page-header {
  padding: 56px 0 32px;
  border-bottom: 1px solid var(--border);
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
}

.page-content {
  padding: var(--section-py) 0;
}

.page-content p { margin-bottom: 16px; line-height: 1.75; }
.page-content a { color: var(--accent); }

/* Archive (categories/tags) */
.archive-group {
  margin-bottom: 48px;
}

.archive-group-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text);
  text-transform: capitalize;
}

.archive-count {
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 400;
  margin-left: 8px;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 640px) {
  .hero h1 { font-size: 36px; }
  .section-title { font-size: 26px; }
  .tiles-grid { grid-template-columns: 1fr; }
  .writing-grid { grid-template-columns: 1fr; }

  .posts-item {
    flex-direction: column;
    gap: 8px;
  }
  .posts-item-meta { justify-content: flex-start; }

  .post-title-text { font-size: 28px; }

  .footer-inner { flex-direction: column; align-items: flex-start; }

  /* Mobile nav */
  .nav-links {
    display: none;
    position: absolute;
    top: 56px;
    left: 0;
    right: 0;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    z-index: 99;
  }

  .nav-links.open { display: flex; }
  .hamburger { display: flex; }
}
```

- [ ] **Step 3: Verify CSS file saved**

```bash
wc -l assets/css/main.css
```

Expected: ~380+ lines with no truncation.

- [ ] **Step 4: Commit**

```bash
git add assets/css/main.css
git commit -m "feat: add complete CSS design system with dark/light tokens"
```

---

## Task 3: Default Layout, Nav, and Footer

**Files:**
- Create: `_layouts/default.html`
- Create: `_includes/nav.html`
- Create: `_includes/footer.html`

- [ ] **Step 1: Create `_layouts/default.html`**

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{% if page.title %}{{ page.title }} — {% endif %}{{ site.title }}</title>
  <meta name="description" content="{{ page.excerpt | default: site.description | strip_html | strip_newlines | truncate: 160 }}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">
  {% feed_meta %}
</head>
<body>
  {% include nav.html %}
  <main>{{ content }}</main>
  {% include footer.html %}
  <script src="{{ '/assets/js/theme.js' | relative_url }}"></script>
</body>
</html>
```

- [ ] **Step 2: Create `_includes/nav.html`**

```html
<nav>
  <div class="nav-inner">
    <a href="{{ '/' | relative_url }}" class="nav-logo">{{ site.title }}</a>
    <ul class="nav-links" id="nav-links">
      <li><a href="{{ '/#work' | relative_url }}">Work</a></li>
      <li><a href="{{ '/#experience' | relative_url }}">Experience</a></li>
      <li><a href="{{ '/#writing' | relative_url }}">Writing</a></li>
      <li><a href="{{ '/posts/' | relative_url }}">Posts</a></li>
      <li>
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">
          <svg id="icon-sun" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg id="icon-moon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </li>
    </ul>
    <button class="hamburger" id="hamburger" aria-label="Toggle menu">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  </div>
</nav>
```

- [ ] **Step 3: Create `_includes/footer.html`**

```html
<footer>
  <div class="footer-inner">
    <div class="footer-links">
      <a href="mailto:biradar.gourish@gmail.com">biradar.gourish@gmail.com</a>
      <a href="https://github.com/gourishbiradar" target="_blank" rel="noopener">GitHub</a>
      <a href="https://www.linkedin.com/in/gourishkbiradar" target="_blank" rel="noopener">LinkedIn</a>
    </div>
    <p class="footer-copy">© Gourish Biradar</p>
  </div>
</footer>
```

- [ ] **Step 4: Create a minimal `_layouts/home.html` to verify the shell**

```html
---
layout: default
---
<div class="container" style="padding: 80px 24px">
  <p>Shell OK — sections load here.</p>
</div>
```

- [ ] **Step 5: Verify in browser**

Open `http://localhost:4000`. Confirm:
- Sticky nav with "Threadspool" wordmark, nav links, and sun icon visible
- Footer with email, GitHub, LinkedIn links at the bottom
- Page background is white (#ffffff), text is dark
- No console errors

- [ ] **Step 6: Commit**

```bash
git add _layouts/default.html _includes/nav.html _includes/footer.html _layouts/home.html
git commit -m "feat: add default layout, nav, and footer"
```

---

## Task 4: Home Layout and Hero Section

**Files:**
- Modify: `_layouts/home.html`
- Create: `_includes/hero.html`

- [ ] **Step 1: Create `_includes/hero.html`**

```html
<section class="hero">
  <div class="container">
    <h1>Gourish Biradar</h1>
    <p class="subtitle">Senior Software Engineer · Distributed Systems &amp; Cloud-Native Infrastructure</p>
    <p class="tagline">Building systems that scale — multi-cluster Kubernetes, GPU infrastructure, and cloud-native platforms.</p>
    <div class="hero-ctas">
      <a href="#work" class="btn btn-primary">View Work</a>
      <a href="mailto:biradar.gourish@gmail.com" class="btn btn-secondary">biradar.gourish@gmail.com</a>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Update `_layouts/home.html`**

Replace the temporary placeholder with:

```html
---
layout: default
---
{% include hero.html %}
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:4000`. Confirm:
- Large "Gourish Biradar" heading
- Subtitle and tagline in muted color
- Two CTA buttons: blue "View Work" and bordered email button

- [ ] **Step 4: Commit**

```bash
git add _includes/hero.html _layouts/home.html
git commit -m "feat: add hero section"
```

---

## Task 5: "What I Build" Section

**Files:**
- Create: `_includes/what-i-build.html`
- Modify: `_layouts/home.html`

- [ ] **Step 1: Create `_includes/what-i-build.html`**

```html
<section class="section" id="what-i-build">
  <div class="container">
    <h2 class="section-title">What I Build</h2>
    <div class="tiles-grid">
      <div class="tile">
        <div class="tile-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </div>
        <h3 class="tile-title">Distributed Systems &amp; Networking</h3>
        <p class="tile-desc">Overlay networks, event-driven architectures, and fault-tolerant distributed platforms at scale.</p>
      </div>
      <div class="tile">
        <div class="tile-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
            <line x1="12" y1="22" x2="12" y2="15.5"/>
            <polyline points="22 8.5 12 15.5 2 8.5"/>
          </svg>
        </div>
        <h3 class="tile-title">Kubernetes &amp; Cloud-Native</h3>
        <p class="tile-desc">Operators, CRDs, multi-cluster networking, CNI plugins, and production-grade Kubernetes platforms.</p>
      </div>
      <div class="tile">
        <div class="tile-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
            <rect x="9" y="9" width="6" height="6"/>
            <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
            <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
            <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
            <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
          </svg>
        </div>
        <h3 class="tile-title">GPU &amp; AI Infrastructure</h3>
        <p class="tile-desc">Intelligent GPU allocation for LLM workloads, real-time utilisation monitoring for NVIDIA and AMD GPUs.</p>
      </div>
      <div class="tile">
        <div class="tile-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <h3 class="tile-title">Cost Optimization &amp; Autoscaling</h3>
        <p class="tile-desc">Predictive autoscaling algorithms delivering 20–70% cloud cost reduction across multi-cloud deployments.</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add to `_layouts/home.html`**

```html
---
layout: default
---
{% include hero.html %}
{% include what-i-build.html %}
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:4000`. Scroll past the hero. Confirm:
- "What I Build" heading
- 2×2 grid of tiles with icons, titles, and descriptions
- Section separated from hero by a horizontal rule

- [ ] **Step 4: Commit**

```bash
git add _includes/what-i-build.html _layouts/home.html
git commit -m "feat: add What I Build section"
```

---

## Task 6: Data Files

**Files:**
- Create: `_data/projects.yml`
- Create: `_data/experience.yml`
- Create: `_data/opensource.yml`

- [ ] **Step 1: Create `_data/projects.yml`**

```yaml
- id: egs
  title: "EGS (Elastic GPU Service)"
  description: "SaaS platform for intelligent GPU allocation to LLM workloads, provisioning inference endpoints on dynamically procured GPU nodes."
  bullets:
    - "Real-time GPU utilisation monitoring for NVIDIA and AMD GPUs"
    - "Dynamic node provisioning for inference endpoints at scale"
    - "Workload-aware GPU scheduling reducing idle resource waste"
  tags: ["Go", "Kubernetes", "NVIDIA", "AMD", "gRPC"]

- id: kubeslice
  title: "KubeSlice"
  badge: "CNCF Sandbox"
  description: "Multi-cluster Kubernetes networking platform with NSM-based overlay networking and custom CNI integration."
  bullets:
    - "Architected certificate-based mutual auth using AES-256-GCM"
    - "Led full open-sourcing process to CNCF Sandbox"
    - "Custom CNI integration and Kubernetes Operators (CRDs + controllers)"
  tags: ["Go", "Kubernetes", "NSM", "CNI", "Operators", "AES-256-GCM"]

- id: smart-scaler
  title: "Smart Scaler"
  description: "Predictive autoscaling platform delivering 20–70% cloud cost reduction across multi-cloud customer deployments."
  bullets:
    - "Workload-aware scaling algorithms for heterogeneous workloads"
    - "20–70% cloud cost reduction across production deployments"
    - "Multi-cloud support: AWS, GCP, and Azure"
  tags: ["Go", "Kubernetes", "AWS", "GCP", "Azure"]

- id: smart-traffic-director
  title: "Smart Traffic Director"
  description: "Custom Kubernetes operator for DNS-based traffic steering across heterogeneous multi-cloud environments."
  bullets:
    - "DNS-based traffic steering for low-latency routing"
    - "High availability across heterogeneous multi-cloud environments"
    - "Implemented as a custom Kubernetes Operator"
  tags: ["Go", "Kubernetes Operators", "Multi-cloud", "DNS"]
```

- [ ] **Step 2: Create `_data/experience.yml`**

```yaml
- role: "Software Engineer 3 (Senior IC)"
  company: "Avesha Systems"
  location: "Bangalore, India"
  start: "Jan 2022"
  end: "Present"
  bullets:
    - "Led architecture and open-sourcing of KubeSlice to CNCF Sandbox; active LFX Mentor driving contributor adoption."
    - "Built EGS — SaaS platform for intelligent GPU allocation to LLM workloads with real-time GPU utilisation monitoring."

- role: "Software Engineer 2"
  company: "Citrix R&D"
  location: "Bangalore, India"
  start: "Mar 2021"
  end: "Dec 2021"
  bullets:
    - "Designed high-throughput event-processing microservice handling ~1,000,000 events per application under 30 minutes end-to-end."
    - "Led full application lifecycle for a highly distributed, highly transactional platform."

- role: "Software Engineer"
  company: "Citrix R&D"
  location: "Bangalore, India"
  start: "Jul 2019"
  end: "Feb 2021"
  bullets:
    - "Developed Web Application Firewall features in C/C++ across a 10K+ line production codebase."
    - "Designed PostgreSQL schema models and wrote unit tests eliminating 200+ failures."

- role: "Software Engineering Intern"
  company: "Citrix R&D"
  location: "Bangalore, India"
  start: "Jan 2019"
  end: "Jun 2019"
  bullets:
    - "Built Python REST API test automation framework covering 1,000+ test cases."
    - "Contributed production code in 2-week Agile sprints from week one."

- role: "Research Intern"
  company: "ABB"
  location: "Bangalore, India"
  start: "Jun 2017"
  end: "Jul 2017"
  bullets:
    - "Built PoC for high-throughput sensor data transmission via MQTT (C++14), achieving 20× improvement in rates."
    - "Implemented cross-platform MQTT clients using Apache Thrift with two teammates."
```

- [ ] **Step 3: Create `_data/opensource.yml`**

```yaml
- name: "KubeSlice"
  org: "CNCF Sandbox Project"
  status: "Active"
  repo_url: "https://github.com/kubeslice"
  work_github_url: "https://github.com/gourishkb"
  description: "Led architecture, security design (AES-256-GCM, NSM integration, cert-based mutual auth), and full open-sourcing to CNCF Sandbox."
  callout: "LFX Mentor — driving external contributor onboarding, community growth, and ecosystem engagement."
```

- [ ] **Step 4: Commit**

```bash
git add _data/projects.yml _data/experience.yml _data/opensource.yml
git commit -m "feat: add portfolio data files (projects, experience, opensource)"
```

---

## Task 7: Featured Work Section

**Files:**
- Create: `_includes/featured-work.html`
- Modify: `_layouts/home.html`

- [ ] **Step 1: Create `_includes/featured-work.html`**

```html
<section class="section" id="work">
  <div class="container">
    <h2 class="section-title">Featured Work</h2>
    {% for project in site.data.projects %}
    <div class="project-card">
      <div class="project-header">
        <h3 class="project-title">{{ project.title }}</h3>
        {% if project.badge %}
        <span class="badge">{{ project.badge }}</span>
        {% endif %}
      </div>
      <p class="project-desc">{{ project.description }}</p>
      <ul class="project-bullets">
        {% for bullet in project.bullets %}
        <li>{{ bullet }}</li>
        {% endfor %}
      </ul>
      <div class="tags">
        {% for tag in project.tags %}
        <span class="tag">{{ tag }}</span>
        {% endfor %}
      </div>
    </div>
    {% endfor %}
  </div>
</section>
```

- [ ] **Step 2: Add to `_layouts/home.html`**

```html
---
layout: default
---
{% include hero.html %}
{% include what-i-build.html %}
{% include featured-work.html %}
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:4000`. Scroll to Featured Work. Confirm:
- 4 project cards in order: EGS, KubeSlice (with "CNCF Sandbox" badge), Smart Scaler, Smart Traffic Director
- Each card shows description, bullet points with `→` prefix, and tag pills

- [ ] **Step 4: Commit**

```bash
git add _includes/featured-work.html _layouts/home.html
git commit -m "feat: add Featured Work section"
```

---

## Task 8: Open Source Section

**Files:**
- Create: `_includes/opensource.html`
- Modify: `_layouts/home.html`

- [ ] **Step 1: Create `_includes/opensource.html`**

```html
<section class="section" id="opensource">
  <div class="container">
    <h2 class="section-title">Open Source</h2>
    {% for project in site.data.opensource %}
    <div class="opensource-block">
      <div class="opensource-header">
        <h3 class="opensource-title">{{ project.name }}</h3>
        <span class="badge">{{ project.org }}</span>
        <span class="badge">{{ project.status }}</span>
      </div>
      <p class="project-desc">{{ project.description }}</p>
      <p class="opensource-callout">{{ project.callout }}</p>
      <div class="opensource-links">
        <a href="{{ project.repo_url }}" target="_blank" rel="noopener">↗ {{ project.repo_url | remove: "https://" }}</a>
        <a href="{{ project.work_github_url }}" target="_blank" rel="noopener">↗ Commits on GitHub</a>
      </div>
    </div>
    {% endfor %}
  </div>
</section>
```

- [ ] **Step 2: Add to `_layouts/home.html`**

```html
---
layout: default
---
{% include hero.html %}
{% include what-i-build.html %}
{% include featured-work.html %}
{% include opensource.html %}
```

- [ ] **Step 3: Verify in browser**

Scroll to Open Source. Confirm:
- KubeSlice block with CNCF Sandbox and Active badges
- Two links: `github.com/kubeslice` and `github.com/gourishkb`

- [ ] **Step 4: Commit**

```bash
git add _includes/opensource.html _layouts/home.html
git commit -m "feat: add Open Source section"
```

---

## Task 9: Experience Section

**Files:**
- Create: `_includes/experience.html`
- Modify: `_layouts/home.html`

- [ ] **Step 1: Create `_includes/experience.html`**

```html
<section class="section" id="experience">
  <div class="container">
    <h2 class="section-title">Experience</h2>
    <ul class="timeline">
      {% for job in site.data.experience %}
      <li class="timeline-item">
        <div class="timeline-role">{{ job.role }}</div>
        <div class="timeline-company">{{ job.company }} · {{ job.location }}</div>
        <div class="timeline-dates">{{ job.start }} – {{ job.end }}</div>
        <ul class="timeline-bullets">
          {% for bullet in job.bullets %}
          <li>{{ bullet }}</li>
          {% endfor %}
        </ul>
      </li>
      {% endfor %}
    </ul>
  </div>
</section>
```

- [ ] **Step 2: Add to `_layouts/home.html`**

```html
---
layout: default
---
{% include hero.html %}
{% include what-i-build.html %}
{% include featured-work.html %}
{% include opensource.html %}
{% include experience.html %}
```

- [ ] **Step 3: Verify in browser**

Scroll to Experience. Confirm:
- Vertical timeline with blue dot and left border for each entry
- 5 entries in order: Avesha → Citrix (SE2) → Citrix (SE) → Citrix (intern) → ABB
- Last entry has no visible left border (border-left transparent)

- [ ] **Step 4: Commit**

```bash
git add _includes/experience.html _layouts/home.html
git commit -m "feat: add Experience timeline section"
```

---

## Task 10: Writing Section

**Files:**
- Create: `_includes/writing.html`
- Modify: `_layouts/home.html`

- [ ] **Step 1: Create `_includes/writing.html`**

```html
<section class="section" id="writing">
  <div class="container">
    <h2 class="section-title">Writing</h2>
    <div class="writing-grid">
      {% for post in site.posts limit:3 %}
      <div class="writing-card">
        <h3 class="writing-title">
          <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        </h3>
        <div class="writing-meta">
          <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%b %-d, %Y" }}</time>
          {% for category in post.categories %}
          <span class="tag">{{ category }}</span>
          {% endfor %}
        </div>
        <p class="writing-excerpt">{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
      </div>
      {% endfor %}
    </div>
    <a href="{{ '/posts/' | relative_url }}" class="view-all">View all posts →</a>
  </div>
</section>
```

- [ ] **Step 2: Finalize `_layouts/home.html`**

```html
---
layout: default
---
{% include hero.html %}
{% include what-i-build.html %}
{% include featured-work.html %}
{% include opensource.html %}
{% include experience.html %}
{% include writing.html %}
```

- [ ] **Step 3: Verify in browser**

Scroll to Writing. Confirm:
- 3 most recent post cards in a 3-column grid
- Each card: title link, date, category tag, excerpt
- "View all posts →" link at the bottom

- [ ] **Step 4: Commit**

```bash
git add _includes/writing.html _layouts/home.html
git commit -m "feat: add Writing section — home page complete"
```

---

## Task 11: Dark/Light Toggle JavaScript

**Files:**
- Create: `assets/js/theme.js`

- [ ] **Step 1: Create `assets/js/theme.js`**

```javascript
(function () {
  var STORAGE_KEY = 'theme';
  var html = document.documentElement;
  var toggleBtn = document.getElementById('theme-toggle');
  var sunIcon = document.getElementById('icon-sun');
  var moonIcon = document.getElementById('icon-moon');
  var hamburger = document.getElementById('hamburger');
  var navLinks = document.getElementById('nav-links');

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    if (sunIcon && moonIcon) {
      sunIcon.style.display = theme === 'dark' ? 'none' : 'block';
      moonIcon.style.display = theme === 'dark' ? 'block' : 'none';
    }
  }

  function storedTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  applyTheme(storedTheme());

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }
}());
```

- [ ] **Step 2: Verify dark mode toggle**

Open `http://localhost:4000`. Click the sun icon in the nav. Confirm:
- Background switches to `#0f0f0f`, text to `#efefef`
- Sun icon is replaced by moon icon
- Reload the page — dark mode persists (localStorage)
- Click moon icon — returns to light mode

- [ ] **Step 3: Commit**

```bash
git add assets/js/theme.js
git commit -m "feat: add dark/light mode toggle with localStorage persistence"
```

---

## Task 12: Individual Post Layout

**Files:**
- Create: `_layouts/post.html`

- [ ] **Step 1: Create `_layouts/post.html`**

```html
---
layout: default
---
<div class="post-header">
  <div class="container">
    <a href="{{ '/posts/' | relative_url }}" class="post-back">← Back to posts</a>
    <h1 class="post-title-text">{{ page.title }}</h1>
    <div class="post-meta">
      <time datetime="{{ page.date | date_to_xmlschema }}">{{ page.date | date: "%b %-d, %Y" }}</time>
      {% for category in page.categories %}
      <span class="tag">{{ category }}</span>
      {% endfor %}
      {% for tag in page.tags %}
      <span class="tag">{{ tag }}</span>
      {% endfor %}
    </div>
  </div>
</div>
<div class="post-content container">
  {{ content }}
</div>
```

- [ ] **Step 2: Verify an individual post**

Open `http://localhost:4000` and click any post title from the Writing section. Confirm:
- "← Back to posts" link at the top
- Large post title
- Date and tag pills in meta row
- Post body with generous line-height, styled headings, and code blocks

- [ ] **Step 3: Commit**

```bash
git add _layouts/post.html
git commit -m "feat: add individual post layout"
```

---

## Task 13: Posts Listing with Pagination

**Files:**
- Create: `posts/index.html`
- Create: `_layouts/posts.html`

- [ ] **Step 1: Create `posts/index.html`**

```html
---
layout: posts
title: Posts
---
```

- [ ] **Step 2: Create `_layouts/posts.html`**

```html
---
layout: default
---
<div class="post-header">
  <div class="container">
    <h1>{{ page.title }}</h1>
  </div>
</div>
<div class="container posts-body">
  <ul class="posts-list">
    {% for post in paginator.posts %}
    <li class="posts-item">
      <h2 class="posts-item-title">
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      </h2>
      <div class="posts-item-meta">
        <time class="posts-item-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%b %-d, %Y" }}</time>
        {% for category in post.categories %}
        <span class="tag">{{ category }}</span>
        {% endfor %}
      </div>
    </li>
    {% endfor %}
  </ul>

  {% if paginator.total_pages > 1 %}
  <nav class="pagination" aria-label="Post navigation">
    {% if paginator.previous_page %}
      <a href="{{ paginator.previous_page_path | relative_url }}">← Newer</a>
    {% else %}
      <span>← Newer</span>
    {% endif %}

    {% for i in (1..paginator.total_pages) %}
      {% if i == paginator.page %}
        <span class="current">{{ i }}</span>
      {% elsif i == 1 %}
        <a href="{{ '/posts/' | relative_url }}">{{ i }}</a>
      {% else %}
        <a href="{{ site.paginate_path | relative_url | replace: ':num', i }}">{{ i }}</a>
      {% endif %}
    {% endfor %}

    {% if paginator.next_page %}
      <a href="{{ paginator.next_page_path | relative_url }}">Older →</a>
    {% else %}
      <span>Older →</span>
    {% endif %}
  </nav>
  {% endif %}
</div>
```

- [ ] **Step 3: Verify the posts listing**

Open `http://localhost:4000/posts/`. Confirm:
- "Posts" heading
- All posts listed: title, date, category tags
- Currently 9 posts — with `paginate: 5`, you should see 5 on the first page and pagination controls
- Page 2 link at `/posts/page2/` shows the remaining posts
- "← Newer" on page 2 goes back to `/posts/`

- [ ] **Step 4: Commit**

```bash
git add posts/index.html _layouts/posts.html
git commit -m "feat: add /posts/ listing with jekyll-paginate (5 per page)"
```

---

## Task 14: Page, Archive, and 404 Layouts

**Files:**
- Create: `_layouts/page.html`
- Create: `_layouts/archive-taxonomies.html`
- Modify: `404.html`

- [ ] **Step 1: Create `_layouts/page.html`**

```html
---
layout: default
---
<div class="page-header">
  <div class="container">
    {% if page.title %}<h1>{{ page.title }}</h1>{% endif %}
  </div>
</div>
<div class="page-content container">
  {{ content }}
</div>
```

- [ ] **Step 2: Create `_layouts/archive-taxonomies.html`**

```html
---
layout: default
---
<div class="page-header">
  <div class="container">
    <h1>{{ page.title }}</h1>
  </div>
</div>
<div class="page-content container">
  {% if page.type == "categories" %}
    {% assign groups = site.categories | sort %}
  {% else %}
    {% assign groups = site.tags | sort %}
  {% endif %}

  {% for group in groups %}
  <div class="archive-group">
    <h2 class="archive-group-title" id="{{ group[0] }}">
      {{ group[0] }}<span class="archive-count">({{ group[1].size }})</span>
    </h2>
    <ul class="posts-list">
      {% for post in group[1] %}
      <li class="posts-item">
        <h3 class="posts-item-title">
          <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        </h3>
        <div class="posts-item-meta">
          <time class="posts-item-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%b %-d, %Y" }}</time>
        </div>
      </li>
      {% endfor %}
    </ul>
  </div>
  {% endfor %}
</div>
```

- [ ] **Step 3: Update `404.html`** to remove the inline CSS that conflicts with the design system:

```html
---
permalink: /404.html
layout: default
---
<div class="page-header">
  <div class="container">
    <h1>404</h1>
  </div>
</div>
<div class="page-content container">
  <p><strong>Page not found.</strong></p>
  <p>The requested page could not be found. <a href="{{ '/' | relative_url }}">Go home →</a></p>
</div>
```

- [ ] **Step 4: Verify all three pages**

- Open `http://localhost:4000/about/` — should show About page content with new styling
- Open `http://localhost:4000/categories/` — should list all categories with post counts and links
- Open `http://localhost:4000/tags/` — should list all tags similarly
- Navigate to a non-existent URL — should show the 404 page with correct styling

- [ ] **Step 5: Commit**

```bash
git add _layouts/page.html _layouts/archive-taxonomies.html 404.html
git commit -m "feat: add page, archive, and 404 layouts"
```

---

## Task 15: Final Smoke Test

- [ ] **Step 1: Full site check**

With `bundle exec jekyll serve` running, verify each URL:

| URL | Expected |
|---|---|
| `http://localhost:4000/` | Full portfolio: hero → what I build → work → open source → experience → writing |
| `http://localhost:4000/#work` | Smooth scrolls to Featured Work |
| `http://localhost:4000/#experience` | Smooth scrolls to Experience |
| `http://localhost:4000/#writing` | Smooth scrolls to Writing |
| `http://localhost:4000/posts/` | Post listing, 5 per page |
| `http://localhost:4000/posts/page2/` | Second page of posts |
| Individual post URL | Post with back link, title, meta, styled body |
| `http://localhost:4000/about/` | About page |
| `http://localhost:4000/categories/` | Category archive |
| `http://localhost:4000/tags/` | Tag archive |
| `http://localhost:4000/404.html` | Custom 404 |

- [ ] **Step 2: Dark mode check**

Click the toggle on every page type above. Confirm background/text/border/accent colors all switch correctly and persist on reload.

- [ ] **Step 3: Mobile check**

In Chrome DevTools, switch to a 375px mobile viewport. Confirm:
- Nav collapses to hamburger; tapping it reveals links
- Tiles grid is single column
- Writing grid is single column
- Post listing items stack vertically
- Footer stacks

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: complete portfolio + blog redesign"
```
