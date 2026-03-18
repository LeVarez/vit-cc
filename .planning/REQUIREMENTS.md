# Requirements: vit-cc GitHub Sync & Agents Extension

**Defined:** 2026-03-18
**Core Value:** Every step of the VIT workflow is automatically reflected in GitHub — from execution to verification to merge — with zero manual GitHub operations.

## v1 Requirements

### PR Lifecycle

- [x] **PRL-01**: `execute-phase` creates a draft PR for the feature branch with idempotency guard (checks `gh pr list --head` before creating — never duplicates)
- [x] **PRL-02**: Draft PR always targets `milestone/vX.Y` as base branch, never `main`
- [x] **PRL-03**: PR body includes phase goal, feature issue link, and `Closes #N`
- [x] **PRL-04**: STATE.md GitHub Issue Mapping table gains a PR column (`pr#N` or `—`) for cross-command handoff
- [x] **PRL-05**: `verify-work` promotes draft PR to ready-for-review on Route A only (all success criteria pass)
- [x] **PRL-06**: All PR operations skip gracefully when `gh` CLI is unavailable or unauthenticated

### PR Reviewer

- [x] **PRR-01**: `vit-pr-reviewer` agent spawns automatically after `verify-work` promotes the PR (Route A only)
- [x] **PRR-02**: Agent posts severity-tiered review comment (`block-merge / should-fix / nit`) using `gh pr review --comment`
- [x] **PRR-03**: Agent posts inline diff comments on specific changed lines via `gh api` (REST endpoint for PR reviews)

### Documentation & Changelog

- [x] **DOC-01**: `vit-doc-updater` agent spawns after all phase waves complete in `execute-phase`
- [x] **DOC-02**: Agent autonomously reads phase SUMMARY.md and PLAN.md to determine which docs and sections need updating — no manual configuration required
- [x] **DOC-03**: Agent updates only targeted sections of affected documentation files (section-scoped, preserves all other content verbatim)
- [x] **DOC-04**: Agent appends to `[Unreleased]` section in CHANGELOG after phase completes
- [x] **DOC-05**: `vit-changelog-writer` agent spawns inside `complete-milestone` before the archive step
- [x] **DOC-06**: Changelog writer updates ALL project documentation (README, docs/, API docs) and generates a versioned CHANGELOG entry — reads all phase SUMMARY.md files to understand the full scope of delivered work

## v2 Requirements

### PR Reviewer

- **PRR-04**: Review suggestion attribution tracking — calibrates reviewer quality over time
- **PRR-05**: PR reviewer posts follow-up comment after `review-feedback` implements fixes

### Documentation

- **DOC-07**: Targeted JSDoc/docstring updates for changed functions (AST-level via recast + jsdoc-api)
- **DOC-08**: `vit-doc-updater` runs diff against previous phase docs to avoid redundant updates

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-merge | Bypasses human review — defeats the purpose of PR reviewer |
| GitHub webhook → VIT state sync | Requires server infrastructure VIT cannot own (CLI tool) |
| GitHub Projects / kanban board | Too much overhead; not aligned with developer workflow |
| Full JSDoc regeneration per plan | Expensive and produces noisy diffs; deferred to v2 (targeted only) |
| Full README rewrite per plan | Destructive to manually written content |
| `gh pr review --approve` / `--request-changes` | GitHub blocks self-review (HTTP 422); out of scope |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PRL-01 | Phase 1 | Complete |
| PRL-02 | Phase 1 | Complete |
| PRL-03 | Phase 1 | Complete |
| PRL-04 | Phase 1 | Complete |
| PRL-05 | Phase 1 | Complete |
| PRL-06 | Phase 1 | Complete |
| PRR-01 | Phase 2 | Complete |
| PRR-02 | Phase 2 | Complete |
| PRR-03 | Phase 2 | Complete |
| DOC-01 | Phase 3 | Complete |
| DOC-02 | Phase 3 | Complete |
| DOC-03 | Phase 3 | Complete |
| DOC-04 | Phase 3 | Complete |
| DOC-05 | Phase 3 | Complete |
| DOC-06 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after Phase 2 completion*
