# vit-cc — Onboarding Guide

> Read this if you're joining the project mid-stream or after a break.

## What we're building

vit-cc is a Claude Code workflow framework that orchestrates AI-driven development through phase-based workflows. This milestone (v1.0.1) adds a comprehensive VitePress documentation site — the entry point for developers covering concepts, commands, agents, internals, and tutorials.

**Core value:** Every step of the VIT workflow is automatically reflected in GitHub — from execution to verification to merge — with zero manual GitHub operations.

## Where we are

Phase 01 of 05 — Infrastructure and Information Architecture
Status: Ready to plan

See `.planning/STATE.md` for current position and `.planning/ROADMAP.md` for all phases.

## Read in this order

1. `.planning/PROJECT.md` — vision, constraints, key decisions
2. `.planning/REQUIREMENTS.md` — what v1.0.1 must deliver (28 requirements)
3. `.planning/ROADMAP.md` — 5 phases and their goals
4. `.planning/STATE.md` — current position, active blockers, recent decisions

If a phase is in progress, also read:
- `.planning/phases/v1.0.1/[N]-[name]/HANDOFF.md` — context from previous engineer
- `.planning/phases/v1.0.1/[N]-[name]/*-PLAN.md` — current execution plans

## Branch and PR workflow

| Branch | Purpose |
|--------|---------|
| `main` | Stable, reviewed code only |
| `milestone/v1.0.1` | All milestone work lands here |
| `feature/v1.0.1-01-infrastructure-and-ia` | Phase 01: Site infrastructure |
| `feature/v1.0.1-02-getting-started-and-concepts` | Phase 02: Getting started & concepts |
| `feature/v1.0.1-03-command-reference` | Phase 03: Command reference |
| `feature/v1.0.1-04-agent-reference` | Phase 04: Agent reference |
| `feature/v1.0.1-05-advanced-guides` | Phase 05: Advanced guides |

To start working on a phase:
```bash
git checkout feature/v1.0.1-[N]-[phase-slug]
# or if using worktrees:
cd ../vit-cc-feature-v1.0.1-[N]-[phase-slug]
```

## How to contribute

```bash
# Plan a phase (if not yet planned)
/vit:plan-phase [N]

# Execute plans (Claude does the work)
/vit:execute-phase [N]

# Check progress
/vit:progress

# Resume after a break
/vit:resume-work
```

## Active blockers

None currently.

## Key architectural decisions

- **VitePress v2 alpha (`@next`)**: Officially recommended for new sites; API surface is stable despite alpha label
- **`base: '/vit-cc/'`**: Must be set before writing content — invisible in dev, breaks production if missed
- **Sidebar structure in Phase 01**: Restructuring 62 cross-linked pages later is a rewrite
- **Stub extraction for reference pages**: Parse frontmatter from source command/agent files, don't hand-write
- **GitHub Pages deployment**: Free, project already on GitHub, VitePress provides ready-made workflow

## What to avoid

- Blog section — not needed for CLI framework docs
- i18n / translations — English-only for v1.0.1
- API reference — VIT is CLI-only, no programmatic API
- Video tutorials — text walkthroughs sufficient
- Algolia DocSearch — built-in MiniSearch is sufficient

## Getting unstuck

- Check `.planning/phases/v1.0.1/[N]-[name]/HANDOFF.md` for phase-level context
- Run `/vit:progress` to see what's complete and what's next
- Run `/vit:debug "[issue]"` if something is broken
