---
layout: post
title: "I Let Claude Code Redesign My Portfolio. Here's What Actually Happened."
date: 2026-05-19
categories: [ai-tools]
tags: [claude-code, vibe-coding, jekyll, portfolio, dx]
---

*This post is written entirely by Claude Code, with inputs, direction, and (a lot of) course corrections from me — Gourish. The meta-ness of an AI writing about being used to build an AI-assisted site is intentional.*

---

I've had a Framer portfolio sitting at [gourishbiradar.framer.website](https://gourishbiradar.framer.website) for a while — polished, section-by-section, visually close to what I wanted. My actual blog at gourishbiradar.com was running on a Jekyll theme (Hamilton) that looked like it was from 2018. The gap bothered me.

I didn't want to abandon Jekyll. GitHub Pages is free, markdown posts are portable, and I control everything. What I wanted was to close the visual gap — take the Framer design as the reference and rebuild the blog site to match it, using Claude Code to do the heavy lifting.

This is the honest account of how that went.

## The Setup

The stack going in:
- Jekyll + GitHub Pages (keeping both)
- `jekyll-theme-hamilton` remote theme (removing this)
- No custom CSS — all inherited from the theme
- A Framer portfolio that looked the way I wanted

The goal: full custom HTML/CSS redesign, portfolio + blog hybrid, dark/light mode, paginated posts. All matching the Framer site as closely as possible — without touching Framer or paying for hosting.

## How Claude Code Was Used

This wasn't "write me a CSS file." The entire workflow was structured using Claude Code's superpowers plugin — a set of skills that impose process discipline on what would otherwise be freestyle prompting.

**Phase 1: Brainstorming (~30 min)**  
Claude explored the codebase, asked clarifying questions one at a time (single-page or multi-page? dark mode? custom CSS or theme override?), proposed three architectural approaches, and drafted a design spec. I approved sections. It found my resume PDF in the repo and used it to populate the portfolio data.

**Phase 2: Implementation plan (~20 min)**  
The spec became a 15-task implementation plan stored in `_docs/superpowers/plans/`. Each task had exact file paths, step-by-step instructions with actual code, and test commands. No placeholders.

**Phase 3: Execution (~2 hours active, longer in wall time)**  
Claude used *subagent-driven development*: for each task, it dispatched a fresh subagent to implement, then a spec compliance reviewer, then a code quality reviewer. The main session stayed clean while subagents did the work in isolation. This is the part that surprised me most — the structure prevented the context pollution that usually makes long AI coding sessions degrade badly.

**Phase 4: Visual comparison and CSS overhaul (~1 hour)**  
After the initial build, I shared screenshots of both sites side-by-side. Claude identified 12 specific divergences from the Framer reference and rewrote the CSS and all includes in one pass.

Total wall time: roughly half a day, across two sessions. Active time I spent directing: maybe 2 hours.

## What Went Well

**The planning phase was genuinely useful.** I've tried AI coding assistants where you just describe what you want and watch chaos unfold. Having a written spec that Claude could be held accountable to changed the dynamic completely. When the spec reviewer said "the implementer added a `--json` flag that isn't in the spec," that was a catch that would have silently shipped otherwise.

**Subagent isolation kept quality high.** Each fresh subagent started with exactly the context it needed — no accumulated confusion from prior tasks, no "as mentioned earlier" that referred to something 40 messages ago. The quality curve didn't drop off after task 3.

**It caught things I wouldn't have.** The final code review flagged: CLAUDE.md and README.md being published to the live site, missing `og:image`, dark mode accent failing WCAG AA contrast, `aria-label` missing from the nav, and the footer year hardcoded as `2025`. These are the kind of things that slip through when you're in the weeds.

**Data-driven sections worked perfectly.** The projects, experience, and open source sections are all driven by `_data/*.yml` files that Claude populated from my resume. Editing content now means editing YAML, not touching HTML.

## What Didn't Work

