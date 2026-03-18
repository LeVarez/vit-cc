# [Project Name] — Onboarding Guide

> Read this if you're joining the project mid-stream or after a break.

## What we're building

[One paragraph from PROJECT.md describing the product and core value]

## Where we are

Phase [N] of [Y] — [Phase Name]
Status: [Ready to plan / In progress / Phase complete]

See `.planning/STATE.md` for current position and `.planning/ROADMAP.md` for all phases.

## Read in this order

1. `.planning/PROJECT.md` — vision, constraints, key decisions
2. `.planning/REQUIREMENTS.md` — what v1 must deliver (scoped)
3. `.planning/ROADMAP.md` — phases and their goals
4. `.planning/STATE.md` — current position, active blockers, recent decisions

If a phase is in progress, also read:
- `.planning/phases/[milestone]/[N]-[name]/HANDOFF.md` — context from previous engineer
- `.planning/phases/[milestone]/[N]-[name]/*-PLAN.md` — current execution plans

## Branch and PR workflow

| Branch | Purpose |
|--------|---------|
| `main` | Stable, reviewed code only |
| `milestone/v1.0` | All milestone work lands here |
| `feature/v1.0-NN-name` | Per-phase feature branches |

To start working on a phase:
```bash
git checkout feature/v1.0-[N]-[phase-slug]
# or if using worktrees:
cd ../[project]-feature-v1.0-[N]-[phase-slug]
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

## Team contacts

| Phase | Owner | GitHub |
|-------|-------|--------|
| [N] | [name] | @[handle] |

## Active blockers

[Pull from STATE.md Blockers/Concerns at generation time]

None currently.

## Key architectural decisions

[Pull from PROJECT.md Key Decisions table — most recent 3-5]

- [Decision]: [Rationale]

## What to avoid

[Pull from REQUIREMENTS.md Out of Scope section]

- [Out of scope item]: Don't build this for v1

## Getting unstuck

- Check `.planning/phases/[milestone]/[N]-[name]/HANDOFF.md` for phase-level context
- Run `/vit:progress` to see what's complete and what's next
- Run `/vit:debug "[issue]"` if something is broken
- Ask in [team channel] if unclear on approach
