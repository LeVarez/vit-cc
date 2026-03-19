---
title: Templates and References
---

# Templates and References

VIT uses two types of static files that agents consult during execution: **templates** and **references**. They look similar — both live in `files/vit/` — but serve different purposes.

---

## Templates vs References

**Templates** are document skeletons. An agent reads a template and uses it to create a new file. The template defines structure and required sections; the agent fills in the content.

Example: When an executor finishes a plan, it reads `summary.md` template and creates a populated `02-02-SUMMARY.md` with the actual tasks completed, decisions made, and files modified.

**References** are static knowledge bases. An agent reads a reference to make decisions or produce correct output. References are never modified by agents — they are authoritative sources that agents consult.

Example: When the execute-phase orchestrator renders checkpoint output, it reads `ui-brand.md` to know the exact box width, symbol set, and banner format to use.

---

## Template Location

All templates live in `files/vit/templates/`. Inside a project: `.claude/vit/templates/`.

| Template | Creates | Purpose |
|----------|---------|---------|
| `summary.md` | `{phase}-{plan}-SUMMARY.md` | Plan completion documentation |
| `state.md` | `.planning/STATE.md` | Project living memory |
| `roadmap.md` | `.planning/ROADMAP.md` | Phase goals and completion status |
| `project.md` | `.planning/PROJECT.md` | Core value, constraints, key decisions |
| `requirements.md` | `.planning/REQUIREMENTS.md` | Checkable requirements with phase mapping |
| `phase-prompt.md` | `{phase}-{plan}-PLAN.md` | Executable plan structure |
| `verification-report.md` | `{phase}-VERIFICATION.md` | Phase goal verification results |
| `context.md` | `{phase}-CONTEXT.md` | Implementation decisions for a phase |
| `handoff.md` | `HANDOFF.md` | Cross-phase handoff notes |
| `discovery.md` | `DISCOVERY.md` | Shallow research output |
| `research.md` | `{phase}-RESEARCH.md` | Deep research before planning |
| `continue-here.md` | `.continue-here.md` | Resume state for interrupted plans |
| `UAT.md` | `{phase}-UAT.md` | Persistent UAT session tracking |
| `user-setup.md` | `{phase}-USER-SETUP.md` | Human-required configuration |
| `milestone.md` | `MILESTONES.md` entry | Milestone completion record |
| `milestone-archive.md` | Milestone archive files | Historical archive per shipped version |
| `ONBOARDING.md` | Project onboarding guide | New engineer / new session orientation |
| `DEBUG.md` | Debug session tracking | Active debug investigation |

### Consumption Pattern

Agents reference templates when creating new documents:

```xml
<step name="create_summary">
Create {phase}-{plan}-SUMMARY.md.
Use ./.claude/vit/templates/summary.md for structure.
</step>
```

The agent reads the template, then writes a new file with the template's section headings and the execution-specific content filled in.

---

## Reference Location

All references live in `files/vit/references/`. Inside a project: `.claude/vit/references/`.

| Reference | Purpose |
|-----------|---------|
| `ui-brand.md` | ASCII art patterns, checkpoint boxes, status symbols, banner format |
| `model-profiles.md` | Agent-to-model mapping for quality / balanced / budget profiles |
| `checkpoints.md` | Full checkpoint handling guide: when to stop, what to return, continuation patterns |
| `git-integration.md` | Commit message conventions, staging rules, branch naming |
| `continuation-format.md` | Standard format for "Next Up" blocks after command completion |
| `verification-patterns.md` | Code patterns for checking artifact existence, substance, and wiring |
| `tdd.md` | Test-driven development plan structure and execution cycle |
| `planning-config.md` | `.planning/config.json` schema and behavior flags |
| `questioning.md` | Discovery questioning patterns for new-project initialization |

### Consumption Pattern

Agents reference references when making decisions that require authoritative information:

```
<execution_context>
@./.claude/vit/references/ui-brand.md
@./.claude/vit/workflows/execute-phase.md
</execution_context>
```

The reference is loaded at execution time. Agents do not modify references — if an agent produces terminal output, it reads `ui-brand.md` to know what format to use; if it needs to spawn agents, it reads `model-profiles.md` to know which model to assign.

---

## Spotlight: ui-brand.md

`ui-brand.md` is the single source of truth for all terminal output formatting. It defines:

**Stage banners** — used at major workflow transitions:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► EXECUTING WAVE 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Checkpoint boxes** — 62-character width, exact box-drawing characters:
```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Verification Required                           ║
╚══════════════════════════════════════════════════════════════╝
```

**Status symbols** — a fixed set used consistently across all output:
```
✓  Complete / Passed / Verified
✗  Failed / Missing / Blocked
◆  In Progress
○  Pending
⚡ Auto-approved
⚠  Warning
```

**Progress display** — block character progress bars:
```
Progress: ████████░░ 80%
```

Any agent that produces user-facing terminal output loads `ui-brand.md` to stay consistent with this visual language. The anti-patterns section explicitly lists things to avoid: varying box widths, random emoji, missing `VIT ►` prefix.

---

## Spotlight: model-profiles.md

`model-profiles.md` defines which Claude model each agent runs under each profile. Orchestrators read this reference before spawning subagents:

```bash
MODEL_PROFILE=$(cat .planning/config.json | grep model_profile | ...)
# → "balanced"

# Then look up in the table:
# vit-executor + balanced → sonnet
# vit-planner + balanced → opus
```

The reference also explains the design rationale for each assignment — why the planner uses Opus in balanced mode, why the codebase mapper uses Haiku in all profiles.

---

## Spotlight: continuation-format.md

`continuation-format.md` defines the "Next Up" block that every command renders after completion. This ensures consistent handoff formatting:

```
───────────────────────────────────────────────────────────────

## ▶ Next Up

**Phase 3: Core Features** — User dashboard and settings

`/vit:plan-phase 3`

<sub>`/clear` first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- `/vit:verify-work 2` — manual acceptance testing first
```

The reference includes variants for different scenarios (next plan, next phase, milestone complete) and anti-patterns to avoid (command-only output with no context, missing `/clear` explanation).
