# UX Redesign: Portfolio + Blog — Design Spec

**Date:** 2026-05-18
**Reference:** https://gourishbiradar.framer.website
**Target:** https://www.gourishbiradar.com

## Goal

Rebuild the existing Jekyll blog (Hamilton theme) into a full portfolio + blog site that closely matches the Framer reference. The redesign stays on GitHub Pages with no hosting changes required.

## Scope

- Remove the `ngzhio/jekyll-theme-hamilton` remote theme entirely
- Build fully custom HTML/CSS layouts from scratch
- Implement dark/light mode toggle with localStorage persistence
- Populate portfolio sections from resume content
- Keep all existing `_posts/` files and front matter untouched

---

## Architecture

### File Structure

```
_layouts/
  default.html        # nav + footer shell used by all pages
  home.html           # single-page portfolio (index.markdown)
  post.html           # individual blog post
  posts.html          # /posts/ listing page

_includes/
  nav.html            # sticky top nav with dark/light toggle
  hero.html
  what-i-build.html
  featured-work.html
  opensource.html
  experience.html
  writing.html        # latest 3 post previews
  footer.html

_data/
  projects.yml        # 4 featured work entries
  experience.yml      # full experience timeline
  opensource.yml      # KubeSlice CNCF entry
  navigation.yml      # existing, unchanged
  social.yml          # existing, unchanged

assets/
  css/main.css        # all styles with CSS custom properties
  js/theme.js         # dark/light toggle

_posts/               # unchanged
```

### Config Changes

Remove from `_config.yml`:
- `remote_theme: ngzhio/jekyll-theme-hamilton`
- plugin: `jekyll-remote-theme`

Remove from `Gemfile`:
- `gem 'jekyll-theme-hamilton'`
- `gem 'jekyll-remote-theme'`

---

## Visual Design System

### Typography

- **Font:** Inter (loaded from Google Fonts)
- **Scale:**
  - Hero name: 48px, weight 700
  - Section headings: 32px, weight 700
  - Subheadings: 20px, weight 600
  - Body: 16px, weight 400
  - Meta/tags: 13px, weight 500

### Color Tokens (CSS Custom Properties)

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#ffffff` | `#0f0f0f` |
| `--bg-subtle` | `#f5f5f5` | `#1a1a1a` |
| `--text` | `#111111` | `#efefef` |
| `--text-muted` | `#666666` | `#888888` |
| `--border` | `#e5e5e5` | `#2a2a2a` |
| `--accent` | `#2563eb` | `#3b82f6` |

All color switches use `[data-theme="dark"]` on `<html>`. Default is light mode; `theme.js` reads `localStorage` on load and applies the stored preference.

### Spacing & Layout

- Base unit: 8px
- Section padding: 80px top/bottom
- Max content width: 760px, centered
- Post body max-width: 680px

### Cards & Components

- Cards: `1px solid var(--border)` border, no box-shadow, `border-radius: 8px`
- Tech stack tags: pill shape, `border-radius: 4px`, `--bg-subtle` background, `--text-muted` color, 13px font
- Section dividers: `1px solid var(--border)` horizontal rule between sections

---

## Home Page Sections

### 1. Nav
- Sticky, full-width
- Left: `Threadspool` wordmark
- Right: `Work · Experience · Writing · Posts` (smooth-scroll anchors for first three, `/posts/` link for last) + dark/light toggle icon
- Mobile: hamburger collapse

### 2. Hero
- Name: `Gourish Biradar` (48px)
- Subtitle: `Senior Software Engineer · Distributed Systems & Cloud-Native Infrastructure`
- Tagline: `Building systems that scale — multi-cluster Kubernetes, GPU infrastructure, and cloud-native platforms.`
- CTAs: `View Work` (scrolls to `#work`) · `biradar.gourish@gmail.com` (mailto)

### 3. What I Build (`#what-i-build`)
2×2 grid of capability tiles:
- Distributed Systems & Networking
- Kubernetes & Cloud-Native
- GPU & AI Infrastructure
- Cost Optimization & Autoscaling

Each tile: icon (inline SVG), title, 1-sentence description.

### 4. Featured Work (`#work`)
4 full-width stacked cards, one per project. Each card:
- Title + status badge (e.g. "CNCF Sandbox")
- 1-line description
- 2–3 bullet impact points
- Tech stack tags

Projects (from resume):
1. **KubeSlice** — Multi-cluster Kubernetes networking platform. Tags: `Go`, `Kubernetes`, `NSM`, `CNI`, `Operators`, `AES-256-GCM`
2. **EGS (Elastic GPU Service)** — SaaS for intelligent GPU allocation to LLM workloads. Tags: `Go`, `Kubernetes`, `NVIDIA`, `AMD`, `gRPC`
3. **Smart Scaler** — Predictive autoscaling with 20–70% cloud cost reduction. Tags: `Go`, `Kubernetes`, `AWS`, `GCP`, `Azure`
4. **Smart Traffic Director** — DNS-based traffic steering Kubernetes operator. Tags: `Go`, `Kubernetes Operators`, `Multi-cloud`, `DNS`

### 5. Open Source (`#opensource`)
Single highlighted block:
- KubeSlice — CNCF Sandbox Project
- GitHub link: `github.com/kubeslice`
- Callout: LFX Mentor, external contributor adoption

### 6. Experience (`#experience`)
Vertical timeline, 5 entries:

| Role | Company | Dates |
|---|---|---|
| Software Engineer 3 (Senior IC) | Avesha Systems | Jan 2022 – Present |
| Software Engineer 2 | Citrix R&D | Mar 2021 – Dec 2021 |
| Software Engineer | Citrix R&D | Jul 2019 – Feb 2021 |
| Software Engineering Intern | Citrix R&D | Jan 2019 – Jun 2019 |
| Research Intern | ABB | Jun 2017 – Jul 2017 |

Each entry shows role, company, date range, and 2 condensed bullet points.

### 7. Writing (`#writing`)
- Latest 3 posts as horizontal preview cards: title, date, excerpt (40 words)
- `View all posts →` link to `/posts/`

### 8. Footer
- Email: `biradar.gourish@gmail.com`
- GitHub: `github.com/gourishbiradar`
- LinkedIn: `linkedin.com/in/gourishkbiradar`
- `© Gourish Biradar`

---

## Blog Pages

### `/posts/` — Listing Page
- Uses `posts` layout (extends `default`)
- Displays all posts: title, date, category tags
- No excerpt on the listing — scannable like a table of contents
- Category pills use same tag style as portfolio cards

### Individual Post Pages
- Uses `post` layout (extends `default`)
- Max-width 680px
- Header: title, date, category + tag pills
- Body: `line-height: 1.75`, generous paragraph spacing
- `← Back to posts` link at top
- No sidebar

### Front Matter
All existing `_posts/` front matter (`layout`, `title`, `date`, `categories`, `tags`) stays unchanged. The `post` layout value in existing posts will be resolved by the new custom layout.

---

## Out of Scope

- Contact form (no backend requirement)
- Search functionality
- Pagination (post count is low)
- Comments system
