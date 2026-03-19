# Feature Landscape: vit-cc Documentation

**Domain:** Comprehensive documentation for a Claude Code agentic framework
**Researched:** 2026-03-19
**Confidence:** HIGH (direct codebase enumeration — no inference required)

---

## Enumeration Method

All components enumerated by direct filesystem traversal of:
- `.claude/commands/vit/` — 30 slash commands
- `.claude/agents/` — 16 agent definitions
- `.claude/vit/workflows/` — 12 workflow files
- `.claude/vit/references/` — 9 reference guides
- `.claude/vit/templates/` — 33 template files (root, codebase, research-project subdirs)
- `.claude/hooks/` — 2 session hooks
- `.planning/` — planning state files produced by the framework

---

## Slash Commands (30 commands requiring documentation)

Every slash command is user-facing and must be documented.

### Project Lifecycle Commands

| Command | File | What It Does |
|---------|------|--------------|
| `vit:new-project` | `new-project.md` | Initialize project: deep questioning → optional research (4 parallel agents) → requirements → roadmap → GitHub milestone + feature issues + feature branches |
| `vit:new-milestone` | `new-milestone.md` | Start new milestone cycle, update PROJECT.md, route to requirements for new milestone scope |
| `vit:progress` | `progress.md` | Check project state, show current position from STATE.md, route to next action (plan or execute) |
| `vit:list-milestones` | `list-milestones.md` | Show all active milestone worktrees and their current state |
| `vit:complete-milestone` | `complete-milestone.md` | Archive completed milestone: spawn changelog-writer, update MILESTONES.md, git tag, prepare for next version |
| `vit:audit-milestone` | `audit-milestone.md` | Audit milestone completion against original intent, spawn integration-checker before archiving |
| `vit:update` | `update.md` | Update VIT to latest version with changelog display |
| `vit:help` | `help.md` | Show available VIT commands and usage guide |
| `vit:join-discord` | `join-discord.md` | Join the VIT Discord community |

### Phase Planning Commands

| Command | File | What It Does |
|---------|------|--------------|
| `vit:plan-phase` | `plan-phase.md` | Create PLAN.md files: optional research → spawn planner → spawn plan-checker → verification loop (max 3 iterations) → GitHub sub-issues + plan branches |
| `vit:discuss-phase` | `discuss-phase.md` | Adaptive questioning to gather phase context before planning; produces CONTEXT.md |
| `vit:list-phase-assumptions` | `list-phase-assumptions.md` | Surface Claude's assumptions about a phase approach before planning; conversational only |
| `vit:research-phase` | `research-phase.md` | Research phase implementation standalone (usually run via plan-phase instead) |
| `vit:add-phase` | `add-phase.md` | Add a new phase to the end of the current milestone roadmap |
| `vit:insert-phase` | `insert-phase.md` | Insert urgent work as decimal phase (e.g., 72.1) between existing phases without renumbering |
| `vit:remove-phase` | `remove-phase.md` | Remove a future phase from roadmap and renumber subsequent phases |
| `vit:plan-milestone-gaps` | `plan-milestone-gaps.md` | Create phases to close all gaps identified by milestone audit |

### Phase Execution Commands

| Command | File | What It Does |
|---------|------|--------------|
| `vit:execute-phase` | `execute-phase.md` | Execute all plans in a phase: wave-based parallel execution, worktree management, GitHub PR lifecycle, verification, doc-updater, test-writer |
| `vit:verify-work` | `verify-work.md` | Conversational UAT with persistent UAT.md state; promotes PR to ready-for-review on pass; spawns pr-reviewer |
| `vit:quick` | `quick.md` | Execute a quick task with VIT guarantees (atomic commits, state tracking) but skip optional agents |
| `vit:debug` | `debug.md` | Systematic debugging with persistent DEBUG.md state that survives context resets |
| `vit:review-feedback` | `review-feedback.md` | Read GitHub issue feedback comments for a phase and implement requested changes as fix commits |

### Session Management Commands

