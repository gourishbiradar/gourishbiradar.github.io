# Calendly Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed a Calendly inline widget into the contact section using a two-column layout — contact info on the left, Calendly on the right — with a single-column stack on mobile.

**Architecture:** Three file changes: (1) CSS grid styles added to `main.css` and existing contact rules adjusted, (2) `contact.html` rewritten with the grid markup and Calendly div, (3) Calendly's external script added to `default.html` before `</body>` so it loads async on every page.

**Tech Stack:** Jekyll, Liquid, vanilla CSS Grid, Calendly hosted widget script

---

### Task 1: Add `.superpowers/` to .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add entry**

Open `.gitignore` and append `.superpowers/` as a new line at the end. Final file:

```
_site
.sass-cache
.jekyll-cache
.jekyll-metadata
vendor
.superpowers/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm artifacts"
```

---

### Task 2: Restyle contact section in CSS

**Files:**
- Modify: `assets/css/main.css`

The current `.contact` rule has `text-align: center` which must be removed. `.contact-subtitle` has `margin-left: auto; margin-right: auto` which must also be removed. New grid and responsive rules are appended within the CONTACT SECTION block.

- [ ] **Step 1: Remove `text-align: center` from `.contact`**

Find the existing rule (around line 641) and change it from:

```css
.contact {
  padding: var(--section-py) 0;
  text-align: center;
  border-top: 1px solid var(--border);
}
```

to:

```css
.contact {
  padding: var(--section-py) 0;
  border-top: 1px solid var(--border);
}
```

- [ ] **Step 2: Remove centering overrides from `.contact-subtitle`**

Find the existing `.contact-subtitle` rule (around line 655) and change it from:

```css
.contact-subtitle {
  font-size: 18px;
  color: var(--text-muted);
  margin-bottom: 48px;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}
```

to:

```css
.contact-subtitle {
  font-size: 18px;
  color: var(--text-muted);
  margin-bottom: 48px;
  max-width: 560px;
  line-height: 1.6;
}
```

- [ ] **Step 3: Append new contact grid rules after the existing CONTACT SECTION block**

After the last rule in the `/* CONTACT SECTION */` block (after `.contact-pill:hover` and the dark mode overrides, around line 692), add:

```css
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  gap: 40px;
  align-items: start;
}

.contact-info {
  display: flex;
  flex-direction: column;
}

.contact-pills {
  flex-direction: column;
  align-items: flex-start;
}

.calendly-inline-widget {
  border-radius: 10px;
  overflow: hidden;
}
```

- [ ] **Step 4: Add responsive breakpoint for the contact grid**

Inside the existing `@media (max-width: 900px)` block (around line 1006), add:

```css
  .contact-grid { grid-template-columns: 1fr; }
  .contact-pills { flex-direction: row; }
```

- [ ] **Step 5: Commit**

```bash
git add assets/css/main.css
git commit -m "style: two-column contact grid with Calendly responsive layout"
```

---

### Task 3: Rewrite contact.html with two-column markup

**Files:**
- Modify: `_includes/contact.html`

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `_includes/contact.html` with:

```html
<section class="contact" id="contact">
  <div class="container">
    <span class="section-label">Get in Touch</span>
    <div class="contact-grid">
      <div class="contact-info">
        <h2 class="contact-title">Let's Build Something Hard.</h2>
        <p class="contact-subtitle">If you're working on complex infrastructure — distributed, cloud-native, or AI-scale — let's talk. Book a 30-minute intro or reach out directly.</p>
        <div class="contact-pills">
          <a href="mailto:{{ site.email }}" class="contact-pill">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            {{ site.email }}
          </a>
          <a href="{{ site.linkedin_url }}" target="_blank" rel="noopener" class="contact-pill">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            LinkedIn
          </a>
        </div>
      </div>
      <!-- Calendly inline widget begin -->
      <div class="calendly-inline-widget" data-url="https://calendly.com/gourishbiradar/intro-call" style="min-width:320px;height:700px;"></div>
      <!-- Calendly inline widget end -->
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add _includes/contact.html
git commit -m "feat: two-column contact section with Calendly inline widget"
```

---

### Task 4: Add Calendly script to default layout

**Files:**
- Modify: `_layouts/default.html`

- [ ] **Step 1: Add script tag before `</body>`**

In `_layouts/default.html`, find the closing `</body>` tag. The current last lines before it are:

```html
  <script src="{{ '/assets/js/theme.js' | relative_url }}"></script>
</body>
```

Change to:

```html
  <script src="{{ '/assets/js/theme.js' | relative_url }}"></script>
  <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
</body>
```

- [ ] **Step 2: Commit**

```bash
git add _layouts/default.html
git commit -m "feat: load Calendly widget script async in default layout"
```

---

### Task 5: Verify in browser

**Files:** none

- [ ] **Step 1: Start the dev server**

```bash
bundle exec jekyll serve
```

Expected: server starts at `http://localhost:4000` with no build errors.

- [ ] **Step 2: Check desktop layout**

Open `http://localhost:4000` and scroll to the contact section. Confirm:
- Two columns side by side — contact info left, Calendly widget right
- Calendly widget renders with available time slots (requires internet)
- Email and LinkedIn pills stack vertically in the left column
- No `text-align: center` on the heading or subtitle

- [ ] **Step 3: Check mobile layout**

In browser DevTools, switch to a viewport ≤ 900px wide. Confirm:
- Left and right columns stack into a single column
- Email and LinkedIn pills appear in a row (not stacked)
- Calendly widget appears below the contact info at full width

- [ ] **Step 4: Check dark mode**

Click the theme toggle in the nav. Confirm:
- Left column (heading, subtext, pills) adapts to dark theme
- Calendly widget remains in its own light theme (expected — no override applied)
- No visual breakage around the widget border-radius

- [ ] **Step 5: Final commit (if any cleanup needed)**

If you made any tweaks during verification:

```bash
git add -p
git commit -m "fix: contact section visual tweaks after browser verification"
```
