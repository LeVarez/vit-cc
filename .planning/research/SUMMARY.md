# Project Research Summary

**Project:** vit-cc documentation site (v1.1 milestone)
**Domain:** VitePress static documentation site for a CLI/agentic developer framework
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

vit-cc's v1.1 milestone is a documentation site for an existing, working CLI framework — not a greenfield application. The correct approach is VitePress 1.6.4 (stable) hosted on GitHub Pages via GitHub Actions, because VitePress is the fastest-building, Markdown-first static site generator in the Node.js ecosystem and GitHub Pages keeps the project in its existing GitHub-native philosophy. The site must serve three distinct audiences (newcomers, active users, and contributors), which makes information architecture the most critical decision: the navigation hierarchy determines URL structure and must be finalized before a single content page is written.

The recommended site structure is five sections — Guide, Commands reference (29 pages), Agents reference (16 pages), Architecture, Contributing — with per-section sidebars using collapsible groups to handle the 45-page reference corpus without overwhelming navigation. Mermaid diagrams require the `vitepress-plugin-mermaid` plugin with pinned exact versions; ASCII art branding is handled with fenced code blocks and a monospace font CSS override. Content authoring is a human-mediated transformation step: the authoritative command and agent `.md` files under `files/` are written for Claude, not users, and must be rewritten (not copy-pasted) into user-facing documentation pages.

The dominant risk is not technical — VitePress is mature and well-documented. The risks are architectural and process-based: wrong `base` config silently breaks GitHub Pages deployments, Mermaid plugin version mismatches silently produce blank diagrams, and documentation drift from source command files will accumulate if no docs-as-code pattern is established. All three risks are preventable in Phase 1 by running `vitepress build` in CI from the start and setting stable URL conventions before content is authored.

---

## Key Findings

### Recommended Stack

VitePress 1.6.4 is the clear choice: Vue-team maintained, Vite-powered builds, Markdown-first, built-in default theme covering sidebar/nav/search/dark mode/code highlighting (Shiki). The v2 alpha exists but has active regressions between releases — use stable 1.6.4 until v2 reaches stable. The docs site lives in a `docs/` subdirectory with its own `package.json` (`"type": "module"` required; VitePress is ESM-only), keeping the docs toolchain isolated from the CLI source code. Deployment is GitHub Pages via the official `actions/upload-pages-artifact` + `actions/deploy-pages` workflow, requiring `base: '/vit-cc/'` in config for sub-path hosting.

**Core technologies:**
- **VitePress 1.6.4**: Static site generator — fastest in class, Markdown-first, built-in theme covers all table-stakes features without extra configuration
- **vitepress-plugin-mermaid 2.0.17 + mermaid ^11.x**: Mermaid diagram rendering — only viable option for Mermaid in VitePress; pin exact versions to avoid silent regressions
- **Node.js >=20**: Runtime — VitePress official requirement; docs `package.json` must target >=20
- **GitHub Actions + GitHub Pages**: CI/CD deployment — zero external accounts, consistent with vit-cc's GitHub-native design

See `/Users/aleix/Documents/Projects/ViT/vit-cc/.planning/research/STACK.md` for full configuration patterns, alternatives evaluated, and version compatibility matrix.

### Expected Features

**Must have (table stakes — v1.1 launch):**
- Getting started guide + installation page — without these the site has no entry point for new users
- Complete command reference (all 29 commands) — existing users need this immediately; it is the primary value of the docs site
- Architecture overview with Mermaid diagram — the single most effective way to explain the command → agent → state system
- Sidebar navigation with correct information architecture — gates every content page; URL structure must be stable before content is written
- Built-in local search — zero-cost config-only feature; developer audiences expect Ctrl+K search
- ASCII art branding — low-effort, high-signal differentiator that makes the docs feel part of the same product as the CLI
- Dark mode, code copy buttons, syntax highlighting — all VitePress defaults; zero implementation cost

**Should have (competitive differentiation — v1.x):**
- Agent deep-dive section — explains how agents work internally; key differentiator vs generic CLI docs
- Contributor guide for new agents — lowers the barrier to extending the framework
- State system reference (.planning/ internals) — needed by advanced users debugging unexpected behavior
- Workflow walkthroughs — end-to-end narratives showing exactly what happens per command
- GitHub effects documentation per command — unique value given vit-cc's deep GitHub integration

**Defer (v2+):**
- Algolia DocSearch — only needed when local search is measurably insufficient (500+ pages)
- Versioned documentation — multiplies maintenance cost with near-zero benefit at this stage
- Internationalization — defer until demonstrated non-English user demand
- Interactive playground, AI chatbot, video embeds — all anti-features for this product type

See `/Users/aleix/Documents/Projects/ViT/vit-cc/.planning/research/FEATURES.md` for full prioritization matrix, dependency graph, and anti-feature rationale.

