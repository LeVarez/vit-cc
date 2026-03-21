# Milestone v1.0.0: GitHub Sync & Agents Extension

**Status:** ✅ SHIPPED 2026-03-18
**Phases:** 1–3
**Total Plans:** 8

## Overview

This milestone closes the gap between vit-cc's existing phase automation and full GitHub lifecycle integration. Three phases deliver in dependency order: the PR plumbing comes first (STATE.md schema + draft PR creation + promotion), the AI reviewer comes second (wired into verify-work), and documentation/changelog agents come last (two coordinated writers sharing the same CHANGELOG discipline). When all three phases complete, every step of the VIT workflow — execution, verification, merge, docs, release notes — is reflected in GitHub without a single manual operation.

## Phases

### Phase 1: PR Lifecycle Foundation

**Goal**: Every feature branch automatically becomes a draft PR the moment execute-phase starts, and that PR is promoted to ready-for-review the moment verify-work passes — with no duplicate creation, no wrong base branch, and graceful fallback when `gh` is unavailable.
**Depends on**: Nothing (first phase)
**Plans**: 2 plans

Plans:

- [x] 01-01: STATE.md PR column schema + idempotent draft PR creation in execute-phase
- [x] 01-02: PR promotion to ready-for-review in verify-work on Route A only

**Details:**
Draft PR created at execute-phase start targeting milestone branch, with idempotency via live `gh pr list` query. STATE.md PR column tracks `pr#N` → `pr#N(ready)`. Graceful fallback when `gh` unavailable: writes `pr:skipped`.

---

### Phase 2: AI PR Reviewer

**Goal**: Every PR that clears verification is automatically reviewed by an AI agent that posts a structured, severity-tiered comment — so the human reviewer sees `block-merge / should-fix / nit` findings before they open the diff.
**Depends on**: Phase 1
**Plans**: 2 plans

Plans:

- [x] 02-01: vit-pr-reviewer agent definition (new file)
- [x] 02-02: verify-work modification — spawn reviewer after PR promotion

**Details:**
Two-step GitHub posting: body summary via `gh pr review --comment`, up to 5 inline diff comments via `gh api` REST with `COMMENT` event. `block-merge` findings surfaced first. Spawn gated on `PR_PROMOTED=true` in verify-work step 8.6 (Route A only). Non-blocking.

---

### Phase 3: Documentation & Changelog Agents

**Goal**: After every phase completes, an agent updates the relevant documentation sections (README, docs/) without overwriting manual content; and when a milestone closes, a second agent writes a versioned CHANGELOG entry from all phase summaries — with the two agents coordinated so they never conflict on CHANGELOG ownership.
**Depends on**: Phase 2
**Plans**: 4 plans

Plans:

- [x] 03-01: vit-doc-updater agent definition (new file)
- [x] 03-02: vit-changelog-writer agent definition (new file)
- [x] 03-03: execute-phase modification — spawn doc-updater after all waves complete
- [x] 03-04: complete-milestone modification — spawn changelog-writer before archive step

**Details:**
doc-updater spawned at execute-phase step 10.6 (after commit, before push) with SUMMARY.md-driven section identification. changelog-writer spawned at complete-milestone step 3.5 (before archive). CHANGELOG ownership split: doc-updater owns `[Unreleased]`, changelog-writer promotes it to versioned entry. Both agents fully non-blocking.

---

## Milestone Summary

**Key Decisions:**

- Draft PR created at execute-phase start (not plan-phase) — phase may span hours; PR should exist while code is being written ✓ Good
- PR reviewer runs automatically after verify (not manually) — reduces friction; reviewer always runs before human sees the PR ✓ Good
- Doc-updater runs per-phase (after all waves), not per-task — per-task too granular; matches commit boundary ✓ Good
- Changelog-writer on complete-milestone (not per-phase) — release notes should cover full milestone ✓ Good
- Idempotency via live `gh pr list` query — STATE.md can be stale, GitHub is authoritative ✓ Good
- Two-step PR posting (body + inline) — inline capped at 5 to avoid GitHub API 422 errors ✓ Good
- CHANGELOG ownership split — doc-updater writes [Unreleased], changelog-writer promotes it — no conflict ✓ Good

**Issues Resolved:**

- Inline diff comment volume limits — capped at 5 with fallback for empty body 422
- README section identification heuristics for doc-updater — semantic mapping heuristic (LLM reads accomplishments, maps to headings)
- Node.js version constraint for git-cliff — NOT used; Claude-native SUMMARY.md approach eliminates concern
- files/agents/ parity with .claude/agents/ — fixed by orchestrator correction after verifier caught gap

**Issues Deferred:**

- None — all blockers resolved during milestone

**Technical Debt Incurred:**

- complete-milestone does not have a model lookup table; changelog-writer model hardcoded to `sonnet` (minor, acceptable)
- vit-changelog-writer and vit-doc-updater are not yet registered as named subagent types; spawned as general-purpose with definition inlined until registration mechanism exists

---

_Archived: 2026-03-18_
_For current project status, see .planning/ROADMAP.md_
