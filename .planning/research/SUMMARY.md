# Project Research Summary

**Project:** vit-cc v1.0.1 — VitePress Documentation Site
**Domain:** Developer documentation site for a CLI workflow framework
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

vit-cc needs a documentation site that serves two distinct audiences: newcomers who need to get from zero to their first working workflow in under 10 minutes, and power users who need a precise, searchable reference for 29 commands and 16 agents. The research is unambiguous about how to build this: VitePress (install `@next` for v2 alpha) deployed to GitHub Pages, with a `docs/` directory at the project root, local search enabled out of the box, and the full sidebar structure committed before a single content page is written.

The recommended approach is a 5-phase build that leads with infrastructure and information architecture (Phase 1), then tackles the highest-traffic newcomer path (Phase 2), then uses semi-automated stub extraction to efficiently produce 45 reference pages (Phases 3–4), and finishes with tutorials and advanced guides (Phase 5). This order is not arbitrary — it reflects hard dependencies: Phase 3 cross-links require Concepts vocabulary to exist; Phase 4 agent pages cross-link to command pages; Phase 5 tutorials require both reference sections to be complete and correct.

The two dominant risks are documentation drift and newcomer abandonment. Documentation drift (docs falling out of sync with command behavior) is structurally addressed by co-locating docs in the same repo and treating every command file change as requiring a corresponding docs update. Newcomer abandonment is addressed by information architecture: keeping Internals and advanced content off the primary navigation path, and writing Getting Started before writing reference material, not after.

---

## Key Findings

### Recommended Stack

One new devDependency — `vitepress@next` (v2.0.0-alpha.16+) — covers everything: static site generation, Shiki syntax highlighting, MiniSearch full-text search, dark mode, mobile layout, and the Vue-powered theming system. No separate installs are needed for Vue, Vite, or any search provider. The existing project needs `engines.node` updated from `>=18` to `>=20` (VitePress v2 requirement) and three npm scripts added (`docs:dev`, `docs:build`, `docs:preview`).

The only infrastructure addition is a GitHub Actions workflow file (`deploy-docs.yml`) scoped to `paths: ['docs/**']` so it does not trigger on code-only commits. Deployment target is GitHub Pages, which requires setting `base: '/vit-cc/'` in config. Note: `cleanUrls: true` (which produces cleaner URLs like `/commands/plan-phase` rather than `/commands/plan-phase.html`) requires either a platform that supports URL rewriting natively or accepting `.html` extension URLs with GitHub Pages.

**Core technologies:**
- `vitepress@next` (v2.0.0-alpha.16+): static site generator — official recommendation for new projects; bundles all needed tooling
- GitHub Actions + GitHub Pages: deployment — zero additional accounts or infrastructure needed; repo is already on GitHub
- MiniSearch (built-in to VitePress): full-text search — no API keys, works offline, sufficient for a single-product docs site

**What NOT to add:** separate `vue` or `vite` installs (version conflicts), Algolia DocSearch (overkill, requires external review), TypeDoc (no TypeScript types to extract), a separate `docs/package.json` (unnecessary complexity).

### Expected Features

The site has 6 required content sections (Home, Getting Started, Concepts, Command Reference, Agent Reference, Changelog) and 7 built-in site features that VitePress provides at zero implementation cost (search, sidebar, dark mode, mobile layout, syntax highlighting, prev/next navigation, on-this-page outline). The differentiators that separate good docs from adequate docs are: a workflow diagram in Concepts, step-by-step tutorials, a custom agents guide, and a command quick-reference table.

**Must have (table stakes):**
- Home page with value prop, install command, and CTA — users need this to exist; content is in README already
- Getting started guide through first phase completion — without this, the only path is the README
- Concepts section (phases, milestones, agents, state) — vocabulary required before reference pages are meaningful
- Command reference: all 29 commands — incomplete reference forces users to read source files
- Agent reference: all 16 agents — the workflow loop is opaque without understanding what agents do
- Search, sidebar, dark mode — VitePress defaults; not configuring them is not an option

