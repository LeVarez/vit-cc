---
phase: 01-pr-lifecycle-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/vit/templates/state.md
  - files/vit/templates/state.md
  - .claude/commands/vit/execute-phase.md
  - files/commands/vit/execute-phase.md
  - .claude/vit/workflows/execute-phase.md
  - files/vit/workflows/execute-phase.md
  - .claude/commands/vit/new-milestone.md
  - files/commands/vit/new-milestone.md
autonomous: true

must_haves:
  truths:
    - "Running execute-phase creates a draft PR targeting milestone/vX.Y.Z with phase goal, plans checklist, success criteria, and Closes #N in the body"
    - "Re-running execute-phase on the same phase does NOT create a second PR"
    - "STATE.md GitHub Issue Mapping table has a PR column showing pr#N after PR creation"
    - "When gh CLI is unavailable, execute-phase prints one-line notice and STATE.md shows pr:skipped"
  artifacts:
    - path: ".claude/commands/vit/execute-phase.md"
      provides: "Draft PR creation step in execute-phase command"
      contains: "gh pr create --draft"
    - path: ".claude/vit/workflows/execute-phase.md"
      provides: "Draft PR creation step in execute-phase workflow"
      contains: "gh pr create --draft"
    - path: ".claude/vit/templates/state.md"
      provides: "PR column in GitHub Issue Mapping table template"
      contains: "| PR |"
    - path: ".claude/commands/vit/new-milestone.md"
      provides: "PR column in GitHub Issue Mapping table creation"
      contains: "| PR |"
  key_links:
    - from: ".claude/commands/vit/execute-phase.md"
      to: "STATE.md GitHub Issue Mapping"
      via: "writes pr#N to PR column after gh pr create"
      pattern: "pr#"
    - from: ".claude/commands/vit/execute-phase.md"
      to: "gh pr list --head"
      via: "idempotency check before creation"
      pattern: "gh pr list.*--head"
---

<objective>
Add draft PR creation to execute-phase and extend STATE.md schema with a PR column.

Purpose: When a developer runs execute-phase, a draft PR is automatically created on GitHub targeting the milestone branch, with a structured body containing the phase goal, plan checklist, success criteria, and issue links. The PR number is recorded in STATE.md so downstream commands (verify-work, Phase 2 reviewer) can find it without querying GitHub.

Output: Modified execute-phase command, execute-phase workflow, STATE.md template, and new-milestone command (all with PR column support). Both `.claude/` and `files/` copies updated identically.
</objective>

<execution_context>
@./.claude/vit/workflows/execute-plan.md
@./.claude/vit/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-pr-lifecycle-foundation/01-CONTEXT.md