| Command | File | What It Does |
|---------|------|--------------|
| `vit:pause-work` | `pause-work.md` | Create `.continue-here.md` context handoff when pausing work mid-phase |
| `vit:resume-work` | `resume-work.md` | Restore full context from STATE.md and `.continue-here.md` to resume a previous session |
| `vit:add-todo` | `add-todo.md` | Capture idea or task as a todo from the current conversation context |
| `vit:check-todos` | `check-todos.md` | List pending todos filtered by area and select one to work on |

### Configuration and Team Commands

| Command | File | What It Does |
|---------|------|--------------|
| `vit:settings` | `settings.md` | Configure VIT workflow toggles and model profile interactively |
| `set-profile` | `set-profile.md` | Switch model profile (quality/balanced/budget) affecting all VIT agents |
| `vit:map-codebase` | `map-codebase.md` | Analyze codebase with 4 parallel mapper agents, produce 7 structured docs in `.planning/codebase/` |
| `vit:team-status` | `team-status.md` | Show team assignment status: who's working on what, what's blocked, what's unassigned |
| `vit:assign-phase` | `assign-phase.md` | Assign a phase or individual plan to a specific engineer handle |

---

## Agents (16 agents requiring documentation)

Every agent has a distinct role. Documentation must cover: purpose, when spawned, inputs consumed, outputs produced, position in workflow.

### Research Agents

| Agent | File | Role | Spawned By |
|-------|------|------|------------|
| `vit-project-researcher` | `vit-project-researcher.md` | Domain ecosystem research before roadmap. One instance per dimension: STACK, FEATURES, ARCHITECTURE, PITFALLS. Produces files in `.planning/research/` | `new-project` orchestrator (4 in parallel), `new-milestone` orchestrator |
| `vit-research-synthesizer` | `vit-research-synthesizer.md` | Reads outputs from 4 parallel researcher agents, synthesizes into SUMMARY.md | `new-project` orchestrator after all 4 researchers complete |
| `vit-phase-researcher` | `vit-phase-researcher.md` | Researches how to implement a specific phase, produces `{phase}-RESEARCH.md` consumed by planner | `plan-phase` orchestrator |
| `vit-codebase-mapper` | `vit-codebase-mapper.md` | Explores codebase for a specific focus area (tech/arch/quality/concerns), writes directly to `.planning/codebase/` | `map-codebase` orchestrator (parallel by focus area) |

### Planning Agents

| Agent | File | Role | Spawned By |
|-------|------|------|------------|
| `vit-roadmapper` | `vit-roadmapper.md` | Creates ROADMAP.md with phase breakdown, requirement mapping, success criteria per phase, coverage validation (100% of v1 requirements must map to a phase) | `new-project` orchestrator |
| `vit-planner` | `vit-planner.md` | Creates executable `{phase}-{plan}-PLAN.md` files with task breakdown, dependency analysis, wave assignment, goal-backward must_haves | `plan-phase` orchestrator |
| `vit-plan-checker` | `vit-plan-checker.md` | Goal-backward analysis of plans: verifies plans will achieve the phase goal, not just that they look complete | `plan-phase` orchestrator after planner |

### Execution Agents

| Agent | File | Role | Spawned By |
|-------|------|------|------------|
| `vit-executor` | `vit-executor.md` | Executes PLAN.md files atomically: per-task commits, deviation handling (auto-fix / ask for architectural), checkpoint protocols, produces SUMMARY.md | `execute-phase` orchestrator (one per plan, parallel within each wave) |
| `vit-debugger` | `vit-debugger.md` | Scientific method bug investigation, manages persistent DEBUG.md sessions, handles checkpoints when user input is needed | `debug` orchestrator |
| `vit-github-reviewer` | `vit-github-reviewer.md` | Reads developer comments on a GitHub feature issue, implements each requested change as a fix commit, replies on the issue confirming what was done | `review-feedback` orchestrator |

### Verification Agents

