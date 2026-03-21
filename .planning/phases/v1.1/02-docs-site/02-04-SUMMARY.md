---
phase: 02-docs-site
plan: 04
type: execute
wave: 2
depends_on: ["02-01"]
files_modified:
  - docs/reference/github-integration.md
  - docs/reference/configuration.md
  - docs/reference/hooks-sessions.md
autonomous: true
assigned_to: ""
execute_by: claude

must_haves:
  truths:
    - "A reader understands the full GitHub integration lifecycle (branches, PRs, issues, CI) after reading GitHub Integration"
    - "A reader can configure VIT using config.json after reading Configuration Reference"
    - "A reader understands VIT's hook system and session management after reading Hooks and Sessions"
  artifacts:
    - path: "docs/reference/github-integration.md"
      provides: "Branch naming, PR lifecycle, issue linking, CI workflow, PR review gates"
      min_lines: 100
    - path: "docs/reference/configuration.md"
      provides: "Complete config.json schema, model profiles matrix, workflow toggles"
      min_lines: 100
    - path: "docs/reference/hooks-sessions.md"
      provides: "Hook files, settings.json, pause/resume, .continue-here"
      min_lines: 80
  key_links:
    - from: "docs/reference/github-integration.md"
      to: "docs/guide/how-vit-works.md"
      via: "cross-link to core loop context"
      pattern: "\\[How VIT Works\\]\\(/guide/how-vit-works\\)"
    - from: "docs/reference/configuration.md"
      to: "docs/guide/architecture.md"
      via: "cross-link to model profile system"
      pattern: "\\[Architecture\\]\\(/guide/architecture\\)"
---

<objective>
Write the 3 Reference section pages with comprehensive technical reference content.

Purpose: The Reference section is the "look it up" path. Contributors and advanced users consult these for specific configuration, integration, and internals details.
Output: 3 complete documentation pages covering DOCS-09, DOCS-10, DOCS-11.
</objective>

<execution_context>
@./.claude/vit/workflows/execute-plan.md
@./.claude/vit/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/v1.1/02-docs-site/02-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Write GitHub Integration Internals reference</name>
  <files>
    docs/reference/github-integration.md
  </files>
  <action>
**GitHub Integration Internals (DOCS-09) — `docs/reference/github-integration.md`:**

Read these source files for content:
- `files/vit/references/git-integration.md` (primary source — branch naming, PR lifecycle, issue linking)
- `.github/workflows/phase-ci.yml` (CI workflow details)
- `files/commands/vit/execute-phase.md` (PR creation during execution)
- `files/commands/vit/new-milestone.md` (milestone/issue creation)

Write a comprehensive reference covering:
1. **Branch Naming Convention** — `milestone/v{X.Y.Z}` for milestone branches, `feature/v{X.Y.Z}-{NN}-{slug}` for feature branches, `feature/v{X.Y.Z}-{NN}-{PP}` for plan branches. Show the hierarchy and how branches relate.
2. **PR Lifecycle** — Draft PR created on execute-phase start -> plans executed on plan branches -> merged to feature branch -> verify-work runs -> PR promoted to ready-for-review -> vit-pr-reviewer runs -> human reviews. Show the full lifecycle with a Mermaid diagram.
3. **Issue Linking** — `gh issue develop` command + GraphQL fallback for linking branches to issues. Feature issues per phase, sub-issues per plan. How sub-issue checkboxes are checked off during execution.
4. **CI Workflow** — How `phase-ci.yml` triggers on feature branch pushes, runs tests, posts results back to GitHub issues. Trigger conditions and reporting format.
5. **PR Review Gates** — vit-pr-reviewer agent runs automatically after verification passes. What it checks, how it posts comments, inline diff comments (capped at 5).
6. **STATE.md Mapping** — How the GitHub Issue Mapping table in STATE.md tracks phase -> issue -> branch -> PR -> sub-issues relationships. How STATE.md stays in sync.

Cross-link to [How VIT Works](/guide/how-vit-works) for context on where GitHub integration fits in the core loop.
  </action>
  <verify>
Run `cd docs && npm run build 2>&1 | grep -i 'dead link\|error'` — must return empty. Verify file has >100 lines: `wc -l docs/reference/github-integration.md`. Verify Mermaid diagram exists: `grep -c 'mermaid' docs/reference/github-integration.md`.
  </verify>
  <done>GitHub Integration reference covers branch naming, PR lifecycle with Mermaid diagram, issue linking, CI workflow, PR review gates, and STATE.md mapping. Content sourced from git-integration.md and related command files.</done>
