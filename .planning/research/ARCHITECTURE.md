# Architecture Research

**Domain:** vit-cc agent framework — GitHub PR lifecycle and agent extensions
**Researched:** 2026-03-18
**Confidence:** HIGH (derived from direct codebase reading, not external sources)

---

## Standard Architecture

### System Overview

The new components slot into the existing three-layer pipeline. The diagram below shows
where the new agents and command modifications attach:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COMMAND LAYER  (slash commands — orchestrators, no direct work)         │
│                                                                           │
│  execute-phase.md   verify-work.md   complete-milestone.md               │
│       │                  │                   │                            │
│  [MODIFY: add        [MODIFY: add        [MODIFY: add                    │
│   draft PR after      PR reviewer         changelog-writer               │
│   last wave]          spawn + PR          spawn at step 3]               │
│                       promotion]                                          │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ spawns via Task()
┌──────────────────────────────────▼──────────────────────────────────────┐
│  AGENT LAYER  (specialist agents — do the actual work)                   │
│                                                                           │
│  EXISTING:                        NEW:                                    │
│  vit-executor        ──────►  vit-doc-updater  (NEW FILE)                │
│  vit-verifier                 vit-pr-reviewer  (NEW FILE)                │
│  vit-github-reviewer          vit-changelog-writer  (NEW FILE)           │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ reads / writes
┌──────────────────────────────────▼──────────────────────────────────────┐
│  STATE LAYER  (.planning/ directory)                                      │
│                                                                           │
│  STATE.md                                                                 │
│  ├── GitHub Issue Mapping (EXISTING — phase → branch, issue#)            │
│  └── PR Mapping (NEW FIELD — phase → PR#, PR status)                     │
│                                                                           │
│  phases/NN-name/                                                          │
│  ├── NN-XX-PLAN.md         (existing)                                    │
│  ├── NN-XX-SUMMARY.md      (existing — doc-updater reads this)           │
│  └── NN-VERIFICATION.md    (existing — pr-reviewer reads this)           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | File Location | Status |
|-----------|----------------|---------------|--------|
| `execute-phase.md` | After last wave: create draft PR on feature branch | `files/commands/vit/execute-phase.md` | MODIFY |
| `verify-work.md` | After all tests pass: promote PR to ready-for-review; spawn vit-pr-reviewer | `files/commands/vit/verify-work.md` | MODIFY |
| `complete-milestone.md` | Spawn vit-changelog-writer before archiving | `files/commands/vit/complete-milestone.md` | MODIFY (already has PR flow at step 9) |
| `vit-pr-reviewer` | Read PR diffs, post structured review comments to GitHub PR | `files/agents/vit-pr-reviewer.md` | NEW |
| `vit-doc-updater` | After each executor wave completes: read SUMMARY.md, update relevant docs | `files/agents/vit-doc-updater.md` | NEW |
| `vit-changelog-writer` | Aggregate all phase SUMMARY.md files for a milestone, write CHANGELOG entry | `files/agents/vit-changelog-writer.md` | NEW |
| `STATE.md` (template) | Add PR Mapping section to track PR numbers per phase | `files/vit/templates/state.md` | MODIFY |

---

## Integration Points

### 1. execute-phase.md — Draft PR creation

**Where:** After step 10.5 (push to GitHub) and before step 11 (offer next steps).

**What to add:** A new step 10.7 "Create draft PR".

**Context available at that point:**
- `WORK_DIR` — the correct worktree path
- `DESIGNATED_BRANCH` — the feature branch name
- `FEATURE_ISSUE` — the GitHub issue number (already resolved in step 8.5)
- `MILESTONE` — milestone version string
- `PHASE_NUM` and `PHASE_DIR` — from earlier steps
- Phase goal from ROADMAP.md

**Logic:**
```bash
# Only if on a feature branch (not main/milestone)
if echo "$DESIGNATED_BRANCH" | grep -q "^feature/"; then
  # Check if a PR already exists for this branch
  EXISTING_PR=$(cd "$WORK_DIR" && gh pr list --head "$DESIGNATED_BRANCH" \
    --json number --jq '.[0].number' 2>/dev/null || echo "")

  if [ -z "$EXISTING_PR" ]; then
    PR_URL=$(cd "$WORK_DIR" && gh pr create \
      --title "feat(${PHASE_NUM}): [phase name]" \
      --base "milestone/v${MILESTONE}" \
      --head "$DESIGNATED_BRANCH" \
      --draft \
      --body "[auto-generated from phase goal + VERIFICATION.md]")
    PR_NUMBER=$(echo "$PR_URL" | grep -o '[0-9]*$')
    # Store PR number in STATE.md PR Mapping
  fi
fi
```

**Branch base:** PRs should target the `milestone/vX.Y` branch (not `main`), because feature branches diverge from the milestone branch. The milestone PR into main already exists at the complete-milestone step.

**STATE.md write:** After creating the PR, write the PR number into the new PR Mapping table in STATE.md (see STATE.md schema changes below).

**Doc-updater spawn:** After PR creation (or if PR already exists), spawn `vit-doc-updater` to update docs from the completed phase SUMMARY.md files. This runs as a non-blocking parallel Task if the workflow configuration permits, but must complete before step 11.

### 2. verify-work.md — PR promotion + PR reviewer spawn

**Where:** After step 8 (post UAT comment on GitHub feature issue), when Route A or B (all tests pass). Insert as new step 8.5.

**What to add:** Two operations:
1. Promote the draft PR to "ready for review"
2. Spawn `vit-pr-reviewer` to post a structured code review

**Logic:**
```bash
# Resolve PR number from STATE.md PR Mapping
PR_NUMBER=$(grep "| ${MILESTONE}/${PHASE_NUM} " .planning/STATE.md \
  | grep -o 'pr#[0-9]*' | grep -o '[0-9]*$' || echo "")

if [ -n "$PR_NUMBER" ]; then
  # Promote from draft
  gh pr ready "$PR_NUMBER" 2>/dev/null || true
fi
```

Then spawn `vit-pr-reviewer`:
```
Task(
  prompt="Working directory: {work_dir}
Phase: {phase_num}
PR number: {pr_number}
Feature branch: {designated_branch}

Read the PR diff and post a structured review comment on PR #{pr_number}.
...",
  subagent_type="vit-pr-reviewer",
  model="{executor_model}"
)
```

**Condition:** Only run when Route A or B (all tests pass). Do not promote/review when Route C (issues found) or Route D (blocked).

### 3. complete-milestone.md — Changelog writer

**Where:** At existing step 3 ("Extract accomplishments"), immediately before the template is filled. The changelog writer reads the same SUMMARY.md files step 3 reads and produces a structured changelog entry.

**Why step 3:** Step 3 already gathers all phase SUMMARY.md files. The changelog writer needs exactly this data. Inserting here avoids a second pass over all SUMMARY files.

**Logic:** Spawn `vit-changelog-writer` as a Task before the accomplishments summary is presented. The changelog writer creates `CHANGELOG.md` (or appends to it if it exists) and returns the entry text. The orchestrator can then reference or present this to the user.

**Condition:** This runs regardless of PR state. Changelog is written as part of the archiving process.

**Note:** `complete-milestone.md` step 9 already handles PR creation (Case A) and merge (Case C). The changelog writer does NOT replace this — it runs before step 4 (archive milestone).

### 4. vit-doc-updater — Integration with executor flow

**When spawned:** By `execute-phase.md` after the final wave completes (step 10.7 above), once all SUMMARY.md files exist for the phase.

**What it reads:**
- All `*-SUMMARY.md` files in the completed phase directory
- Existing project docs (README, docs/ folder if any, API docs)
- PROJECT.md for context

**What it writes:**
- Updates existing documentation files in-place
- Does NOT create new docs unless the phase goal explicitly created a new component with no docs

**Scope constraint:** doc-updater operates only on documentation files (`*.md`, `docs/`) not source code. It must not modify PLAN.md, SUMMARY.md, VERIFICATION.md, or any `.planning/` files.

**Commit behavior:** doc-updater commits its own changes with format `docs({phase}): update documentation from phase summary`. This follows the existing pattern where executor agents commit their own work.

---

## Data Flow

### PR Number Flow

```
execute-phase (creates draft PR)
    │
    ├── gh pr create → returns PR URL → parse PR_NUMBER
    │
    └── write to STATE.md PR Mapping:
        | Milestone/Phase | Branch | Issue | PR |
        | v1.1/3          | feature/v1.1-3-auth | #45 | pr#67 |

verify-work (promotes PR)
    │
    └── reads PR_NUMBER from STATE.md PR Mapping
        └── gh pr ready PR_NUMBER
        └── spawns vit-pr-reviewer with PR_NUMBER

complete-milestone (merges PR)
    │
    └── step 9 already reads PR via gh pr list --head CURRENT_BRANCH
        └── this works without PR Mapping (uses branch directly)
        └── PR Mapping is for cross-command handoff only
```

### Doc Update Flow

```
execute-phase completes last wave
    │
    ├── SUMMARY.md files exist for all plans
    │
    └── spawns vit-doc-updater
            │
            ├── reads phases/NN-name/*-SUMMARY.md
            ├── reads README.md, docs/*.md (if exist)
            ├── edits documentation
            └── commits: docs({phase}): update docs from phase summary
```

### Changelog Flow

```
complete-milestone step 3
    │
    └── spawns vit-changelog-writer
            │
            ├── reads all phases/*-SUMMARY.md for milestone range
            ├── reads ROADMAP.md for phase goals
            ├── writes/appends CHANGELOG.md
            └── returns entry text to orchestrator

orchestrator presents entry for confirmation
    └── continues to step 4 (archive milestone)
```

---

## Recommended Project Structure for New Files

```
files/
├── agents/
│   ├── vit-pr-reviewer.md        # NEW — posts review on GitHub PR
│   ├── vit-doc-updater.md        # NEW — updates docs from SUMMARY.md
│   └── vit-changelog-writer.md   # NEW — writes CHANGELOG.md entries
│
├── commands/vit/
│   ├── execute-phase.md          # MODIFY — add step 10.7 (draft PR + doc-updater)
│   ├── verify-work.md            # MODIFY — add step 8.5 (promote PR + pr-reviewer)
│   └── complete-milestone.md     # MODIFY — add changelog-writer spawn at step 3
│
└── vit/templates/
    └── state.md                  # MODIFY — add PR Mapping schema
```

---

## STATE.md Schema Changes

### New Section: PR Mapping

The existing "GitHub Issue Mapping" section uses this format:
```markdown
## GitHub Issue Mapping

| Phase | Branch | Issues |
|-------|--------|--------|
| v1.0/1 | feature/v1.0-1-foundation | #12 #13 #14 |
```

Add a new column `PR` to the same row (not a separate section). This avoids creating another table that orchestrators must parse separately.

**New format:**
```markdown
## GitHub Issue Mapping

| Phase | Branch | Issues | PR |
|-------|--------|--------|----|
| v1.1/1 | feature/v1.1-1-foundation | #12 #13 #14 | pr#45 |
| v1.1/2 | feature/v1.1-2-auth | #15 #16 | pr#46 |
| v1.1/3 | feature/v1.1-3-api | #17 | — |
```

**Why same table:** All commands already parse the GitHub Issue Mapping table to get branch and issue. Adding the PR column to the same row means a single grep pattern captures all phase context. Splitting into two tables would require two separate greps and correlation logic.

**PR column values:**
- `pr#N` — PR has been created (N = GitHub PR number)
- `—` — No PR yet (phase not yet executed or push not configured)

**Parsing pattern for PR number:**
```bash
PR_NUMBER=$(grep "| ${MILESTONE}/${PHASE_NUM} " .planning/STATE.md \
  | grep -o 'pr#[0-9]*' | grep -o '[0-9]*' || echo "")
```

---

## Architectural Patterns

### Pattern 1: Orchestrator Stays Lean

All three existing commands (execute-phase, verify-work, complete-milestone) follow the same pattern: the command orchestrates, agents do the work. The new components must follow this.

**What:** Command resolves context, calls `gh` for simple state changes (PR create/promote), spawns agents for complex work (reviewing code, writing changelog, updating docs).

**When to use:** Always. Never put multi-step reasoning or file modification logic directly in command files.

**Example:**
- execute-phase calls `gh pr create` directly (simple shell command)
- execute-phase spawns `vit-doc-updater` for doc analysis and writing

### Pattern 2: Non-Blocking Parallel Tasks Where Safe

execute-phase already runs executor agents in parallel within a wave. The same pattern applies to the new agents where they have no output dependency.

**When safe to parallelize:**
- vit-doc-updater can run in parallel with the push step (step 10.5) if no ordering constraint
- vit-pr-reviewer can be fire-and-forget from verify-work's perspective (review comment doesn't block next step)

**When NOT safe:**
- vit-changelog-writer must complete before step 4 (archive) — its output feeds the archive
- Draft PR must be created before vit-doc-updater is spawned (doc commits must land on the feature branch that the PR tracks)

### Pattern 3: Graceful Degradation on Missing GitHub Context

Existing commands already use `|| true` on all `gh` calls and check for empty `FEATURE_ISSUE`. New components must follow the same pattern: if `PR_NUMBER` is empty, log a warning and continue rather than failing.

**What:**
```bash
if [ -n "$PR_NUMBER" ]; then
  gh pr ready "$PR_NUMBER" 2>/dev/null || true
else
  echo "No PR found for phase ${PHASE_NUM} — skipping PR promotion"
fi
```

**Why:** VIT is used in projects without GitHub integration. New features must not break the non-GitHub path.

---

## Anti-Patterns

### Anti-Pattern 1: Creating Draft PR From Main Worktree

**What people do:** Create the PR when `execute-phase` is called from the main worktree (on main or milestone branch) rather than from the feature branch worktree.

**Why it's wrong:** `gh pr create` must be called from within the feature branch worktree (`WORK_DIR`). Creating it from main would target the wrong base branch and show wrong diffs.

**Do this instead:** Always prefix PR creation with `cd "$WORK_DIR" && gh pr create ...`. The `WORK_DIR` variable is already set by step 0.5 of execute-phase.

### Anti-Pattern 2: PR Targets Main Instead of Milestone Branch

**What people do:** Set `--base main` when creating the feature PR.

**Why it's wrong:** Feature branches are cut from `milestone/vX.Y`, not from `main`. The complete-milestone command handles the milestone-to-main PR separately. Targeting main from a feature branch creates a PR with wrong diff scope and a broken merge order.

**Do this instead:** Use `--base "milestone/v${MILESTONE}"` for feature PRs. The milestone PR into main is managed by complete-milestone step 9 (already implemented).

### Anti-Pattern 3: Doc-Updater Runs After Every Wave

**What people do:** Spawn doc-updater after each wave completes.

**Why it's wrong:** Mid-phase SUMMARY.md files are partial — they describe one plan's work, not the full phase outcome. Documentation updated from partial context will be inaccurate and require overwriting.

**Do this instead:** Spawn doc-updater once, after all waves complete and all SUMMARY.md files exist for the phase. The `PLAN_LIST` variable already collects all plan paths at step 6.5.

### Anti-Pattern 4: vit-pr-reviewer Blocks PR Promotion

**What people do:** Wait for pr-reviewer to post its comment before promoting the PR to ready-for-review.

**Why it's wrong:** The review comment is informational. The human reviewer needs to see the PR regardless of whether the automated review comment is posted. Blocking promotion on the review post delays the human reviewer unnecessarily.

**Do this instead:** Call `gh pr ready` first, then spawn vit-pr-reviewer as a non-blocking Task. The Task tool blocks the orchestrator until completion, but this is acceptable because the PR promotion and agent spawn happen in the same step before control returns to the user.

---

## Build Order

The dependencies between new components determine which must be built first:

```
Phase 1 (Foundation):
  STATE.md schema change (add PR column)
    └── required by: execute-phase PR creation step,
                     verify-work PR promotion step

Phase 2 (Core Agents — parallel, no dependency between them):
  vit-pr-reviewer agent
    └── required by: verify-work modification
  vit-doc-updater agent
    └── required by: execute-phase modification
  vit-changelog-writer agent
    └── required by: complete-milestone modification

Phase 3 (Command Modifications — depends on Phase 1 + 2):
  execute-phase.md modification
    └── adds: draft PR creation (step 10.7) + doc-updater spawn
    └── requires: STATE.md schema (to write PR number),
                  vit-doc-updater agent
  verify-work.md modification
    └── adds: PR promotion + pr-reviewer spawn (step 8.5)
    └── requires: STATE.md schema (to read PR number),
                  vit-pr-reviewer agent
  complete-milestone.md modification
    └── adds: changelog-writer spawn (before step 4)
    └── requires: vit-changelog-writer agent
```

**Recommended phase structure for roadmap:**
1. STATE.md schema + vit-doc-updater + vit-pr-reviewer + vit-changelog-writer (can all be in one phase, parallel plans)
2. execute-phase modification
3. verify-work modification
4. complete-milestone modification

Phases 2, 3, 4 can be collapsed into one phase if the planner assigns them to different waves with the agent files as wave 1 and command modifications as wave 2.

---

## Integration Points Summary

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub API (via gh CLI) | `gh pr create`, `gh pr ready`, `gh pr view` | All calls use `|| true` for graceful degradation |
| GitHub PR review API | `gh pr review --comment` (in vit-pr-reviewer) | PR number comes from STATE.md PR Mapping |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| execute-phase → vit-doc-updater | Task() spawn with WORK_DIR + phase plans list | After all waves complete |
| execute-phase → STATE.md | Direct write of PR number to PR Mapping column | After `gh pr create` succeeds |
| verify-work → STATE.md | Direct read of PR number from PR Mapping column | To call `gh pr ready` |
| verify-work → vit-pr-reviewer | Task() spawn with PR_NUMBER + WORK_DIR | After PR promoted to ready |
| complete-milestone → vit-changelog-writer | Task() spawn with milestone range + WORK_DIR | Before step 4 archive |
| vit-pr-reviewer → GitHub | `gh pr review` or `gh api` for review comment | Reads PR diff via `gh pr diff` |
| vit-doc-updater → filesystem | Edit/Write calls only on `*.md` and `docs/` | Must not touch `.planning/` |
| vit-changelog-writer → CHANGELOG.md | Write or append | Creates file if missing |

---

## Sources

- Direct reading of `files/commands/vit/execute-phase.md` (HIGH confidence — authoritative)
- Direct reading of `files/commands/vit/verify-work.md` (HIGH confidence — authoritative)
- Direct reading of `files/commands/vit/complete-milestone.md` (HIGH confidence — authoritative)
- Direct reading of `files/commands/vit/review-feedback.md` (HIGH confidence — authoritative)
- Direct reading of `files/agents/vit-github-reviewer.md` (HIGH confidence — authoritative)
- Direct reading of `.planning/codebase/ARCHITECTURE.md` (HIGH confidence — authoritative)
- Direct reading of `.planning/codebase/STRUCTURE.md` (HIGH confidence — authoritative)
- Direct reading of `.planning/codebase/INTEGRATIONS.md` (HIGH confidence — authoritative)
- Direct reading of `files/vit/templates/state.md` (HIGH confidence — authoritative)

---
*Architecture research for: vit-cc GitHub PR lifecycle and agent extensions*
*Researched: 2026-03-18*
