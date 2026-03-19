# Roadmap: vit-cc GitHub Sync & Agents Extension

## Milestones

- ✅ **v1.0 GitHub Sync & Agents** — Phases 1–3 (shipped 2026-03-18)
- 🚧 **v1.1 Documentation & Developer Portal** — Phases 01–02 (in progress)

## Phases

<details>
<summary>✅ v1.0 GitHub Sync & Agents (Phases 1–3) — SHIPPED 2026-03-18</summary>

- [x] Phase 1: PR Lifecycle Foundation (2/2 plans) — completed 2026-03-18
- [x] Phase 2: AI PR Reviewer (2/2 plans) — completed 2026-03-18
- [x] Phase 3: Documentation & Changelog Agents (4/4 plans) — completed 2026-03-18

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Documentation & Developer Portal (In Progress)

**Milestone Goal:** Create comprehensive documentation — a visually striking README with full command/agent reference, plus a VitePress-powered technical docs site for contributors.

#### Phase 01: README Rewrite with ASCII Art Branding

**Goal:** Users and contributors encounter a complete, visually consistent README that documents every command, agent, and config key in the project.
**Depends on:** Nothing (first phase of milestone)
**Requirements:** README-01, README-02, README-03, README-04, README-05, README-06, README-07, README-08, README-09, README-10, README-11, README-12, README-13
**Success Criteria** (what must be TRUE):
  1. The ASCII art hero banner renders correctly on GitHub and in a terminal without layout breaks
  2. All 31 commands are documented with name, description, usage example, and produced artifacts, organized into 11 groups with ASCII section headers
  3. All 16 agents are documented in a table with spawner command, role description, and output
  4. All config.json keys are documented with defaults, descriptions, and the model profile matrix table
  5. Visual style is consistent throughout: section headers use ━━━, dividers use ───, no unapproved emoji, matching ui-brand.md conventions
**Plans:** TBD

Plans:
- [ ] 01-01: TBD

#### Phase 02: GitHub Pages Technical Documentation Site

**Goal:** A contributor can read the VitePress docs site to understand VIT internals and create a new command or agent without asking for help.
**Depends on:** Phase 01 (branding and reference content established)
**Requirements:** DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, DOCS-06, DOCS-07, DOCS-08, DOCS-09, DOCS-10, DOCS-11, DOCS-12, DOCS-13, DOCS-14
**Success Criteria** (what must be TRUE):
  1. VitePress builds without errors and GitHub Pages deployment workflow publishes the site on push to main
  2. All 13 documentation pages have substantive content (not stubs) covering their specified topics
  3. A contributor can follow the "Command Anatomy" and "Agent Anatomy" guides to create a new command or agent with no additional information
  4. The sidebar navigation matches the specified Guide → Contributing → Reference hierarchy and all internal links resolve correctly
**Plans:** TBD

Plans:
- [ ] 02-01: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. PR Lifecycle Foundation | v1.0 | 2/2 | Complete ✓ | 2026-03-18 |
| 2. AI PR Reviewer | v1.0 | 2/2 | Complete ✓ | 2026-03-18 |
| 3. Documentation & Changelog Agents | v1.0 | 4/4 | Complete ✓ | 2026-03-18 |
| 01. README Rewrite with ASCII Art Branding | v1.1 | 0/? | Not started | - |
| 02. GitHub Pages Technical Documentation Site | v1.1 | 0/? | Not started | - |
