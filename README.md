# vit-cc

**Phase-based project execution framework for Claude Code — with GitHub integration.**

VIT gives Claude Code a structured, repeatable way to plan and execute software projects: one phase at a time, with atomic commits, parallel agents, CI feedback on GitHub issues, and persistent state that survives context resets. The core loop is:

```
/vit:new-project  →  /vit:plan-phase  →  /vit:execute-phase  →  /vit:verify-work
```

```bash
npx vit-claude
```

This copies all framework files into your project's `.claude/` directory and optionally adds the GitHub CI workflow. You can run it again to update.

**What gets installed:**
- `.claude/agents/vit-*.md` — 16 specialist agents
- `.claude/commands/vit/*.md` — 29 slash commands
- `.claude/hooks/vit-check-update.cjs` + `vit-statusline.js`
- `.claude/vit/` — references, templates, workflows, VERSION
- `.github/workflows/phase-ci.yml` — GitHub CI integration (opt-in)
- Hook registrations in `.claude/settings.json`

---

## Documentation

| Section | Description |
|---------|-------------|
| [Getting Started](docs/user-guide/getting-started.md) | Install VIT and run your first phase |
| [Core Concepts](docs/user-guide/core-concepts.md) | The milestone → phase → plan → task mental model |
| [Glossary](docs/user-guide/glossary.md) | Definitions for all VIT-specific terms |
| [User Guide](docs/user-guide/README.md) | All user-facing documentation |
| [Developer Guide](docs/developer-guide/README.md) | Extending VIT with custom agents and commands |

---

## Commands reference

| Command | Description |
|---------|-------------|
| `/vit:new-project` | Initialize a new project with deep context gathering and PROJECT.md |
| `/vit:new-milestone` | Start a new milestone cycle — update PROJECT.md and route to requirements |
| `/vit:plan-phase` | Create detailed execution plan for a phase (PLAN.md) with verification loop |
| `/vit:execute-phase` | Execute all plans in a phase with wave-based parallelization |
| `/vit:verify-work` | Validate built features through conversational UAT |
| `/vit:quick` | Execute a quick task with VIT guarantees (atomic commits, state tracking) but skip optional agents |
| `/vit:discuss-phase` | Gather phase context through adaptive questioning before planning |
| `/vit:research-phase` | Research how to implement a phase (standalone — usually use /vit:plan-phase instead) |
| `/vit:list-phase-assumptions` | Surface Claude's assumptions about a phase approach before planning |
| `/vit:progress` | Check project progress, show context, and route to next action (execute or plan) |
| `/vit:pause-work` | Create context handoff when pausing work mid-phase |
| `/vit:resume-work` | Resume work from previous session with full context restoration |
| `/vit:add-phase` | Add phase to end of current milestone in roadmap |
| `/vit:insert-phase` | Insert urgent work as decimal phase (e.g., 72.1) between existing phases |
| `/vit:remove-phase` | Remove a future phase from roadmap and renumber subsequent phases |
| `/vit:audit-milestone` | Audit milestone completion against original intent before archiving |
| `/vit:complete-milestone` | Archive completed milestone and prepare for next version |
| `/vit:plan-milestone-gaps` | Create phases to close all gaps identified by milestone audit |
| `/vit:list-milestones` | Show all active milestone worktrees and their current state |
| `/vit:map-codebase` | Analyze codebase with parallel mapper agents to produce .planning/codebase/ documents |
| `/vit:review-feedback` | Read developer feedback on a GitHub feature issue and implement requested changes |
| `/vit:debug` | Systematic debugging with persistent state across context resets |
| `/vit:add-todo` | Capture idea or task as todo from current conversation context |
| `/vit:check-todos` | List pending todos and select one to work on |
| `/vit:set-profile` | Switch model profile for VIT agents (quality/balanced/budget) |
| `/vit:settings` | Configure VIT workflow toggles and model profile |
| `/vit:update` | Update VIT to latest version with changelog display |
| `/vit:help` | Show available VIT commands and usage guide |
| `/vit:join-discord` | Join the VIT Discord community |

---

## Agents reference

VIT spawns specialist agents automatically — you don't invoke them directly.

