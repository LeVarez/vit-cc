---
title: Agent Anatomy
---

# Agent Anatomy

A VIT agent is a Markdown file that defines the system prompt for a Claude subagent. When a command spawns an agent via `Task()`, Claude reads this file first to understand its role, then executes based on the task context it receives.

This guide walks through every part of an agent file so you can create new agents without asking for help.

## File Location

Agents live in `files/agents/`. The filename is the agent's identifier:

```
files/agents/vit-planner.md        →   spawned as vit-planner
files/agents/vit-executor.md       →   spawned as vit-executor
files/agents/vit-test-writer.md    →   spawned as vit-test-writer
```

The same file is mirrored to `.claude/agents/` when installed. Both locations are kept identical.

## Frontmatter Schema

Every agent starts with YAML frontmatter:

```yaml
---
name: vit-planner
description: Creates executable phase plans with task breakdown, dependency analysis, and goal-backward verification. Spawned by /vit:plan-phase orchestrator.
tools: Read, Write, Bash, Glob, Grep, WebFetch, mcp__context7__*
color: green
---
```

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Agent identifier (must match filename without `.md`) |
| `description` | Yes | One-liner describing purpose and which command spawns it |
| `tools` | Yes | Comma-separated list of tools the agent can use |
| `color` | No | Terminal output color (`green`, `yellow`, `blue`, etc.) |

**Tools available to agents:**
- `Read`, `Write`, `Edit` — file operations
- `Bash` — shell commands
- `Glob`, `Grep` — search
- `Task` — spawn further subagents (only for orchestrator agents)
- `WebFetch`, `mcp__context7__*` — external research

Agents that only read and write files (like `vit-verifier`) list `Read, Bash, Grep, Glob`. Agents that spawn other agents (rare) also list `Task`.

## System Prompt Structure

The body of an agent file is its system prompt. VIT agents use XML sections to organize their behavior:

| Section | Purpose |
|---------|---------|
| `<role>` | One-paragraph identity statement: who you are, who spawns you, your job |
| `<philosophy>` | Principles and mindset that govern decisions |
| `<execution_flow>` | Step-by-step process using `<step>` elements |
| `<success_criteria>` | Checklist of completion conditions |
| Domain-specific sections | Extra sections for complex domains (e.g., `<task_breakdown>`, `<goal_backward>`) |

### role Section

```xml
<role>
You are a VIT planner. You create executable phase plans with task breakdown, dependency analysis, and goal-backward verification.

You are spawned by:

- `/vit:plan-phase` orchestrator (standard phase planning)
- `/vit:plan-phase --gaps` orchestrator (gap closure planning from verification failures)

Your job: Produce PLAN.md files that Claude executors can implement without interpretation.
</role>
```

Keep the role section short (4–8 sentences). State clearly:
1. What you are (your identity)
2. Who spawns you (which command(s))
3. Your primary job (one sentence)

### philosophy Section

The philosophy section shapes how the agent makes decisions when the task underspecifies something:

```xml
<philosophy>

## Plans Are Prompts

PLAN.md is NOT a document that gets transformed into a prompt.
PLAN.md IS the prompt. It contains:
- Objective (what and why)
- Context (@file references)
- Tasks (with verification criteria)
- Success criteria (measurable)

When planning a phase, you are writing the prompt that will execute it.

## Ship Fast

No enterprise process. No approval gates.
Plan -> Execute -> Ship -> Learn -> Repeat

Anti-enterprise patterns to avoid:
- Team structures, RACI matrices
- Sprint ceremonies
- Human dev time estimates
</philosophy>
```

### execution_flow Section

The execution flow is the step-by-step process using `<step>` XML elements:

```xml
<execution_flow>

<step name="load_project_state" priority="first">
Read `.planning/STATE.md` and parse:
- Current position (which phase we're planning)
- Accumulated decisions (constraints on this phase)
- Pending todos (candidates for inclusion)

```bash
cat .planning/STATE.md
```

If STATE.md missing but .planning/ exists, offer to reconstruct or continue without.
</step>

<step name="identify_phase">
Check roadmap and existing phases:

```bash
cat .planning/ROADMAP.md
ls .planning/phases/
```

Read any existing PLAN.md in the phase directory.
</step>

</execution_flow>
```

**Step naming:** Use lowercase-hyphenated names (`load_project_state`, `gather_phase_context`). Mark first-run steps with `priority="first"`.

### success_criteria Section

End with a checklist:

```xml
<success_criteria>

- [ ] STATE.md read, project history absorbed
- [ ] Dependency graph built (needs/creates for each task)
- [ ] PLAN file(s) exist with valid frontmatter
- [ ] Each plan committed to git
- [ ] User knows next steps

</success_criteria>
```

