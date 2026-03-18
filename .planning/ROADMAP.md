# Roadmap: vit-cc GitHub Sync & Agents Extension

## Overview

This milestone closes the gap between vit-cc's existing phase automation and full GitHub lifecycle integration. Three phases deliver in dependency order: the PR plumbing comes first (STATE.md schema + draft PR creation + promotion), the AI reviewer comes second (wired into verify-work), and documentation/changelog agents come last (two coordinated writers sharing the same CHANGELOG discipline). When all three phases complete, every step of the VIT workflow — execution, verification, merge, docs, release notes — is reflected in GitHub without a single manual operation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: PR Lifecycle Foundation** - Feature branches become draft PRs; verification promotes them to ready-for-review
- [ ] **Phase 2: AI PR Reviewer** - A new agent reviews every promoted PR and posts a severity-tiered comment automatically
- [ ] **Phase 3: Documentation & Changelog Agents** - Two new agents keep docs and CHANGELOG current after each phase and each milestone

## Phase Details

### Phase 1: PR Lifecycle Foundation
**Goal**: Every feature branch automatically becomes a draft PR the moment execute-phase starts, and that PR is promoted to ready-for-review the moment verify-work passes — with no duplicate creation, no wrong base branch, and graceful fallback when `gh` is unavailable.
**Depends on**: Nothing (first phase)
**Requirements**: PRL-01, PRL-02, PRL-03, PRL-04, PRL-05, PRL-06
**Success Criteria** (what must be TRUE):
  1. Running `execute-phase` creates a draft PR targeting `milestone/vX.Y` with phase goal, feature issue link, and `Closes #N` in the body — and re-running the same command does not create a second PR
  2. STATE.md GitHub Issue Mapping table contains a `PR` column showing the PR number (`pr#N`) for any phase that has one, enabling any subsequent command to look up the PR without a `gh` call
  3. Running `verify-work` on a passing phase (Route A) promotes the draft PR to ready-for-review — and leaves it as draft on Routes B, C, or D
  4. All PR operations complete silently (no error, no abort) when `gh` CLI is unavailable or the user is not authenticated
**Plans**: TBD

Plans:
- [ ] 01-01: STATE.md schema update — add PR column to GitHub Issue Mapping table template
- [ ] 01-02: execute-phase modification — idempotent draft PR creation with correct base branch and body
- [ ] 01-03: verify-work modification — PR promotion on Route A only

### Phase 2: AI PR Reviewer
**Goal**: Every PR that clears verification is automatically reviewed by an AI agent that posts a structured, severity-tiered comment — so the human reviewer sees `block-merge / should-fix / nit` findings before they open the diff.
**Depends on**: Phase 1
**Requirements**: PRR-01, PRR-02, PRR-03
**Success Criteria** (what must be TRUE):
  1. After `verify-work` promotes a PR (Route A), `vit-pr-reviewer` spawns automatically and posts a review comment to the PR without any manual invocation
  2. The review comment visibly categorizes findings into `block-merge`, `should-fix`, and `nit` tiers — a reader can immediately see which findings block merging
  3. The agent posts inline diff comments on specific changed lines (via `gh api` REST endpoint), not just a body-only comment
  4. The agent never attempts to approve or request changes on the PR (uses `--comment` only) — no HTTP 422 errors appear in the workflow output
**Plans**: TBD

Plans:
- [ ] 02-01: vit-pr-reviewer agent definition (new file)
- [ ] 02-02: verify-work modification — spawn reviewer after PR promotion

### Phase 3: Documentation & Changelog Agents
**Goal**: After every phase completes, an agent updates the relevant documentation sections (README, docs/) without overwriting manual content; and when a milestone closes, a second agent writes a versioned CHANGELOG entry from all phase summaries — with the two agents coordinated so they never conflict on CHANGELOG ownership.
**Depends on**: Phase 2
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06
**Success Criteria** (what must be TRUE):
  1. After `execute-phase` completes all waves, `vit-doc-updater` spawns automatically and updates only the targeted sections of affected documentation files — all other content in those files is preserved verbatim
  2. The doc-updater agent appends a new entry to the `[Unreleased]` section of CHANGELOG after each phase, without touching any versioned entries
  3. Running `/vit:complete-milestone` causes `vit-changelog-writer` to spawn before the archive step and write a versioned CHANGELOG entry that covers all phases in the milestone — the `[Unreleased]` section is consumed and replaced by the versioned entry
  4. The doc-updater determines which documentation sections to update by reading the phase SUMMARY.md and PLAN.md — no manual configuration file or section mapping is required from the user
  5. The changelog-writer updates all project documentation (README, docs/, API docs) in addition to generating the versioned CHANGELOG entry, using all phase SUMMARY.md files as source material
**Plans**: TBD

Plans:
- [ ] 03-01: vit-doc-updater agent definition (new file)
- [ ] 03-02: vit-changelog-writer agent definition (new file)
- [ ] 03-03: execute-phase modification — spawn doc-updater after all waves complete
- [ ] 03-04: complete-milestone modification — spawn changelog-writer before archive step

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. PR Lifecycle Foundation | 0/3 | Not started | - |
| 2. AI PR Reviewer | 0/2 | Not started | - |
| 3. Documentation & Changelog Agents | 0/4 | Not started | - |
