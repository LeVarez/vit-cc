# Architecture

**Analysis Date:** 2026-03-18

## Pattern Overview

**Overall:** Multi-agent orchestration framework with phase-based workflow execution.

**Key Characteristics:**
- **Modular agent architecture** — 13 specialist agents handle distinct concerns (planning, execution, verification, research, debugging)
- **Orchestrator coordination** — CLI commands spawn agents and manage workflows without doing the work themselves
- **Persistent state management** — `.planning/` directory maintains project context across sessions
- **Wave-based parallel execution** — Tasks grouped into dependency-ordered waves for concurrent execution
- **Checkpoint protocols** — Built-in pause points for human decisions and verification

## Layers

**CLI Entry Layer:**
- Location: `bin/vit-cc.js`
- Purpose: Bootstrap script that initializes installation, displays version info
- Depends on: `src/install.js`

**Installation & Bootstrap Layer:**
- Location: `src/install.js`
- Purpose: Copy framework files to `.claude/`, register hooks, merge settings
- Contains: Directory copying logic, `.claude/settings.json` merging, interactive CI workflow setup

**Framework Files Distribution:**
- Location: `files/` directory
  - `files/agents/` — 13 specialist agent definitions (Markdown system prompts)
  - `files/commands/vit/` — 29 slash command definitions
  - `files/hooks/` — Session lifecycle hooks (update check, status line)
  - `files/vit/` — Core references, workflows, templates, version

**Workflow Orchestration Layer:**
- Location: `files/vit/workflows/`
- Key files: `execute-phase.md`, `execute-plan.md`, `map-codebase.md`, `verify-phase.md`, `resume-project.md`
- Purpose: Coordinate agent spawning, manage checkpoints, handle state transitions

**Specialist Agent Layer:**
- Location: `files/agents/vit-*.md` — 13 agents
- Key agents:
  - `vit-planner.md` — Creates detailed PLAN.md
  - `vit-executor.md` — Executes plan tasks atomically with commits
  - `vit-verifier.md` — UAT verification against success criteria
  - `vit-project-researcher.md` — Domain ecosystem research
  - `vit-debugger.md` — Bug investigation and root cause analysis
  - `vit-roadmapper.md` — Requirement-to-phase mapping
  - `vit-codebase-mapper.md` — Codebase analysis
  - `vit-test-writer.md` — Test generation

**Command Layer:**
- Location: `files/commands/vit/*.md` — 29 commands
- Key commands: `new-project.md`, `plan-phase.md`, `execute-phase.md`, `progress.md`, `debug.md`, `map-codebase.md`

**Reference & Template Layer:**
- Location: `files/vit/references/` and `files/vit/templates/`
- References: questioning.md, ui-brand.md, git-integration.md, checkpoints.md, model-profiles.md
- Templates: project.md, requirements.md, roadmap.md, state.md, plus codebase analysis templates

**State & Context Layer:**
- Location: `.planning/` directory (created per-project)
- Key files: `PROJECT.md`, `ROADMAP.md`, `STATE.md`, `config.json`, `phases/`, `research/`

## Data Flow

**Project Initialization Flow:**
1. User runs `/vit:new-project`
2. Orchestrator gathers project context via structured questioning
3. Optionally spawns `vit-project-researcher` agents for domain research
4. Creates `.planning/PROJECT.md` with vision, scope, constraints
5. Spawns `vit-roadmapper` with requirements
6. Roadmapper creates `.planning/ROADMAP.md` and `.planning/STATE.md`
7. Commits artifacts

**Phase Planning Flow:**
1. User runs `/vit:plan-phase N`
2. Orchestrator reads STATE.md, PROJECT.md, ROADMAP.md
3. Spawns `vit-planner` with full context
4. Planner produces `.planning/phases/NN-name/NN-01-PLAN.md`
5. User reviews and approves

**Phase Execution Flow:**
1. User runs `/vit:execute-phase N`
2. Orchestrator discovers all plans in phase, analyzes dependencies
3. Groups tasks into waves (respecting `depends_on` relationships)
4. Spawns `vit-executor` per wave/plan
5. Executor performs tasks atomically with commits
6. Creates SUMMARY.md after plan completes
7. Optionally spawns `vit-verifier` to validate success criteria

**Update Check Flow:**
1. Claude Code session starts
2. Hook runs: `node .claude/hooks/vit-check-update.cjs`
3. Queries npm registry for latest version
4. Caches result to `~/.claude/cache/vit-update-check.json`
5. Status line hook reads cache and renders in Claude Code sidebar

## Key Abstractions

**Agent System Prompt Pattern:**
- Agents are Markdown files with frontmatter (name, tools, model)
- System prompt defines role, tools allowed, output format
- Orchestrators spawn agents via Task tool with context in prompt

**State Management Pattern:**
- `.planning/STATE.md` is the single source of truth for project position
- Every agent reads STATE.md first; executor updates it after each wave
- `config.json` stores workflow preferences separate from state

**Checkpoint Pattern:**
- Checkpoints defined in PLAN.md as special task types
- Executor pauses at checkpoints, presents decision to user
- Workflow resumes when user types expected signal (e.g., "approved")

**Wave-Based Execution Pattern:**
- Tasks in PLAN.md have `depends_on` fields
- Planner groups tasks into waves based on dependency graph
- Within a wave, tasks run in parallel; waves run sequentially

---

*Architecture analysis: 2026-03-18*