Key files to modify:
@.claude/commands/vit/execute-phase.md
@files/commands/vit/execute-phase.md
@.claude/vit/workflows/execute-phase.md
@files/vit/workflows/execute-phase.md
@.claude/vit/templates/state.md
@files/vit/templates/state.md
@.claude/commands/vit/new-milestone.md
@files/commands/vit/new-milestone.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add PR column to STATE.md template and new-milestone command</name>
  <files>
    .claude/vit/templates/state.md
    files/vit/templates/state.md
    .claude/commands/vit/new-milestone.md
    files/commands/vit/new-milestone.md
  </files>
  <action>
  **STATE.md template** (both `.claude/vit/templates/state.md` and `files/vit/templates/state.md` — must be identical):

  In the template's `## File Template` code block, there is currently NO GitHub Issue Mapping section. This section is created dynamically by `new-milestone.md` Phase 10 and written into the actual STATE.md. The template file documents the schema but does not contain this section in the template itself.

  Add a new `<section>` documentation block to the template (after the existing `### Session Continuity` section block) that documents the PR column:

  ```markdown
  ### GitHub Issue Mapping
  Tracks GitHub artifact numbers per phase. Created by `/vit:new-milestone`.
  Columns:
  - Phase: milestone-scoped key (e.g., `v1.0/01`)
  - Feature Issue: `#N` linking to the parent feature issue
  - Branch: feature branch name
  - PR: Draft PR number. Values:
    - `—` (em-dash): No PR created yet
    - `pr#N`: Draft PR created (number N)
    - `pr#N(ready)`: PR promoted to ready-for-review
    - `pr:skipped`: gh CLI unavailable, PR creation skipped
  ```

  **new-milestone.md** (both `.claude/commands/vit/new-milestone.md` and `files/commands/vit/new-milestone.md` — must be identical):

  In Phase 10 where the GitHub Issue Mapping table is created, add a `PR` column. Change the table from:

  ```
  | Phase | Feature Issue | Branch |
  |-------|---------------|--------|
  | v[X.Y.Z]/[N] | #[FEATURE_ISSUE] | feature/v[X.Y.Z]-[N]-[phase-slug] |
  ```

  to:

  ```
  | Phase | Feature Issue | Branch | PR |
  |-------|---------------|--------|----|
  | v[X.Y.Z]/[N] | #[FEATURE_ISSUE] | feature/v[X.Y.Z]-[N]-[phase-slug] | — |
  ```

  The initial value is `—` (em-dash), meaning no PR exists yet. Also update the print summary table in the same Phase 10 to include the PR column with `—` values.

  IMPORTANT: Both `.claude/` and `files/` copies of each file must be exactly identical after edits.
  </action>
  <verify>
  Run:
  ```bash
  grep -n "| PR |" .claude/vit/templates/state.md
  grep -n "| PR |" .claude/commands/vit/new-milestone.md
  diff .claude/vit/templates/state.md files/vit/templates/state.md
  diff .claude/commands/vit/new-milestone.md files/commands/vit/new-milestone.md
  ```
  First two greps return lines. Both diffs return empty (files are identical).
  </verify>
  <done>STATE.md template documents PR column schema. new-milestone creates the table with a PR column initialized to em-dash. Both .claude/ and files/ copies are identical.</done>
</task>

<task type="auto">
  <name>Task 2: Add idempotent draft PR creation to execute-phase</name>
  <files>
    .claude/commands/vit/execute-phase.md
    files/commands/vit/execute-phase.md
    .claude/vit/workflows/execute-phase.md
    files/vit/workflows/execute-phase.md
  </files>
  <action>
  Add a new step to the execute-phase command AND the execute-phase workflow. The step runs AFTER step 0.5 (verify worktree and branch) and BEFORE step 1 (validate phase). Call it step **0.7: Create draft PR**.

  **In execute-phase command** (`.claude/commands/vit/execute-phase.md` and `files/commands/vit/execute-phase.md`):

  Add step 0.7 between step 0.5 and step 1 with this logic:

  ```
  0.7. **Create draft PR**

     Check if gh CLI is available:
     ```bash
     gh --version 2>/dev/null && GH_AVAILABLE=true || GH_AVAILABLE=false
     ```

     If `GH_AVAILABLE=false`:
     - Log: `[PR skipped — gh not available]`
     - Update STATE.md PR column for this phase to `pr:skipped`
     - Continue to step 1

     If `GH_AVAILABLE=true`:

     **Idempotency check — query live, don't trust STATE.md:**
     ```bash
     EXISTING_PR=$(cd "$WORK_DIR" && gh pr list --head "$DESIGNATED_BRANCH" --json number,state --jq '.[0].number' 2>/dev/null || echo "")
     ```

     If `EXISTING_PR` is non-empty:
     - Log: `Draft PR already exists: #$EXISTING_PR`
     - Ensure STATE.md PR column shows `pr#$EXISTING_PR` (update if missing)
     - Continue to step 1 (no duplicate creation)

     If no existing PR:

     **Read phase metadata for PR body:**
     ```bash
     PHASE_NAME=$(basename "$PHASE_DIR" | sed 's/^[0-9]*-//')
     PHASE_GOAL=$(grep -A2 "### Phase ${PHASE_NUM}:" "$WORK_DIR/.planning/ROADMAP.md" | grep "Goal:" | sed 's/.*\*\*Goal\*\*: //')
     MILESTONE_BRANCH="milestone/${MILESTONE}"

     # Get feature issue number from STATE.md
     FEATURE_ISSUE=$(grep "| ${MILESTONE}/${PHASE_NUM} " "$WORK_DIR/.planning/STATE.md" 2>/dev/null | grep -o '#[0-9][0-9]*' | head -1 | tr -d '#')
     if [ -z "$FEATURE_ISSUE" ]; then
       FEATURE_ISSUE=$(grep "| ${PHASE_NUM} " "$WORK_DIR/.planning/STATE.md" 2>/dev/null | grep -o '#[0-9][0-9]*' | head -1 | tr -d '#')
     fi

     # Get plan list for checklist
     PLAN_LIST=$(ls -1 "$WORK_DIR/$PHASE_DIR"/*-PLAN.md 2>/dev/null | while read f; do
       PLAN_NUM=$(basename "$f" | grep -o '^[0-9]*-[0-9]*')
       PLAN_OBJ=$(grep -A1 '<objective>' "$f" | tail -1 | sed 's/^ *//')
       echo "- [ ] ${PLAN_NUM}: ${PLAN_OBJ}"
     done)

     # Get success criteria from ROADMAP.md
     SUCCESS_CRITERIA=$(sed -n "/### Phase ${PHASE_NUM}:/,/### Phase/p" "$WORK_DIR/.planning/ROADMAP.md" | grep -A50 "Success Criteria" | grep "^  [0-9]" | sed 's/^  //')

     # Get blockers for this phase from STATE.md (if any)
     PHASE_BLOCKERS=$(grep "\[Phase ${PHASE_NUM}\]" "$WORK_DIR/.planning/STATE.md" 2>/dev/null | sed 's/^- //')
     ```

     **Create draft PR:**
     ```bash
     PR_TITLE="feat(phase-${PHASE_NUM}): $(echo "$PHASE_NAME" | tr '-' ' ')"

     PR_BODY="## Goal
     ${PHASE_GOAL}

     ## Plans
     ${PLAN_LIST}

     ## Success Criteria
     ${SUCCESS_CRITERIA}

     $(if [ -n "$PHASE_BLOCKERS" ]; then echo "## Notes"; echo "$PHASE_BLOCKERS"; fi)

     ## Links
     Feature issue: #${FEATURE_ISSUE}
     Closes #${FEATURE_ISSUE}"

     NEW_PR=$(cd "$WORK_DIR" && gh pr create \
       --draft \
       --base "$MILESTONE_BRANCH" \
       --title "$PR_TITLE" \
       --body "$PR_BODY" \
       2>/dev/null || echo "")
     ```

     If `NEW_PR` is empty (creation failed):
     - Log: `[PR skipped — creation failed]`
     - Update STATE.md PR column to `pr:skipped`
     - Continue to step 1 (non-blocking)

     If `NEW_PR` is non-empty:
     - Extract PR number: `PR_NUM=$(echo "$NEW_PR" | grep -o '[0-9]*$')`
     - Log: `Draft PR created: #$PR_NUM`
     - Update STATE.md PR column from `—` to `pr#$PR_NUM` for this phase row
     - Continue to step 1
  ```

  **Updating STATE.md PR column** — use sed to find the row matching the phase key and replace the last column:
  ```bash
  # Pattern: find row with phase key, replace last column value
  cd "$WORK_DIR" && sed -i '' "s/| ${MILESTONE}\/${PHASE_NUM} .*|[^|]*$/& /; s/| —[[:space:]]*$/| pr#${PR_NUM} |/" .planning/STATE.md
  ```
  Note: The exact sed pattern may need adjustment — the executor should ensure the PR column value is correctly updated in the phase's row. An alternative is to read STATE.md, find the line, replace the last cell, and write back.

  **In execute-phase workflow** (`.claude/vit/workflows/execute-phase.md` and `files/vit/workflows/execute-phase.md`):

  Add a corresponding `<step name="create_draft_pr">` between `validate_phase` and `discover_plans` steps. The content mirrors the command's step 0.7 logic described above. Keep the workflow description more concise (it's a reference, not the primary prompt), focusing on: gh availability check, idempotency via `gh pr list --head`, PR body assembly (goal, plans, success criteria, notes, links), `gh pr create --draft --base milestone/vX.Y.Z`, STATE.md PR column update, graceful skip on failure.

  IMPORTANT:
  - The `--base` flag MUST target `milestone/vX.Y.Z` (PRL-02), NEVER `main`.
  - The body MUST include phase goal, plan checklist, success criteria, feature issue link, and `Closes #N` (PRL-03).
  - Idempotency: always check `gh pr list --head` before creating (PRL-01). Never trust STATE.md alone for this check.
  - Graceful failure: if gh is unavailable or creation fails, log one line and continue (PRL-06). Do NOT abort execute-phase.
  - Both `.claude/` and `files/` copies must be exactly identical after edits.
  </action>
  <verify>
  Run:
  ```bash
  grep -c "gh pr create --draft" .claude/commands/vit/execute-phase.md
  grep -c "gh pr list --head" .claude/commands/vit/execute-phase.md
  grep -c "milestone/" .claude/commands/vit/execute-phase.md
  grep -c "Closes #" .claude/commands/vit/execute-phase.md
  grep -c "pr:skipped" .claude/commands/vit/execute-phase.md
  grep -c "create_draft_pr" .claude/vit/workflows/execute-phase.md
  diff .claude/commands/vit/execute-phase.md files/commands/vit/execute-phase.md
  diff .claude/vit/workflows/execute-phase.md files/vit/workflows/execute-phase.md
  ```
  All grep counts >= 1. Both diffs return empty.
  </verify>
  <done>execute-phase creates a draft PR on first run (idempotent), targets milestone branch, includes structured body with goal/plans/criteria/links, records pr#N in STATE.md, and skips gracefully when gh is unavailable. Both .claude/ and files/ copies are identical.</done>
