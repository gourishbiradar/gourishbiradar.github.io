# Calendly Integration Design

**Date:** 2026-06-04
**Status:** Approved

## Overview

Embed a Calendly inline widget into the portfolio's contact section using a two-column layout: contact info (heading, subtext, email/LinkedIn pills) on the left, Calendly widget on the right. On mobile, the two columns stack vertically with pills above the widget.

## What Changes

### `_includes/contact.html`

Replace the current single-column layout with a two-column CSS grid:

- **Left column:** section label, heading, updated subtext (adds mention of booking a call), email pill, LinkedIn pill — stacked vertically, top-aligned
- **Right column:** `<div class="calendly-inline-widget">` with `data-url="https://calendly.com/gourishbiradar/intro-call"` and `style="min-width:320px;height:700px;"`

The subtext updates from "If you're working on complex infrastructure — distributed, cloud-native, or AI-scale — let's talk." to include "Book a 30-minute intro or reach out directly."

### `_layouts/default.html`

Add the Calendly external script tag just before `</body>`:

```html
<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
```

Loading it here (async, at the bottom of the layout) keeps it off the critical render path and ensures it's available on every page without duplicating it inside the include.

### `assets/css/main.css`

Add styles for the two-column contact grid:

- `.contact-grid` — `display: grid; grid-template-columns: 1fr 1.6fr; gap: 40px; align-items: start;`
- `.contact-info` — left column, pills stacked via `flex-direction: column`
- Responsive breakpoint at `768px`: grid collapses to single column, pills revert to `flex-wrap: wrap` (row direction)
- `.calendly-inline-widget` — `border-radius: 10px; overflow: hidden;` for visual polish; no forced background so it renders in Calendly's own light theme regardless of site dark mode

## What Does Not Change

- `#contact` anchor ID — nav "Contact" button keeps pointing to `/#contact`
- Navigation links — no new nav item needed
- Section label and heading copy — "Get in Touch" / "Let's Build Something Hard." stay the same
- Dark mode: Calendly renders in its own light theme; no override is needed or desired

## Out of Scope

- Adding a separate "Book a Call" nav link
- Calendly popup/modal variant
- Customizing Calendly widget appearance beyond border-radius
