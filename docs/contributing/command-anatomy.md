---
title: Command Anatomy
---

# Command Anatomy

A VIT command is a Markdown file that defines what an orchestrator does when a user types `/vit:command-name`. This guide walks you through every part of a command file so you can create new commands without asking for help.

## File Location

Commands live in `files/commands/vit/`. The filename becomes the command name:

```
files/commands/vit/plan-phase.md    →   /vit:plan-phase
files/commands/vit/new-project.md   →   /vit:new-project
files/commands/vit/execute-phase.md →   /vit:execute-phase
```

VIT uses file-based registration — dropping a Markdown file in this directory is all you need. No config files, no manifests.

The same file is mirrored to `.claude/commands/vit/` when installed. Both locations are kept identical.

## Frontmatter Schema

Every command starts with YAML frontmatter:

```yaml
---
name: vit:plan-phase
description: Create detailed execution plan for a phase (PLAN.md) with verification loop
argument-hint: "[phase] [--research] [--skip-research] [--gaps] [--skip-verify]"
agent: vit-planner
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebFetch
  - mcp__context7__*
---
```

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | The slash-command name (e.g., `vit:plan-phase`) |
| `description` | Yes | Short description shown in `/vit:help` |
| `argument-hint` | No | Shown as usage hint (e.g., `[phase] [--flag]`) |
| `agent` | No | Primary agent this command spawns (informational) |
| `allowed-tools` | Yes | Tools the orchestrator can use. Wildcards supported (`mcp__context7__*`) |

**Tool selection principle:** Include only what the orchestrator itself needs. Agents it spawns declare their own tools in their own files.

## Execution Context

After frontmatter, commands can reference shared resources with the `@` syntax:

```markdown
<execution_context>
@./.claude/vit/references/ui-brand.md
@./.claude/vit/workflows/execute-phase.md
</execution_context>
```

These files are loaded into the command's context before execution begins. Use this for:
- **UI brand guidelines** — consistent output formatting
- **Workflow files** — complex multi-step logic shared across commands
- **Reference docs** — patterns the orchestrator must follow

The `@` syntax works within a command's own context but does **not** cross Task() boundaries. Context passed to spawned agents must be inlined explicitly (read the file contents into a variable, then embed in the prompt string).

## Objective Section

Every command has a short `<objective>` that answers "what does this command do and why?":

```markdown
<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Orchestrator role:** Parse arguments, validate phase, research domain (unless skipped or exists), spawn vit-planner agent, verify plans with vit-plan-checker, iterate until plans pass or max iterations reached, present results.

**Why subagents:** Research and planning burn context fast. Verification uses fresh context. User sees the flow between agents in main context.
</objective>
```

Keep it to 3–5 sentences. Focus on _why_ not _what_.

## Context Section

The `<context>` section tells the orchestrator what runtime data to load:

```markdown
<context>
Phase number: $ARGUMENTS (optional - auto-detects next unplanned phase if not provided)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research entirely, go straight to planning

@.planning/ROADMAP.md
@.planning/STATE.md
</context>
```

`$ARGUMENTS` is the text the user typed after the command name. Parse it in your process steps.

## Process Sections

The `<process>` block is the orchestrator's step-by-step workflow. Commands use numbered headings:

Process section structure (the actual content lives unescaped in the command file):

```
<process>

## 1. Validate Environment

  Run: ls .planning/ 2>/dev/null

  If not found: Error — user should run /vit:new-project first.

## 2. Parse Arguments

  Extract from $ARGUMENTS:
  - Phase number (integer or decimal like 2.1)
  - --research flag to force re-research
  - --skip-research flag to skip research

## 3. Spawn Agent

  Task(
    prompt="First, read ./.claude/agents/vit-planner.md for your role...\n\n{filled_prompt}",
    subagent_type="general-purpose",
    model="{planner_model}",
    description="Plan Phase {phase}"
  )

## 4. Handle Agent Return

  ## PLANNING COMPLETE: Display result, proceed to step 5
  ## CHECKPOINT REACHED: Present to user, spawn continuation agent

</process>
```