</task>

</tasks>

<verification>
After both tasks complete:
1. STATE.md template documents PR column values (—, pr#N, pr#N(ready), pr:skipped)
2. new-milestone creates GitHub Issue Mapping table WITH PR column
3. execute-phase has draft PR creation step between worktree check and plan validation
4. Idempotency guard uses `gh pr list --head` (never duplicates)
5. PR base branch is always `milestone/vX.Y.Z`
6. PR body has: ## Goal, ## Plans (checklist), ## Success Criteria, ## Notes (if blockers), ## Links (Closes #N)
7. PR title uses conventional commits: `feat(phase-N): phase name`
8. gh unavailability produces one-line notice and pr:skipped in STATE.md
9. All modified files have identical .claude/ and files/ copies
</verification>

<success_criteria>
- execute-phase step 0.7 creates draft PR with idempotency guard
- PR targets milestone/vX.Y.Z, never main
- PR body includes goal, plans, criteria, issue link, Closes #N
- STATE.md PR column updated to pr#N on success, pr:skipped on gh unavailability
- Re-running execute-phase on same phase does not create duplicate PR
- No execution aborts when gh is unavailable or PR creation fails
</success_criteria>

<output>
After completion, create `.planning/phases/01-pr-lifecycle-foundation/01-01-SUMMARY.md`
</output>
