# Architecture Patterns: vit-cc Internal Architecture

**Domain:** vit-cc agent framework — core architecture for developer documentation
**Researched:** 2026-03-19
**Confidence:** HIGH (derived from direct source file reading, not external sources)

---

## System Overview

vit-cc is a Claude Code extension framework. It installs into a project's `.claude/` directory and operates entirely through Claude Code's native primitives: slash commands (`/vit:*`), sub-agents (`.claude/agents/`), and a file-based state store (`.planning/`). There is no runtime server, no daemon, and no build step — the "runtime" is Claude itself.

**Install artifact locations:**
```
.claude/
  agents/          ← 16 specialist agent definitions (Markdown + YAML frontmatter)
  commands/vit/    ← 29 slash command definitions (Markdown with YAML frontmatter)
  hooks/           ← SessionStart hooks (JS/CJS — run by Claude Code host)
  vit/
    references/    ← Shared knowledge modules (@-imported by commands and agents)
    templates/     ← Output templates for generated artifacts
    workflows/     ← Reusable multi-step workflow fragments (@-imported)

.planning/         ← Project state store (written/read by agents at runtime)
  PROJECT.md
  REQUIREMENTS.md
  ROADMAP.md
  STATE.md
  config.json
  research/
  phases/
    <milestone>/
      <phase_dir>/
        *-PLAN.md
        *-SUMMARY.md
        *-VERIFICATION.md
```

---

