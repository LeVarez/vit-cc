---
phase: 02-docs-site
plan: 02
subsystem: docs
tags: [vitepress, mermaid, documentation, guide]

requires:
  - phase: 02-01
    provides: VitePress site foundation with stub pages and working build

provides:
  - How VIT Works guide page (core loop, state management, context resilience, .planning/ structure)
  - Architecture Deep Dive guide page (orchestrator pattern, wave parallelization, goal-backward verification, model profiles)
  - Workflow Files guide page (purpose, location, @-referencing, step naming)
  - Templates and References guide page (distinction, locations, consumption patterns)

affects: [02-03, 02-04, 02-05]

tech-stack:
  added: []
  patterns:
    - "Guide pages derived from actual source files (workflows, templates, references)"
    - "Mermaid diagrams in how-vit-works and architecture pages"
    - "Cross-links between guide pages using VitePress /guide/... format"

key-files:
  created: []
  modified:
    - docs/guide/how-vit-works.md
    - docs/guide/architecture.md
    - docs/guide/workflow-files.md
    - docs/guide/templates-references.md

key-decisions:
  - "Content derived verbatim from source files (execute-phase.md, execute-plan.md, model-profiles.md, ui-brand.md, verify-phase.md) — no synthetic content"
  - "Mermaid flowchart in how-vit-works shows new-project → plan-phase → execute-phase → verify-work loop"
  - "Mermaid flowchart in architecture shows full state flow: ROADMAP → PLAN → executor → SUMMARY → verifier → VERIFICATION → STATE"
  - "Workflow files page lists all 12 workflow files with one-line descriptions"
  - "Templates/References page spotlights ui-brand.md, model-profiles.md, continuation-format.md as key references"

duration: 10min
completed: 2026-03-19
---

# Phase 02 Plan 02: Guide Section Pages Summary

**4 guide pages with substantive content derived from codebase source files: core loop, orchestrator architecture, workflow files, and template/reference system**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-19T14:00:16Z
- **Completed:** 2026-03-19T14:10:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Wrote `how-vit-works.md` (192 lines): the Core Loop section with a Mermaid flowchart, state management (.planning/ directory walkthrough), context resilience (50% budget rule, fresh agents, .continue-here files), and deviation handling
- Wrote `architecture.md` (264 lines): orchestrator pattern with code examples, wave parallelization with state flow Mermaid diagram, goal-backward verification (must_haves system with truths/artifacts/key_links), model profile matrix, checkpoint system, GitHub integration
- Wrote `workflow-files.md` (158 lines): purpose, full list of all 12 workflow files, @-referencing syntax, step naming convention with XML examples, and example simplified workflow structure
- Wrote `templates-references.md` (169 lines): templates vs references distinction, full tables for all templates and all references, consumption patterns, and spotlights on ui-brand.md / model-profiles.md / continuation-format.md

## Task Commits

1. **Task 1: Write How VIT Works and Architecture Deep Dive pages** - `dd23568` (docs)
2. **Task 2: Write Workflow Files and Templates/References pages** - `7227178` (docs)

## Files Created/Modified

- `docs/guide/how-vit-works.md` — Core loop, state management, context resilience, .planning/ structure with Mermaid diagram
- `docs/guide/architecture.md` — Orchestrator pattern, wave parallelization, goal-backward verification, model profiles, with state flow Mermaid diagram
- `docs/guide/workflow-files.md` — Workflow purpose, location, @-referencing, step naming, example structure
- `docs/guide/templates-references.md` — Template vs reference distinction, all files listed, consumption patterns, key spotlights

## Decisions Made

- Content derived directly from source files (execute-phase.md, execute-plan.md, verify-phase.md, model-profiles.md, ui-brand.md, continuation-format.md) — ensures accuracy
- Both architecture page Mermaid diagrams use `flowchart TD` / `flowchart LR` for compatibility with vitepress-plugin-mermaid
- Cross-link pattern used: `/guide/...` absolute paths (not relative) per VitePress convention

## Deviations from Plan

None — plan executed exactly as written. VitePress build passed clean with no dead links.

## Issues Encountered

None.

## Next Phase Readiness

- All 4 guide pages are substantive (>60 lines each, both Mermaid pages exceed 120 lines)
- VitePress build clean — no dead links
- Required cross-links verified: how-vit-works → architecture, architecture → workflow-files
- Ready for Plan 03 (Reference section pages)

---
*Phase: 02-docs-site*
*Completed: 2026-03-19*
