# vit-cc GitHub Sync & Agents Extension

## What This Is

vit-cc is a Claude Code agentic framework that orchestrates AI-driven development through phase-based workflows. This project extends the framework with full GitHub lifecycle integration — automatically creating and managing PRs through the execution and verification cycle — and adds three new agents: a PR reviewer, a changelog writer, and an automatic documentation updater.

## Core Value

Every step of the VIT workflow is automatically reflected in GitHub — from execution to verification to merge — with zero manual GitHub operations.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ GitHub milestone created on `/vit:new-milestone` — existing
- ✓ Feature issue created per phase on `/vit:new-milestone` — existing
- ✓ Feature branch created per phase on `/vit:new-milestone` — existing
- ✓ Sub-issues created per plan on `/vit:plan-phase` — existing
- ✓ Sub-issue checkboxes checked off during `execute-phase` — existing
- ✓ Feature issue closed when phase completes in `execute-phase` — existing
- ✓ Developer feedback read from GitHub issues via `review-feedback` — existing
- ✓ CI workflow posts test results to GitHub issues via `phase-ci.yml` — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] Draft PR created automatically when `execute-phase` starts (feature/vX.Y-N → milestone/vX.Y)
- [ ] Draft PR promoted to ready-for-review after `verify-work` passes
- [ ] `vit-pr-reviewer` agent spawned automatically after `verify-work` passes — reviews code, posts PR review comment
- [ ] `vit-changelog-writer` agent generates CHANGELOG entries when `/vit:complete-milestone` runs
- [ ] `vit-doc-updater` agent spawned after each plan completes in `execute-phase` — updates README, API docs (JSDoc/docstrings), and CHANGELOG incrementally

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- GitHub webhook → VIT state sync — requires server infrastructure, out of scope for a CLI tool
- GitHub Projects / kanban board — too much overhead for a dev-focused workflow
- External PR review services (Copilot, etc.) — VIT uses Claude directly

## Context

- This extends the existing vit-cc framework — new commands, agents, and modifications to existing commands
- The workflow already has: milestone → phase issues → sub-issues → CI results → developer feedback loop
- The missing piece is PR lifecycle: feature branches exist but are never turned into PRs
- Auto-doc updates run inside `vit-executor` after each plan completes (post-plan hook)
- PR reviewer runs between `verify-work` and the PR being marked ready — quality gate before human review
- Changelog writer runs inside `complete-milestone` — turns phase SUMMARY.md files into release notes

## Constraints

- **Tech stack**: Node.js CLI, Markdown agent definitions, `gh` CLI for GitHub operations — no new dependencies
- **Compatibility**: Must degrade gracefully when `gh` CLI is not available or unauthenticated (skip GitHub steps silently)
- **Backwards compatibility**: Existing projects without GitHub Issue Mapping in STATE.md must continue to work unchanged
- **Agent pattern**: New agents follow existing pattern — Markdown system prompts in `files/agents/`, spawned via Task tool

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Draft PR on execute-phase start, not plan-phase | Phase may span hours; PR should exist while code is being written | — Pending |
| PR reviewer runs automatically after verify (not manually) | Reduces friction; reviewer should always run before human sees the PR | — Pending |
| Doc updater runs per-plan, not per-task | Per-task is too granular and expensive; per-plan matches the commit boundary | — Pending |
| Changelog writer on complete-milestone, not per-phase | Release notes should cover the full milestone; incremental entries per phase | — Pending |

---
*Last updated: 2026-03-18 after initialization*