**Should have (differentiators):**
- Workflow diagram in Concepts — a single diagram beats 500 words of prose for the plan/execute/verify loop
- Command quick-reference table — orientation for all 29 commands before reading individual pages
- Step-by-step tutorials — the #1 reason users bounce back to the README is no walkthrough
- Custom agents guide — differentiates VIT from black-box tools; enables community contribution
- Edit this page link + last updated timestamp — builds trust, opens docs to community fixes

**Defer (v2+):**
- Internals deep-dive — write when contributors start asking questions not answered by current pages
- Team workflows guide — defer until team usage patterns are understood
- i18n / multi-language — significant ongoing maintenance burden; unclear ROI at current scale
- Versioned docs — `npx vit-claude` always installs latest; versioned docs add navigation complexity without benefit

**Anti-features to avoid explicitly:**
- Video tutorials embedded in docs (go stale, not skimmable)
- Auto-generated command reference from source bodies (agent prompt XML is not user-facing content)
- Separate FAQ section (symptom of missing documentation; write the answer in the right section)
- Interactive browser playground (VIT requires Claude Code and a real file system; a sandbox is misleading)

### Architecture Approach

The docs site lives at `docs/` in the project root. VitePress config (`docs/.vitepress/config.mts`) uses path-based sidebar scoping: each URL prefix (`/commands/`, `/agents/`, etc.) shows a different sidebar. This is the correct pattern for a large multi-section site — without it, a 62-page sidebar would be shown on every page. The top nav has 6 entries: Get Started, Concepts, Commands, Agents, Guides, GitHub.

The highest-leverage implementation decision is stub extraction: 45 of the ~62 total pages (all 29 command pages and all 16 agent pages) can be bootstrapped from existing source files. Command frontmatter (`name:`, `description:`, `argument-hint:`) seeds each command page stub; agent frontmatter and `<role>` blocks seed each agent page stub. The remaining hand-written sections (What It Does, Options, Examples, Inputs, Outputs) are filled in during the content phase. This extraction is a single contained task — one plan in one execution wave — and avoids writing 45 page headers by hand.

**Major components:**
1. `docs/.vitepress/config.mts` — nav, sidebar (7 sections), search, base URL, cleanUrls setting
2. `docs/.vitepress/sidebars.ts` — sidebar config extracted into its own file to avoid a 300-line config.mts
3. `docs/index.md` — homepage with hero block and feature grid (hand-written marketing copy)
4. `docs/getting-started/`, `docs/concepts/` — 9 hand-written pages establishing the newcomer path
5. `docs/commands/` (30 pages), `docs/agents/` (17 pages) — mostly stub-extracted, human-completed reference
6. `docs/guides/`, `docs/internals/`, `docs/config/` — advanced content written last
7. `.github/workflows/deploy-docs.yml` — GitHub Actions deployment scoped to `docs/**` path changes

### Critical Pitfalls

1. **Base path misconfiguration on GitHub Pages** — Set `base: '/vit-cc/'` with both leading and trailing slashes in `config.mts` before writing any content. Test with `npm run docs:build && npm run docs:preview` before first deployment. This is invisible in dev but breaks the entire production site (blank page, all assets 404).

2. **Documentation drift** — Establish the rule at the start: any modification to a file under `.claude/commands/vit/` or `.claude/agents/` requires a corresponding docs update in the same PR. The `vit-doc-updater` agent scope should be extended to include the `docs/` directory, not just README and CHANGELOG.

3. **No information architecture before content creation** — Commit the full sidebar structure (all sections, all page titles, all groupings) as a single document before any content page is written. Restructuring 62 pages of cross-linked content post-hoc is a rewrite. The sidebar config is the information architecture.

4. **Overwhelming newcomers with internals** — Internals and advanced content go last in the sidebar and last in the writing order. The Getting Started section is written first, not last. Test: an unfamiliar developer should reach a working command invocation in under 10 minutes using only the docs.