### Architecture Approach

The site follows a path-based multi-sidebar architecture where each URL prefix renders its own sidebar. The 29 commands are grouped into workflow-stage collapsible sections (Project Setup, Phase Workflow, State Management, Milestone Management, Phase Editing, Tools, Settings) so users navigate by intent rather than alphabetically. A separate `docs/.vitepress/sidebar.ts` file extracts sidebar arrays to keep `config.ts` readable at scale. Content authoring follows a strict source extraction pattern: internal command files (`files/commands/vit/*.md`) are 1000+ line Claude-facing instruction documents; VitePress pages are 100-200 line user-facing rewrites derived from those sources, never copy-pasted.

**Major components:**
1. `docs/.vitepress/config.ts` (wrapped with `withMermaid()`) — site metadata, nav, per-section sidebars, Mermaid config, search
2. `docs/.vitepress/sidebar.ts` — extracted sidebar arrays for all five sections (avoids 300-line config)
3. `docs/.vitepress/theme/custom.css` — monospace font override for ASCII art, brand CSS variables
4. `docs/guide/` — five narrative pages establishing vocabulary for all reference pages
5. `docs/reference/commands/` + `docs/reference/agents/` — 29 + 16 reference pages with uniform templates
6. `docs/architecture/` + `docs/contributing/` — specialized sections for advanced users and contributors

**Content build order is load-bearing:** Foundation config and landing page first, then guide section (establishes vocabulary), then reference index pages, then core workflow commands (highest traffic), then remaining commands and agents, then architecture and contributing.

See `/Users/aleix/Documents/Projects/ViT/vit-cc/.planning/research/ARCHITECTURE.md` for full project structure, all five architectural patterns, and the complete content build order.

### Critical Pitfalls

1. **Mermaid plugin version mismatch** — Pin `vitepress-plugin-mermaid` and `mermaid` to exact versions (no `^` ranges); add a CI smoke test that verifies `<svg` elements render in built HTML; do not rely on dev server alone.

2. **GitHub Pages `base` config missing** — Set `base: '/vit-cc/'` in `config.ts` before the first deployment commit; test with `vitepress preview` locally; never enable GitHub Pages "Auto Minify" (strips Vue hydration comments, causes runtime errors).

3. **Dead links silently break builds** — Establish a stable URL naming convention in Phase 1 before content is authored; run `vitepress build` in CI on every PR; never use `ignoreDeadLinks: true` globally.

4. **SSR build failures from browser-only code** — Always run `vitepress build` in CI (not just `vitepress dev`); the dev server masks SSR errors; wrap any component using `window`/`document` in `<ClientOnly>`.

5. **Documentation drift from source command files** — Establish the docs-as-code pattern in Phase 2: each command reference page must be verified against its `files/commands/vit/*.md` source; the existing `vit-doc-updater` agent is a future mitigation hook.

6. **Audience mismatch in content** — Guide section must contain no implementation internals; command reference describes user-observable behavior only; contributing section is strictly for developers extending VIT; never mix "how to use" with "how this is implemented" on the same page.

See `/Users/aleix/Documents/Projects/ViT/vit-cc/.planning/research/PITFALLS.md` for full pitfall-to-phase mapping, integration gotchas, UX pitfalls, and the "Looks Done But Isn't" checklist.

---

## Implications for Roadmap

Based on the dependency analysis in ARCHITECTURE.md and the pitfall-to-phase mapping in PITFALLS.md, a four-phase structure is recommended.

### Phase 1: VitePress Foundation and Infrastructure

**Rationale:** Everything else depends on this. Config, theme, navigation structure, and CI pipeline must exist before any content page is useful. URL structure set here is immutable after publishing — getting it wrong creates dead links across the entire site. All four critical infrastructure pitfalls must be addressed here before content work begins.

**Delivers:** Working VitePress site deployed to GitHub Pages with correct `base` config; Mermaid plugin installed and verified with pinned exact versions; ASCII art branding via custom CSS; full nav structure with stub pages for all five sections; CI build running `vitepress build` on every push; local search enabled; `sidebar.ts` extract in place.

**Addresses (from FEATURES.md):** Sidebar navigation with correct IA, dark mode, built-in search, code blocks, ASCII branding, deployment infrastructure.

**Avoids (from PITFALLS.md):** Mermaid version lock-in (pin versions now), GitHub Pages `base` config failure (set before first deploy), SSR build surprises (CI runs `vitepress build`), dead link accumulation (URL convention established before content), Auto Minify hydration breakage.

**Research flag:** Standard patterns — VitePress deployment and configuration are fully documented with official sources. Skip `/vit:research-phase`.

---

### Phase 2: Guide Section and Command Reference

