# vit-cc — Onboarding Guide

> Read this if you're joining the project mid-stream or after a break.

## What we're building

vit-cc is a Claude Code agentic framework that orchestrates AI-driven development through phase-based workflows. Every step of the VIT workflow is automatically reflected in GitHub — from execution to verification to merge — with zero manual GitHub operations. We're now building comprehensive documentation: a visually striking README and a VitePress-powered technical docs site.

## Where we are

Phase 01 of 02 — README Rewrite with ASCII Art Branding
Status: Ready to plan

See `.planning/STATE.md` for current position and `.planning/ROADMAP.md` for all phases.

## Read in this order

1. `.planning/PROJECT.md` — vision, constraints, key decisions
2. `.planning/REQUIREMENTS.md` — what v1.1.0 must deliver (27 requirements)
3. `.planning/ROADMAP.md` — phases and their goals
4. `.planning/STATE.md` — current position, active blockers, recent decisions

If a phase is in progress, also read:
- `.planning/phases/v1.1.0/[N]-[name]/HANDOFF.md` — context from previous engineer
- `.planning/phases/v1.1.0/[N]-[name]/*-PLAN.md` — current execution plans

## Branch and PR workflow

| Branch | Purpose |
|--------|---------|
| `main` | Stable, reviewed code only |
| `milestone/v1.1.0` | All v1.1.0 milestone work lands here |
| `feature/v1.1.0-01-readme-rewrite` | Phase 01 — README rewrite |
| `feature/v1.1.0-02-docs-site` | Phase 02 — VitePress docs site |

To start working on a phase:
```bash
git checkout feature/v1.1.0-01-readme-rewrite
# or if using worktrees:
cd ../vit-cc-feature-v1.1.0-01-readme-rewrite
```

## How to contribute

```bash
# Plan a phase (if not yet planned)
/vit:plan-phase 01

# Execute plans (Claude does the work)
/vit:execute-phase 01

# Check progress
/vit:progress

# Resume after a break
/vit:resume-work
```

## Team contacts

| Phase | Owner | GitHub |
|-------|-------|--------|
| 01 | — | — |
| 02 | — | — |

## Active blockers

None currently.

## Key architectural decisions

- **Draft PR on execute-phase start, not plan-phase**: Phase may span hours; PR should exist while code is being written — ✓ Good
- **PR reviewer runs automatically after verify**: Reduces friction; reviewer should always run before human sees the PR — ✓ Good
- **Doc-updater runs per-phase, not per-task**: Per-task too granular and expensive; per-phase matches commit boundary — ✓ Good
- **Idempotency via live `gh pr list` query**: STATE.md can be stale; GitHub is authoritative — ✓ Good
- **CHANGELOG ownership split**: doc-updater writes [Unreleased]; changelog-writer promotes it — ✓ Good

## What to avoid

- Targeted JSDoc updates — high cost, unproven value
- API reference auto-generation — VIT is prompt-based, not a code library
- i18n / translations — English-only for now
- Interactive tutorials — static docs sufficient
- Blog / changelog page on docs site — CHANGELOG.md in repo is sufficient

## Getting unstuck

- Check `.planning/phases/v1.1.0/[N]-[name]/HANDOFF.md` for phase-level context
- Run `/vit:progress` to see what's complete and what's next
- Run `/vit:debug "[issue]"` if something is broken
