# vit-cc Documentation & Developer Guide

## What This Is

vit-cc is a Claude Code agentic framework that orchestrates AI-driven development through phase-based workflows. It includes full GitHub lifecycle integration, AI code review, and automated documentation agents. This milestone focuses on creating comprehensive documentation: a user guide covering all commands, agents, and skills, plus a developer guide explaining architecture, design patterns, and how to extend the framework with custom components.

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
- ✓ Draft PR created automatically when `execute-phase` starts — v1.0
- ✓ Draft PR promoted to ready-for-review after `verify-work` passes — v1.0
- ✓ `vit-pr-reviewer` agent spawned automatically after `verify-work` passes — v1.0
- ✓ `vit-doc-updater` agent spawns after each phase to update docs and CHANGELOG — v1.0
- ✓ `vit-changelog-writer` agent generates versioned CHANGELOG entry on `/vit:complete-milestone` — v1.0

### Active

<!-- Current scope for next milestone. -->

- [ ] User guide documenting all slash commands with usage, options, and examples
- [ ] User guide documenting all agents with roles, inputs/outputs, and spawning context
- [ ] Developer guide covering VIT architecture and design patterns
- [ ] Developer guide explaining how to create custom agents, commands, and skills
- [ ] Architecture documentation with data flow diagrams and state management

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
| Draft PR on execute-phase start, not plan-phase | Phase may span hours; PR should exist while code is being written | ✓ Good — PR exists throughout execution |
| PR reviewer runs automatically after verify (not manually) | Reduces friction; reviewer should always run before human sees the PR | ✓ Good — zero friction, consistent quality gate |
| Doc-updater runs per-phase (after all waves), not per-task | Per-task too granular and expensive; per-phase matches commit boundary | ✓ Good — CHANGELOG [Unreleased] grows phase by phase |
| Changelog writer on complete-milestone, not per-phase | Release notes should cover the full milestone | ✓ Good — single versioned entry covers all phases |
| Idempotency via live `gh pr list` query | STATE.md can be stale; GitHub is authoritative | ✓ Good — no duplicate PRs |
| Inline diff comments capped at 5 | GitHub API 422 errors on large diffs | ✓ Good — fallback handles empty body edge case |
| CHANGELOG ownership split | doc-updater writes [Unreleased]; changelog-writer promotes it | ✓ Good — no conflict, clean promotion |

## Current Milestone: v1.1 Documentation & Developer Guide

**Goal:** Create comprehensive user-facing and developer-facing documentation for the entire VIT framework.

**Target features:**
- User guide: all commands, agents, skills, and configuration reference
- Developer guide: architecture, design patterns, extending with custom components
- Architecture docs: data flow, state management, agent orchestration patterns

---
*Last updated: 2026-03-19 after v1.1 milestone start*
