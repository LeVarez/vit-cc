---
title: Configuration Reference
---

# Configuration Reference

VIT behavior is controlled by a single JSON file at `.planning/config.json`. This file is created by `/vit:new-project` and can be edited at any time — changes take effect on the next command run.

For how model profiles affect the agent system, see [Architecture Deep Dive](/guide/architecture).

## Location

```
.planning/config.json
```

This file lives inside `.planning/`, which is committed to git by default. All team members share the same configuration.

## Complete Schema

### Top-level fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `"yolo"` \| `"interactive"` | `"yolo"` | Controls whether checkpoints pause for user input. `"yolo"` runs fully autonomously; `"interactive"` stops at each checkpoint. |
| `depth` | `"quick"` \| `"standard"` \| `"comprehensive"` | `"standard"` | Controls plan granularity. `"quick"` produces fewer, larger tasks; `"comprehensive"` produces more atomic tasks with more verification. |
| `parallelization` | `boolean` | `true` | Enables wave-based parallel plan execution. When `true`, plans in the same wave execute simultaneously across git worktrees. When `false`, plans run sequentially. |
| `commit_docs` | `boolean` | `true` | Whether `.planning/` artifacts (SUMMARY.md, STATE.md, ROADMAP.md) are committed to git. Set to `false` for OSS contributions or client projects where planning is private. |
| `model_profile` | `"quality"` \| `"balanced"` \| `"budget"` | `"balanced"` | Which model tier mapping to use for all VIT agents. See [Model Profiles Matrix](#model-profiles-matrix). |

### `workflow` object

Controls which VIT sub-workflows run automatically during phase execution.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `workflow.research` | `boolean` | `true` | Enable the research phase when starting a new milestone. When `false`, `/vit:new-milestone` skips domain research and goes straight to requirements. |
| `workflow.plan_check` | `boolean` | `true` | Enable the plan checker (`vit-plan-checker`) before execution. When `false`, plans are executed without pre-execution quality review. |
| `workflow.verifier` | `boolean` | `true` | Enable post-execution verification (`vit-verifier`). When `false`, phases are marked complete without checking must-haves against the codebase. |

### `team` object

Controls multi-engineer collaboration features.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `team.enabled` | `boolean` | `false` | Enable team mode. When `true`, `vit-planner` distributes plans to engineers based on `roster` and file ownership. |
| `team.roster` | `array` | `[]` | Array of `{"handle": "alice", "role": "backend"}` objects. Roles: `full-stack`, `backend`, `frontend`, `devops`, `data`, `ml`. Used as hints for plan assignment. |
| `team.default_reviewer` | `string` | `""` | GitHub handle auto-assigned as PR reviewer when a phase passes verification. Leave empty to skip auto-assignment. |

## Model Profiles Matrix

The `model_profile` field maps each VIT agent to a specific Claude model tier. This is the complete mapping:

| Agent | `quality` | `balanced` | `budget` |
|-------|-----------|------------|----------|
| vit-planner | opus | opus | sonnet |
| vit-roadmapper | opus | sonnet | sonnet |
| vit-executor | opus | sonnet | sonnet |
| vit-phase-researcher | opus | sonnet | haiku |
| vit-project-researcher | opus | sonnet | haiku |
| vit-research-synthesizer | sonnet | sonnet | haiku |
| vit-debugger | opus | sonnet | sonnet |
| vit-codebase-mapper | sonnet | haiku | haiku |
| vit-verifier | sonnet | sonnet | haiku |
| vit-plan-checker | sonnet | sonnet | haiku |
| vit-integration-checker | sonnet | sonnet | haiku |

**Profile philosophy:**

- **`quality`** — Maximum reasoning power. Opus for all decision-making agents. Use when Anthropic quota is available and architecture quality matters most.
- **`balanced`** (default) — Smart allocation. Opus only for planning agents where architecture decisions happen; Sonnet for execution and research which follow explicit instructions.
- **`budget`** — Minimal Opus usage. Sonnet for code-writing agents; Haiku for read-only analysis. Use when conserving quota or running high-volume work.

**Switching profiles at runtime:**

```
/vit:set-profile quality
/vit:set-profile balanced
/vit:set-profile budget
```

This updates `model_profile` in `config.json` and takes effect on the next command run.

## Example config.json

A complete, annotated example showing all fields at common defaults:

```json
{
  "mode": "yolo",
  "depth": "standard",
  "parallelization": true,
  "commit_docs": true,
  "model_profile": "balanced",
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

**Team project example** (with reviewer auto-assignment):

```json
{
  "mode": "yolo",
  "depth": "standard",
  "parallelization": true,
  "commit_docs": true,
  "model_profile": "balanced",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  },
  "team": {
    "enabled": true,
    "roster": [
      { "handle": "alice", "role": "full-stack" },
      { "handle": "bob", "role": "backend" }
    ],
    "default_reviewer": "alice"
  }
}
```

**Private planning example** (planning docs not committed to git):

```json
{
  "mode": "yolo",
  "depth": "standard",
  "parallelization": true,
  "commit_docs": false,
  "model_profile": "budget",
  "workflow": {
    "research": false,
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

When `commit_docs` is `false`, also add `.planning/` to your `.gitignore`:

```
.planning/
```

## `commit_docs` Auto-Detection

Even if `commit_docs` is `true` in config, VIT automatically disables planning doc commits when `.planning/` is gitignored:

```bash
git check-ignore -q .planning && COMMIT_DOCS=false
```

This prevents git errors when users have `.planning/` in `.gitignore` but haven't updated `config.json`.
