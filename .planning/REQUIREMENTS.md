# Requirements: vit-cc v1.1 Documentation & Developer Portal

**Defined:** 2026-03-19
**Core Value:** Every step of the VIT workflow is automatically reflected in GitHub — from execution to verification to merge — with zero manual GitHub operations.

## v1 Requirements

### README

- [x] **README-01**: ASCII art hero banner using box-drawing characters consistent with ui-brand.md, renders correctly on GitHub and in terminal
- [x] **README-02**: "What is VIT?" section with core loop diagram (new-project → plan-phase → execute-phase → verify-work)
- [x] **README-03**: Visual install section with `npx vit-claude` command, listing installed components (agents, commands, hooks, workflows, CI)
- [x] **README-04**: Quick Start numbered walkthrough from zero to first phase complete
- [x] **README-05**: Complete commands reference — all 31 commands organized into 11 groups with ASCII section headers, each with name, description, usage example, and produced artifacts
- [x] **README-06**: Complete agents reference — all 16 agents in table with spawner command, role description, and output
- [x] **README-07**: Settings reference — all config.json keys with defaults and descriptions, including model profile matrix table
- [x] **README-08**: GitHub CI Integration section explaining phase-ci.yml, branch→issue linking, issue comments, and review-feedback loop
- [x] **README-09**: Architecture diagram in ASCII art showing plan-phase, execute-phase, and verify-work agent pipelines with state management files
- [x] **README-10**: Project structure — ASCII tree of .planning/ and .claude/ directories
- [x] **README-11**: Common Workflows section with 6 recipes (greenfield, brownfield, resume, urgent work, team collab, debugging)
- [x] **README-12**: ASCII art style consistency throughout — section headers with ━━━, dividers with ───, approved status symbols only, no random emoji
- [x] **README-13**: Footer with license, Discord link, GitHub issues link, and docs site link

### Docs Site

- [ ] **DOCS-01**: VitePress site setup in docs/ directory with config.ts, package.json, index.md, and GitHub Pages deployment workflow
- [ ] **DOCS-02**: Landing page with VIT branding hero and features grid (Phase Execution, GitHub Integration, Multi-Agent Architecture, Context Resilience)
- [ ] **DOCS-03**: "How VIT Works" guide — core loop in depth, state management, context resilience, .planning/ as project memory
- [ ] **DOCS-04**: "Architecture Deep Dive" — orchestrator pattern, wave parallelization, goal-backward verification, state flow diagram, model profile system
- [ ] **DOCS-05**: "Command Anatomy" contributor guide — file location, frontmatter schema, process sections, orchestrator→workflow references, walkthrough example, registration
- [ ] **DOCS-06**: "Agent Anatomy" contributor guide — file location, frontmatter, system prompt structure, Task() spawning, subagent_type mapping, walkthrough example
- [ ] **DOCS-07**: "Workflow Files" guide — purpose, location, @-referencing, step naming, example structure
- [ ] **DOCS-08**: "Templates & References" guide — template vs reference distinction, locations, consumption by agents, ui-brand.md reference
- [ ] **DOCS-09**: "GitHub Integration Internals" — branch naming, PR lifecycle, issue linking (gh issue develop + GraphQL fallback), CI workflow, PR review gates, STATE.md mapping
- [ ] **DOCS-10**: "Configuration Reference" — complete config.json schema, model profiles matrix, workflow toggles, team mode, PR review gates
- [ ] **DOCS-11**: "Hooks & Session Management" — vit-check-update.cjs, vit-statusline.js, settings.json hooks, pause/resume via .continue-here
- [ ] **DOCS-12**: "Testing" guide — vit-test-writer, test location, phase-ci.yml, writing tests for VIT features
- [ ] **DOCS-13**: Sidebar navigation structure matching specified hierarchy (Guide → Contributing → Reference)
- [ ] **DOCS-14**: Visual consistency — VitePress default theme with VIT brand colors, code highlighting, Mermaid diagrams, ASCII art in code blocks

## v2 Requirements

None — documentation milestone is self-contained.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Targeted JSDoc updates | High cost, unproven value — deferred from v1.0 |
| API reference auto-generation | VIT is prompt-based, not a code library |
| i18n / translations | English-only for now |
| Interactive tutorials | Static docs sufficient for v1.1 |
| Blog / changelog page on docs site | CHANGELOG.md in repo is sufficient |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| README-01 | Phase 1 | Pending |
| README-02 | Phase 1 | Pending |
| README-03 | Phase 1 | Pending |
| README-04 | Phase 1 | Pending |
| README-05 | Phase 1 | Pending |
| README-06 | Phase 1 | Pending |
| README-07 | Phase 1 | Pending |
| README-08 | Phase 1 | Pending |
| README-09 | Phase 1 | Pending |
| README-10 | Phase 1 | Pending |
| README-11 | Phase 1 | Pending |
| README-12 | Phase 1 | Pending |
| README-13 | Phase 1 | Pending |
| DOCS-01 | Phase 2 | Pending |
| DOCS-02 | Phase 2 | Pending |
| DOCS-03 | Phase 2 | Pending |
| DOCS-04 | Phase 2 | Pending |
| DOCS-05 | Phase 2 | Pending |
| DOCS-06 | Phase 2 | Pending |
| DOCS-07 | Phase 2 | Pending |
| DOCS-08 | Phase 2 | Pending |
| DOCS-09 | Phase 2 | Pending |
| DOCS-10 | Phase 2 | Pending |
| DOCS-11 | Phase 2 | Pending |
| DOCS-12 | Phase 2 | Pending |
| DOCS-13 | Phase 2 | Pending |
| DOCS-14 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after initial definition*
