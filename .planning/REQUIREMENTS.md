# Requirements: vit-cc Documentation & Developer Guide

**Defined:** 2026-03-19
**Core Value:** Every VIT user can discover, understand, and use any command or agent without reading source markdown files; every developer can extend the framework with custom components by following documented patterns.

## v1.1 Requirements

Requirements for the documentation milestone. Each maps to roadmap phases.

### Information Architecture

- [ ] **IA-01**: docs/ folder structure with clear separation between user guide and developer guide
- [ ] **IA-02**: Root README.md restructured to serve as entry point with navigation to docs/
- [ ] **IA-03**: Getting started guide that walks through first project setup to first phase execution
- [ ] **IA-04**: Core concepts page explaining the VIT mental model (milestone → phase → plan → task, agents, state)
- [ ] **IA-05**: Glossary of all VIT-specific terms (phase, plan, wave, checkpoint, must_have, etc.)

### Command Reference

- [ ] **CMD-01**: All 30 slash commands documented with syntax, options, flags, and expected output
- [ ] **CMD-02**: Each command page includes prerequisites (what state must exist before running)
- [ ] **CMD-03**: Each command page includes at least one usage example with expected behavior
- [ ] **CMD-04**: Commands grouped by workflow stage (project lifecycle, planning, execution, session, config)
- [ ] **CMD-05**: Command flow diagram showing which commands lead to which next commands

### Agent Reference

- [ ] **AGT-01**: All 16 agents documented with role, behavioral contract (inputs/outputs/invariants)
- [ ] **AGT-02**: Each agent page shows when and by which command it is spawned
- [ ] **AGT-03**: Each agent page describes what files it reads and what files it produces
- [ ] **AGT-04**: Agent orchestration diagram showing spawn relationships (command → agent → output)

### Architecture & Design Patterns

- [ ] **ARCH-01**: Three-layer architecture documented (commands → agents → .planning/ state store)
- [ ] **ARCH-02**: Data flow diagrams using Mermaid showing state progression through a full milestone lifecycle
- [ ] **ARCH-03**: Design patterns documented: wave parallelization, checkpoint handling, content inlining, model profiles
- [ ] **ARCH-04**: State management guide explaining how STATE.md, ROADMAP.md, and REQUIREMENTS.md evolve

### Developer Extension Guide

- [ ] **DEV-01**: Tutorial: creating a custom agent with step-by-step walkthrough
- [ ] **DEV-02**: Tutorial: creating a custom slash command (orchestrator) with step-by-step walkthrough
- [ ] **DEV-03**: Reference: agent definition anatomy (frontmatter, sections, conventions)
- [ ] **DEV-04**: Reference: command definition anatomy (purpose, process steps, success criteria)
- [ ] **DEV-05**: Reference: template system (how templates are consumed, how to create new ones)
- [ ] **DEV-06**: Reference: configuration system (config.json schema, model profiles, workflow toggles)

### Workflow Guides

- [ ] **WF-01**: End-to-end workflow guide: from `/vit:new-project` through `/vit:complete-milestone`
- [ ] **WF-02**: GitHub integration guide: PR lifecycle, issue tracking, milestone sync
- [ ] **WF-03**: Team workflow guide: multi-engineer setup, phase assignment, parallel worktrees
- [ ] **WF-04**: Debugging guide: using `/vit:debug`, context resets, session continuity

## Future Requirements

### v1.2+

- **SITE-01**: VitePress-powered documentation site with search
- **SITE-02**: Interactive command explorer
- **VID-01**: Video walkthroughs for key workflows

## Out of Scope

| Feature | Reason |
|---------|--------|
| VitePress/static site generation | Documentation must be agent-writable plain markdown first; site layer deferred |
| Auto-generated command reference from source | Command files are prose system prompts, not parseable APIs — manual authoring required |
| API documentation (JSDoc/TypeDoc) | vit-cc is markdown-based, not a code library |
| Translated documentation | English only for v1.1; translation infrastructure adds complexity |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| IA-01 | Phase 1 | Pending |
| IA-02 | Phase 1 | Pending |
| IA-03 | Phase 1 | Pending |
| IA-04 | Phase 1 | Pending |
| IA-05 | Phase 1 | Pending |
| CMD-01 | Phase 2 | Pending |
| CMD-02 | Phase 2 | Pending |
| CMD-03 | Phase 2 | Pending |
| CMD-04 | Phase 2 | Pending |
| CMD-05 | Phase 2 | Pending |
| AGT-01 | Phase 2 | Pending |
| AGT-02 | Phase 2 | Pending |
| AGT-03 | Phase 2 | Pending |
| AGT-04 | Phase 2 | Pending |
| ARCH-01 | Phase 3 | Pending |
| ARCH-02 | Phase 3 | Pending |
| ARCH-03 | Phase 3 | Pending |
| ARCH-04 | Phase 3 | Pending |
| DEV-01 | Phase 4 | Pending |
| DEV-02 | Phase 4 | Pending |
| DEV-03 | Phase 4 | Pending |
| DEV-04 | Phase 4 | Pending |
| DEV-05 | Phase 4 | Pending |
| DEV-06 | Phase 4 | Pending |
| WF-01 | Phase 3 | Pending |
| WF-02 | Phase 3 | Pending |
| WF-03 | Phase 3 | Pending |
| WF-04 | Phase 3 | Pending |

**Coverage:**
- v1.1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after initial definition*
