# Getting Started

This guide walks you through installing VIT and running your first complete phase.

## Prerequisites

- Node.js 18+
- [Claude Code](https://claude.ai/code) CLI installed and authenticated
- A project directory (new or existing)

## Step 1: Install VIT

```bash
npx vit-claude
```

VIT copies its framework files into your project's `.claude/` directory. You will be prompted about the optional GitHub CI workflow — say yes if your project is on GitHub.

**What you get:**
- `.claude/agents/vit-*.md` — 16 specialist agents
- `.claude/commands/vit/*.md` — 29 slash commands
- `.claude/hooks/` — update checker and status hooks
- `.claude/vit/` — references, templates, and workflows
- `.github/workflows/phase-ci.yml` — GitHub CI integration (if you opted in)

**Time:** ~1 minute

## Step 2: Start a new project

```
/vit:new-project
```

Claude will ask about your project: goals, tech stack, constraints, and timeline. Answer the questions — VIT uses your answers to build the planning documents.

**What you get:**
- `.planning/PROJECT.md` — project brief and key decisions log
- `.planning/ROADMAP.md` — milestone breakdown with phases
- `.planning/STATE.md` — live project state that persists across sessions

**Time:** 2–5 minutes

## Step 3: Plan your first phase

```
/vit:plan-phase 1
```

VIT researches the phase domain, generates executable plans with task breakdowns, and verifies the plans against your phase goals before handing them to you.

**What you get:**
- `.planning/phases/01-*/01-RESEARCH.md` — domain research
- `.planning/phases/01-*/01-01-PLAN.md`, `01-02-PLAN.md`, … — one plan file per work unit, each with tasks, dependencies, and verification criteria

**Time:** 3–8 minutes

## Step 4: Execute the phase

```
/vit:execute-phase 1
```

VIT runs the plans wave by wave — plans in the same wave execute in parallel; later waves start only after earlier ones complete. Each completed task produces an atomic commit on a feature branch.

**What you get:**
- Working code committed on `feature/v{milestone}-01-*` branch
- A draft PR on GitHub (if CI is enabled)
- `.planning/STATE.md` updated with progress and decisions

**Time:** varies by phase complexity

## Step 5: Verify your work

```
/vit:verify-work 1
```

VIT checks everything built during the phase against the original phase goals, working backwards from goals to evidence.

**What you get:**
- `.planning/phases/01-*/VERIFICATION.md` — pass/fail report with evidence
- PR promoted from draft to ready-for-review (if all goals pass and GitHub is enabled)

**Time:** 1–3 minutes

## What's next

- [Core Concepts](core-concepts.md) — understand the milestone → phase → plan → task hierarchy and how VIT thinks about your project
- [Glossary](glossary.md) — definitions for every VIT-specific term
- [Commands reference](../../README.md#commands-reference) — full list of all 29 slash commands with descriptions
