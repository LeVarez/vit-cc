# Roadmap: vit-cc

## Milestones

- ✅ **v1.0 GitHub Sync & Agents** — Phases 1–3 (shipped 2026-03-18)
- 🚧 **v1.1 Documentation Site** — Phases 01–04 (in progress)

## Phases

<details>
<summary>✅ v1.0 GitHub Sync & Agents (Phases 1–3) — SHIPPED 2026-03-18</summary>

- [x] Phase 1: PR Lifecycle Foundation (2/2 plans) — completed 2026-03-18
- [x] Phase 2: AI PR Reviewer (2/2 plans) — completed 2026-03-18
- [x] Phase 3: Documentation & Changelog Agents (4/4 plans) — completed 2026-03-18

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Documentation Site (In Progress)

**Milestone Goal:** Create comprehensive documentation for the entire VIT framework — commands, agents, architecture, and contributor guides — as a VitePress site with ASCII branding and Mermaid diagrams.

- [x] **Phase 01: VitePress Foundation** — Working site deployed to GitHub Pages with correct config, Mermaid, ASCII branding, full navigation skeleton, and CI build
- [ ] **Phase 02: Getting Started and Command Reference** — Complete guide section establishing core vocabulary plus all 29 command reference pages
- [ ] **Phase 03: Agent Reference and Architecture** — All 16 agent reference pages plus four architecture diagrams covering the full system
- [ ] **Phase 04: Advanced and Contributors** — Custom agent guide, .planning/ internals reference, and contributor walkthrough

---

#### Phase 01: VitePress Foundation

**Goal**: A working VitePress site is live on GitHub Pages with correct infrastructure — every subsequent content phase builds on this.
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07
**Success Criteria** (what must be TRUE):
  1. Visiting the GitHub Pages URL serves the site with dark mode, syntax highlighting, and local search (Ctrl+K)
  2. ASCII art logo renders correctly on the landing page and site header using a monospace font
  3. A Mermaid fenced code block on any page renders as an SVG diagram (not raw text)
  4. `vitepress build` runs and passes in CI on every push, catching dead links and SSR errors
  5. Navigation sidebar shows all five sections (Guide, Commands, Agents, Architecture, Contributing) with stub pages behind each entry
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Initialize VitePress project, configure site settings, create stub pages, and deploy workflow
- [ ] 01-02-PLAN.md — Install Mermaid plugin, create ASCII branding, verify diagram rendering

---

#### Phase 02: Getting Started and Command Reference

**Goal**: New users can get oriented and running, and existing users can look up any command — the primary value of the docs site is delivered.
**Depends on**: Phase 01
**Requirements**: GUIDE-01, GUIDE-02, GUIDE-03, GUIDE-04, GUIDE-05, CMD-01, CMD-02, CMD-03, CMD-04
**Success Criteria** (what must be TRUE):
  1. A user who has never heard of VIT can read the guide section (landing page through core concepts) and understand what the framework does and how to install it
  2. A user can follow the first-project walkthrough from start to finish and see the full `/vit:new-project` lifecycle
  3. Any of the 29 commands can be found by navigating the command sidebar grouped by workflow stage
  4. Every command page documents: description, usage, what to expect, and GitHub effects — using a consistent template
  5. The workflow diagram on the overview page renders as a Mermaid diagram showing the full phase lifecycle
**Plans**: TBD

Plans:
- [ ] 02-01: Write guide section (landing page, installation, first project walkthrough, core concepts, workflow overview)
- [ ] 02-02: Write command reference index and all 29 command pages (Project Setup, Phase Workflow, State Management groups)
- [ ] 02-03: Write remaining command pages (Milestone Management, Phase Editing, Tools, Settings groups) and verify all pages against source files

---

#### Phase 03: Agent Reference and Architecture

**Goal**: Advanced users can understand how every agent works and how the system fits together — the framework's internals are visible and navigable.
**Depends on**: Phase 02
**Requirements**: AGT-01, AGT-02, AGT-03, AGT-04, ARCH-01, ARCH-02, ARCH-03, ARCH-04
**Success Criteria** (what must be TRUE):
  1. Any of the 16 agents can be found by navigating the agent sidebar, with each page explaining purpose, when spawned, inputs/outputs, and tools available
  2. The agent orchestration diagram shows which commands spawn which agents as a Mermaid diagram
  3. The architecture section has a top-level diagram showing the three-layer pipeline (commands → agents → state)
  4. Data flow, GitHub integration, and agent spawning are each covered by a dedicated Mermaid diagram on their own pages
**Plans**: TBD

Plans:
- [ ] 03-01: Write agent reference index and all 16 agent pages with per-agent Mermaid flow diagrams
- [ ] 03-02: Write architecture section (high-level, data flow, GitHub integration, agent spawning diagrams)

---

#### Phase 04: Advanced and Contributors

**Goal**: Contributors can extend VIT with new agents and commands, and advanced users can understand the .planning/ state system internals.
**Depends on**: Phase 03
**Requirements**: ADV-01, ADV-02, ADV-03, ADV-04, ADV-05
**Success Criteria** (what must be TRUE):
  1. A developer can follow the "creating a custom agent" guide step-by-step and understand spawning patterns, tool access, and registration
  2. The .planning/ directory reference documents every file format (STATE.md, config.json, PLAN.md, MILESTONE.md) with annotated examples
  3. The contributing guide explains how to add commands, agents, and modify workflows — starting from the baseline of a user who has completed the core workflow
**Plans**: TBD

Plans:
- [ ] 04-01: Write contributing section (creating agents, creating commands, templates reference, development setup)
- [ ] 04-02: Write internals reference (.planning/ structure, STATE.md lifecycle, config.json options)

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. PR Lifecycle Foundation | v1.0 | 2/2 | Complete ✓ | 2026-03-18 |
| 2. AI PR Reviewer | v1.0 | 2/2 | Complete ✓ | 2026-03-18 |
| 3. Documentation & Changelog Agents | v1.0 | 4/4 | Complete ✓ | 2026-03-18 |
| 01. VitePress Foundation | v1.1 | 2/2 | Complete ✓ | 2026-03-18 |
| 02. Getting Started and Command Reference | v1.1 | 0/3 | Not started | — |
| 03. Agent Reference and Architecture | v1.1 | 0/2 | Not started | — |
| 04. Advanced and Contributors | v1.1 | 0/2 | Not started | — |