**Rationale:** The guide section establishes vocabulary (phases, milestones, agents, state) used on every reference page — writing it before reference pages prevents inconsistent terminology. Command reference is the primary value for existing users and the highest-priority content. The content authoring workflow and docs-as-code pattern must be established here so subsequent phases inherit the same standard.

**Delivers:** Complete guide section (what is VIT, installation, quick-start, core concepts, GitHub integration); all 29 command reference pages following the uniform template; quick-reference index pages for commands; docs-as-code verification pattern established.

**Uses (from STACK.md):** VitePress `<!--@include:-->` mechanism (with CI verification); Shiki syntax highlighting for command examples.

**Implements (from ARCHITECTURE.md):** Source extraction pattern — each command page derived from `files/commands/vit/*.md` and rewritten from user perspective; uniform command page template (When to use, Usage, What it does, Spawns, Creates, Example, See also); commands grouped by workflow stage in sidebar.

**Avoids (from PITFALLS.md):** Audience mismatch (guide contains no internals; reference describes user-observable behavior only); documentation drift (every page verified against source `.md` file before merging); alphabetical command organization (group by workflow stage instead).

**Research flag:** Content-heavy phase, not technically complex. The challenge is writing quality (source extraction, audience discipline), not technology. Skip `/vit:research-phase`.

---

### Phase 3: Agent Reference and Architecture Diagrams

**Rationale:** Agent reference pages depend on architecture vocabulary established in Phase 2's guide section. Architecture diagram pages are Mermaid-heavy and validate the plugin setup from Phase 1 against real content. Both sections serve a specialized audience (advanced users, contributors) and can follow the high-traffic command reference without blocking users.

**Delivers:** All 16 agent reference pages with "When spawned" context and per-agent Mermaid flow diagrams; `docs/architecture/` section with command flow, state model, GitHub CI, and agent system diagrams; quick-reference index page for agents.

**Uses (from STACK.md):** `vitepress-plugin-mermaid` for `flowchart LR` and `sequenceDiagram` diagrams.

**Implements (from ARCHITECTURE.md):** Pattern 5 (Mermaid for flows, ASCII for structure); uniform agent page template (Role, When spawned, Inputs, Outputs, Tools, Flow diagram); architecture section with top-level diagram cross-linking to sub-pages.

**Avoids (from PITFALLS.md):** Agent pages without "When spawned" context (each page must explain which commands invoke the agent and under what conditions); copying internal agent files verbatim; mixing architecture (for users) with contributing (for developers) on the same pages.

**Research flag:** Same Mermaid and source-extraction patterns as Phase 2. Well-documented. Skip `/vit:research-phase`.

---

### Phase 4: Contributing Guide and State System Reference

**Rationale:** Contributor-facing content (how to add agents and commands) requires the architecture diagrams from Phase 3 as foundation. The state system reference requires guide section vocabulary from Phase 2. This section serves the smallest audience and can be deferred without blocking the site launch or blocking users.

**Delivers:** `docs/contributing/` section covering contributor overview, creating commands, creating agents, templates reference, and development setup; `docs/architecture/state-model.md` covering STATE.md, PLAN.md, and MILESTONE.md lifecycle.

**Implements (from ARCHITECTURE.md):** Audience separation — contributing section is strictly for developers extending VIT, not users running it; agent creation walkthrough using existing agent files as annotated examples; explicit separation of architecture pages (for users understanding internals) from contributing pages (for developers extending VIT).

**Avoids (from PITFALLS.md):** Mixing user/contributor content on the same pages; contributor guide that assumes reader hasn't used VIT (start from "you have completed the core workflow" baseline); command reference pages that contain agent source code structure explanations.

**Research flag:** The agent creation walkthrough requires accurate mapping of spawning patterns, tool access conventions, and registration mechanisms — nuanced enough to warrant a focused research pass. Recommend `/vit:research-phase` for the contributing section before writing Phase 4 content.

---

### Phase Ordering Rationale

- **Infrastructure before content:** Phase 1 sets the foundation that all content phases depend on. URL structure is immutable after publishing — deferring infrastructure is the highest-risk decision in the project.
- **Guide before reference:** Core concepts defined in the guide section are assumed knowledge on every reference page. Writing reference pages first creates inconsistent terminology that propagates across the entire site.
- **Commands before agents:** Commands are higher-traffic (users invoke commands, not agents directly). The agent reference also requires "When spawned" context which links back to command pages — those pages must exist first.
- **Architecture before contributing:** The contributing guide presupposes understanding of the architecture. Audience separation requires architecture pages to be available as cross-link targets.
- **Content phases are sequential by dependency, not by technical difficulty:** All phases after Phase 1 are primarily content work. The technical risks are concentrated in Phase 1. Phases 2-4 can be parallelized between writers once Phase 1 is stable, but the recommended build order within each phase (guide before reference, commands before agents) should be maintained.

