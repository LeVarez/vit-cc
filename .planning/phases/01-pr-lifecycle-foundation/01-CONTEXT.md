# Phase 1: PR Lifecycle Foundation - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Automation running inside `execute-phase` and `verify-work`: feature branches become draft PRs on execute-phase start, promoted to ready-for-review when verify-work passes. No manual PR operations. Creating posts, interactions, and all other workflow commands are out of scope.

</domain>

<decisions>
## Implementation Decisions

### PR body content
- Sections with headers: `## Goal`, `## Plans`, `## Success Criteria`, `## Notes`, `## Links`
- Plans section: full checklist of all phase plans (`- [ ] NN-NN: plan name`)
- Success criteria: included as a `## Success Criteria` section so reviewers see what "done" means without opening ROADMAP.md
- Notes section: include relevant STATE.md blockers if any exist for the phase (omit section if none)
- Links: `Closes #N` and feature issue link

### PR title format
- Conventional commits style: `feat(phase-N): phase name`
- Case of phase name: Claude's discretion

### gh unavailability signal
- One-line notice in command output (e.g. `[PR skipped — gh not available]`) — no failure, no abort
- STATE.md PR column marked as `pr:skipped` when gh is unavailable
- Consistent behavior across both `execute-phase` (creation) and `verify-work` (promotion)

### STATE.md update timing
- Update STATE.md immediately after `gh pr create` succeeds — don't wait for execute-phase to finish
- On PR promotion (verify-work Route A), update STATE.md entry from `pr#N` to `pr#N(ready)`
- Idempotency check: always query `gh pr list` live (authoritative); don't rely on STATE.md alone

### Claude's Discretion
- Exact case/slug format for phase name in PR title
- Precise wording of the `[PR skipped]` notice message

</decisions>

<specifics>
## Specific Ideas

No specific references or "I want it like X" moments — standard approaches apply.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-pr-lifecycle-foundation*
*Context gathered: 2026-03-18*