**The `github-pages` gem was a silent landmine.** The first attempt used `jekyll-theme-hamilton` and `~> 214` of the github-pages gem. Both failed on Ruby 3.2 — the theme's dependencies call `String#tainted?`, which was removed in Ruby 3.2. This took a reviewer subagent catching it and escalating. The fix (`~> 232`) isn't documented anywhere obvious.

**Visual fidelity required a second pass.** The initial build was functional but looked nothing like the Framer reference. Max-width was 760px (vs ~1100px), no alternating section backgrounds, all section titles were black instead of blue, the hero was left-aligned plain text. The code was correct; the design wasn't close. I had to share screenshots of both sites and ask for an explicit visual diff pass. The lesson: "match the Framer site" is too abstract an instruction for the implementation phase. Visual specs need visual comparison.

**The Framer site's CSS was inaccessible to Claude.** When I asked Claude to fetch the Framer reference for color values, it got back markdown-converted text with no CSS. Framer generates obfuscated CSS bundles — there's no clean way to extract design tokens programmatically. The comparison had to happen through screenshots.

**I accidentally broke things mid-implementation.** I edited `_config.yml` during the implementation run and removed the `exclude:` block Claude had added. This caused Jekyll to Liquid-process the plan files (which contained Liquid tags like `{% include nav.html %}`), producing cryptic build errors. Claude caught it, diagnosed it, and solved it by renaming `docs/` to `_docs/` (Jekyll auto-skips underscore-prefixed directories). But it was a reminder that changing the environment mid-flight creates unexpected interactions.

## Lessons for Vibe Coding

**Vibe coding works when the vibes have structure.** Letting an AI freestyle a full redesign produces mediocre results. What worked here was: spec first, plan second, implementation third, visual review fourth. Each phase has a clear output that the next phase is accountable to. "Make it look good" isn't a spec. "Match the max-width, alternating section backgrounds, and blue section titles from this reference" is.

**Screenshots beat text descriptions for visual work.** I spent time describing what was different ("the nav feels cramped, the cards are too narrow") when I could have just shared a screenshot from the start. The moment I shared side-by-side screenshots, Claude produced an exact diff of 12 specific divergences and fixed all of them in one pass.

**Fresh context per task is underrated.** My previous experience with long AI coding sessions: quality degrades as the context fills up. The session starts crisp, then by task 8 the AI is contradicting itself, forgetting constraints, or hallucinating APIs it defined earlier. Subagents sidestep this. Each one starts clean.

**Reviews are not optional.** The spec reviewer catching an extra `--json` flag, the code reviewer catching the WCAG contrast failure, the final reviewer catching the CLAUDE.md being published to the site — none of these were things I would have noticed in a reasonable pre-deploy checklist. The structure forced a review loop that I would have skipped if I were doing this manually.

**The AI is a very fast junior who reads everything.** Claude read my resume, extracted my projects and experience, wrote the YAML data files, and populated them accurately — faster than I would have. But it needed direction on what to build and explicit feedback when the output wasn't right. The rate-limiting step was always me: approving the spec section by section, deciding between approaches, describing what was visually wrong. That's the right division of labor.

## The Result

The site you're reading this on is the output. Custom CSS (no remote theme), full portfolio sections (What I Build, Featured Work, Open Source, Experience, Writing, Contact), dark/light mode, paginated posts at `/posts/`, WCAG AA-compliant throughout.

The Framer site still looks slightly more polished — Framer's animations and component transitions are hard to replicate in static CSS without meaningfully increasing complexity. But the color palette, section rhythm, typography scale, and information architecture are now close enough that they feel like the same site.

Total lines of CSS written: ~750. Total lines of HTML across layouts and includes: ~400. Time I spent writing those lines directly: zero.

The work I actually did: direction, review, and the occasional "no, that's not right, here's a screenshot of what I mean." Which is, I think, exactly what this kind of tooling should be optimizing for.

---

*Next: I want to try the same approach on a greenfield project — starting from nothing rather than an existing reference. Curious whether the planning phase holds up when there's no visual target to anchor to.*