**Step naming conventions:**
- Start each step with an action verb: "Validate", "Spawn", "Handle", "Collect"
- Number steps at the `##` heading level
- Sub-steps within a numbered step use `###`

## Orchestrator vs Agent: Who Does What

Commands are **orchestrators**. They:
- Parse user arguments
- Validate the environment
- Read context files and inline their content
- Spawn agents via `Task()` with inlined context
- Present results to the user
- Handle agent returns (success/failure/checkpoint)

Agents do the actual work — reading the codebase, writing files, running builds. The orchestrator stays thin.

**Why this separation?** Research and execution burn through context quickly. Spawning a fresh agent gives each task a full context window with no accumulated history. The orchestrator keeps ~15% of its own context for coordination.

For creating commands that spawn agents, see [Agent Anatomy](/contributing/agent-anatomy).

## Walkthrough: plan-phase.md

Let's trace through `plan-phase.md` step by step.

### Frontmatter

```yaml
---
name: vit:plan-phase
description: Create detailed execution plan for a phase (PLAN.md) with verification loop
argument-hint: "[phase] [--research] [--skip-research] [--gaps] [--skip-verify]"
agent: vit-planner
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebFetch
  - mcp__context7__*
---
```

`Task` is listed because this command spawns subagents. `WebFetch` and `mcp__context7__*` are available for any research the orchestrator itself needs to do before spawning.

### Step 1: Validate and resolve model profile

The command checks `.planning/` exists, then reads `config.json` to determine which Claude model tier to use:

```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null \
  | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

The model lookup table maps agent names to model tiers:

| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| vit-planner | opus | opus | sonnet |
| vit-plan-checker | sonnet | sonnet | haiku |

This pattern — resolve profile early, store resolved models in variables, use them in all Task() calls — appears in every command that spawns agents.

### Step 1.5: Determine WORK_DIR

VIT supports git worktrees for parallel execution. The orchestrator finds (or creates) the correct worktree for the phase by looking up the designated feature branch in STATE.md:

```bash
DESIGNATED_BRANCH=$(grep "| ${MILESTONE}/${PHASE_NUM} " .planning/STATE.md 2>/dev/null \
  | grep -o 'feature/[^ |]*' | head -1)
MAIN_WORKTREE=$(git worktree list --porcelain | head -1 | sed 's/worktree //')
```

All subsequent bash commands prefix with `cd "$WORK_DIR" &&`. All file reads use `$WORK_DIR` as base. `WORK_DIR` is passed to every spawned agent in its prompt.

### Step 5: Spawn vit-phase-researcher

When research is needed, the orchestrator gathers context and spawns a researcher agent. Context files must be read into variables because `@` syntax does not cross Task() boundaries:

```bash
PHASE_DESC=$(grep -A3 "Phase ${PHASE}:" .planning/ROADMAP.md)
REQUIREMENTS=$(cat .planning/REQUIREMENTS.md 2>/dev/null | head -50)
DECISIONS=$(grep -A20 "### Decisions Made" .planning/STATE.md 2>/dev/null)
```

Then spawns with inlined content:

```
Task(
  prompt="First, read ./.claude/agents/vit-phase-researcher.md for your role and instructions.\n\n<objective>\nResearch how to implement Phase {phase}...\n</objective>\n\n<context>\n**Phase description:**\n{phase_desc}\n\n**Prior decisions:**\n{decisions}\n</context>",
  subagent_type="general-purpose",
  model="{researcher_model}",
  description="Research Phase {phase}"
)
```

**Key pattern:** Agents always read their own `.md` file first (`read ./.claude/agents/vit-phase-researcher.md`). This loads the agent's role, philosophy, and execution flow. Content that would normally use `@` references is manually inlined because `@` does not cross Task() boundaries.

### Steps 8–12: Planner + checker verification loop

The command spawns `vit-planner`, then `vit-plan-checker`, then loops up to 3 times if issues are found. This verification loop is built into the command, not the agent — the orchestrator owns the retry logic.

After plans pass, the command creates GitHub sub-issues (if `gh` CLI is available) and presents the final status to the user.

### offer_next section

Commands end with `<offer_next>` — what to display after success. The content is rendered directly to the user as Markdown, not in a code block:

```markdown
<offer_next>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► PHASE {X} PLANNED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {X}: {Name}** — {N} plan(s) in {M} wave(s)

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1    | 01, 02 | [objectives] |

