---
phase: 02-ai-pr-reviewer
plan: 01
subsystem: infra
tags: [github, gh-cli, pr-review, ai-review, claude-agent, severity-tiers]

# Dependency graph
requires:
  - phase: 01-pr-lifecycle-foundation
    provides: verify-work agent that spawns the PR reviewer after Route A promotion
provides:
  - vit-pr-reviewer agent definition with two-step posting strategy and three severity tiers
affects:
  - 02-ai-pr-reviewer/02-02 (verify-work integration wiring the reviewer into Route A)
  - 03-doc-updater (any phase reading agent patterns established here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-step PR review posting: body summary via gh pr review --comment, inline diffs via gh api REST"
    - "Severity tiers: block-merge > should-fix > nit for prioritized findings"
    - "Inline diff comment cap at 5 to avoid GitHub API 422 errors"
    - "event: COMMENT only — never APPROVE or REQUEST_CHANGES"
    - "Graceful error handling: log one line per failure, never abort parent agent"

key-files:
  created:
    - .claude/agents/vit-pr-reviewer.md
  modified: []

key-decisions:
  - "Use gh pr review --comment (not --approve/--request-changes) for body summary to avoid 422 errors"
  - "Cap inline comments at 5 — prevents GitHub API size limit failures"
  - "Always use side: RIGHT (new file) and additions-only line numbers for inline comments"
  - "Fallback: if body empty causes 422 on REST call, retry with non-empty body string"
  - "Agent is read-only plus GitHub posting — must never modify local files"

patterns-established:
  - "Reviewer agents: two-step posting pattern (body summary + inline comments)"
  - "Severity tiers: block-merge / should-fix / nit as standard review categories"
  - "Graceful degradation: body summary is primary output, inline comments are best-effort"

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 2 Plan 01: vit-pr-reviewer Agent Summary

**AI PR reviewer agent with two-step GitHub posting (body summary + up to 5 inline diff comments) and three severity tiers (block-merge, should-fix, nit)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T15:12:28Z
- **Completed:** 2026-03-18T15:15:37Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created vit-pr-reviewer agent at `.claude/agents/vit-pr-reviewer.md` with valid frontmatter (name, description, tools: Bash Read, color: purple)
- Implemented two-step GitHub posting: body summary via `gh pr review --comment` and up to 5 inline diff comments via `gh api repos/.../pulls/N/reviews` REST endpoint
- Defined three severity tiers (block-merge, should-fix, nit) with clear categorization rules for the self-review analysis step
- Enforced strict constraints: no approve/request-changes, RIGHT side only for inline comments, additions-only line numbers, max 5 inline comments
- Added fallback for empty body 422 errors on REST call and graceful error handling throughout

## Task Commits

Each task was committed atomically:

1. **Task 1: Create vit-pr-reviewer agent definition** - `23b1f03` (feat)

**Plan metadata:** _(to be committed after SUMMARY.md)_

## Files Created/Modified
- `.claude/agents/vit-pr-reviewer.md` — AI PR reviewer agent definition with role, execution flow (6 steps), error handling, anti-patterns, and success criteria

## Decisions Made
- Used `gh pr review --comment` (not `--approve` or `--request-changes`) for body summary — avoids HTTP 422 errors and does not change PR approval state
- Capped inline comments at 5 — prevents GitHub API 422 errors from large payloads (from Phase 2 blocker concern in STATE.md)
- Always use `"event": "COMMENT"` in REST API call — never APPROVE or REQUEST_CHANGES
- Fallback for empty body 422: retry with `"body": "Inline comments for AI review"` as non-empty string
- Agent is read-only plus GitHub posting — no local file modifications permitted

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — the verify check for `approve\|request-changes\|REQUEST_CHANGES\|APPROVE` returned 8 matches, but all are in anti-pattern warnings and "DO NOT" constraint sections. No actual usage of approve or request-changes exists in the agent. This matches the plan's expectation of "0 or only appear in anti-pattern warnings."

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- vit-pr-reviewer agent is ready to be wired into verify-work (plan 02-02)
- The agent expects PR_NUM, REPO, WORK_DIR, PHASE_NUM, PHASE_NAME from the spawning verify-work prompt context
- Verify-work must pass these variables when spawning the reviewer after Route A promotion

---
*Phase: 02-ai-pr-reviewer*
*Completed: 2026-03-18*