5. **Frontmatter titles not indexed by search** — Configure the custom `_render` hook for local search before any content is published, or use explicit H1 headings instead of frontmatter-based headings. This bug is invisible in dev and only manifests in the built search index.

---

## Implications for Roadmap

Based on combined research, the 5-phase structure below is the recommended build order. Phases 1 and 2 deliver a live site with the most important content. Phases 3–4 are the highest-volume work but are efficiently parallelizable via stub extraction. Phase 5 adds the high-value content that requires both reference sections to already exist.

### Phase 1: Infrastructure and Information Architecture

**Rationale:** Every subsequent phase adds content to a working, deployed site. A non-deployable site means content work has no visible effect. The information architecture decision (sidebar structure, page groupings, URL conventions) must be made before content is written because restructuring afterwards breaks cross-links across all pages simultaneously.

**Delivers:** Live GitHub Pages deployment with homepage and placeholder pages for all sections. VitePress installed, configured (base path, search, sidebar skeleton, cleanUrls decision), and deploying on push to `docs/**`. Full sidebar structure committed as a design document.

**Addresses:** Table stakes site features (search, dark mode, sidebar navigation). Anti-feature avoidance (information architecture before content).

**Avoids:**
- Base path misconfiguration (Pitfall 2) — set `base: '/vit-cc/'` before first content push
- No information architecture before content (Pitfall 3) — sidebar structure is a deliverable of this phase
- HTML minification breaking Vue hydration (Pitfall 7) — verify in CI before first deployment
- cleanUrls without host configuration (Pitfall 11) — decide here, not after 62 pages use one convention
- Sidebar leading slash omission (Pitfall 10) — enforce in the initial config template
- Frontmatter title search bug (Pitfall 6) — configure `_render` hook before content begins

**Research flag:** Skip — VitePress setup is well-documented with official guides and the pitfalls research covers all edge cases.

---

### Phase 2: Getting Started and Concepts

**Rationale:** The Getting Started section is the highest-traffic path for the audience this milestone serves. Writing reference pages before the onboarding path inverts priorities. Concepts establish the vocabulary (phases, milestones, agents, state) that makes every subsequent reference page meaningful — without this vocabulary, a newcomer reading a command page cannot understand what it does.

**Delivers:** Complete Getting Started section (installation, first-project walkthrough through first verify-work cycle) and complete Concepts section (phases, milestones, agents, state management, workflow loop). A newcomer can now install vit-cc and run a working workflow using only the docs.

**Addresses:** Table stakes content (getting started guide, concepts overview). Differentiators (workflow diagram in concepts/workflow-loop.md).

**Avoids:**
- Overwhelming newcomers with internals before first command (Pitfall 4) — getting started is written first; internals are not present yet
- Mixed reference and tutorial content (Pitfall 8) — getting-started pages are tutorial-form; concepts pages are explanation-form; reference does not exist yet to be mixed

**Research flag:** Skip for infrastructure patterns. Consider a brief review of the actual command source files (`files/commands/vit/new-project.md`, `plan-phase.md`, `execute-phase.md`, `verify-work.md`) to verify the walkthrough narrative matches current behavior — this is content validation, not technology research.

---

### Phase 3: Command Reference (29 pages)

**Rationale:** Command reference is the primary content destination for power users and the lookup target for newcomers who have read Getting Started. The stub extraction approach (parse frontmatter from `.claude/commands/vit/*.md`, write stub pages) makes this phase mostly mechanical for the boilerplate — the human work is writing accurate examples and cross-links. Requires Concepts to be complete so cross-links to phases/agents/milestones use established vocabulary.

**Delivers:** All 29 command reference pages plus `commands/index.md` with the categorized table. Sidebar for `/commands/` fully populated with 7 workflow-stage groups.

**Addresses:** Table stakes content (command reference: all 29 commands). Differentiator (command quick-reference table).

