---
name: vit:execute-phase
description: Execute all plans in a phase with wave-based parallelization
argument-hint: "<phase-number> [--gaps-only]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - TodoWrite
  - AskUserQuestion
---

<objective>
Execute all plans in a phase using wave-based parallel execution.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.

Context budget: ~15% orchestrator, 100% fresh per subagent.
</objective>

<execution_context>
@./.claude/vit/references/ui-brand.md
@./.claude/vit/workflows/execute-phase.md
</execution_context>

<context>
Phase: $ARGUMENTS

**Flags:**
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.

@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<process>
0. **Resolve Model Profile**

   Read model profile for agent spawning:
   ```bash
   MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
   ```

   Default to "balanced" if not set.

   **Model lookup table:**

   | Agent | quality | balanced | budget |
   |-------|---------|----------|--------|
   | vit-executor | opus | sonnet | sonnet |
   | vit-verifier | sonnet | sonnet | haiku |

   Store resolved models for use in Task calls below.

0.5. **Verify worktree and branch**

   Extract the phase number from `$ARGUMENTS` and look up the designated branch in STATE.md:

   ```bash
   PHASE_NUM=$(echo "$ARGUMENTS" | grep -o '^[0-9]*')
   MILESTONE=$(grep "^Milestone:" .planning/STATE.md 2>/dev/null | sed 's/Milestone: //' | tr -d ' ')
   if [ -z "$MILESTONE" ]; then
     MILESTONE=$(git branch --show-current | grep -o 'v[0-9]*\.[0-9]*' | head -1)
   fi
   # Try milestone-scoped key first, fall back to legacy global key
   DESIGNATED_BRANCH=$(grep "| ${MILESTONE}/${PHASE_NUM} " .planning/STATE.md 2>/dev/null | grep -o 'feature/[^ |]*')
   if [ -z "$DESIGNATED_BRANCH" ]; then
     DESIGNATED_BRANCH=$(grep "| ${PHASE_NUM} " .planning/STATE.md 2>/dev/null | grep -o 'feature/[^ |]*')
   fi
   CURRENT_BRANCH=$(git branch --show-current)
   MAIN_WORKTREE=$(git worktree list --porcelain | grep "^worktree " | head -1 | sed 's/worktree //')
   CURRENT_DIR=$(pwd)
   IN_MAIN_WORKTREE=$( [ "$CURRENT_DIR" = "$MAIN_WORKTREE" ] && echo "yes" || echo "no" )
   WORK_DIR="$CURRENT_DIR"  # default — may be overridden below
   ```

   1. **If `DESIGNATED_BRANCH` is not found in STATE.md:**

      - Warn: "No designated branch found for phase $PHASE_NUM in STATE.md — continuing on current branch: $CURRENT_BRANCH"
      - `WORK_DIR=$(pwd)` — continue

   2. **If `DESIGNATED_BRANCH` is found and already on it and not in main worktree:**

      - Log: "Already on designated branch in worktree: $DESIGNATED_BRANCH"
      - `WORK_DIR=$(pwd)` — continue

   3. **If `DESIGNATED_BRANCH` is found and in main worktree:**

      - Check if a worktree for this branch already exists:
        ```bash
        EXISTING_WORKTREE=$(git worktree list --porcelain | grep -B2 "branch refs/heads/$DESIGNATED_BRANCH" | grep "^worktree " | sed 's/worktree //')
        ```
      - **If worktree already exists:** `WORK_DIR=$EXISTING_WORKTREE` — log "Using existing worktree: $WORK_DIR" — continue
      - **If no worktree exists:** create one and set `WORK_DIR`:
        ```bash
        WORKTREE_NAME=$(echo "$DESIGNATED_BRANCH" | sed 's|.*/||')
        WORKTREE_PATH="${MAIN_WORKTREE%/*}/$WORKTREE_NAME"
        git worktree add "$WORKTREE_PATH" "$DESIGNATED_BRANCH" 2>/dev/null || \
          git worktree add -b "$DESIGNATED_BRANCH" "$WORKTREE_PATH"
        ```
        - If creation fails: STOP with error asking user to create the worktree manually
        - If creation succeeds: `WORK_DIR=$WORKTREE_PATH` — log "Created and using worktree: $WORK_DIR" — continue

   4. **If `DESIGNATED_BRANCH` is found, in a worktree, but on a different branch:**

      - Run `cd "$CURRENT_DIR" && git checkout "$DESIGNATED_BRANCH"`
      - **If checkout succeeds:** `WORK_DIR=$(pwd)` — log "Switched to designated branch: $DESIGNATED_BRANCH" — continue
      - **If checkout fails:** try `git checkout -b "$DESIGNATED_BRANCH" --track "origin/$DESIGNATED_BRANCH"`
        - If that also fails: STOP and ask user to create the branch
        - If it succeeds: `WORK_DIR=$(pwd)` — continue

   **After this step:** `WORK_DIR` holds the absolute path to the correct worktree. All subsequent bash commands must be prefixed with `cd "$WORK_DIR" &&`. All file paths are relative to `$WORK_DIR`.

