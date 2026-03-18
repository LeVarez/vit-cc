# Directory Structure

**Analysis Date:** 2026-03-18

## Root Layout

```
vit-cc/
├── bin/
│   └── vit-cc.js              # CLI entry point (npx vit-claude)
├── src/
│   └── install.js             # Installation logic
├── files/                     # Framework files distributed to target projects
│   ├── agents/                # 13 specialist agent system prompts
│   ├── commands/vit/          # 29 slash command definitions
│   ├── github/workflows/      # Optional CI workflow (phase-ci.yml)
│   ├── hooks/                 # Session lifecycle hooks
│   └── vit/                   # Core VIT framework resources
│       ├── references/        # Best practice guides and patterns
│       ├── templates/         # Document templates
│       ├── workflows/         # Orchestration workflow definitions
│       └── VERSION            # Current version string
├── .claude/                   # VIT's own Claude Code configuration
│   ├── agents/                # Symlinked/copied from files/agents/
│   ├── commands/              # Symlinked/copied from files/commands/
│   ├── hooks/                 # Active hooks for this repo
│   ├── settings.json          # Hook registrations
│   └── vit/                   # Symlinked/copied vit resources
├── package.json               # npm package metadata (name: vit-claude)
└── README.md
```

## Key Directories

### `files/agents/` — 13 Specialist Agents

Each file is a Markdown system prompt for a Claude subagent:

| Agent | Purpose |
|-------|---------|
| `vit-planner.md` | Creates PLAN.md from phase requirements |
| `vit-executor.md` | Executes plan tasks atomically with commits |
| `vit-verifier.md` | Validates phase completion against success criteria |
| `vit-project-researcher.md` | Domain ecosystem research (stack, features, pitfalls) |
| `vit-phase-researcher.md` | Phase-specific research before planning |
| `vit-roadmapper.md` | Maps requirements to phases in ROADMAP.md |
| `vit-codebase-mapper.md` | Analyzes codebase and writes .planning/codebase/ docs |
| `vit-debugger.md` | Systematic bug investigation |
| `vit-test-writer.md` | Generates Vitest tests from phase plans |
| `vit-github-reviewer.md` | Reads GitHub feedback and implements changes |
| `vit-research-synthesizer.md` | Synthesizes research outputs into SUMMARY.md |
| `vit-plan-checker.md` | Verifies plan will achieve phase goal |
| `vit-integration-checker.md` | Validates cross-phase integration |

### `files/commands/vit/` — 29 Slash Commands

Commands are Markdown files loaded by Claude Code as `/vit:<name>`:

| Category | Commands |
|----------|---------|
| Project init | `new-project.md`, `map-codebase.md`, `new-milestone.md` |
| Planning | `plan-phase.md`, `discuss-phase.md`, `research-phase.md`, `list-phase-assumptions.md` |
| Execution | `execute-phase.md`, `quick.md` |
| Verification | `verify-work.md`, `audit-milestone.md` |
| Progress | `progress.md`, `list-milestones.md`, `check-todos.md` |
| Roadmap | `add-phase.md`, `insert-phase.md`, `remove-phase.md`, `plan-milestone-gaps.md` |
| Session | `pause-work.md`, `resume-work.md` |
| Maintenance | `complete-milestone.md`, `review-feedback.md`, `debug.md` |
| Config | `settings.md`, `set-profile.md`, `update.md` |
| Meta | `help.md`, `join-discord.md`, `add-todo.md` |

### `files/vit/templates/` — Document Templates

Templates for `.planning/` structure:

| Template | Creates |
|----------|---------|
| `project.md` | `.planning/PROJECT.md` |
| `requirements.md` | `.planning/REQUIREMENTS.md` |
| `roadmap.md` | `.planning/ROADMAP.md` |
| `state.md` | `.planning/STATE.md` |
| `phase-prompt.md` | Phase plan header |
| `summary.md` | Phase SUMMARY.md |
| `milestone.md` | Milestone tracking |
| `codebase/` | `.planning/codebase/*.md` templates |
| `research-project/` | `.planning/research/*.md` templates |

### `files/vit/references/` — Best Practice Guides

Referenced by agents during execution:

- `ui-brand.md` — Visual output patterns (banners, progress, tables)
- `questioning.md` — Project questioning technique guide
- `git-integration.md` — Commit message patterns, branch strategy
- `checkpoints.md` — Checkpoint protocol definitions
- `model-profiles.md` — Agent model selection guidance
- `verification-patterns.md` — How to verify phase completion
- `tdd.md` — Test-driven development patterns
- `planning-config.md` — config.json schema and usage

### `files/hooks/` — Session Hooks

- `vit-check-update.cjs` — Checks npm for new vit-claude version at session start
- `vit-statusline.js` — Renders VIT status in Claude Code sidebar

### `.planning/` — Per-Project State (Not In This Repo)

Created in target project after `/vit:new-project`:

```
.planning/
├── PROJECT.md           # Vision, scope, requirements, decisions
├── REQUIREMENTS.md      # Categorized requirements with REQ-IDs
├── ROADMAP.md           # Phase structure with success criteria
├── STATE.md             # Current position and execution context
├── config.json          # Workflow preferences
├── codebase/            # Codebase analysis (from /vit:map-codebase)
├── research/            # Domain research (from /vit:new-project)
└── phases/
    ├── 01-phase-name/
    │   ├── 01-01-PLAN.md
    │   ├── 01-02-PLAN.md
    │   └── 01-01-SUMMARY.md
    └── 02-phase-name/
        └── ...
```

## Naming Conventions

**Files:**
- JavaScript: kebab-case (`vit-cc.js`, `vit-statusline.js`)
- Markdown agents/commands: kebab-case (`vit-executor.md`, `plan-phase.md`)
- Templates: lowercase with hyphens

**Agents:** Prefixed with `vit-` (e.g., `vit-planner`, `vit-executor`)

**Commands:** No prefix, maps to `/vit:<name>` (e.g., `plan-phase.md` → `/vit:plan-phase`)

**Phase directories:** Zero-padded numbers with descriptive name (`01-foundation`, `02-auth`)

**Plan files:** Phase number + plan number (`01-01-PLAN.md`, `01-02-PLAN.md`)

## Adding New Components

**New agent:** Add `files/agents/vit-<name>.md` with role frontmatter

**New command:** Add `files/commands/vit/<name>.md` with command metadata

**New template:** Add to `files/vit/templates/`

**New reference:** Add to `files/vit/references/`

After adding, run `npx vit-claude` in a target project to get the updated files.

---

*Structure analysis: 2026-03-18*