**Avoids:**
- Extracting command file bodies verbatim (architecture anti-pattern) — extract frontmatter and human-readable prose only; XML prompt blocks stay internal
- Manual sidebar maintenance bottleneck (Pitfall 5) — stub extraction creates all 29 pages; sidebar is auto-populated once per phase

**Research flag:** Skip — stub extraction pattern is documented in ARCHITECTURE.md; command content comes from source files read directly.

---

### Phase 4: Agent Reference (16 pages)

**Rationale:** Agent pages cross-link to the commands that spawn them. Command pages must exist before agent pages link to them. The extraction pattern is identical to Phase 3 (frontmatter + `<role>` block extraction), so this phase benefits from the tooling and conventions established in Phase 3.

**Delivers:** All 16 agent reference pages plus `agents/index.md` with grouped table. Spawn triggers, inputs, and outputs documented for each agent.

**Addresses:** Table stakes content (agent reference). Differentiator (understanding the workflow loop through agent spawn relationships).

**Avoids:**
- Agent pages not covering spawn triggers (Pitfall 14) — spawn trigger is a required field in the agent page template; information exists in command implementations

**Research flag:** Skip — same extraction pattern as Phase 3; agent content comes from `.claude/agents/*.md` files read directly.

---

### Phase 5: Guides, Internals, Configuration, and Polish

**Rationale:** Tutorials and how-to guides cite specific commands and agents by name; both reference sections must exist before tutorials can cross-link correctly. Internals and configuration are lower-discovery-traffic sections — power users find them via sidebar; newcomers are explicitly directed away from them. Placing these last ensures they do not dominate development time at the expense of the newcomer path.

**Delivers:** Tutorials section (build-a-project, add-a-milestone, debug-with-vit), advanced guides (custom agents), internals reference (state management, GitHub sync, worktrees, hooks), configuration reference (profiles, settings, hooks). Final polish: OG image, social links, edit-this-page links pointing to GitHub, last-updated timestamps, README updated with link to hosted docs.

**Addresses:** Differentiators (step-by-step tutorials, custom agents guide, annotated file tree, edit-this-page link, last-updated timestamp). Anti-feature avoidance (internals goes last and is labeled "for contributors and power users").

**Avoids:**
- Tutorials becoming stale (Pitfall 15) — annotate each tutorial step with the commands it invokes; establish review requirement when those commands change
- Glossary-first information architecture anti-feature — concepts are inline in tutorials, not an upfront glossary

**Research flag:** The custom agents guide may benefit from a brief research pass — understanding the exact mechanism by which custom agents are registered and spawned requires careful reading of `execute-phase.md` and several agent files. Not external research, but internal codebase research via `/vit:map-codebase`.

---

### Phase Ordering Rationale

The sequence reflects three dependency chains identified across all four research files:

1. **Infrastructure before content** (PITFALLS: base path, sidebar structure, search config): all three of these decisions must be made once and early, because changing them retroactively affects every page simultaneously.

2. **Vocabulary before reference** (FEATURES: concepts section required for reference pages to be meaningful; ARCHITECTURE: Phase 2 before Phase 3): a command reference page that says "this command creates a phase plan" is useful only if the reader knows what a phase is.

3. **Reference before tutorials** (ARCHITECTURE: Phase 5 after Phases 3–4; FEATURES: tutorials deferred to post-launch if needed): tutorials are narrative cross-links through the command and agent reference; they cannot be written until what they reference exists and is accurate.

The stub extraction insight from ARCHITECTURE.md is the key efficiency decision: treating Phases 3 and 4 as "extraction + completion" rather than "write from scratch" makes the 45 reference pages tractable within a milestone that is documentation-only.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | VitePress official docs verified; `@next` recommendation from maintainer on record; deployment config verified from official deploy guide |
| Features | HIGH | Built-in VitePress features verified from official default theme docs; content section recommendations converge across multiple authoritative developer documentation sources |
| Architecture | HIGH | Sidebar scoping, file-based routing, and integration patterns verified from official VitePress docs; component boundaries verified by reading actual source files in the vit-cc codebase |
| Pitfalls | HIGH | Critical VitePress-specific pitfalls verified via official docs and GitHub Issues with specific issue numbers; documentation strategy pitfalls from multiple converging credible sources |