### Research Flags

Phases likely needing `/vit:research-phase` during planning:
- **Phase 4 (Contributing Guide):** Agent creation walkthrough requires accurate mapping of spawning patterns, tool access, and registration — nuanced enough to warrant a focused research pass before writing.

Phases with standard patterns (skip `/vit:research-phase`):
- **Phase 1 (Foundation):** VitePress configuration, GitHub Pages deployment, and Mermaid plugin setup are fully documented with official sources. No novel territory.
- **Phase 2 (Guide + Commands):** Content transformation work; source extraction pattern and uniform template are clearly defined. No novel technology.
- **Phase 3 (Agents + Architecture):** Same Mermaid and source-extraction patterns as Phase 2. Agent page template is fully specified.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | VitePress official docs verified; GitHub release history confirmed 1.6.4 stable vs 2.0.0-alpha.16 pre-release; deployment workflow from official VitePress deploy guide |
| Features | HIGH | Table stakes from VitePress official docs; differentiators from Diataxis framework (authoritative) and practitioner community consensus across multiple independent sources |
| Architecture | HIGH | Directly verified against VitePress sidebar/config docs and codebase reading of `files/commands/vit/` (29 files) and `files/agents/` (16 files); component structure maps directly to confirmed source inventory |
| Pitfalls | HIGH (VitePress-specific), MEDIUM (Mermaid) | VitePress-specific pitfalls sourced from official SSR/deploy docs and GitHub issue tracker; Mermaid ecosystem is actively shifting and version compatibility should be verified in Phase 1 |

**Overall confidence:** HIGH

### Gaps to Address

- **Mermaid plugin compatibility at build time:** The vitepress-plugin-mermaid ecosystem has known version instability. Pinning exact versions is the mitigation, but the specific working version pair (2.0.17 + mermaid ^11.x) should be verified with a `vitepress build` smoke test in Phase 1 before any diagram content is authored. Fallback if plugin fails: render Mermaid diagrams as static SVG images committed to the repo.

- **Content scope for command reference:** 29 command reference pages each require reading the source file and writing a 100-200 line user-facing page. This is the largest content effort in the project. Phase 2 planning should include realistic per-page time estimates rather than treating it as a single deliverable.

- **vit-doc-updater agent integration:** PITFALLS.md identifies documentation drift as a HIGH recovery cost pitfall and points to the existing `vit-doc-updater` agent as a mitigation. How this agent integrates with the VitePress docs workflow is not fully specified and should be scoped during Phase 2 planning.

---

## Sources

### Primary (HIGH confidence)
- https://vitepress.dev/guide/getting-started — Node.js requirements, ESM constraint, installation commands
- https://github.com/vuejs/vitepress/releases — Version confirmation: 1.6.4 stable, 2.0.0-alpha.16 pre-release
- https://vitepress.dev/guide/deploy — GitHub Pages workflow structure, base path requirement, Auto Minify warning
- https://vitepress.dev/guide/markdown — Built-in features: Shiki, custom containers, `<!--@include:-->` behavior
- https://vitepress.dev/reference/default-theme-search — Local search and Algolia DocSearch configuration
- https://vitepress.dev/reference/default-theme-sidebar — Path-based multi-sidebar, collapsible groups pattern
- https://vitepress.dev/guide/ssr-compat — `<ClientOnly>` and SSR-safe component patterns
- https://diataxis.fr/ — Diataxis framework: Tutorials / How-to / Reference / Explanation structure
- Direct reading of `files/commands/vit/` (29 command files) — source inventory and content scope
- Direct reading of `files/agents/` (16 agent files) — source inventory and content scope

### Secondary (MEDIUM confidence)
- https://emersonbottero.github.io/vitepress-plugin-mermaid/ — Plugin setup, dark theme detection, version 2.0.17 confirmed
- https://www.npmjs.com/package/vitepress-plugin-mermaid — Version 2.0.17 confirmation
- https://github.com/emersonbottero/vitepress-plugin-mermaid/issues/80 — Gitgraph diagrams broken in Mermaid 11.1+
- https://draft.dev/learn/documentation-best-practices-for-developer-tools — Quick-start, complete reference, search as key features
- https://document360.com/blog/developer-documentation-mistakes/ — Audience mismatch and consistency anti-patterns
- https://clig.dev/ — Command grouping by workflow stage (not alphabetically) as CLI UX standard
- https://gaudion.dev/blog/documentation-drift — Documentation drift root causes and prevention patterns
- https://github.com/vuejs/vitepress/issues/3377 — Local search indexing performance at scale

### Tertiary (LOW confidence / needs Phase 1 validation)
- WebSearch results for "VitePress mermaid diagrams integration 2025 2026" — vitepress-plugin-mermaid identified as dominant option; specific version pair needs build-time verification

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