0.7. **Create draft PR**

   Check if gh CLI is available:
   ```bash
   gh --version 2>/dev/null && GH_AVAILABLE=true || GH_AVAILABLE=false
   ```

   If `GH_AVAILABLE=false`:
   - Log: `[PR skipped — gh not available]`
   - Update STATE.md PR column for this phase to `pr:skipped`:
     ```bash
     cd "$WORK_DIR" && sed -i '' "s/| ${MILESTONE}\/${PHASE_NUM} \([^|]*\)| \([^|]*\)| \([^|]*\)| —/| ${MILESTONE}\/${PHASE_NUM} \1| \2| \3| pr:skipped/" .planning/STATE.md 2>/dev/null || true
     ```
   - Continue to step 1

   If `GH_AVAILABLE=true`:

   **Idempotency check — query live, don't trust STATE.md:**
   ```bash
   EXISTING_PR=$(cd "$WORK_DIR" && gh pr list --head "$DESIGNATED_BRANCH" --json number,state --jq '.[0].number' 2>/dev/null || echo "")
   ```

   If `EXISTING_PR` is non-empty:
   - Log: `Draft PR already exists: #$EXISTING_PR`
   - Ensure STATE.md PR column shows `pr#$EXISTING_PR` (update if currently `—` or missing):
     ```bash
     cd "$WORK_DIR" && sed -i '' "s/| ${MILESTONE}\/${PHASE_NUM} \([^|]*\)| \([^|]*\)| \([^|]*\)| —[[:space:]]*/| ${MILESTONE}\/${PHASE_NUM} \1| \2| \3| pr#${EXISTING_PR} /" .planning/STATE.md 2>/dev/null || true
     ```
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

   NEW_PR=$(cd "$WORK_DIR" && gh pr create --draft \
     --base "$MILESTONE_BRANCH" \
     --title "$PR_TITLE" \
     --body "$PR_BODY" \
     2>/dev/null || echo "")
   ```

   If `NEW_PR` is empty (creation failed):
   - Log: `[PR skipped — creation failed]`
   - Update STATE.md PR column to `pr:skipped`:
     ```bash
     cd "$WORK_DIR" && sed -i '' "s/| ${MILESTONE}\/${PHASE_NUM} \([^|]*\)| \([^|]*\)| \([^|]*\)| —[[:space:]]*/| ${MILESTONE}\/${PHASE_NUM} \1| \2| \3| pr:skipped /" .planning/STATE.md 2>/dev/null || true
     ```
   - Continue to step 1 (non-blocking)

   If `NEW_PR` is non-empty:
   - Extract PR number: `PR_NUM=$(echo "$NEW_PR" | grep -o '[0-9]*$')`
   - Log: `Draft PR created: #$PR_NUM`
   - Update STATE.md PR column from `—` to `pr#$PR_NUM` for this phase row:
     ```bash
     cd "$WORK_DIR" && sed -i '' "s/| ${MILESTONE}\/${PHASE_NUM} \([^|]*\)| \([^|]*\)| \([^|]*\)| —[[:space:]]*/| ${MILESTONE}\/${PHASE_NUM} \1| \2| \3| pr#${PR_NUM} /" .planning/STATE.md 2>/dev/null || true
     ```
   - Continue to step 1

1. **Validate phase exists**
   - Find phase directory matching argument
   - Count PLAN.md files
   - Error if no plans found

2. **Discover plans**
   - List all *-PLAN.md files in phase directory
   - Check which have *-SUMMARY.md (already complete)
   - If `--gaps-only`: filter to only plans with `gap_closure: true`
   - Build list of incomplete plans

3. **Group by wave**
   - Read `wave` from each plan's frontmatter
   - Group plans by wave number
   - Report wave structure to user