/vit:execute-phase {X}
</offer_next>
```

Use the stage banner style (lines of `━`) from `ui-brand.md`.

## Command Patterns

### Simple Command (no agent spawning)

Some commands do their work inline without spawning agents. Use this when the work fits in the orchestrator's context window.

Frontmatter:

```yaml
---
name: vit:add-todo
description: Add a todo item to the planning state
allowed-tools:
  - Read
  - Write
  - Bash
---
```

Then in the body, the process section (plain text, not in a code fence):

```
<objective>
Add a todo item to STATE.md Pending Todos section.
</objective>

<process>

## 1. Read current STATE.md

  Run: cat .planning/STATE.md

## 2. Parse and update

  Locate the "Pending Todos" section and append the new item.
  Write the updated file.

## 3. Confirm

  Display the added todo to the user.

</process>
```

### Orchestrator Command (spawns agents)

When work requires deep focus or burns through context quickly, delegate to agents.

Frontmatter:

```yaml
---
name: vit:my-command
description: Do something complex
allowed-tools:
  - Read
  - Bash
  - Task
---
```

Process section:

```
<process>

## 1. Resolve model profile

  Run: MODEL_PROFILE=$(cat .planning/config.json | grep model_profile || echo "balanced")

## 2. Gather context (inline — @-syntax won't cross Task boundary)

  STATE_CONTENT=$(cat "$WORK_DIR/.planning/STATE.md")
  RELEVANT_FILE=$(cat "$WORK_DIR/path/to/relevant-file.md" 2>/dev/null)

## 3. Spawn agent

  Task(
    prompt="First, read ./.claude/agents/my-agent.md for your role.\n\n{state_content}\n{relevant_file}",
    subagent_type="general-purpose",
    model="{resolved_model}",
    description="Do the thing"
  )

## 4. Handle return

  ## COMPLETE: Display results, offer next steps.
  ## BLOCKED: Present blocker to user.

</process>
```

### Commands with Flags

Parse `$ARGUMENTS` to support flags:

```bash
# Extract phase number and flags
PHASE_NUM=$(echo "$ARGUMENTS" | grep -o '^[0-9]*')
FORCE_RESEARCH=false
SKIP_VERIFY=false
for arg in $ARGUMENTS; do
  case "$arg" in
    --research) FORCE_RESEARCH=true ;;
    --skip-verify) SKIP_VERIFY=true ;;
  esac
done
```

## Registration

Creating a command file is all that is needed for registration. The VIT installer copies files from `files/commands/vit/` to `.claude/commands/vit/`. Claude picks up commands automatically from `.claude/commands/`.

There is no registry file to update.

## success_criteria Section

End commands with a checklist of completion conditions:

```markdown
<success_criteria>
- [ ] .planning/ directory validated
- [ ] Phase validated against roadmap
- [ ] Agent spawned with complete context
- [ ] User knows next steps
</success_criteria>
```

This both documents intent and gives reviewers a checklist.

## Contributor Checklist

To create a new VIT command:

- [ ] Create `files/commands/vit/your-command.md`
- [ ] Add frontmatter: `name`, `description`, `allowed-tools`
- [ ] Write `<objective>`: 3–5 sentences on what and why
- [ ] Add `<context>`: document `$ARGUMENTS` flags, reference files with `@`
- [ ] Write `<process>`: numbered steps with bash commands and conditionals
- [ ] If spawning agents: resolve model profile, inline context, prefix prompt with agent read instruction
- [ ] Add `<offer_next>`: show the user what to do next
- [ ] Add `<success_criteria>`: list observable completion conditions
- [ ] Mirror to `.claude/commands/vit/your-command.md`
- [ ] Write a test in `tests/phases/` verifying key patterns exist

## Related

- [Agent Anatomy](/contributing/agent-anatomy) — create the agents your command spawns
- [Testing](/contributing/testing) — write tests for your command
