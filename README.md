```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   VIT ►  Phase-based project execution for Claude Code       ║
║                                                              ║
║   Plan  →  Execute  →  Verify  →  Merge                      ║
║   Atomic commits · Parallel agents · GitHub CI feedback      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

Phase-based project execution framework for Claude Code — with GitHub integration.

---

## What is VIT?

VIT is a Claude Code workflow framework. It installs as slash commands, specialist agents, and session hooks directly into your `.claude/` directory.

The core loop:

```
/vit:new-project  ->  /vit:plan-phase  ->  /vit:execute-phase  ->  /vit:verify-work
```

Each phase produces **atomic commits** on a feature branch, updates a `STATE.md` tracker, and optionally posts CI results back to the linked GitHub issue. **Parallel agents** handle research, planning, execution, testing, docs, and review simultaneously. When context fills up, `/vit:pause-work` creates a handoff document so the next session resumes exactly where you left off.

**State survives context resets.** All decisions, progress, and phase context live in `.planning/` files — not in Claude's memory.

---

## Install

```bash
npx vit-claude
```

What gets installed:

- 16 specialist agents (`.claude/agents/vit-*.md`)
- 31 slash commands (`.claude/commands/vit/*.md`)
- 2 session hooks (`vit-check-update.cjs`, `vit-statusline.js`)
- Core references, templates, workflows (`.claude/vit/`)
- GitHub CI workflow (`.github/workflows/phase-ci.yml`) — opt-in
- Hook registrations in `.claude/settings.json`

Run `npx vit-claude` again at any time to update. Your `.planning/` data is never touched.

---

## Quick Start

**1. Initialize your project**

```
/vit:new-project
```

Claude gathers deep context through adaptive questioning, then produces `PROJECT.md` + a phased `ROADMAP.md`.

**2. Plan a phase**

```
/vit:plan-phase 1
```

Spawns a researcher and planner in parallel. Produces a `PLAN.md` with task breakdown, wave assignments, and verification criteria. A plan checker validates it before you execute.

**3. Execute the plan**

```
/vit:execute-phase 1
```

Spawns parallel executor agents per wave. Each task gets an atomic commit. After all waves complete: integration check, test generation, and doc update run automatically. Results push to your feature branch and CI posts to the linked GitHub issue.

**4. Verify the work**

```
/vit:verify-work 1
```

A verifier agent runs goal-backward analysis and produces `VERIFICATION.md`. If all criteria pass, the draft PR is promoted to ready and a PR reviewer posts inline comments.

---

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► COMMANDS REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Commands Reference

31 commands organized into 11 groups. Each command is a slash command invoked as `/vit:<name>`.

<!-- COMMANDS_PLACEHOLDER -->

---

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► AGENTS REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Agents Reference

VIT spawns 16 specialist agents automatically — you don't invoke them directly.

<!-- AGENTS_PLACEHOLDER -->

---

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► SETTINGS REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Settings Reference

VIT is configured through `.planning/config.json` in your project root. All settings are optional — defaults work out of the box.

<!-- SETTINGS_PLACEHOLDER -->

---

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► GITHUB CI INTEGRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## GitHub CI Integration

`phase-ci.yml` triggers automatically on every push to `feature/**`, `milestone/**`, and `quick/**` branches.

**How it finds your issue:**

Branch names follow the pattern `feature/v1.6-01-api-foundation`. The workflow extracts the milestone and phase number, then looks up the corresponding GitHub issue number from `.planning/STATE.md`. No manual linking needed.

**What it posts to the issue:**

```
✅ CI Passed — Phase v1.6/01 @ abc1234
Branch: feature/v1.6-01-api-foundation
Tests: 24/24 passed
All unit tests green. Ready for human review.
Run /vit:verify-work 1 to complete manual UAT.
```

```
❌ CI Failed — Phase v1.6/01 @ abc1234
Branch: feature/v1.6-01-api-foundation
Tests: 20/24 passed — 4 failing
### Failing tests
  ...
Fix failures before running /vit:verify-work 1.
```

```
🔄 CI — Phase v1.6/01 @ abc1234
Branch: feature/v1.6-01-api-foundation
Status: No phase tests yet — waiting for test generation
Tests are created by vit-test-writer after phase execution completes.
```

**Test location:** `tests/phases/` — the `vit-test-writer` agent generates these automatically after phase execution. If no tests exist yet, the workflow posts the "waiting" comment instead of failing.

**Feedback loop:** Use `/vit:review-feedback` to read developer comments posted to the issue and implement changes as fix commits — a complete review cycle without leaving the terminal.

**Requires:** `GITHUB_TOKEN` in your repo secrets (automatically available in GitHub Actions — no setup needed).

---

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Architecture

```
/vit:plan-phase
    ├── vit-phase-researcher    (parallel) → RESEARCH.md
    ├── vit-planner                        → PLAN.md with task waves
    └── vit-plan-checker                   → goal-backward verification

/vit:execute-phase
    ├── gh pr create --draft               (idempotent, milestone-targeted)
    ├── Wave 1: [vit-executor] [vit-executor] ...   (parallel tasks)
    ├── Wave 2: [vit-executor] ...
    ├── vit-integration-checker            → cross-wave integration check
    ├── vit-test-writer                    → tests/phases/
    ├── vit-doc-updater                    → README/docs + CHANGELOG [Unreleased]
    └── git push → phase-ci.yml → GitHub issue comment

/vit:verify-work
    ├── vit-verifier                       → VERIFICATION.md
    ├── gh pr ready                        (Route A: all pass, phases remain)
    └── vit-pr-reviewer                    → GitHub inline review comments
```

All state is stored in `.planning/STATE.md`, `.planning/MILESTONE.md`, and per-phase `PLAN.md` files. State survives context resets and session boundaries.

---

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► PROJECT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Project Structure

**`.planning/` — per-project state (created by `/vit:new-project`)**

```
.planning/
├── PROJECT.md              # Vision, scope, requirements, decisions
├── REQUIREMENTS.md         # Categorized requirements with REQ-IDs
├── ROADMAP.md              # Phase structure with success criteria
├── STATE.md                # Current position and GitHub issue mapping
├── MILESTONE.md            # Active milestone tracker
├── config.json             # Workflow preferences
├── codebase/               # Codebase analysis (from /vit:map-codebase)
├── research/               # Domain research (from /vit:new-project)
└── phases/
    ├── 01-phase-name/
    │   ├── 01-RESEARCH.md
    │   ├── 01-01-PLAN.md
    │   ├── 01-02-PLAN.md
    │   ├── 01-01-SUMMARY.md
    │   └── 01-02-SUMMARY.md
    └── 02-phase-name/
        └── ...
```

**`.claude/` — framework files (installed by `npx vit-claude`)**

```
.claude/
├── agents/
│   └── vit-*.md            # 16 specialist agent system prompts
├── commands/
│   └── vit/
│       └── *.md            # 31 slash command definitions
├── hooks/
│   ├── vit-check-update.cjs  # Version check at session start
│   └── vit-statusline.js     # Status sidebar renderer
├── settings.json             # Hook registrations
└── vit/
    ├── references/           # Best practice guides and patterns
    ├── templates/            # Document templates (PLAN, SUMMARY, STATE, ...)
    └── workflows/            # Orchestration workflow definitions
```

---

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► COMMON WORKFLOWS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Common Workflows

### 1. Greenfield — start a new project from scratch

Initialize VIT on a blank repo. Claude asks questions to understand your vision, then builds a complete roadmap.

```
/vit:new-project
/vit:plan-phase 1
/vit:execute-phase 1
/vit:verify-work 1
```

Repeat plan/execute/verify for each phase. When a milestone is complete: `/vit:audit-milestone` then `/vit:complete-milestone`.

---

### 2. Brownfield — adopt VIT on an existing codebase

Start with a codebase analysis so the planner understands what already exists before building the roadmap.

```
/vit:map-codebase
/vit:new-project
/vit:plan-phase 1
```

`/vit:map-codebase` produces structured analysis in `.planning/codebase/` that the planner reads automatically.

---

### 3. Resume — pick up after a context reset

After starting a new Claude Code session, restore full context instantly.

```
/vit:resume-work
```

Reads `STATE.md`, the active phase plan, and any handoff documents. Shows exactly where you are and what to do next.

---

### 4. Urgent work — insert a hotfix between planned phases

Need to ship something urgently without disrupting the roadmap?

```
/vit:insert-phase
```

Inserts as a decimal phase (e.g., `2.1`) between existing phases and renumbers subsequent phases automatically. After the hotfix: continue from where the roadmap left off.

---

### 5. Team collaboration — assign phases and track handoffs

Enable team mode in `.planning/config.json`, then assign phases to engineers.

```
/vit:settings
/vit:assign-phase 3
/vit:team-status
```

`/vit:assign-phase` records the assignee in STATE.md. `/vit:team-status` shows all phases, assignees, and current progress across the milestone.

---

### 6. Debugging — systematic investigation with persistent state

Use the structured debugging workflow for tricky bugs that need investigation across multiple sessions.

```
/vit:debug
```

Spawns `vit-debugger`, which applies a scientific method approach: hypothesis, reproduction, isolation, fix. Debug state persists across context resets so you can pick up mid-investigation.

---

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► UPDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Update

```bash
npx vit-claude      # Re-run to update (overwrites framework files, preserves your .planning/ data)
/vit:update         # Or use the in-session command
```

VIT checks for updates automatically at session start via the `vit-check-update` hook.

---

## License & Community

MIT License

- [GitHub Issues](https://github.com/LeVarez/vit-cc/issues) — bug reports, feature requests
- [Discord](https://discord.gg/vit-claude) — community, help, announcements
- [Docs](https://vit-claude.dev) — full documentation site