| Agent | File | Role | Spawned By |
|-------|------|------|------------|
| `vit-verifier` | `vit-verifier.md` | Goal-backward phase verification: checks codebase delivers what the phase promised (not just that tasks completed). Creates VERIFICATION.md. Returns: passed / gaps_found / human_needed | `execute-phase` orchestrator after all waves complete |
| `vit-pr-reviewer` | `vit-pr-reviewer.md` | Reviews promoted PRs: reads diff, posts severity-tiered findings as GitHub review comments (block-merge / should-fix / nit) | `verify-work` orchestrator after PR promotion |
| `vit-integration-checker` | `vit-integration-checker.md` | Verifies cross-phase integration and E2E flows: checks that phases connect properly and user workflows complete end-to-end | `audit-milestone` orchestrator |

### Documentation Agents

| Agent | File | Role | Spawned By |
|-------|------|------|------------|
| `vit-doc-updater` | `vit-doc-updater.md` | Updates targeted documentation sections after phase completes. Reads SUMMARY.md + PLAN.md to identify which doc sections changed. Updates README and appends to CHANGELOG [Unreleased] | `execute-phase` orchestrator after all waves pass verification |
| `vit-changelog-writer` | `vit-changelog-writer.md` | Writes versioned CHANGELOG entry at milestone completion. Reads all phase SUMMARY.md files. Promotes [Unreleased] to versioned entry | `complete-milestone` orchestrator |
| `vit-test-writer` | `vit-test-writer.md` | Generates Vitest unit tests from phase plan must_haves and SUMMARY.md deliverables | `execute-phase` orchestrator after all waves complete |

---

## Workflows (12 files — developer-facing orchestration logic)

Workflows are internal to commands and agents. Users do not invoke them directly, but developers extending vit-cc must understand them.

| Workflow | File | Called By | Core Responsibility |
|----------|------|-----------|---------------------|
| `execute-phase` | `execute-phase.md` | `vit:execute-phase` command | Wave discovery, parallel executor spawning, GitHub PR lifecycle (draft → ready), verification routing, doc-updater dispatch |
| `execute-plan` | `execute-plan.md` | `vit-executor` agent | Single PLAN.md execution: read STATE.md → run tasks → atomic commits → produce SUMMARY.md |
| `complete-milestone` | `complete-milestone.md` | `vit:complete-milestone` command | Archive milestone: create MILESTONES.md entry, run PROJECT.md evolution review, reorganize ROADMAP.md, git tag |
| `diagnose-issues` | `diagnose-issues.md` | `vit:verify-work` when UAT finds gaps | Spawn one debug agent per UAT gap, collect root causes, update UAT.md with diagnoses |
| `discovery-phase` | `discovery-phase.md` | `plan-phase` during mandatory discovery | Shallow library/option research at appropriate depth, produce DISCOVERY.md |
| `discuss-phase` | `discuss-phase.md` | `vit:discuss-phase` command | Adaptive questioning with user, capture implementation decisions in CONTEXT.md |
| `list-phase-assumptions` | `list-phase-assumptions.md` | `vit:list-phase-assumptions` command | Surface Claude's assumptions about a phase; conversational only, no file output |
| `map-codebase` | `map-codebase.md` | `vit:map-codebase` command | Orchestrate 4 parallel codebase mapper agents by focus area, write summary |
| `resume-project` | `resume-project.md` | Any session starting on existing project | Load STATE.md + ROADMAP.md, restore context, route to next action |
| `transition` | `transition.md` | Between command phases | State synchronization between workflow steps |
| `verify-phase` | `verify-phase.md` | `vit-verifier` agent | Goal-backward verification logic executed inside the verifier |
| `verify-work` | `verify-work.md` | `vit:verify-work` command | Conversational UAT with persistent UAT.md, one test at a time, feeds gaps into plan-phase --gaps |

---

## Reference Files (9 files — developer-facing behavioral standards)

References define behavioral standards used by agents and commands via `@` includes. They are stable contracts between the framework and its agents.

