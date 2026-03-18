# vit-cc

## What This Is

vit-cc is a Claude Code agentic framework that orchestrates AI-driven development through phase-based workflows. It manages the full lifecycle from project initialization through research, planning, execution, verification, and GitHub integration — with specialized AI agents handling each step.

## Core Value

Developers can go from idea to shipped code through a structured, AI-orchestrated workflow that handles planning, execution, review, and documentation automatically.

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

- [ ] VitePress documentation site with Markdown source
- [ ] ASCII art branding/logo
- [ ] Architecture diagrams (Mermaid)
- [ ] Complete command reference (every command: what it does, what to expect, GitHub effects)
- [ ] Agent deep-dive (how agents work internally, how to create new ones)
- [ ] Layered depth: user-facing guides → advanced internals reference
- [ ] Getting started guide for new users

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- GitHub webhook → VIT state sync — requires server infrastructure, out of scope for a CLI tool
- GitHub Projects / kanban board — too much overhead for a dev-focused workflow
- External PR review services (Copilot, etc.) — VIT uses Claude directly

## Current Milestone: v1.1 Documentation Site

**Goal:** Create comprehensive documentation for the entire VIT framework — commands, agents, architecture, and contributor guides — as a VitePress site with ASCII branding and Mermaid diagrams.

**Target features:**
- VitePress documentation site (Markdown source, builds to hosted site)
- ASCII art logo and branding throughout
- Complete command reference with GitHub integration effects
- Agent system deep-dive with guide for creating custom agents
- Architecture diagrams (Mermaid) showing workflow, data flow, agent orchestration
- Layered content: getting started → user guides → advanced internals

## Context

- vit-cc is a mature framework with 20+ commands, 15+ agents, and a rich .planning/ state system
- v1.0 added GitHub lifecycle integration (PRs, review, docs, changelog)
- No documentation exists beyond the command/agent source files themselves
- The framework uses Markdown files as both agent definitions and orchestrator instructions
- Documentation should be extractable from the existing command and agent .md files
- The .planning/ internals (STATE.md, config.json, ROADMAP.md) need reference docs but are secondary to user-facing guides

## Constraints

- **Tech stack**: VitePress for the docs site — Markdown source files that also render on GitHub
- **Content source**: Extract from existing command/agent .md files where possible, don't duplicate
- **Branding**: ASCII art logo, consistent visual identity matching VIT's existing UI patterns (stage banners, status symbols)
- **Diagrams**: Mermaid format (renders natively in VitePress and GitHub)

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

| VitePress for docs site | Best VitePress/Markdown ecosystem fit, native Mermaid support, Vue-based | — Pending |
| Layered depth (user → advanced) | Serves all audiences without overwhelming newcomers | — Pending |
| Mermaid for diagrams | Native rendering in both VitePress and GitHub | — Pending |

---
*Last updated: 2026-03-18 after v1.1 milestone start*
