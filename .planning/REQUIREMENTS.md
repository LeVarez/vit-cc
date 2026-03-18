# Requirements: vit-cc v1.0.1 Documentation

**Defined:** 2026-03-18
**Core Value:** Developers can discover, understand, and adopt vit-cc through a comprehensive, navigable docs site

## v1.0.1 Requirements

### Site Infrastructure

- [ ] **INFRA-01**: VitePress v2 site scaffolded in `docs/` with working local dev server
- [ ] **INFRA-02**: Sidebar navigation with sections for all content categories
- [ ] **INFRA-03**: Built-in local search (MiniSearch) configured and working
- [ ] **INFRA-04**: Homepage with hero section, feature highlights, and quick-start CTA
- [ ] **INFRA-05**: GitHub Pages deployment via CI workflow (auto-deploy on push to main)
- [ ] **INFRA-06**: Dark mode support (VitePress default theme)
- [ ] **INFRA-07**: Clean URLs configured (`/commands/new-project` not `.html`)

### Getting Started

- [ ] **START-01**: Installation guide with prerequisites (Node.js, Claude Code, gh CLI)
- [ ] **START-02**: First project walkthrough — end-to-end from `npx vit-claude` to `/vit:verify-work`
- [ ] **START-03**: Quick-start page with the core workflow loop and what to expect

### Concepts & Architecture

- [ ] **CONC-01**: Core workflow loop explained (new-project → plan-phase → execute-phase → verify-work)
- [ ] **CONC-02**: Phases and milestones concept — what they are, how they relate, lifecycle
- [ ] **CONC-03**: Agents concept — what agents are, how they're spawned, the specialist pattern
- [ ] **CONC-04**: State management explained — STATE.md, PROJECT.md, ROADMAP.md, PLAN.md, how state survives context resets
- [ ] **CONC-05**: GitHub integration overview — PRs, issues, CI, the closed-loop workflow
- [ ] **CONC-06**: Architecture diagram — the three-layer pipeline (commands → agents → state)

### Command Reference

- [ ] **CMD-01**: One reference page per command (29 pages) with description, usage syntax, arguments, and behavior
- [ ] **CMD-02**: Each command page includes practical usage examples showing real invocations and expected output
- [ ] **CMD-03**: Commands categorized in sidebar (Lifecycle, Planning, Execution, Utility, Configuration)
- [ ] **CMD-04**: Cross-links between related commands (e.g., plan-phase links to execute-phase)

### Agent Reference

- [ ] **AGT-01**: One reference page per agent (16 pages) with role, spawn trigger, inputs, outputs
- [ ] **AGT-02**: Each agent page explains when it runs and what it produces
- [ ] **AGT-03**: Agent interaction diagram showing which commands spawn which agents
- [ ] **AGT-04**: Cross-links from agent pages to spawning commands and vice versa

### Advanced Guides

- [ ] **ADV-01**: Creating custom agents guide — the agent contract (Markdown prompt structure, spawn mechanism, inputs/outputs)
- [ ] **ADV-02**: Configuration guide — model profiles (quality/balanced/budget), settings, workflow toggles
- [ ] **ADV-03**: Internals deep-dive — state machine, worktrees, GitHub sync mechanics, hook system
- [ ] **ADV-04**: Tutorials — at least 2 step-by-step workflow guides (e.g., "Build a project from scratch", "Debug with VIT")

## Future Requirements

### Documentation Maintenance

- **MAINT-01**: Auto-update docs when framework commands change (extend vit-doc-updater)
- **MAINT-02**: Versioned docs for different VIT releases

## Out of Scope

| Feature | Reason |
|---------|--------|
| Blog section | Not needed for a CLI framework docs site |
| i18n / translations | English-only for v1.0.1, revisit if adoption grows |
| API reference (programmatic) | VIT is CLI-only, no programmatic API to document |
| Video tutorials | High production cost, text walkthroughs sufficient for v1 |
| Algolia DocSearch | Requires application process; built-in MiniSearch is sufficient |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 01 | Pending |
| INFRA-02 | Phase 01 | Pending |
| INFRA-03 | Phase 01 | Pending |
| INFRA-04 | Phase 01 | Pending |
| INFRA-05 | Phase 01 | Pending |
| INFRA-06 | Phase 01 | Pending |
| INFRA-07 | Phase 01 | Pending |
| START-01 | Phase 02 | Pending |
| START-02 | Phase 02 | Pending |
| START-03 | Phase 02 | Pending |
| CONC-01 | Phase 02 | Pending |
| CONC-02 | Phase 02 | Pending |
| CONC-03 | Phase 02 | Pending |
| CONC-04 | Phase 02 | Pending |
| CONC-05 | Phase 02 | Pending |
| CONC-06 | Phase 02 | Pending |
| CMD-01 | Phase 03 | Pending |
| CMD-02 | Phase 03 | Pending |
| CMD-03 | Phase 03 | Pending |
| CMD-04 | Phase 03 | Pending |
| AGT-01 | Phase 04 | Pending |
| AGT-02 | Phase 04 | Pending |
| AGT-03 | Phase 04 | Pending |
| AGT-04 | Phase 04 | Pending |
| ADV-01 | Phase 05 | Pending |
| ADV-02 | Phase 05 | Pending |
| ADV-03 | Phase 05 | Pending |
| ADV-04 | Phase 05 | Pending |

**Coverage:**
- v1.0.1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after roadmap creation*