</task>

<task type="auto">
  <name>Task 2: Write Configuration Reference and Hooks/Sessions reference</name>
  <files>
    docs/reference/configuration.md
    docs/reference/hooks-sessions.md
  </files>
  <action>
**Configuration Reference (DOCS-10) — `docs/reference/configuration.md`:**

Read these source files for content:
- `files/vit/references/planning-config.md` (config schema documentation)
- `files/vit/references/model-profiles.md` (model profile matrix)
- `.planning/config.json` (live example)

Write a comprehensive reference covering:
1. **config.json Location** — `.planning/config.json`, created by `/vit:new-project`.
2. **Complete Schema** — Document every field:
   - `mode`: "yolo" | "interactive" — controls whether checkpoints pause for user input
   - `depth`: "quick" | "standard" | "comprehensive" — controls plan granularity
   - `parallelization`: boolean — enables wave-based parallel plan execution
   - `commit_docs`: boolean — whether planning docs are committed to git
   - `model_profile`: "quick" | "balanced" | "comprehensive" — which model tier mapping to use
   - `workflow.research`: boolean — enable/disable research phase
   - `workflow.plan_check`: boolean — enable/disable plan checker
   - `workflow.verifier`: boolean — enable/disable post-execution verification
   - `team.enabled`: boolean — team mode
   - `team.roster`: array — team member identifiers
   - `team.default_reviewer`: string — default PR reviewer
3. **Model Profiles Matrix** — Full table showing all agents (16) mapped across all 3 profiles (quick, balanced, comprehensive). Source from model-profiles.md exactly.
4. **Example config.json** — Show a complete, annotated example with all fields at their defaults.

Cross-link to [Architecture Deep Dive](/guide/architecture) for details on how model profiles affect the agent system.

**Hooks and Sessions (DOCS-11) — `docs/reference/hooks-sessions.md`:**

Read these source files for content:
- `files/hooks/vit-check-update.cjs` (update checker hook)
- `files/hooks/vit-statusline.js` (statusline hook)
- `files/vit/references/continuation-format.md` (session continuation)
- `src/install.js` (settings.json merge logic — scan for relevant parts)

Write a reference covering:
1. **vit-check-update.cjs** — What it does (checks for npm updates on session start), how it works (runs in background, non-blocking), when it triggers.
2. **vit-statusline.js** — What it does (shows VIT status in terminal), what information it displays, how it reads STATE.md.
3. **settings.json Hooks** — How VIT installs hooks into Claude Code's settings.json. The merge logic in install.js — how it preserves user's existing settings while adding VIT hooks. The `customInstructions` and `hooks` fields.
4. **Pause/Resume** — `/vit:pause-work` creates a continuation file, `/vit:resume-work` reads it. The `.continue-here` file format. How state is serialized and restored across sessions.
5. **Session Management** — How VIT tracks session boundaries. STATE.md `Session Continuity` section. How accumulated context persists across Claude Code restarts.
  </action>
  <verify>
Run `cd docs && npm run build 2>&1 | grep -i 'dead link\|error'` — must return empty. Verify files have sufficient content: `wc -l docs/reference/configuration.md docs/reference/hooks-sessions.md` (>100 and >80 lines respectively).
  </verify>
  <done>Configuration Reference documents complete config.json schema with all fields, model profiles matrix, and annotated example. Hooks and Sessions reference covers hook files, settings.json integration, pause/resume workflow, and session management.</done>
</task>

</tasks>

<verification>
1. `cd docs && npm run build` exits 0 with no dead link warnings
2. All 3 reference pages have substantive content (github-integration >100, configuration >100, hooks-sessions >80 lines)
3. GitHub Integration includes Mermaid diagram of PR lifecycle
4. Configuration includes complete model profiles matrix matching model-profiles.md
5. Cross-links to guide pages resolve correctly
</verification>

<success_criteria>
- GitHub Integration reference covers the full lifecycle from branch creation to PR merge
- Configuration reference is complete enough to configure VIT without looking at source code
- Hooks and Sessions reference explains all hook files and the pause/resume system
- All content derived from actual source files
- VitePress builds without errors
</success_criteria>

<output>
After completion, create `.planning/phases/v1.1/02-docs-site/02-04-SUMMARY.md`
</output>