| Reference | File | What It Defines |
|-----------|------|-----------------|
| `checkpoints` | `checkpoints.md` | When and how to pause for human input. Golden rule: Claude automates everything with CLI; humans only do what requires judgment (visual checks, UX evaluation, secret retrieval) |
| `continuation-format` | `continuation-format.md` | Standard format for presenting next steps after a command completes — the "Next Up" block |
| `git-integration` | `git-integration.md` | Git commit standards: commit outcomes not process, per-task commits, `feat/fix/docs/chore` types, never `git add .` |
| `model-profiles` | `model-profiles.md` | Three profiles (quality/balanced/budget) and which model each agent uses per profile. Quality = opus; balanced = sonnet for most; budget = haiku where possible |
| `planning-config` | `planning-config.md` | Configuration schema for `.planning/config.json`: mode, depth, parallelization, commit_docs, model_profile, workflow toggles |
| `questioning` | `questioning.md` | Dream extraction philosophy and questioning techniques for project initialization. Key: thinking partner, not interviewer |
| `tdd` | `tdd.md` | When and how to apply TDD. Red-green-refactor principles. TDD features get dedicated plans because the execution cycle is heavier |
| `ui-brand` | `ui-brand.md` | Visual patterns for user-facing output: stage banners, progress indicators, icons, continuation format |
| `verification-patterns` | `verification-patterns.md` | How to verify different artifact types are real implementations vs stubs/placeholders. Existence != implementation |

---

## Templates (33 files — developer-facing, users see the output)

Templates define the schema of all planning artifacts VIT creates.

### Root Planning Templates (21 files)

| Template | Produces | Created By |
|----------|----------|------------|
| `project.md` | `.planning/PROJECT.md` — living project context | `new-project` |
| `state.md` | `.planning/STATE.md` — project memory and GitHub Issue Mapping | roadmapper |
| `roadmap.md` | `.planning/ROADMAP.md` — phase structure with requirement mapping | roadmapper |
| `requirements.md` | `.planning/REQUIREMENTS.md` — checkable requirements with REQ-IDs | `new-project` |
| `config.json` | `.planning/config.json` — workflow preferences | `new-project` |
| `context.md` | `{phase}-CONTEXT.md` — phase implementation decisions | `discuss-phase` |
| `discovery.md` | `{phase}-DISCOVERY.md` — shallow library/option research | plan-phase discovery |
| `research.md` | `{phase}-RESEARCH.md` — comprehensive ecosystem research | phase-researcher |
| `phase-prompt.md` | `{phase}-{plan}-PLAN.md` — executable plan with frontmatter and tasks | planner |
| `summary.md` | `{phase}-{plan}-SUMMARY.md` — plan completion documentation | executor |
| `UAT.md` | `{phase}-UAT.md` — persistent UAT session tracking | verify-work |
| `verification-report.md` | `{phase}-VERIFICATION.md` — phase goal verification results | verifier |
| `handoff.md` | `{next-phase}/HANDOFF.md` — context handoff between phases | execute-phase |
| `DEBUG.md` | `.planning/debug/{slug}.md` — active debug session | debugger |
| `debug-subagent-prompt.md` | Prompt template for spawning vit-debugger | `debug` command |
| `planner-subagent-prompt.md` | Prompt template for spawning vit-planner | `plan-phase` command |
| `milestone.md` | `.planning/MILESTONES.md` entry | `complete-milestone` |
| `milestone-archive.md` | `.planning/milestones/vX.Y-*.md` | `complete-milestone` |
| `ONBOARDING.md` | `.planning/ONBOARDING.md` — team onboarding guide | `new-project` |
| `user-setup.md` | `{phase}-USER-SETUP.md` — tasks Claude cannot automate | executor when needed |
| `continue-here.md` | `.continue-here.md` — mid-phase pause continuation point | `pause-work` |

### Codebase Templates (7 files — produce `.planning/codebase/` documents)

