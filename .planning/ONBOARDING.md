# vit-cc — Onboarding Guide

> Read this if you're joining the project mid-stream or after a break.

## What we're building

vit-cc is a Claude Code agentic framework that orchestrates AI-driven development through phase-based workflows. It includes full GitHub lifecycle integration, AI code review, and automated documentation agents. The current milestone (v1.1) focuses on creating comprehensive documentation: a user guide covering all commands, agents, and skills, plus a developer guide explaining architecture, design patterns, and how to extend the framework.

**Core value:** Every VIT user can discover, understand, and use any command or agent without reading source markdown files; every developer can extend the framework with custom components by following documented patterns.

## Where we are

Phase 01 of 04 — Information Architecture
Status: Ready to plan

See `.planning/STATE.md` for current position and `.planning/ROADMAP.md` for all phases.

## Read in this order

1. `.planning/PROJECT.md` — vision, constraints, key decisions
2. `.planning/REQUIREMENTS.md` — what v1.1 must deliver (28 requirements across 6 categories)
3. `.planning/ROADMAP.md` — phases and their goals
4. `.planning/STATE.md` — current position, active blockers, recent decisions

If a phase is in progress, also read:
- `.planning/phases/v1.1/[N]-[name]/HANDOFF.md` — context from previous engineer
- `.planning/phases/v1.1/[N]-[name]/*-PLAN.md` — current execution plans

## Branch and PR workflow

| Branch | Purpose |
|--------|---------|
| `main` | Stable, reviewed code only |
| `milestone/v1.1` | All v1.1 milestone work lands here |
| `feature/v1.1-01-information-architecture` | Phase 01: docs/ structure, README, getting started, concepts, glossary |
| `feature/v1.1-02-command-agent-reference` | Phase 02: all 30 commands + 16 agents documented |
| `feature/v1.1-03-workflow-guides-architecture` | Phase 03: workflow guides + architecture docs with Mermaid |
| `feature/v1.1-04-developer-extension-guide` | Phase 04: custom agent/command tutorials + extension references |

To start working on a phase:
```bash
git checkout feature/v1.1-[N]-[phase-slug]
# or if using worktrees:
cd ../vit-cc-feature-v1.1-[N]-[phase-slug]
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

- **Plain GFM markdown in docs/ folder**: No build pipeline — vit-doc-updater and vit-changelog-writer agents must be able to write docs without tooling
- **Two-audience split**: User guide and developer guide are separate entry points — never merged on the same pages
- **Getting started before reference**: Conceptual overview and getting started guide must exist before any command/agent reference is written
- **Mermaid for diagrams**: GitHub-native rendering, text-based, agent-writable, diff-friendly

## What to avoid

- VitePress/static site generation — deferred to v1.2; focus on plain markdown baseline
- Auto-generated command reference — command files are prose system prompts, not parseable APIs
- API documentation (JSDoc/TypeDoc) — vit-cc is markdown-based, not a code library
- Translated documentation — English only for v1.1

## Getting unstuck

- Check `.planning/phases/v1.1/[N]-[name]/HANDOFF.md` for phase-level context
- Run `/vit:progress` to see what's complete and what's next
- Run `/vit:debug "[issue]"` if something is broken
