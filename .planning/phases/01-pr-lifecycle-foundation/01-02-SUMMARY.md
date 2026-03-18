---
phase: 01-pr-lifecycle-foundation
plan: "02"
subsystem: workflow
tags: [gh-cli, pr-promotion, verify-work, uat, github]

# Dependency graph
requires:
  - phase: 01-01
    provides: PR column in STATE.md (pr#N, pr#N(ready), pr:skipped format) and draft PR creation in execute-phase

provides:
  - PR promotion step (gh pr ready) in verify-work command on Route A
  - promote_pr step in verify-work workflow
  - STATE.md update from pr#N to pr#N(ready) after successful promotion

affects:
  - verify-work command consumers
  - Phase 3 doc-updater (reads phase completion state)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route-gated GitHub automation: promotion logic wrapped in Route A gate, non-blocking on failure"
    - "Dual-copy parity: .claude/ and files/ copies kept byte-for-byte identical"

key-files:
  created: []
  modified:
    - .claude/commands/vit/verify-work.md
    - files/commands/vit/verify-work.md
    - .claude/vit/workflows/verify-work.md
    - files/vit/workflows/verify-work.md

key-decisions:
  - "Step 8.5 inserted between GitHub comment post (step 8) and issue diagnosis (step 9) in command"
  - "promote_pr workflow step placed after complete_session, before diagnose_issues"
  - "Non-blocking on all failure modes: gh unavailable, no PR found, promotion API error"

patterns-established:
  - "Route gate pattern: check issues > 0 (skip) then check last phase (skip) before automating"
  - "pr#N(ready) written via sed only after confirmed gh pr ready success"

# Metrics
duration: 1min
completed: 2026-03-18
---

# Phase 1 Plan 02: PR Promotion in verify-work Summary

**PR promotion step added to verify-work: `gh pr ready` fires on Route A (all pass, more phases remain) and updates STATE.md pr#N to pr#N(ready)**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-18T14:22:00Z
- **Completed:** 2026-03-18T14:23:27Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added step 8.5 to verify-work command with full Route A gate, gh availability check, PR lookup from STATE.md, and graceful failure handling
- Added `promote_pr` workflow step to verify-work workflow (after `complete_session`, before `diagnose_issues`)
- Both `.claude/` and `files/` copies are identical for both command and workflow

## Task Commits

Each task was committed atomically:

1. **Task 1: Add PR promotion to verify-work command** - `58559af` (feat)
2. **Task 2: Add PR promotion to verify-work workflow** - `17bfdce` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `.claude/commands/vit/verify-work.md` - Step 8.5 inserted: Route A PR promotion with gh pr ready
- `files/commands/vit/verify-work.md` - Identical copy
- `.claude/vit/workflows/verify-work.md` - promote_pr step added between complete_session and diagnose_issues
- `files/vit/workflows/verify-work.md` - Identical copy

## Decisions Made

- Step 8.5 positioned between GitHub issue comment (step 8) and issue diagnosis (step 9) — promotion happens only after human-readable comment is posted, before any automated planning begins
- Promotion is strictly non-blocking: any failure mode (gh unavailable, no PR entry, API error) logs one line and continues
- STATE.md written with `sed -i ''` only after confirmed `gh pr ready` success — avoids false `pr#N(ready)` marker on failure

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 01 (execute-phase draft PR creation) and Plan 02 (verify-work promotion) are both complete
- Phase 1 Plan 03 is the remaining plan in this phase
- PR lifecycle foundation: draft created on execute-phase start, promoted on verify-work Route A completion

---
*Phase: 01-pr-lifecycle-foundation*
*Completed: 2026-03-18*