## How Commands Spawn Agents

Commands spawn agents using the `Task()` tool. The pattern always follows this structure:

```
Task(
  prompt="First, read ./.claude/agents/{agent-name}.md for your role and instructions.\n\n{task_context}",
  subagent_type="general-purpose",
  model="{resolved_model}",
  description="Brief description for UI"
)
```

The `subagent_type` field controls model routing (see below). The `prompt` always begins with the instruction to read the agent's own `.md` file — this loads its role and behavior before the task context arrives.

**Why read the file first?** The agent file contains the full system prompt. Claude needs to read it to understand its role before tackling the task. The `@`-reference syntax cannot pre-load files into a spawned agent's context.

## subagent_type and Model Profiles

The `subagent_type` field in `Task()` maps to a model tier. VIT supports three model profiles configured in `.planning/config.json`:

| Profile | Use |
|---------|-----|
| `quality` | Best model for critical tasks (opus) |
| `balanced` | Good quality/cost ratio (sonnet) — default |
| `budget` | Fastest, cheapest (haiku) |

Each command has a lookup table that maps agent names to models per profile:

```
# From plan-phase.md:
| Agent             | quality | balanced | budget |
|-------------------|---------|----------|--------|
| vit-planner       | opus    | opus     | sonnet |
| vit-plan-checker  | sonnet  | sonnet   | haiku  |

# From execute-phase.md:
| Agent             | quality | balanced | budget |
|-------------------|---------|----------|--------|
| vit-executor      | opus    | sonnet   | sonnet |
| vit-verifier      | sonnet  | sonnet   | haiku  |
```

The command reads `config.json`, resolves the model from the lookup table, and passes it as the `model` parameter to `Task()`.

When `subagent_type` matches a registered agent name (e.g., `"vit-plan-checker"`), Claude uses the specific model profile for that agent type. For general-purpose agents, use `"general-purpose"` and pass the resolved model explicitly.

## Structured Returns

Agents communicate back to their orchestrator through structured return messages. By convention:

```markdown
## PLANNING COMPLETE

**Phase:** {phase-name}
**Plans:** {N} plan(s) in {M} wave(s)

### Plans Created

| Plan | Objective | Tasks | Files |
|------|-----------|-------|-------|
| {phase}-01 | [brief] | 2 | [files] |
```

Return headers follow the pattern `## {STATUS}` (e.g., `## PLANNING COMPLETE`, `## RESEARCH BLOCKED`, `## CHECKPOINT REACHED`). The orchestrator parses these headers to route its next action.

**Always return a structured message.** The orchestrator cannot proceed without knowing your status.

## Walkthrough: vit-planner.md

Let's trace through `vit-planner.md` — the most complex VIT agent.

### Role and identity

```yaml
---
name: vit-planner
description: Creates executable phase plans with task breakdown, dependency analysis, and goal-backward verification. Spawned by /vit:plan-phase orchestrator.
tools: Read, Write, Bash, Glob, Grep, WebFetch, mcp__context7__*
color: green
---
```

```xml
<role>
You are a VIT planner. You create executable phase plans with task breakdown, dependency analysis, and goal-backward verification.

You are spawned by:
- `/vit:plan-phase` orchestrator (standard phase planning)
- `/vit:plan-phase --gaps` orchestrator (gap closure planning)
- `/vit:plan-phase` orchestrator in revision mode

Your job: Produce PLAN.md files that Claude executors can implement without interpretation.
Plans are prompts, not documents that become prompts.
</role>
```

The role section establishes identity up front. Note that it lists all the ways this agent can be spawned — this matters because the orchestrator passes different context depending on the mode.

### Philosophy section

The planner's philosophy section covers four key principles:

1. **Solo Developer + Claude Workflow** — Planning for one person and one implementer, no enterprise process
2. **Team Mode** — When `assigned_to` is set, plans get engineer owners
3. **Plans Are Prompts** — PLAN.md is the execution prompt itself
4. **Quality Degradation Curve** — Plans should complete within ~50% context to avoid quality loss

These principles directly affect decisions: for example, when the planner must choose between one large plan or two smaller ones, the Quality Degradation Curve principle says: split it.

### Domain-specific sections

The planner has several domain-specific sections beyond the standard structure:

**`<task_breakdown>`** — How to decompose work into tasks. Defines the four required fields (`<files>`, `<action>`, `<verify>`, `<done>`), task types (`auto`, `checkpoint:*`), and sizing rules (15–60 minutes per task).

**`<dependency_graph>`** — How to build the dependency graph and assign execution waves. Vertical slices vs horizontal layers. File ownership for parallel execution.

