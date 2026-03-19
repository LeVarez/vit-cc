# Roadmap: vit-cc

## Milestones

- ✅ **v1.0 GitHub Sync & Agents** — Phases 1–3 (shipped 2026-03-18)
- 🚧 **v1.1 Documentation & Developer Guide** — Phases 01–04 (in progress)

## Phases

<details>
<summary>✅ v1.0 GitHub Sync & Agents (Phases 1–3) — SHIPPED 2026-03-18</summary>

- [x] Phase 1: PR Lifecycle Foundation (2/2 plans) — completed 2026-03-18
- [x] Phase 2: AI PR Reviewer (2/2 plans) — completed 2026-03-18
- [x] Phase 3: Documentation & Changelog Agents (4/4 plans) — completed 2026-03-18

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Documentation & Developer Guide (In Progress)

**Milestone Goal:** Every VIT user can discover, understand, and use any command or agent without reading source markdown files; every developer can extend the framework with custom components by following documented patterns.

#### Phase 01: Information Architecture

**Goal**: Users have a clear, navigable documentation home — the right folder structure, an oriented README, and foundational concept pages that define the VIT mental model.
**Depends on**: Nothing (first phase)
**Requirements**: IA-01, IA-02, IA-03, IA-04, IA-05
**Success Criteria** (what must be TRUE):
  1. A user new to VIT can open the repo and find their way to any documentation section from README.md without visiting source files
  2. A user can read the getting started guide and complete first project setup through first phase execution without external help
  3. A user can look up any VIT-specific term (phase, plan, wave, checkpoint, must_have) in the glossary and find a clear definition
  4. The docs/ folder separates user-facing content from developer-facing content visibly
  5. A user can read the core concepts page and explain the milestone → phase → plan → task hierarchy and how agents fit in
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — docs/ folder structure + README.md restructure as navigation hub
- [ ] 01-02-PLAN.md — Getting started tutorial (install to first verified phase)
- [ ] 01-03-PLAN.md — Core concepts explanation + glossary reference

#### Phase 02: Command & Agent Reference

**Goal**: Every slash command and every agent has a complete, accurate reference page a user can consult to understand inputs, outputs, prerequisites, and expected behavior.
**Depends on**: Phase 01
**Requirements**: CMD-01, CMD-02, CMD-03, CMD-04, CMD-05, AGT-01, AGT-02, AGT-03, AGT-04
**Success Criteria** (what must be TRUE):
  1. A user can look up any of the 30 slash commands and find its syntax, options, prerequisites, and at least one usage example
  2. A user can look up any of the 16 agents and find its role, behavioral contract, spawning command, and file inputs/outputs
  3. A user can consult the command flow diagram to know which command to run next from any point in the workflow
  4. Commands are grouped by workflow stage so a user can scan for commands relevant to where they are in their work
  5. The agent orchestration diagram shows the full spawn graph so a user can trace what happens when a command runs
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

#### Phase 03: Workflow Guides & Architecture

**Goal**: Users can follow end-to-end guides for the most important workflows, and developers can understand the architecture and design patterns that make VIT work.
**Depends on**: Phase 02
**Requirements**: WF-01, WF-02, WF-03, WF-04, ARCH-01, ARCH-02, ARCH-03, ARCH-04
**Success Criteria** (what must be TRUE):
  1. A user can follow the end-to-end workflow guide from `/vit:new-project` through `/vit:complete-milestone` without consulting source files
  2. A user can follow the GitHub integration guide to set up PR lifecycle and issue tracking for their project
  3. A developer can read the three-layer architecture page and explain the command → agent → state-store separation
  4. A developer can follow the Mermaid data flow diagrams to trace state progression through a complete milestone lifecycle
  5. A user encountering a broken context or stuck workflow can follow the debugging guide to diagnose and recover
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

#### Phase 04: Developer Extension Guide

**Goal**: A developer can create a custom agent or slash command by following step-by-step tutorials, with reference pages for every extension point in the framework.
**Depends on**: Phase 01
**Requirements**: DEV-01, DEV-02, DEV-03, DEV-04, DEV-05, DEV-06
**Success Criteria** (what must be TRUE):
  1. A developer can follow the custom agent tutorial and produce a working agent that integrates with the VIT framework
  2. A developer can follow the custom slash command tutorial and produce a working orchestrator command
  3. A developer can consult the agent anatomy reference to understand every section and convention in an agent definition file
  4. A developer can consult the configuration reference to understand every config.json field, model profile, and workflow toggle
  5. A developer can consult the template system reference to understand how templates are consumed and how to add new ones
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. PR Lifecycle Foundation | v1.0 | 2/2 | Complete ✓ | 2026-03-18 |
| 2. AI PR Reviewer | v1.0 | 2/2 | Complete ✓ | 2026-03-18 |
| 3. Documentation & Changelog Agents | v1.0 | 4/4 | Complete ✓ | 2026-03-18 |
| 01. Information Architecture | v1.1 | 0/3 | Planned | - |
| 02. Command & Agent Reference | v1.1 | 0/TBD | Not started | - |
| 03. Workflow Guides & Architecture | v1.1 | 0/TBD | Not started | - |
| 04. Developer Extension Guide | v1.1 | 0/TBD | Not started | - |