4. **Execute waves**
   For each wave in order:
   - Spawn `vit-executor` for each plan in wave (parallel Task calls)
   - Wait for completion (Task blocks)
   - Verify SUMMARYs created
   - **Per-wave push (Gap 5 safety):** Push commits to remote after each wave:
     ```bash
     cd "$WORK_DIR" && git push origin HEAD 2>/dev/null || true
     ```
   - **Update sub-issue checkboxes (Gap 4):** For each plan completed in this wave, mark its sub-issue checkbox in the feature issue body:
     ```bash
     # For each completed plan in this wave:
     PLAN_IDX=<plan index, 1-based>
     SUB_ISSUE=$(grep "| ${MILESTONE}/${PHASE_NUM} " "$WORK_DIR/.planning/STATE.md" 2>/dev/null \
       | grep -o '#[0-9][0-9]*' | sed -n "${PLAN_IDX}p" || echo "")
     # Fallback to legacy global key
     if [ -z "$SUB_ISSUE" ]; then
       SUB_ISSUE=$(grep "| ${PHASE_NUM} " "$WORK_DIR/.planning/STATE.md" 2>/dev/null \
         | grep -o '#[0-9][0-9]*' | sed -n "${PLAN_IDX}p" || echo "")
     fi
     if [ -n "$SUB_ISSUE" ] && [ -n "$FEATURE_ISSUE" ]; then
       CURRENT_BODY=$(cd "$WORK_DIR" && gh issue view "$FEATURE_ISSUE" --json body -q '.body' 2>/dev/null || echo "")
       UPDATED_BODY=$(echo "$CURRENT_BODY" | sed "s/- \[ \] $SUB_ISSUE/- [x] $SUB_ISSUE/g")
       cd "$WORK_DIR" && gh issue edit "$FEATURE_ISSUE" --body "$UPDATED_BODY" 2>/dev/null || true
     fi
     ```
   - Proceed to next wave

5. **Aggregate results**
   - Collect summaries from all plans
   - Report phase completion status

6. **Commit any orchestrator corrections**
   Check for uncommitted changes before verification:
   ```bash
   cd "$WORK_DIR" && git status --porcelain
   ```

   **If changes exist:** Orchestrator made corrections between executor completions. Commit them:
   ```bash
   cd "$WORK_DIR" && git add -u && git commit -m "fix({phase}): orchestrator corrections"
   ```

   **If clean:** Continue to verification.

6.5. **Generate unit tests**

    Spawn `vit-test-writer` to generate Vitest tests for all plans in this phase:

    ```bash
    PLAN_LIST=$(ls "$WORK_DIR/.planning/phases/${PHASE_DIR}"/*-PLAN.md 2>/dev/null | xargs -I{} basename {} | tr '\n' ' ')
    ```

    ```
    Task(
      prompt="First, read ./.claude/agents/vit-test-writer.md for your role and instructions.\n\nPhase: {phase_number}\nPhase name: {phase_name}\nWorking directory: {work_dir}\nPlans to cover: {plan_list}\n\nGenerate unit tests for all plans in this phase. Read each PLAN.md for must_haves and each SUMMARY.md for what was built.",
      subagent_type="general-purpose",
      model="{executor_model}",
      description="Write tests for Phase {phase}"
    )
    ```

    - If test writer returns `## TESTS WRITTEN`: log test file count, continue
    - If test writer returns errors: log warning, continue (tests are non-blocking)

7. **Verify phase goal**
   Check config: `WORKFLOW_VERIFIER=$(cat .planning/config.json 2>/dev/null | grep -o '"verifier"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")`

   **If `workflow.verifier` is `false`:** Skip to step 8 (treat as passed).

   **Otherwise:**
   - Spawn `vit-verifier` subagent with phase directory and goal
   - Verifier checks must_haves against actual codebase (not SUMMARY claims)
   - Creates VERIFICATION.md with detailed report
   - Route by status:
     - `passed` → continue to step 8
     - `human_needed` → present items, get approval or feedback
     - `gaps_found` → present gaps, offer `/vit:plan-phase {X} --gaps`

8. **Update roadmap and state**
   - Update ROADMAP.md, STATE.md

