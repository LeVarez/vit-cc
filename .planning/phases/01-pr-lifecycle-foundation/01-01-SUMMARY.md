---
phase: 01-pr-lifecycle-foundation
plan: 01
subsystem: workflow
tags: [github, gh-cli, pull-request, state-management, execute-phase]

# Dependency graph
requires: []
provides:
  - Draft PR creation step in execute-phase (step 0.7)
  - Idempotency guard via gh pr list --head
  - PR body with goal, plans checklist, success criteria, links, Closes #N
  - STATE.md PR column schema (—, pr#N, pr#N(ready), pr:skipped)
  - new-milestone Phase 10 creates GitHub Issue Mapping table with PR column
affects:
  - 01-02 (verify-work PR promotion — reads pr#N from STATE.md)
  - 01-03 (complete-milestone — PR state visible in STATE.md)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Idempotency via live gh pr list --head query (never trust STATE.md alone)"
    - "Graceful gh unavailability: one-line notice + pr:skipped, never abort"
    - "Both .claude/ and files/ copies of every VIT command kept identical"

key-files:
  created: []
  modified:
    - .claude/commands/vit/execute-phase.md
    - files/commands/vit/execute-phase.md
    - .claude/vit/workflows/execute-phase.md
    - files/vit/workflows/execute-phase.md
    - .claude/vit/templates/state.md
    - files/vit/templates/state.md
    - .claude/commands/vit/new-milestone.md
    - files/commands/vit/new-milestone.md

key-decisions:
  - "Step 0.7 placed between worktree check (0.5) and plan validation (1) so PR exists before any execution begins"
  - "Idempotency uses gh pr list --head (live query) — STATE.md can be stale, GitHub is authoritative"
  - "STATE.md update happens immediately after gh pr create succeeds, not at phase end"
  - "pr:skipped written for both gh-unavailable and creation-failed cases (consistent signal for downstream)"

patterns-established:
  - "PR lifecycle columns: — → pr#N → pr#N(ready) — three-state progression through VIT workflow"

# Metrics
duration: 7min
completed: 2026-03-18
---

# Phase 1 Plan 01: PR Column and Draft PR Creation Summary

**Draft PR creation in execute-phase with idempotency guard, milestone-targeting, and STATE.md PR column tracking**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-18T14:12:35Z
- **Completed:** 2026-03-18T14:19:47Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- STATE.md template now documents GitHub Issue Mapping section with PR column and all four value states (—, pr#N, pr#N(ready), pr:skipped); File Template code block includes example table
- new-milestone Phase 10 now creates GitHub Issue Mapping table with PR column initialized to em-dash, and print summary also includes PR column
- execute-phase step 0.7 creates draft PR before plan discovery; checks gh availability, guards against duplicates via live `gh pr list --head`, assembles body from ROADMAP.md + PLAN.md files, targets `milestone/vX.Y`, records pr#N in STATE.md immediately on success

## Task Commits

1. **Task 1: Add PR column to STATE.md template and new-milestone** - `83bc26e` (feat)
2. **Task 2: Add idempotent draft PR creation to execute-phase** - `b142bf4` (feat)

## Files Created/Modified

- `.claude/commands/vit/execute-phase.md` - Added step 0.7 with gh availability check, idempotency guard, PR body assembly, gh pr create --draft targeting milestone branch, STATE.md update
- `.claude/vit/workflows/execute-phase.md` - Added create_draft_pr step between validate_phase and discover_plans
- `.claude/vit/templates/state.md` - Added GitHub Issue Mapping section to File Template code block and sections documentation with PR column schema
- `.claude/commands/vit/new-milestone.md` - Phase 10 table and print summary updated with PR column (initialized to —)
- `files/` mirrors of all four files above kept identical

## Decisions Made

- Step 0.7 positioned after worktree setup (DESIGNATED_BRANCH is available) and before plan discovery (PR should exist before code starts landing)
- Idempotency check queries gh live (`gh pr list --head`) rather than reading STATE.md, because STATE.md can be stale after branch switches or worktree creation
- STATE.md update for PR number is non-atomic (sed in-place) but correct: happens immediately after gh pr create returns, before continuing to step 1
- Both gh-unavailable and creation-failed cases write `pr:skipped` — downstream commands (verify-work) should treat both identically

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `gh pr create --draft` grep check required `--draft` on same line as `gh pr create` (not on continuation line). Fixed by restructuring the bash command to put `--draft` inline.

## Next Phase Readiness

- Plan 01-02 (verify-work PR promotion) can read pr#N from STATE.md to find the PR to promote
- PR column progression is documented: — → pr#N (this plan) → pr#N(ready) (01-02)
- No blockers

---
*Phase: 01-pr-lifecycle-foundation*
*Completed: 2026-03-18*