**Overall confidence:** HIGH

### Gaps to Address

- **`cleanUrls: true` decision:** GitHub Pages does not natively support clean URL routing. Either accept `.html` extension URLs (ugly in shared links), configure a 404-fallback workaround (fragile), or switch to Netlify or Vercel (adds account dependency). This decision should be made and documented in Phase 1 before any internal links are written.

- **VitePress v2-alpha stability:** The `@next` tag resolves to v2.0.0-alpha at research time. The alpha label carries some risk of breaking config changes before stable. Mitigation: pin to a specific alpha version in `package.json` (e.g., `"vitepress": "2.0.0-alpha.16"`) rather than `@next` after initial install, to avoid unintended upgrades.

- **`vit-doc-updater` agent scope:** The agent currently scopes to README and CHANGELOG updates. Whether extending its trigger to cover `docs/` pages is a natural extension or requires new agent behavior is not determined by research — this needs a decision during Phase 1 planning.

- **Sidebar auto-generation plugin:** PITFALLS.md notes the community `vitepress-sidebar` plugin as a preventive measure for manual sidebar maintenance. The plugin is community-maintained (MEDIUM confidence). The tradeoff (reduced manual work vs. one more dependency) should be explicitly decided in Phase 1.

---

## Sources

### Primary (HIGH confidence)

- https://vitepress.dev/guide/getting-started — install, project structure, Node.js requirements, ESM requirements
- https://vitepress.dev/guide/deploy — GitHub Pages deployment, base path, HTML minification warning
- https://vitepress.dev/reference/default-theme-config — search, sidebar, dark mode, edit link, last updated, outline
- https://vitepress.dev/reference/site-config — cleanUrls, ignoreDeadLinks, base, srcDir
- https://vitepress.dev/guide/routing — file-based routing, link extension conventions, leading slash requirement
- https://vitepress.dev/reference/default-theme-search — local search configuration and `_render` hook
- Direct reading of `.claude/commands/vit/*.md` — all 29 command files (name, description, argument-hint)
- Direct reading of `.claude/agents/*.md` — all 16 agent files (name, description, role blocks)
- Direct reading of `README.md`, `package.json`, `PROJECT.md`, `CHANGELOG.md`
- GitHub Issues: #3243 (sidebar leading slash), #3083 (frontmatter search), #1084 (ignoreDeadLinks)

### Secondary (MEDIUM confidence)

- https://github.com/vuejs/vitepress/issues/4945 — maintainer recommendation to use v2 alpha for new projects
- https://github.com/jooy2/vitepress-sidebar — auto-sidebar plugin
- WorkOS: 9 Components of Great Developer Documentation — content section recommendations
- draft.dev: 12 Documentation Examples — interactive elements, role-based learning paths
- CLI Guidelines (clig.dev) — examples-first documentation; searchability
- GitHub Blog: Documentation Done Right — separate Quick Starts, Tutorials, Reference, and Concepts
- Document360: 10 Common Developer Documentation Mistakes — outdated examples, poor structure, version info
- Nielsen Norman Group: Top 10 IA Mistakes — navigation and information architecture
- Diátaxis framework — tutorials/how-to/explanation/reference as distinct content types

### Tertiary (LOW confidence / informational)

- https://gaudion.dev/blog/documentation-drift — documentation drift definition and patterns
- https://thisisimportant.net/posts/docs-as-code-broken-promise/ — docs-as-code ownership challenges
- APIdog: Why Stripe's API Docs Are the Benchmark — three-column layout patterns (informational; not directly applicable to VitePress default theme)

---

*Research completed: 2026-03-18*
*Ready for roadmap: yes*