8.5. **Sync GitHub**

   Read STATE.md GitHub Issue Mapping and get the feature issue number for this phase.

   If a feature issue is found:

   **If phase status is `passed`:**
   ```bash
   cd "$WORK_DIR" && \
   GOAL=$(grep -A2 "### Phase {N}:" .planning/ROADMAP.md | grep "Goal:" | sed 's/.*Goal: //') && \
   VERIFICATION_SUMMARY=$(grep -m1 "^Status:\|^Summary:" .planning/phases/{phase_dir}/{phase}-VERIFICATION.md 2>/dev/null || echo "Phase goal verified") && \
   gh issue comment $FEATURE_ISSUE --body "## Phase complete ✓
   **Phase:** {N} — {Name}
   **Plans executed:** {N}
   **Goal verified:** $GOAL
   **Verification:** $VERIFICATION_SUMMARY" 2>/dev/null || true
   cd "$WORK_DIR" && gh issue close $FEATURE_ISSUE 2>/dev/null || true
   ```

   **If phase status is `gaps_found`:**
   ```bash
   cd "$WORK_DIR" && \
   GAPS=$(grep -A20 "## Gaps\|## Missing\|## What's Missing" .planning/phases/{phase_dir}/{phase}-VERIFICATION.md 2>/dev/null | head -20) && \
   gh issue comment $FEATURE_ISSUE --body "## Phase gaps found ⚠
   **Phase:** {N} — {Name}
   **Status:** Gaps found — issue remains open

   $GAPS" 2>/dev/null || true
   ```
   (Leave issue open)

9. **Update requirements**
   Mark phase requirements as Complete:
   - Read ROADMAP.md, find this phase's `Requirements:` line (e.g., "AUTH-01, AUTH-02")
   - Read REQUIREMENTS.md traceability table
   - For each REQ-ID in this phase: change Status from "Pending" to "Complete"
   - Write updated REQUIREMENTS.md
   - Skip if: REQUIREMENTS.md doesn't exist, or phase has no Requirements line

10. **Commit phase completion**
    Check `COMMIT_PLANNING_DOCS` from config.json (default: true).
    If false: Skip git operations for .planning/ files.
    If true: Bundle all phase metadata updates in one commit:
    ```bash
    cd "$WORK_DIR" && git add .planning/ROADMAP.md .planning/STATE.md
    cd "$WORK_DIR" && git add .planning/REQUIREMENTS.md  # if updated
    cd "$WORK_DIR" && git commit -m "docs({phase}): complete {phase-name} phase"
    ```

10.5. **Push to GitHub**
    Push the feature branch to origin:
    ```bash
    cd "$WORK_DIR" && git push origin HEAD
    ```
    - If push fails (no upstream): try `git push -u origin HEAD`
    - If that also fails: warn the user but do not block — continue to next step

11. **Offer next steps**
    - Route to next action (see `<offer_next>`)
</process>

<offer_next>
Output this markdown directly (not as a code block). Route based on status:

| Status | Route |
|--------|-------|
| `gaps_found` | Route C (gap closure) |
| `human_needed` | Present checklist, then re-route based on approval |
| `passed` + more phases | Route A (next phase) |
| `passed` + last phase | Route B (milestone complete) |

---

**Route A: Phase verified, more phases remain**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► PHASE {Z} COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {Z}: {Name}**

{Y} plans executed
Goal verified ✓

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Phase {Z+1}: {Name}** — {Goal from ROADMAP.md}

/vit:discuss-phase {Z+1} — gather context and clarify approach

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- /vit:plan-phase {Z+1} — skip discussion, plan directly
- /vit:verify-work {Z} — manual acceptance testing before continuing

───────────────────────────────────────────────────────────────

---

**Route B: Phase verified, milestone complete**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► MILESTONE COMPLETE 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**v1.0**

{N} phases completed
All phase goals verified ✓

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Audit milestone** — verify requirements, cross-phase integration, E2E flows

/vit:audit-milestone

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- /vit:verify-work — manual acceptance testing
- /vit:complete-milestone — skip audit, archive directly

───────────────────────────────────────────────────────────────

---

**Route C: Gaps found — need additional planning**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► PHASE {Z} GAPS FOUND ⚠
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {Z}: {Name}**

Score: {N}/{M} must-haves verified
Report: .planning/phases/{phase_dir}/{phase}-VERIFICATION.md

### What's Missing

{Extract gap summaries from VERIFICATION.md}

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Plan gap closure** — create additional plans to complete the phase

/vit:plan-phase {Z} --gaps

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- cat .planning/phases/{phase_dir}/{phase}-VERIFICATION.md — see full report
- /vit:verify-work {Z} — manual testing before planning

───────────────────────────────────────────────────────────────

---