| Agent | Role |
|-------|------|
| `vit-planner` | Creates executable phase plans with task breakdown, dependency analysis, and goal-backward verification |
| `vit-executor` | Executes VIT plans with atomic commits, deviation handling, checkpoint protocols, and state management |
| `vit-verifier` | Verifies phase goal achievement through goal-backward analysis. Creates VERIFICATION.md report |
| `vit-phase-researcher` | Researches how to implement a phase before planning. Produces RESEARCH.md consumed by vit-planner |
| `vit-plan-checker` | Verifies plans will achieve phase goal before execution. Goal-backward analysis of plan quality |
| `vit-project-researcher` | Researches domain ecosystem before roadmap creation. Produces files in .planning/research/ |
| `vit-research-synthesizer` | Synthesizes research outputs from parallel researcher agents into SUMMARY.md |
| `vit-roadmapper` | Creates project roadmaps with phase breakdown, requirement mapping, and coverage validation |
| `vit-codebase-mapper` | Explores codebase and writes structured analysis documents |
| `vit-integration-checker` | Verifies cross-phase integration and E2E flows |
| `vit-debugger` | Investigates bugs using scientific method, manages debug sessions, handles checkpoints |
| `vit-github-reviewer` | Reads GitHub issue feedback comments for a phase and implements requested changes as fix commits |
| `vit-test-writer` | Generates Vitest unit tests from phase plan must_haves and SUMMARY.md |
| `vit-pr-reviewer` | AI PR reviewer posting body summary + up to 5 inline diff comments with three severity tiers (block-merge, should-fix, nit); spawned by verify-work after PR promotion on Route A |
| `vit-doc-updater` | Reads phase SUMMARY.md to autonomously update targeted README/docs sections and append to CHANGELOG.md [Unreleased]; spawned by execute-phase after phase completion commit |
| `vit-changelog-writer` | Promotes CHANGELOG.md [Unreleased] to a versioned entry and updates milestone-wide README/docs; spawned by complete-milestone before archive |

---

## GitHub CI workflow

`phase-ci.yml` triggers on pushes to `feature/**`, `milestone/**`, and `quick/**` branches.

**How it finds your issue:**

Branch names follow the pattern `feature/v1.6-01-api-foundation` or `feature/42-my-feature`. The workflow extracts the phase number and looks up the corresponding GitHub issue number from `.planning/STATE.md`.

**What it posts:**

```
✅ CI Passed — Phase v1.6/01 @ abc1234
Branch: feature/v1.6-01-api-foundation
Tests: 24/24 passed
All unit tests green. Ready for human review.
Run /vit:verify-work 1 to complete manual UAT.
```

**Test location:** `tests/phases/` — VIT's `vit-test-writer` agent generates these automatically after phase execution. If no tests exist yet, the workflow posts a "waiting" comment instead of failing.

**Requires:** `GITHUB_TOKEN` in your repo secrets (automatically available in GitHub Actions).

---

## Architecture

```
/vit:plan-phase
    ├── vit-phase-researcher  (parallel, produces RESEARCH.md)
    ├── vit-planner           (produces PLAN.md with task waves)
    └── vit-plan-checker      (goal-backward verification)

/vit:execute-phase
    ├── step 0.7: gh pr create --draft              (idempotent, milestone-targeted)
    ├── Wave 1: [vit-executor] [vit-executor] ...  (parallel tasks)
    ├── Wave 2: [vit-executor] ...
    ├── vit-integration-checker                     (cross-wave check)
    ├── vit-test-writer                             (generates tests/phases/)
    ├── step 10.6: vit-doc-updater                  (updates README/docs + CHANGELOG [Unreleased])
    └── git push → phase-ci.yml → GitHub issue comment

/vit:verify-work
    ├── vit-verifier          (goal-backward analysis → VERIFICATION.md)
    ├── step 8.5: gh pr ready (Route A only — all pass, more phases remain)
    └── step 8.6: vit-pr-reviewer (spawned after PR promotion, non-blocking)
```

State is stored in `.planning/STATE.md`, `.planning/MILESTONE.md`, and per-phase `PLAN.md` files. All state survives context resets and session boundaries.

---

## Update

```bash
npx vit-claude          # Re-run to update (overwrites framework files, preserves your .planning/ data)
/vit:update         # Or use the in-session command
```

---

## License

MIT
