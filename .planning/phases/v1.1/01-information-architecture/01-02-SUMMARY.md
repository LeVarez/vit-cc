---
phase: 01-information-architecture
plan: 02
subsystem: documentation
tags: [markdown, diataxis, tutorial, user-guide, getting-started]

requires:
  - phase: 01-01-docs-skeleton-and-readme-nav
    provides: docs/user-guide/ directory and README.md navigation hub

provides:
  - docs/user-guide/getting-started.md — 5-step tutorial from install to first phase verification

affects:
  - v1.1/01-03 (core-concepts.md links back to getting-started)
  - v1.1/02 (command reference should be consistent with commands shown here)

tech-stack:
  added: []
  patterns:
    - "Diátaxis tutorial pattern: each step shows exact command, what happens, what you get, time estimate"
    - "No conceptual preamble: guide opens with action, not definition"

key-files:
  created:
    - docs/user-guide/getting-started.md
  modified: []

key-decisions:
  - "Tutorial structure (doing not explaining): all definitions deferred to core-concepts.md and glossary.md"
  - "What's next section links to core-concepts.md, glossary.md, and README#commands-reference"
  - "Guide kept under 100 lines (90 lines) to stay scannable"

patterns-established:
  - "Step format: command in code block → What you get (bullet list) → Time estimate"

duration: 1min
completed: 2026-03-19
---

# Phase 01 Plan 02: Getting Started Tutorial Summary

**Hands-on 5-step tutorial taking a new VIT user from `npx vit-claude` through first phase verification, with exact commands, outputs, and time estimates at each step**

## Performance

- **Duration:** ~1 minute
- **Started:** 2026-03-19T08:45:44Z
- **Completed:** 2026-03-19T08:46:42Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `docs/user-guide/getting-started.md` as a pure Diátaxis tutorial (no conceptual preamble)
- Each of the 5 steps shows the exact command, what the user sees, what artifacts are produced, and a time estimate
- What's next section links to core-concepts.md, glossary.md, and README#commands-reference

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the getting started tutorial** - `92bf0d1` (docs)

**Plan metadata:** _(see final commit below)_

## Files Created/Modified

- `docs/user-guide/getting-started.md` — 90-line tutorial covering install through verify-work

## Decisions Made

- Tutorial follows Diátaxis pattern strictly: doing over explaining. No sentence begins with "VIT is..." or defines a term — those belong in core-concepts.md and glossary.md.
- What's next cross-references use relative paths (`core-concepts.md`, `glossary.md`) and one root-level anchor link (`../../README.md#commands-reference`).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `docs/user-guide/getting-started.md` is complete and ready for cross-linking from core-concepts.md (Plan 03)
- The guide references `core-concepts.md` and `glossary.md` which do not yet exist; they will be created in Plan 03

---
*Phase: 01-information-architecture*
*Completed: 2026-03-19*