| Template | Produces | Notes |
|----------|----------|-------|
| `codebase/architecture.md` | `ARCHITECTURE.md` | Conceptual code organization (not physical structure) |
| `codebase/concerns.md` | `CONCERNS.md` | Known issues and areas requiring care when making changes |
| `codebase/conventions.md` | `CONVENTIONS.md` | Coding style and patterns to match |
| `codebase/integrations.md` | `INTEGRATIONS.md` | External service dependencies |
| `codebase/stack.md` | `STACK.md` | Technology foundation |
| `codebase/structure.md` | `STRUCTURE.md` | Physical file organization; answers "where do I put X?" |
| `codebase/testing.md` | `TESTING.md` | Test framework and patterns |

### Research Project Templates (5 files — produce `.planning/research/` documents)

| Template | Produces | Notes |
|----------|----------|-------|
| `research-project/SUMMARY.md` | `research/SUMMARY.md` | Executive summary with roadmap implications |
| `research-project/STACK.md` | `research/STACK.md` | Technology recommendations |
| `research-project/FEATURES.md` | `research/FEATURES.md` | Feature landscape |
| `research-project/ARCHITECTURE.md` | `research/ARCHITECTURE.md` | Architecture patterns |
| `research-project/PITFALLS.md` | `research/PITFALLS.md` | Common mistakes |

---

## Hooks and System Configuration (4 files)

| File | What It Does | Audience |
|------|--------------|----------|
| `vit-check-update.cjs` | SessionStart hook: checks for VIT updates in background (cached), displays notification if update available | User (automatic) |
| `vit-statusline.js` | Renders custom Claude Code status bar: model name, current task, directory, context usage percentage | User (automatic) |
| `settings.json` | Configures Claude Code hooks: SessionStart runs update check, statusLine renders custom bar | Developer |
| `VERSION` | Current VIT version (1.10.1); read by update checker to compare against latest release | Internal |

---

## Planning State File Schema (what users see constantly)

The `.planning/` directory is the live state of every vit-cc project. Users interact with these files every session.

| File / Directory | Purpose | Schema Doc Needed? |
|-----------------|---------|-------------------|
| `PROJECT.md` | Living project context: what, why, requirements (Validated/Active/Out of Scope), key decisions | Yes — users edit this |
| `STATE.md` | Project memory: current position, performance metrics, GitHub Issue Mapping table, accumulated context | Yes — users read this constantly |
| `ROADMAP.md` | Phase structure: goal, requirements, success criteria, depends_on, plan count, status per phase | Yes — users reference this constantly |
| `MILESTONES.md` | Shipped milestones history | No — auto-generated |
| `config.json` | Workflow preferences: mode, depth, parallelization, model_profile, workflow toggles, team config | Yes — users configure this |
| `ONBOARDING.md` | Team onboarding guide for new engineers | Yes — teams share this |
| `codebase/` | 7 codebase analysis docs from map-codebase | No — auto-generated, self-explanatory |
| `research/` | 5 domain research docs from new-project | No — auto-generated |
| `phases/{milestone}/{N}-{name}/` | Per-phase: PLAN.md files, SUMMARY.md files, VERIFICATION.md, UAT.md, RESEARCH.md, CONTEXT.md | Yes — users reference PLAN.md and VERIFICATION.md |
| `milestones/` | Archived milestone files | No — auto-generated |
| `debug/` | Active debug sessions | No — auto-generated |

---

## Table Stakes: What MUST Be Documented

These are non-negotiable for the v1.1 documentation milestone.

| Item | Why Table Stakes |
|------|-----------------|
| All 30 slash commands with usage, arguments, flags, output | Users cannot use vit-cc without a command reference |
| `vit:new-project` full walkthrough with phases | Most complex command; first thing every user runs |
| `vit:plan-phase` + `vit:execute-phase` as the core loop | Every project runs this cycle dozens of times |
| All 16 agents with role, inputs, outputs, spawning context | Agents are invisible to users unless explained |
| `.planning/` directory structure and file schemas | Users see these files every session; must understand what each field means |
| `config.json` complete reference | Users configure VIT behavior here |
| Model profiles explained with cost/quality tradeoff | Users choose quality/balanced/budget without knowing what it means |
| GitHub integration overview | Users see GitHub issues and PRs created automatically |
| Wave-based parallelization concept | Users see multiple agents running; need to understand why and what to expect |
| Verification flow (verifier → gaps → plan --gaps loop) | Users encounter verification failures; need to know what to do |

