---
title: Workflow Files
---

# Workflow Files

Workflow files define the step-by-step procedures that VIT agents follow. They are the "how-to" for each operation — where orchestration logic, deviation rules, and commit protocols live.

---

## Purpose

A workflow file is a procedural document that an agent reads and executes. When you run `/vit:execute-phase`, the command file tells the orchestrator *what* to do; the workflow file `execute-phase.md` tells it *how* to do each step in detail.

Workflows are kept separate from command definitions so that:
- Commands stay lean (define intent, spawn agents)
- Workflows contain all the implementation detail (step logic, error handling, edge cases)
- Multiple commands can reference the same workflow

---

## Location

All workflow files live in `files/vit/workflows/`. The path inside a project is `.claude/vit/workflows/`.

| File | Purpose |
|------|---------|
| `execute-phase.md` | Wave-based parallel execution of all plans in a phase |
| `execute-plan.md` | Execute a single PLAN.md, create SUMMARY.md, handle checkpoints |
| `verify-phase.md` | Goal-backward verification against must_haves |
| `verify-work.md` | Conversational UAT session with persistent state in UAT.md |
| `discuss-phase.md` | Extract implementation decisions before planning begins |
| `discovery-phase.md` | Shallow research for library and option decisions |
| `complete-milestone.md` | Archive a shipped version, tag release, update MILESTONES.md |
| `transition.md` | Move a phase from planning state to ready-to-execute |
| `resume-project.md` | Restore session context when returning to an existing project |
| `map-codebase.md` | Spawn parallel agents to build structured codebase documentation |
| `diagnose-issues.md` | Orchestrate parallel debug agents to find root causes |
| `list-phase-assumptions.md` | Surface Claude's planning assumptions before execution |

---

## @-Referencing

Workflows are included in agent execution context via `@` syntax in command files and PLAN.md files:

```
<execution_context>
@./.claude/vit/workflows/execute-plan.md
@./.claude/vit/templates/summary.md
@./.claude/vit/references/checkpoints.md
</execution_context>
```

Claude Code resolves `@`-references at prompt assembly time. The content of the referenced file is inlined into the context before the agent runs.

This works in command files and PLAN.md execution contexts, but **not across `Task()` boundaries**. When the execute-phase orchestrator spawns subagents via `Task()`, it cannot use `@` syntax — it must read file contents and inline them explicitly:

```bash
WORKFLOW_CONTENT=$(cat "$WORK_DIR/.claude/vit/workflows/execute-plan.md")
# Then pass $WORKFLOW_CONTENT in the Task() prompt
```

---

## Step Naming

Workflows use `<step name="...">` XML tags to define discrete, named operations. This makes workflows scannable and allows documentation to reference specific steps by name.

```xml
<step name="load_project_state">
Read STATE.md before any operation...
</step>

<step name="discover_plans">
List all plans and extract metadata...
</step>

<step name="execute_waves">
Execute each wave in sequence...
</step>
```

Steps have a natural execution order (top to bottom), but can have a `priority="first"` attribute to signal that a step must run before others regardless of position:

```xml
<step name="resolve_model_profile" priority="first">
Read model profile for agent spawning...
</step>
```

---

## Example Structure

Here is a simplified version of `execute-plan.md` to illustrate the pattern:

```xml
<purpose>
Execute a phase prompt (PLAN.md) and create the outcome summary (SUMMARY.md).
</purpose>

<required_reading>
Read STATE.md before any operation to load project context.
@./.claude/vit/references/git-integration.md
</required_reading>

<process>

<step name="record_start_time">
Record execution start time for performance tracking:

  PLAN_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  PLAN_START_EPOCH=$(date +%s)
</step>

<step name="execute">
Execute each task in the prompt.

For each task:
  - If type="auto": implement, verify, commit, continue
  - If type="checkpoint:*": STOP, return structured state to orchestrator
</step>

<step name="create_summary">
Create {phase}-{plan}-SUMMARY.md using the summary template.
Include: accomplishments, decisions, deviations, files modified.
</step>

</process>

<success_criteria>
- All tasks executed
- Each task committed individually
- SUMMARY.md created
- STATE.md updated
</success_criteria>
```

**Key sections in a workflow file:**

- `<purpose>` — One-sentence description of what this workflow does
- `<required_reading>` — Files the agent must read before starting (loaded via `@` or bash)
- `<process>` — The ordered sequence of `<step>` blocks
- `<success_criteria>` — Checkable completion criteria

---

## Adding a New Workflow

If you need to add a new workflow:

1. Create `files/vit/workflows/your-workflow.md`
2. Add a `<purpose>` block and a `<process>` section with named steps
3. Reference it from the relevant command file via `@./.claude/vit/workflows/your-workflow.md` in the `<execution_context>` block
4. Or reference it from a PLAN.md `<execution_context>` section if it's plan-specific

Workflow files are plain Markdown with XML block structure. There is no compilation step.
