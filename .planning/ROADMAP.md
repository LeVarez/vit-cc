# Roadmap: vit-cc GitHub Sync & Agents Extension

## Milestones

- ✅ **v1.0 GitHub Sync & Agents** — Phases 1–3 (shipped 2026-03-18)
- 🚧 **v1.0.1 Documentation** — Phases 01–05 (in progress)

## Phases

<details>
<summary>✅ v1.0 GitHub Sync & Agents (Phases 1–3) — SHIPPED 2026-03-18</summary>

- [x] Phase 1: PR Lifecycle Foundation (2/2 plans) — completed 2026-03-18
- [x] Phase 2: AI PR Reviewer (2/2 plans) — completed 2026-03-18
- [x] Phase 3: Documentation & Changelog Agents (4/4 plans) — completed 2026-03-18

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.0.1 Documentation (In Progress)

**Milestone Goal:** Create a comprehensive VitePress documentation site that serves as the entry point for developers — covering concepts, commands, agents, internals, and tutorials.

#### Phase 01: Infrastructure and Information Architecture

**Goal**: The docs site is live and navigable — every section exists, search works, and deployment is automated.
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07
**Success Criteria** (what must be TRUE):
  1. Running `npm run docs:dev` serves the docs site locally with no errors
  2. The deployed GitHub Pages site is reachable and all section links in the sidebar resolve (no 404s)
  3. The search bar finds content across the site without any API key or external service
  4. The homepage shows the value proposition, a quick-start CTA, and feature highlights
  5. Dark mode toggles correctly and all content sections appear in the sidebar navigation
**Plans**: TBD

Plans:
- [ ] 01-01: VitePress setup, config, and deployment workflow
- [ ] 01-02: Homepage, sidebar structure, and placeholder pages

#### Phase 02: Getting Started and Concepts

**Goal**: A newcomer can install vit-cc and run a complete workflow using only the docs.
**Depends on**: Phase 01
**Requirements**: START-01, START-02, START-03, CONC-01, CONC-02, CONC-03, CONC-04, CONC-05, CONC-06
**Success Criteria** (what must be TRUE):
  1. A developer unfamiliar with VIT can reach a working `/vit:verify-work` invocation in under 10 minutes using only the Getting Started section
  2. The installation page lists all prerequisites (Node.js, Claude Code, gh CLI) and the install command
  3. The workflow loop page includes a diagram showing how commands, agents, and state connect
  4. Each concepts page (phases, milestones, agents, state, GitHub integration) defines its subject without assuming prior knowledge
**Plans**: TBD

Plans:
- [ ] 02-01: Getting Started section (installation, quick-start, first-project walkthrough)
- [ ] 02-02: Concepts section (workflow loop, phases/milestones, agents, state, GitHub integration, architecture diagram)

#### Phase 03: Command Reference

**Goal**: Every command is documented with accurate description, usage syntax, examples, and cross-links.
**Depends on**: Phase 02
**Requirements**: CMD-01, CMD-02, CMD-03, CMD-04
**Success Criteria** (what must be TRUE):
  1. All 29 command pages exist under `/commands/` and are reachable from the sidebar
  2. Each command page shows the invocation syntax, what it does, and at least one real usage example
  3. The commands index page groups all 29 commands by workflow stage (Lifecycle, Planning, Execution, Utility, Configuration)
  4. Related commands link to each other (e.g., `/vit:plan-phase` links to `/vit:execute-phase`)
**Plans**: TBD

Plans:
- [ ] 03-01: Stub extraction — generate all 29 command page stubs from source frontmatter
- [ ] 03-02: Command content — complete descriptions, options, examples, and cross-links for all pages
- [ ] 03-03: Commands index page and sidebar categorization

#### Phase 04: Agent Reference

**Goal**: Every agent is documented with role, spawn trigger, inputs, outputs, and links to the commands that invoke it.
**Depends on**: Phase 03
**Requirements**: AGT-01, AGT-02, AGT-03, AGT-04
**Success Criteria** (what must be TRUE):
  1. All 16 agent pages exist under `/agents/` and are reachable from the sidebar
  2. Each agent page states when the agent runs, what triggers it, and what it produces
  3. An agent interaction diagram shows which commands spawn which agents
  4. Agent pages link to their spawning commands; command pages link to agents they spawn
**Plans**: TBD

Plans:
- [ ] 04-01: Stub extraction — generate all 16 agent page stubs from source role blocks
- [ ] 04-02: Agent content — complete trigger descriptions, inputs/outputs, and cross-links for all pages
- [ ] 04-03: Agents index page and interaction diagram

#### Phase 05: Advanced Guides

**Goal**: Power users can extend VIT with custom agents, tune configuration, understand internals, and follow step-by-step tutorials for common workflows.
**Depends on**: Phase 04
**Requirements**: ADV-01, ADV-02, ADV-03, ADV-04
**Success Criteria** (what must be TRUE):
  1. The custom agents guide explains the full agent contract (Markdown prompt structure, spawn mechanism, inputs/outputs) with a worked example
  2. The configuration guide covers all model profiles, workflow toggles, and settings fields
  3. At least 2 tutorials walk through a complete workflow end-to-end with commands, expected output, and links to reference pages
  4. The internals page covers state management, worktrees, GitHub sync mechanics, and the hook system
**Plans**: TBD

Plans:
- [ ] 05-01: Custom agents guide and configuration reference
- [ ] 05-02: Internals deep-dive
- [ ] 05-03: Step-by-step tutorials (build a project, debug with VIT)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. PR Lifecycle Foundation | v1.0 | 2/2 | Complete ✓ | 2026-03-18 |
| 2. AI PR Reviewer | v1.0 | 2/2 | Complete ✓ | 2026-03-18 |
| 3. Documentation & Changelog Agents | v1.0 | 4/4 | Complete ✓ | 2026-03-18 |
| 01. Infrastructure and Information Architecture | v1.0.1 | 0/2 | Not started | - |
| 02. Getting Started and Concepts | v1.0.1 | 0/2 | Not started | - |
| 03. Command Reference | v1.0.1 | 0/3 | Not started | - |
| 04. Agent Reference | v1.0.1 | 0/3 | Not started | - |
| 05. Advanced Guides | v1.0.1 | 0/3 | Not started | - |