---

## Differentiators: Documentation That Sets vit-cc Apart

| Documentation | Value |
|---------------|-------|
| Architecture guide: orchestrators → workflows → agents → files data flow | Builds trust and enables debugging when things go wrong |
| "How to extend vit-cc" — custom agents tutorial | Makes the framework composable for teams with domain-specific needs |
| "How to extend vit-cc" — custom commands tutorial | Enables team-specific orchestrators |
| Design philosophy: why agents not macros | Explains the "orchestrators stay lean" principle; agents get fresh context |
| GitHub integration deep-dive: full PR lifecycle | Draft → execute → verify → ready → review → merge sequence with all touchpoints |
| Multi-engineer team workflow guide | assign-phase, team-status, worktree isolation for parallel feature work |
| Context management guide | Why `/clear` is recommended between commands; context budget concept |
| Debugging guide using `vit:debug` | Scientific method debugging; persistent sessions across context resets |
| UAT workflow guide | How verify-work creates persistent state and feeds gaps back to plan-phase |
| Model profile tuning guide | Concrete examples of what quality vs balanced vs budget means per agent |

---

## Anti-Features: What NOT to Document

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Internal workflow step-by-step implementation | Changes frequently; creates maintenance burden | Document behavior and I/O contracts, not implementation steps |
| Template internal syntax | Templates are Claude-internal scaffolding; syntax is unstable | Document the output file format and schema |
| Agent system prompt internals | Agents are consumed by Claude, not users; internals are intentionally opaque | Document agent's role, spawning context, and what it produces |
| Every `sed` command in execute-phase | Too granular; obscures conceptual behavior | Document what GitHub sync does and when it runs |
| Hook implementation code | Users don't modify hooks | Document what the hook does and its trigger |
| Exhaustive git plumbing commands | Git is documented elsewhere | Document VIT's commit conventions and atomic commit guarantees |
| Research template schemas | Claude-internal scaffolding | Document what good research outputs contain |

---

## Feature Dependencies for Documentation Structure

```
User Guide depends on:
  → Command enumeration (complete — 30 commands)
  → Agent enumeration (complete — 16 agents)
  → Workflow overview (complete — 12 workflows)

Developer Guide depends on:
  → User Guide concepts (prerequisite reading)
  → Architecture documentation
  → Template/contract documentation

Architecture docs depend on:
  → All components enumerated (complete)
  → Data flow between components understood
  → State machine (STATE.md, ROADMAP.md, phase files) documented
```

---

## MVP Documentation Recommendation

**Phase 1 — Commands Reference (table stakes):**
All 30 slash commands: description, syntax, arguments, flags, example invocation, expected output, common errors. Users cannot use vit-cc without this.

**Phase 2 — Agents Reference (table stakes):**
All 16 agents: role, spawning context (which command spawns it), inputs consumed, outputs produced, what happens after it completes.

**Phase 3 — Core Concepts and Architecture (differentiator):**
Wave parallelization, context management, planning state machine, GitHub integration data flow. Includes architecture diagram showing orchestrators → workflows → agents → planning files.

**Phase 4 — Developer Guide (differentiator):**
Extending vit-cc: custom agents, custom commands, custom references. Tutorial format with worked examples.

**Defer to post-MVP:**
- Per-workflow deep-dives (implementation-level internals)
- Video walkthroughs
- Interactive examples
- Migration guides for version upgrades

---

## Sources

All findings from direct codebase enumeration — HIGH confidence. No inference required; every file read directly.

- Commands: `.claude/commands/vit/` (30 files read)
- Agents: `.claude/agents/` (16 files read)
- Workflows: `.claude/vit/workflows/` (12 files read)
- References: `.claude/vit/references/` (9 files read)
- Templates: `.claude/vit/templates/` (33 files read across 3 subdirectories)
- Planning state: `.planning/` (15 files read)
- Hooks: `.claude/hooks/` (2 files read)