## The Three-Layer Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  LAYER 1: COMMANDS (Orchestrators)                            │
│                                                              │
│  .claude/commands/vit/*.md                                   │
│  Invoked by user: /vit:new-project, /vit:plan-phase, etc.   │
│  Role: coordinate, spawn agents, route results, update state │
└────────────────────────────┬─────────────────────────────────┘
                             │ Task(subagent_type=, model=)
┌────────────────────────────▼─────────────────────────────────┐
│  LAYER 2: AGENTS (Workers)                                    │
│                                                              │
│  .claude/agents/*.md                                         │
│  Spawned by commands via Task() calls                        │
│  Role: implement, research, plan, verify, document           │
└────────────────────────────┬─────────────────────────────────┘
                             │ reads / writes
┌────────────────────────────▼─────────────────────────────────┐
│  LAYER 3: STATE STORE (.planning/)                            │
│                                                              │
│  File-based persistent state across sessions                 │
│  STATE.md, ROADMAP.md, PLAN.md, SUMMARY.md, etc.            │
└──────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Commands (Orchestrators)

**Location:** `.claude/commands/vit/*.md`
**Invoked by:** User typing `/vit:<name>` in Claude Code chat

Commands are Markdown files with YAML frontmatter. Claude Code parses the frontmatter to register allowed tools and argument hints, then feeds the Markdown body as Claude's system prompt when the command is invoked.

### Anatomy of a Command File

```yaml
---
name: vit:execute-phase
description: Execute all plans in a phase with wave-based parallelization
argument-hint: "<phase-number> [--gaps-only]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Task
  - AskUserQuestion
---
```

The Markdown body below the frontmatter defines Claude's behavior. Context modules are loaded via `@`-includes:

```markdown
<execution_context>
@./.claude/vit/references/ui-brand.md
@./.claude/vit/workflows/execute-phase.md
</execution_context>
```

### Orchestrator Responsibilities

Every command follows this sequence:

1. **State check** — read `.planning/STATE.md` and `.planning/config.json`
2. **Model resolution** — look up agent → model mapping from `model_profile`
3. **Content inlining** — read files into bash variables before Task() calls
4. **Agent spawning** — `Task(prompt=..., subagent_type=..., model=...)`
5. **Result routing** — parse structured returns (`## PLAN COMPLETE`, `## CHECKPOINT REACHED`, etc.)
6. **State update** — write back to `.planning/STATE.md`, ROADMAP.md, etc.
7. **Git operations** — atomic commits after each meaningful artifact

### Orchestrator Context Budget

Commands stay lean (~10-15% of context) so each sub-agent gets a fresh 200k context window. The orchestrator discovers plans, reads their content into variables, spawns agents, and processes results — it does not implement.

### Command Catalog

| Command | Role |
|---------|------|
| `vit:new-project` | Full initialization: questioning → research → requirements → roadmap |
| `vit:new-milestone` | Start new milestone cycle for an existing project |
| `vit:plan-phase` | Research + plan + verify plans for a phase |
| `vit:execute-phase` | Wave-based execution of all plans in a phase |
| `vit:verify-work` | Manual acceptance testing workflow |
| `vit:discuss-phase` | Gather user context before planning |
| `vit:research-phase` | Phase-specific domain research |
| `vit:complete-milestone` | Archive milestone, merge PRs, write changelog |
| `vit:audit-milestone` | Cross-phase integration check |
| `vit:progress` | Show current project state |
| `vit:debug` | Spawn debugger on failed execution |
| `vit:map-codebase` | Generate codebase knowledge map |
| `vit:settings` | Update workflow preferences |
| `vit:set-profile` | Change model profile at runtime |

---

## Layer 2: Agents (Workers)

**Location:** `.claude/agents/*.md`
**Invoked by:** Commands via `Task(subagent_type="<agent-name>", ...)`

Agents are also Markdown files with YAML frontmatter. The `subagent_type` field in a `Task()` call matches the `name` field in the agent's frontmatter.

### Anatomy of an Agent File

```yaml
---
name: vit-executor
description: Executes VIT plans with atomic commits, deviation handling,
             checkpoint protocols, and state management.
tools: Read, Write, Edit, Bash, Grep, Glob
color: yellow
---
```

The tool set is scoped to what the agent actually needs. Agents do NOT have `Task` or `AskUserQuestion` — they are terminal workers, not orchestrators.

### Agent Invocation Pattern

File contents must be inlined before `Task()` calls — the `@` syntax does not cross Task() boundaries:

```bash
PLAN_CONTENT=$(cat "$WORK_DIR/{plan_path}")
STATE_CONTENT=$(cat "$WORK_DIR/.planning/STATE.md")
```

```
Task(
  prompt="Working directory: {work_dir}\n\nPlan:\n{plan_content}\n\nState:\n{state_content}",
  subagent_type="vit-executor",
  model="{executor_model}",
  description="Execute plan {plan_id}"
)
```

When spawned via `subagent_type="general-purpose"`, agents load their own definition:
```
Task(prompt="First, read ./.claude/agents/vit-phase-researcher.md for your role and instructions.\n\n[context...]")
```

### Agent Catalog

| Agent | Role | Spawned By |
|-------|------|------------|
| `vit-executor` | Executes PLAN.md tasks, creates SUMMARY.md | execute-phase |
| `vit-planner` | Creates PLAN.md files from phase context | plan-phase |
| `vit-phase-researcher` | Phase-specific research (RESEARCH.md) | plan-phase |
| `vit-project-researcher` | Domain ecosystem research (STACK/FEATURES/ARCHITECTURE/PITFALLS.md) | new-project, new-milestone |
| `vit-research-synthesizer` | Synthesizes 4 research files into SUMMARY.md | new-project, new-milestone |
| `vit-roadmapper` | Creates ROADMAP.md + STATE.md from requirements | new-project, new-milestone |
| `vit-plan-checker` | Verifies plans achieve phase goal before execution | plan-phase |
| `vit-verifier` | Goal-backward verification after phase execution | execute-phase |
| `vit-debugger` | Diagnoses and fixes execution failures | debug |
| `vit-codebase-mapper` | Maps existing codebase structure into .planning/codebase/ | map-codebase |
| `vit-doc-updater` | Updates README, docs/, CHANGELOG after phase | execute-phase |
| `vit-changelog-writer` | Aggregates SUMMARY.md files into milestone changelog | complete-milestone |
| `vit-github-reviewer` | Reads GitHub PR and posts review comments | review-feedback |
| `vit-integration-checker` | Cross-phase integration verification | audit-milestone |
| `vit-pr-reviewer` | AI-assisted PR review | review-feedback |
| `vit-test-writer` | Generates unit tests for phase plans | execute-phase |

---

## Layer 3: State Store (.planning/)

**Location:** `.planning/` directory in project root
**Written by:** Orchestrators and agents
**Read by:** Every command and agent as first step

### Core State Files

**`STATE.md`** — Session memory (read first in every workflow, under 100 lines):

```markdown
## Current Position
Milestone: v1.0
Phase: 2 of 5 (authentication)
Status: In progress

## GitHub Issue Mapping
| Phase | Feature Issue | Branch | PR | Assigned |
|-------|---------------|--------|----|----------|
| v1.0/01 | #12 | feature/v1.0-01-foundation | pr#7(ready) | — |
| v1.0/02 | #13 | feature/v1.0-02-auth | pr#9 | — |
```

**`ROADMAP.md`** — Phase structure with requirements and success criteria. Written by vit-roadmapper, status updated by execute-phase.

**`REQUIREMENTS.md`** — Requirements with REQ-IDs (e.g., AUTH-01). Traceability table links each to a phase. Status updated to "Complete" after phase execution.

**`PROJECT.md`** — Project context, validated requirements, key decisions. Updated incrementally as milestones complete.

**`config.json`** — Workflow preferences. Read by every orchestrator before spawning agents:

```json
{
  "mode": "yolo|interactive",
  "depth": "quick|standard|comprehensive",
  "parallelization": true,
  "commit_docs": true,
  "model_profile": "quality|balanced|budget",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  },
  "team": {
    "enabled": false,
    "roster": [],
    "default_reviewer": ""
  }
}
```

### Phase Artifact Structure

Each phase produces artifacts under `.planning/phases/<milestone>/<phase_dir>/`:

```
.planning/phases/v1.0/02-authentication/
  02-CONTEXT.md          ← User's vision notes (from discuss-phase)
  02-RESEARCH.md         ← Phase-specific research (from plan-phase)
  02-01-PLAN.md          ← Executable plan (tasks + must_haves)
  02-01-SUMMARY.md       ← Execution record (what was built, commits, deviations)
  02-02-PLAN.md
  02-02-SUMMARY.md
  02-VERIFICATION.md     ← Goal-backward verification report
  02-UAT.md              ← User acceptance testing (from verify-work)
  HANDOFF.md             ← Context brief for next phase's engineer
```

---

## Core Architectural Patterns

### Pattern 1: Context Budget Management

**Problem:** Orchestrators accumulate context from reading state, spawning agents, and handling results. If the orchestrator context fills up, the workflow fails mid-execution.

**Solution:** Orchestrators stay lean (10-15% context), agents get fresh 200k windows.

Rules enforced:
- Orchestrators discover, group, spawn, route — they do not implement
- File contents are read and inlined per-spawn (not accumulated in orchestrator)
- Each agent starts fresh with only what it needs
- No polling loops — `Task()` is blocking; orchestrator waits for completion

### Pattern 2: Wave-Based Parallel Execution

**Problem:** Plans within a phase may be independent or dependent. Sequential is slow; uncontrolled parallel breaks dependencies.

**Solution:** Plans are pre-grouped into numbered waves during `/vit:plan-phase`. Plans in the same wave run in parallel; waves run sequentially.

PLAN.md frontmatter carries pre-computed wave assignment:

```yaml
---
wave: 1
depends_on: []
files_modified: [src/models/user.ts, src/api/users.ts]
autonomous: true
---
```

execute-phase reads `wave:` from each plan's frontmatter and issues all plans in a wave as simultaneous `Task()` calls. No runtime dependency analysis needed.

When `HAS_PLAN_BRANCHES=true` (enabled by plan-phase step 13), each plan runs in a dedicated git worktree for full file isolation — true parallel execution without git conflicts.

Wave grouping logic in the planner:
- Wave 1: Plans with no dependencies and no file overlap with each other
- Wave N: Plans whose dependencies are all in earlier waves
- A plan with checkpoints (`autonomous: false`) is typically its own wave to avoid blocking other work

### Pattern 3: Checkpoint and Continuation

**Problem:** Some tasks require human interaction (visual verification, auth credentials, architecture decisions). Claude cannot pause and resume across turns.

**Solution:** Agents STOP at checkpoint tasks and return a structured state block. The orchestrator presents the checkpoint to the user and spawns a *fresh* continuation agent with all prior state inlined.

Checkpoint task types (defined in `references/checkpoints.md`):
- `checkpoint:human-verify` — Claude built something, user visually confirms (90% of checkpoints)
- `checkpoint:decision` — User selects between implementation options (9%)
- `checkpoint:human-action` — Truly unavoidable manual step with no CLI/API (1%)

Checkpoint rule: **Claude automates everything with CLI/API. Checkpoints are only for what Claude cannot do.** Never ask the user to run CLI commands, start servers, or create files — Claude does all of that, then asks the user to verify the result.

Agent return at checkpoint:
```markdown
## CHECKPOINT REACHED

**Type:** human-verify
**Plan:** 02-03
**Progress:** 2/3 tasks complete

### Completed Tasks
| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create auth schema | d6fe73f | prisma/schema.prisma |

### Awaiting
Type "approved" or describe issues
```

Continuation agent receives `<completed_tasks>` section and verifies commit hashes exist before resuming from the specified task.

**Why fresh agent, not resume:** Claude Code's internal serialization breaks with parallel tool calls. Explicit state-passing via structured return is more reliable.

### Pattern 4: Goal-Backward Verification

**Problem:** Tasks can complete (file created, function written) without the phase goal being achieved (feature doesn't work, wiring is missing).

**Solution:** `must_haves` in PLAN.md frontmatter encode what must be TRUE for the goal to be achieved, not what tasks must be done. `vit-verifier` checks these against the actual codebase — NOT against SUMMARY.md claims.

Three-level artifact verification:
1. **Existence** — file is at the expected path
2. **Substantive** — file has real implementation (not stub, placeholder, empty return)
3. **Wired** — file is imported and used by the system

Plus key link verification: component → API → database connections checked with grep patterns.

Verification outcomes:
- `passed` → all must-haves verified, phase complete
- `gaps_found` → structured gap analysis written to VERIFICATION.md frontmatter; `/vit:plan-phase --gaps` creates fix plans
- `human_needed` → automated checks pass, items need visual/interactive testing

Gap closure loop:
```
execute-phase → verifier (gaps_found)
             → plan-phase --gaps (creates gap closure plans with gap_closure: true)
             → execute-phase --gaps-only (runs only gap closure plans)
             → verifier (re-verification)
             → repeat until passed
```

### Pattern 5: Structured Returns

Every agent returns with a defined status prefix so the orchestrator can route without parsing free-form text:

| Agent | Return Prefixes |
|-------|-----------------|
| `vit-executor` | `## PLAN COMPLETE`, `## CHECKPOINT REACHED` |
| `vit-planner` | `## PLANNING COMPLETE`, `## CHECKPOINT REACHED`, `## PLANNING INCONCLUSIVE` |
| `vit-plan-checker` | `## VERIFICATION PASSED`, `## ISSUES FOUND` |
| `vit-verifier` | `## Verification Complete` with `status: passed/gaps_found/human_needed` |
| `vit-roadmapper` | `## ROADMAP CREATED`, `## ROADMAP REVISED`, `## ROADMAP BLOCKED` |
| `vit-phase-researcher` | `## RESEARCH COMPLETE`, `## RESEARCH BLOCKED` |

### Pattern 6: Atomic Commits

Every meaningful artifact is committed immediately after creation so that context loss mid-workflow does not lose work.

Commit hierarchy (per `execute-phase` and `vit-executor`):
- **Per-task commit:** `feat(02-01): task description` — code files only, staged individually
- **Per-plan commit:** `docs(02-01): complete plan-name plan` — PLAN.md + SUMMARY.md only
- **Per-phase commit:** `docs(02): complete authentication phase` — ROADMAP.md + STATE.md + VERIFICATION.md
- **Per-milestone commits:** PROJECT.md, config.json, REQUIREMENTS.md, ROADMAP.md, STATE.md, ONBOARDING.md

Commit rule enforced everywhere: **Never use `git add .` or `git add -A`**. Always stage files individually. This prevents accidentally committing sensitive files (.env, credentials).

### Pattern 7: Model Profile Resolution

Commands read `model_profile` from `config.json` before spawning agents and look up the per-agent model in a table (defined in `references/model-profiles.md`):

| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| `vit-planner` | opus | opus | sonnet |
| `vit-roadmapper` | opus | sonnet | sonnet |
| `vit-executor` | opus | sonnet | sonnet |
| `vit-phase-researcher` | opus | sonnet | haiku |
| `vit-project-researcher` | opus | sonnet | haiku |
| `vit-research-synthesizer` | sonnet | sonnet | haiku |
| `vit-verifier` | sonnet | sonnet | haiku |
| `vit-plan-checker` | sonnet | sonnet | haiku |
| `vit-codebase-mapper` | sonnet | haiku | haiku |

Resolution pattern (identical in every orchestrator):
```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null \
  | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
# Then per-agent lookup stored in shell variable
PLANNER_MODEL="opus"   # from table for current profile
EXECUTOR_MODEL="sonnet"
```

Design rationale:
- `vit-planner` gets opus in quality/balanced — architecture decisions happen during planning
- `vit-executor` gets sonnet in balanced — follows explicit instructions, reasoning is in the plan
- Verifiers get sonnet (not haiku) in balanced — goal-backward reasoning needs more than pattern matching

### Pattern 8: Milestone-Scoped Branch Hierarchy

Phases live in a git isolation hierarchy:
```
main (stable, production)
  └── milestone/v1.0 (milestone integration branch)
        └── feature/v1.0-01-foundation (phase branch)
              └── feature/v1.0-01-01 (plan branch, when plan_branches enabled)
```

`execute-phase` creates a worktree for the feature branch and all git operations run there. PRs target the milestone branch, not main. complete-milestone handles the milestone → main merge.

STATE.md tracks the full mapping:
```markdown
## GitHub Issue Mapping
| Phase | Feature Issue | Branch | PR | Assigned | Sub-issues | Plan Branches |
|-------|---------------|--------|----|----------|------------|---------------|
| v1.0/01 | #12 | feature/v1.0-01-foundation | pr#7(ready) | — | #33, #34 | feature/v1.0-01-01, feature/v1.0-01-02 |
```

### Pattern 9: Reference and Template System

**References** (`/.claude/vit/references/`) are shared knowledge modules @-imported into command `<execution_context>` blocks. They define how the system behaves, not what it produces.

| Reference | Purpose |
|-----------|---------|
| `checkpoints.md` | Checkpoint types, automation rules, anti-patterns |
| `model-profiles.md` | Agent-to-model mapping table and rationale |
| `planning-config.md` | Config schema, commit_docs behavior, team config |
| `continuation-format.md` | Standard "Next Up" output format for command completion |
| `questioning.md` | Deep requirement elicitation techniques |
| `ui-brand.md` | VIT visual style (banner format, ASCII borders) |
| `verification-patterns.md` | Grep patterns for stub detection |
| `tdd.md` | TDD (Red-Green-Refactor) execution flow |
| `git-integration.md` | GitHub integration patterns |

**Templates** (`/.claude/vit/templates/`) define the output structure of generated artifacts:

| Template | Generates |
|----------|-----------|
| `phase-prompt.md` | PLAN.md (frontmatter schema + task XML format) |
| `summary.md` | SUMMARY.md |
| `state.md` | STATE.md |
| `roadmap.md` | ROADMAP.md |
| `project.md` | PROJECT.md |
| `requirements.md` | REQUIREMENTS.md |
| `milestone.md` | Milestone archive entry in MILESTONES.md |
| `verification-report.md` | VERIFICATION.md |
| `research-project/` | STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, SUMMARY.md |

### Pattern 10: Workflow Fragments

**Workflows** (`/.claude/vit/workflows/`) are multi-step process definitions @-imported into commands. They describe how a process works (steps, decision points, error handling) while commands define when to start and what arguments to accept.

Example: `execute-phase.md` command imports `execute-phase.md` workflow:
```markdown
<execution_context>
@./.claude/vit/workflows/execute-phase.md
</execution_context>
```

This separation allows workflow logic to be read and understood independently of the command invocation context.

---

## Data Flows

### Project Initialization Flow

```
User: /vit:new-project
  ↓
Command (orchestrator): question user
  writes: .planning/PROJECT.md
  writes: .planning/config.json
  ↓ spawns 4 parallel researchers
  Task(vit-project-researcher) → .planning/research/STACK.md
  Task(vit-project-researcher) → .planning/research/FEATURES.md
  Task(vit-project-researcher) → .planning/research/ARCHITECTURE.md
  Task(vit-project-researcher) → .planning/research/PITFALLS.md
  ↓ spawns synthesizer (after all 4 complete)
  Task(vit-research-synthesizer) → .planning/research/SUMMARY.md
  ↓ requirement gathering (inline in command, AskUserQuestion)
  writes: .planning/REQUIREMENTS.md
  ↓ spawns roadmapper
  Task(vit-roadmapper) → .planning/ROADMAP.md
                       → .planning/STATE.md
                       → updates REQUIREMENTS.md traceability
  ↓ GitHub sync (if gh CLI available)
  creates: milestone/v1.0 branch
  creates: feature/v1.0-N-slug branches (one per phase)
  writes: .planning/STATE.md (GitHub Issue Mapping)
  writes: .planning/ONBOARDING.md
```

### Phase Planning Flow

```
User: /vit:plan-phase 2
  ↓
Command reads: config.json → model_profile → resolve per-agent models
Command reads: STATE.md → current milestone, WORK_DIR
  ↓ (if workflow.research = true)
Task(vit-phase-researcher) → .planning/phases/v1.0/02-auth/02-RESEARCH.md
  ↓
read into vars: STATE, ROADMAP, REQUIREMENTS, RESEARCH, CONTEXT
  ↓
Task(vit-planner) → .planning/phases/v1.0/02-auth/02-01-PLAN.md
                  → .planning/phases/v1.0/02-auth/02-02-PLAN.md
  returns: ## PLANNING COMPLETE
  ↓ (if workflow.plan_check = true, max 3 iterations)
Task(vit-plan-checker) → ## VERIFICATION PASSED | ## ISSUES FOUND
  [if issues: send back to planner, re-check, repeat]
  ↓
Create GitHub sub-issues per plan (if gh CLI available)
Create plan branches per sub-issue
Update STATE.md with sub-issue numbers + plan branches
```

### Phase Execution Flow

```
User: /vit:execute-phase 2
  ↓
Command reads: config.json → model_profile
Command reads: STATE.md → milestone, branch mapping
Command resolves: WORK_DIR (create worktree for feature/v1.0-02-auth if needed)
Command: git pull --rebase (freshness check)
Command: check phase dependencies (warn if not complete)
Command: create draft PR on GitHub
  ↓
discover: .planning/phases/v1.0/02-auth/*-PLAN.md
group by: wave: field in frontmatter
display: wave structure to user
  ↓
Wave 1 (all parallel):
  PLAN_CONTENT=$(cat plan_01_path)
  STATE_CONTENT=$(cat STATE.md)
  Task(vit-executor, plan=01) → 02-01-SUMMARY.md (commits atomically)
  Task(vit-executor, plan=02) → 02-02-SUMMARY.md (commits atomically)
  [both complete]
  push: feature branch per wave
  ↓
Wave 2 (checkpoint plan, sequential):
  Task(vit-executor, plan=03)
    → [executes tasks 1-2]
    → [hits checkpoint:human-verify]
    → returns: ## CHECKPOINT REACHED
  Command presents checkpoint to user
  User: "approved"
  Task(vit-executor, continuation) → 02-03-SUMMARY.md
  push: feature branch
  ↓
Task(vit-test-writer) → unit tests for phase (non-blocking)
  ↓
Task(vit-verifier) → .planning/phases/v1.0/02-auth/02-VERIFICATION.md
  [status: passed | gaps_found | human_needed]
  ↓
updates: ROADMAP.md (phase → Complete)
updates: STATE.md (position, PR status → pr#9(ready))
updates: REQUIREMENTS.md (AUTH-01, AUTH-02 → Complete)
  ↓
Task(vit-doc-updater) → README.md, CHANGELOG.md (non-blocking)
push: feature branch
promote: draft PR → ready-for-review
close: GitHub feature issue
create: HANDOFF.md for next phase
```

---

## Component Boundaries

| Component | Responsibility | Does NOT Do |
|-----------|---------------|-------------|
| Commands | Orchestrate, route, update state | Implement features, write code |
| `vit-executor` | Execute PLAN.md tasks atomically | Plan, research, verify |
| `vit-planner` | Create PLAN.md files | Execute, verify, research |
| `vit-verifier` | Check codebase against must_haves | Fix gaps (creates report only) |
| `vit-plan-checker` | Check plans achieve phase goal | Plan new content |
| `vit-doc-updater` | Update `*.md` and `docs/` files | Modify `.planning/` or source code |
| STATE.md | Current position + GitHub mapping | Full history (that's PROJECT.md) |
| PROJECT.md | Requirements + decisions history | Current position (that's STATE.md) |

---

## Extension Points

### Adding a New Command

1. Create `.claude/commands/vit/<name>.md`
2. Add YAML frontmatter with `name`, `description`, `allowed-tools`
3. Body follows orchestrator pattern: read state → resolve model → spawn agents → update state

Minimal command structure:
```markdown
---
name: vit:my-command
description: What it does
allowed-tools:
  - Read
  - Bash
  - Task
---

<execution_context>
@./.claude/vit/references/ui-brand.md
</execution_context>

<process>
0. Read STATE.md and config.json
1. Resolve model profile
2. [command logic]
3. Spawn agent(s) via Task
4. Handle structured returns
5. Update STATE.md if needed
</process>
```

### Adding a New Agent

1. Create `.claude/agents/vit-<name>.md`
2. Add YAML frontmatter with `name`, `description`, `tools`, `color`
3. Body defines role, execution flow, and structured return format

Tool scope conventions:
- Research agents: `Read, Bash, Grep, Glob, WebFetch, WebSearch, mcp__context7__*`
- Execution agents: `Read, Write, Edit, Bash, Grep, Glob`
- Verification agents: `Read, Bash, Grep, Glob`
- Agents do NOT get `Task` or `AskUserQuestion`

Structured return is required — the spawning orchestrator routes on the return prefix.

Add the agent to the model profile table in `references/model-profiles.md`.

### Adding a New Optional Workflow Stage

To add a new conditional agent (like plan_check or verifier):

1. Add config key to `config.json` schema (document in `references/planning-config.md`)
2. Add model row to orchestrator's lookup table
3. Add model row to `references/model-profiles.md`
4. In the orchestrator, read config and spawn conditionally:
   ```bash
   MY_STAGE=$(cat .planning/config.json | grep '"my_stage"' | grep -o 'true\|false' || echo "true")
   if [ "$MY_STAGE" = "true" ]; then
     Task(subagent_type="vit-my-agent", ...)
   fi
   ```

### Adding a New Template

1. Create `.claude/vit/templates/<name>.md`
2. Reference in agent instructions: `Use template: ./.claude/vit/templates/<name>.md`
3. Templates define output structure — agents use them as formatting guides

### Extending config.json

Add new keys to `.planning/config.json`. Document in `references/planning-config.md`. Read with the standard bash pattern:

```bash
MY_SETTING=$(cat .planning/config.json 2>/dev/null \
  | grep -o '"my_key"[[:space:]]*:[[:space:]]*[^,}]*' \
  | grep -o 'true\|false' || echo "default")
```

---

## Conventions Developers Must Follow

### Content Inlining Before Task Calls
```bash
# CORRECT — content inlined before Task()
PLAN_CONTENT=$(cat "$WORK_DIR/path/to/plan.md")
Task(prompt="...\n\nPlan:\n${PLAN_CONTENT}")

# WRONG — @ syntax does not work across Task() boundaries
Task(prompt="Read @./path/to/plan.md and execute it")
```

### STATE.md as First Read
Every command and agent reads STATE.md as its first operation. This provides the milestone, phase position, branch mapping, and accumulated decisions needed to orient all subsequent work.

### Commit Safety Rules
- Never commit phase work to `main`
- Always check `DESIGNATED_BRANCH` from STATE.md before first commit
- Always stage files individually — never `git add .` or `git add -A`
- The branch safety check in vit-executor halts execution if about to commit to main

### WORK_DIR Propagation
When executing in a worktree (not main working directory), `WORK_DIR` is determined at the start of execute-phase and plan-phase, and passed to all spawned agents. All bash commands in agents are prefixed with `cd "$WORK_DIR" &&`.

### Non-Blocking doc/test Updates
`vit-doc-updater` and `vit-test-writer` are spawned after phase completion and are non-blocking — if they fail, execution continues. The pattern is:
```bash
Task(...doc-updater...) || log "[doc-updater failed — continuing]"
```
Critical path agents (executor, verifier) are blocking.

### Phase Namespace by Milestone
Phase directories are namespaced by milestone: `.planning/phases/v1.0/02-auth/` not `.planning/phases/02-auth/`. This prevents collision when two milestones run in parallel worktrees.

### Plan Sizing Rule
Plans are sized for 2-3 tasks and ~50% context usage. If a phase requires more work, it gets multiple plans in the same wave (parallel if no file conflicts) rather than one large plan. Preferred structure: vertical slices (user model + API + UI in one plan) over horizontal layers (all models → all APIs → all UIs).

### Graceful GitHub Degradation
All `gh` CLI calls use `|| true` or empty-string fallback. Commands work without GitHub access — PR creation, issue tracking, and branch creation are additive, not required.

---

## Hooks and Session Integration

**SessionStart hook** (`hooks/vit-check-update.cjs`): Runs on Claude Code session start. Checks npm for new vit-cc version and writes result to `~/.claude/cache/vit-update-check.json`.

**Status line** (`hooks/vit-statusline.js`): Reads session JSON from stdin, displays model name, current todo task (from `~/.claude/todos/`), directory, and context window usage as a progress bar. Reads the update cache file to show `⬆ /vit:update` indicator when a new version is available.

Both hooks are registered in `.claude/settings.json` via the install script's `mergeSettings()` function — existing settings are merged, not overwritten.

---

## Install Mechanism

vit-cc is an npm package. `src/install.js` copies four directory trees into the target project:

```
files/agents/        → .claude/agents/
files/commands/vit/  → .claude/commands/vit/
files/hooks/         → .claude/hooks/
files/vit/           → .claude/vit/
```

After copying, it merges the hooks registration into `.claude/settings.json` and optionally installs a GitHub CI workflow. The `bin/vit-cc.js` entry point exposes `npx vit-cc` for installation.

---

## Confidence Assessment

| Area | Confidence | Source |
|------|------------|--------|
| Command structure | HIGH | Read all 29 command files, especially new-project, execute-phase, plan-phase, new-milestone |
| Agent definitions | HIGH | Read all 16 agent files |
| State file schemas | HIGH | Read templates and actual .planning/ files |
| Execution flow | HIGH | Read execute-phase workflow + command in full |
| Model profile system | HIGH | Read references/model-profiles.md |
| Wave/checkpoint mechanics | HIGH | Read checkpoints.md + execute-phase.md workflow |
| Extension points | HIGH | Derived from actual file structure and conventions |
| Install mechanism | HIGH | Read src/install.js |
| GitHub integration | HIGH | Read execute-phase, new-project, new-milestone commands |