After user runs /vit:plan-phase {Z} --gaps:
1. Planner reads VERIFICATION.md gaps
2. Creates plans 04, 05, etc. to close gaps
3. User runs /vit:execute-phase {Z} again
4. Execute-phase runs incomplete plans (04, 05...)
5. Verifier runs again → loop until passed
</offer_next>

<wave_execution>
**Parallel spawning:**

Before spawning, read file contents from `$WORK_DIR`. The `@` syntax does not work across Task() boundaries.

```bash
# Read each plan and STATE.md using WORK_DIR absolute paths
PLAN_01_CONTENT=$(cat "$WORK_DIR/{plan_01_path}")
PLAN_02_CONTENT=$(cat "$WORK_DIR/{plan_02_path}")
PLAN_03_CONTENT=$(cat "$WORK_DIR/{plan_03_path}")
STATE_CONTENT=$(cat "$WORK_DIR/.planning/STATE.md")
```

Spawn all plans in a wave with a single message containing multiple Task calls, with inlined content.
Pass `WORK_DIR` in each prompt so the executor runs git commands in the right directory:

```
Task(prompt="Working directory: {work_dir}\n\nAll git commands and file operations must be run as: cd {work_dir} && ...\n\nExecute plan at {work_dir}/{plan_01_path}\n\nPlan:\n{plan_01_content}\n\nProject state:\n{state_content}", subagent_type="vit-executor", model="{executor_model}")
Task(prompt="Working directory: {work_dir}\n\nAll git commands and file operations must be run as: cd {work_dir} && ...\n\nExecute plan at {work_dir}/{plan_02_path}\n\nPlan:\n{plan_02_content}\n\nProject state:\n{state_content}", subagent_type="vit-executor", model="{executor_model}")
Task(prompt="Working directory: {work_dir}\n\nAll git commands and file operations must be run as: cd {work_dir} && ...\n\nExecute plan at {work_dir}/{plan_03_path}\n\nPlan:\n{plan_03_content}\n\nProject state:\n{state_content}", subagent_type="vit-executor", model="{executor_model}")
```

All three run in parallel. Task tool blocks until all complete.

**No polling.** No background agents. No TaskOutput loops.
</wave_execution>

<checkpoint_handling>
Plans with `autonomous: false` have checkpoints. The execute-phase.md workflow handles the full checkpoint flow:
- Subagent pauses at checkpoint, returns structured state
- Orchestrator presents to user, collects response
- Spawns fresh continuation agent (not resume)

See `@./.claude/vit/workflows/execute-phase.md` step `checkpoint_handling` for complete details.
</checkpoint_handling>

<deviation_rules>
During execution, handle discoveries automatically:

1. **Auto-fix bugs** - Fix immediately, document in Summary
2. **Auto-add critical** - Security/correctness gaps, add and document
3. **Auto-fix blockers** - Can't proceed without fix, do it and document
4. **Ask about architectural** - Major structural changes, stop and ask user

Only rule 4 requires user intervention.
</deviation_rules>

<commit_rules>
**Per-Task Commits:**

After each task completes:
1. Stage only files modified by that task
2. Commit with format: `{type}({phase}-{plan}): {task-name}`
3. Types: feat, fix, test, refactor, perf, chore
4. Record commit hash for SUMMARY.md

**Plan Metadata Commit:**

After all tasks in a plan complete:
1. Stage plan artifacts only: PLAN.md, SUMMARY.md
2. Commit with format: `docs({phase}-{plan}): complete [plan-name] plan`
3. NO code files (already committed per-task)

**Phase Completion Commit:**

After all plans in phase complete (step 7):
1. Stage: ROADMAP.md, STATE.md, REQUIREMENTS.md (if updated), VERIFICATION.md
2. Commit with format: `docs({phase}): complete {phase-name} phase`
3. Bundles all phase-level state updates in one commit

**NEVER use:**
- `git add .`
- `git add -A`
- `git add src/` or any broad directory

**Always stage files individually.**
</commit_rules>

<success_criteria>
- [ ] All incomplete plans in phase executed
- [ ] Each plan has SUMMARY.md
- [ ] Phase goal verified (must_haves checked against codebase)
- [ ] VERIFICATION.md created in phase directory
- [ ] STATE.md reflects phase completion
- [ ] ROADMAP.md updated
- [ ] REQUIREMENTS.md updated (phase requirements marked Complete)
- [ ] GitHub feature issue closed or updated (if available)
- [ ] User informed of next steps
</success_criteria>