**`<goal_backward>`** — The goal-backward methodology: start from the outcome, derive observable truths, required artifacts, and key links. This produces the `must_haves` frontmatter that the verifier checks.

**`<plan_format>`** — The exact PLAN.md template with all frontmatter fields documented.

**`<gap_closure_mode>`** — What to do when spawned with `--gaps`: read VERIFICATION.md, cluster gaps, create fix plans.

**`<revision_mode>`** — What to do when spawned with checker feedback: make targeted edits, not full rewrites.

### execution_flow

The planner's execution flow has 10 steps:

```xml
<step name="load_project_state" priority="first">
Read STATE.md, parse current position and decisions.
Load config.json for COMMIT_PLANNING_DOCS setting.
</step>

<step name="identify_phase">
Check roadmap. If --gaps flag, switch to gap_closure_mode.
</step>

<step name="break_into_tasks">
Decompose phase into tasks. Think dependencies first.
For each task: what does it NEED? what does it CREATE?
</step>

<step name="write_phase_prompt">
Write PLAN.md files to disk. Each file is an executable prompt.
</step>

<step name="git_commit">
Commit plan files if COMMIT_PLANNING_DOCS=true.
</step>
```

### Structured returns

The planner returns one of four structured messages:

- `## PLANNING COMPLETE` — plans written and committed
- `## CHECKPOINT REACHED` — needs user input on a decision
- `## PLANNING INCONCLUSIVE` — couldn't determine correct approach
- `## REVISION COMPLETE` — updated plans based on checker feedback

Each return includes enough context for the orchestrator to route its next action correctly.

## Creating a New Agent

### When to create a new agent

Create a new agent when:
- A command needs to delegate work that would fill its context window
- A specific domain of expertise should be isolated (research, verification, testing)
- The same work is delegated by multiple commands

### Agent template

```markdown
---
name: vit-my-agent
description: Does X. Spawned by /vit:my-command.
tools: Read, Write, Bash, Glob, Grep
color: blue
---

<role>
You are a VIT {role}. You {primary job}.

You are spawned by `/vit:my-command`.

Your job: {one sentence describing your job and output}.
</role>

<philosophy>

## {Key Principle 1}

{Explanation and implications}

## {Key Principle 2}

{Explanation and implications}

</philosophy>

<execution_flow>

<step name="load_context" priority="first">
{First step — always load project state}

```bash
cat .planning/STATE.md
```
</step>

<step name="do_the_work">
{Core work steps}
</step>

<step name="write_output">
{Write files, commit}
</step>

<step name="return">
Return structured result to orchestrator.
</step>

</execution_flow>

<success_criteria>

- [ ] Context loaded
- [ ] Work completed
- [ ] Output written and committed
- [ ] Structured return sent to orchestrator

</success_criteria>
```

### Wiring the new agent to a command

In your command file, add a Task() call:

```bash
# In the command's process section, gather context first
CONTEXT_CONTENT=$(cat "$WORK_DIR/relevant-file.md" 2>/dev/null)
STATE_CONTENT=$(cat "$WORK_DIR/.planning/STATE.md")
```

```
Task(
  prompt="First, read ./.claude/agents/vit-my-agent.md for your role and instructions.\n\n<context>\n{context_content}\n</context>\n\nWorking directory: {work_dir}\nAll git commands must be prefixed with: cd {work_dir} &&",
  subagent_type="general-purpose",
  model="{resolved_model}",
  description="My agent task description"
)
```

Add the agent to the command's model lookup table:

```
| Agent           | quality | balanced | budget |
|-----------------|---------|----------|--------|
| vit-my-agent    | sonnet  | sonnet   | haiku  |
```

### Registration

Drop the file in `files/agents/` and mirror to `.claude/agents/`. No registry to update.

## Contributor Checklist

To create a new VIT agent:

- [ ] Create `files/agents/vit-your-agent.md`
- [ ] Add frontmatter: `name`, `description`, `tools`, `color`
- [ ] Write `<role>`: who you are, who spawns you, your job
- [ ] Write `<philosophy>`: key principles that govern decisions
- [ ] Write `<execution_flow>`: step-by-step with `<step>` elements
- [ ] First step loads STATE.md (or relevant context)
- [ ] Last step returns a structured message
- [ ] Write `<success_criteria>`: completion checklist
- [ ] Wire the agent into a command (Task() call + model lookup entry)
- [ ] Mirror to `.claude/agents/vit-your-agent.md`
- [ ] Write a test in `tests/phases/` verifying key patterns exist

## Related

- [Command Anatomy](/contributing/command-anatomy) — create the commands that spawn your agent
- [Testing](/contributing/testing) — write tests for your agent
