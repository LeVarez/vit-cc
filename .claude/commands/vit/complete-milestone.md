---
type: prompt
name: vit:complete-milestone
description: Archive completed milestone and prepare for next version
argument-hint: <version>
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Mark milestone {{version}} complete, archive to milestones/, and update ROADMAP.md and REQUIREMENTS.md.

Purpose: Create historical record of shipped version, archive milestone artifacts (roadmap + requirements), and prepare for next milestone.
Output: Milestone archived (roadmap + requirements), PROJECT.md evolved, git tagged.
</objective>

<execution_context>
**Load these files NOW (before proceeding):**

- @./.claude/vit/workflows/complete-milestone.md (main workflow)
- @./.claude/vit/templates/milestone-archive.md (archive template)
  </execution_context>

<context>
**Project files:**
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/PROJECT.md`

**User input:**

- Version: {{version}} (e.g., "1.0", "1.1", "2.0")
  </context>

<process>

**Follow complete-milestone.md workflow:**

0. **Check for audit:**

   - Look for `.planning/v{{version}}-MILESTONE-AUDIT.md`
   - If missing or stale: recommend `/vit:audit-milestone` first
   - If audit status is `gaps_found`: recommend `/vit:plan-milestone-gaps` first
   - If audit status is `passed`: proceed to step 1

   ```markdown
   ## Pre-flight Check

   {If no v{{version}}-MILESTONE-AUDIT.md:}
   ⚠ No milestone audit found. Run `/vit:audit-milestone` first to verify
   requirements coverage, cross-phase integration, and E2E flows.

   {If audit has gaps:}
   ⚠ Milestone audit found gaps. Run `/vit:plan-milestone-gaps` to create
   phases that close the gaps, or proceed anyway to accept as tech debt.

   {If audit passed:}
   ✓ Milestone audit passed. Proceeding with completion.
   ```

1. **Verify readiness:**

   - Check all phases in milestone have completed plans (SUMMARY.md exists)
   - Present milestone scope and stats
   - Wait for confirmation

2. **Gather stats:**

   - Count phases, plans, tasks
   - Calculate git range, file changes, LOC
   - Extract timeline from git log
   - Present summary, confirm

3. **Extract accomplishments:**

   - Read all phase SUMMARY.md files in milestone range
   - Extract 4-6 key accomplishments
   - Present for approval

3.5. **Spawn changelog-writer** (before archive)

   Spawn vit-changelog-writer to generate a versioned CHANGELOG entry and update all project documentation:

   ```
   Task(
     prompt="""
   <context>
   Version: {{version}}
   Milestone: v{{version}}
   Working Directory: $WORK_DIR
   Phases Directory: $WORK_DIR/.planning/phases/
   </context>

   Read all phase SUMMARY.md files in the milestone.
   Update all project documentation (README.md, docs/).
   Generate a versioned CHANGELOG entry [{{version}}] - DATE from the [Unreleased] section.
   Commit all documentation and CHANGELOG changes.
   """,
     subagent_type="vit-changelog-writer",
     model="sonnet",
     description="Write versioned CHANGELOG for v{{version}}"
   ) || log "[changelog-writer failed — continuing]"
   ```

   If the Task call fails or the agent crashes: log `[changelog-writer failed — continuing]` and proceed to step 4 (archive). The changelog-writer is non-blocking — it must NEVER prevent milestone archival from completing.

   Note: The model is hardcoded to "sonnet" here because complete-milestone does not have a model lookup table like execute-phase. If a model profile is later added to complete-milestone, this should reference the lookup table instead.

4. **Archive milestone:**

   - Create `.planning/milestones/v{{version}}-ROADMAP.md`
   - Extract full phase details from ROADMAP.md
   - Fill milestone-archive.md template
   - Update ROADMAP.md to one-line summary with link

5. **Archive requirements:**

   - Create `.planning/milestones/v{{version}}-REQUIREMENTS.md`
   - Mark all v1 requirements as complete (checkboxes checked)
   - Note requirement outcomes (validated, adjusted, dropped)
   - Delete `.planning/REQUIREMENTS.md` (fresh one created for next milestone)

6. **Update PROJECT.md:**

   - Add "Current State" section with shipped version
   - Add "Next Milestone Goals" section
   - Archive previous content in `<details>` (if v1.1.0+)

7. **Commit and tag:**

   - Stage: MILESTONES.md, PROJECT.md, ROADMAP.md, STATE.md, archive files
   - Commit: `chore: archive v{{version}} milestone`
   - Tag: `git tag -a v{{version}} -m "[milestone summary]"`
   - Ask about pushing tag

7.5. **Sync GitHub:**

   Parse STATE.md for `GitHub milestone #N` number.

   If found, close the GitHub milestone:
   ```bash
   GH_MILESTONE=$(grep -o 'GitHub milestone #[0-9]*' .planning/STATE.md | grep -o '[0-9]*$')
   gh api repos/:owner/:repo/milestones/$GH_MILESTONE --method PATCH \
     --field state=closed 2>/dev/null || true
   ```

   Ask user (using AskUserQuestion): "Delete merged feature branches from GitHub? This will remove all `feature/${MILESTONE}-N-*` branches listed in STATE.md GitHub Issue Mapping. (yes/no, default: yes)"

   Detect milestone before cleanup:
   ```bash
   MILESTONE=$(grep "^Milestone:" .planning/STATE.md 2>/dev/null | sed 's/Milestone: //' | tr -d ' ')
   if [ -z "$MILESTONE" ]; then
     MILESTONE=$(git branch --show-current | grep -o 'v[0-9]*\.[0-9]*\.[0-9]*' | head -1)
   fi
   ```

   If yes: for each feature branch in the `## GitHub Issue Mapping` table in STATE.md:
   ```bash
   git push origin --delete "feature/${MILESTONE}-{N}-{slug}" 2>/dev/null || true
   ```

7.7. **Create milestone handoff summary**

   Generate a milestone-boundary handoff for the team starting the next milestone. Write `.planning/milestones/v{{version}}-HANDOFF.md`:

   ```markdown
   # Milestone v{{version}} Handoff

   ## What was shipped

   [4-6 accomplishments from step 3 of this workflow]

   ## Key architectural decisions made

   [3-5 decisions from PROJECT.md Key Decisions table that were made during this milestone]

   ## Files/areas to know about

   | Area | Files | Why it matters |
   |------|-------|----------------|
   [Top changed files from git diff with brief description]

   ## Known tech debt

   [Gaps from MILESTONE-AUDIT.md if any, or "None identified"]

   ## Team who built it

   [Engineers from STATE.md GitHub Issue Mapping Assigned column, or "Claude (solo)"]

   ## How to start the next milestone

   1. Run `/vit:new-milestone` to define goals and requirements
   2. Read `.planning/ONBOARDING.md` for project context
   3. Review `.planning/milestones/v{{version}}-ROADMAP.md` for what was built
   ```

   Commit:
   ```bash
   git add ".planning/milestones/v{{version}}-HANDOFF.md"
   git commit -m "docs: add v{{version}} milestone handoff"
   ```

8. **Offer next steps:**
   - `/vit:new-milestone` — start next milestone (questioning → research → requirements → roadmap)

9. **PR review gate (if applicable):**

   Detect if currently running inside a git worktree:

   ```bash
   MAIN_WORKTREE=$(git worktree list --porcelain | grep "^worktree " | head -1 | sed 's/worktree //')
   CURRENT_DIR=$(git rev-parse --show-toplevel)
   CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
   ```

   If `MAIN_WORKTREE == CURRENT_DIR`: Skip this step entirely.

   If in a worktree, check PR review status:

   ```bash
   PR_NUMBER=$(gh pr list --head "$CURRENT_BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")
   PR_STATE=$(gh pr view "$PR_NUMBER" --json state,reviewDecision \
     --jq '{state: .state, decision: .reviewDecision}' 2>/dev/null || echo "")
   ```

   **Case A — No PR exists yet:**

   Push branch and open the PR:
   ```bash
   git push -u origin "$CURRENT_BRANCH"
   PR_URL=$(gh pr create \
     --title "feat: milestone v{{version}} — [Milestone Name]" \
     --base main \
     --head "$CURRENT_BRANCH" \
     --body "..." )
   ```

   The PR body must include (generate from planning artifacts):

   ```markdown
   ## What was built
   [4-6 accomplishments from step 3 of this workflow]

   ## Requirements covered
   [Full list from REQUIREMENTS.md — all checked items]

   ## How to test locally
   1. Check out this branch: `git checkout $CURRENT_BRANCH`
   2. [Any setup steps from PROJECT.md — migrations, env vars, etc.]
   3. Run the test suite: `[test command from config]`
   4. [Key user flows to manually verify — derived from phase success criteria]

   ## Key files changed
   [Top changed files by commit count from `git diff main...$CURRENT_BRANCH --name-only | sort | uniq -c | sort -rn | head -20`]

   ## Areas needing careful review
   [Identify: auth/security changes, data model changes, public API changes, anything with TODO/FIXME]

   ## Reviewer checklist
   - [ ] Requirements coverage looks complete
   - [ ] No obvious security issues (auth, input validation, secrets)
   - [ ] Data model changes are safe (migrations, backwards compat)
   - [ ] Error handling is reasonable
   - [ ] Tests cover the critical paths
   - [ ] No dead code or debug artifacts left in
   ```

   Then stop and print:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    VIT ► AWAITING HUMAN REVIEW
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   PR ready for review: $PR_URL

   The milestone is archived and tagged, but the branch will NOT
   be merged until a human reviews and approves the PR.

   After the reviewer approves (or after you've reviewed it yourself):
     /vit:complete-milestone {{version}}

   Running this command again will detect the approval and complete the merge.
   ```

   **Case B — PR exists, not yet approved (or has change requests):**

   Check for change requests:
   ```bash
   CHANGES_REQUESTED=$(gh pr view "$PR_NUMBER" --json reviews \
     --jq '[.reviews[] | select(.state=="CHANGES_REQUESTED")] | length')
   ```

   If change requests exist, print:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    VIT ► CHANGES REQUESTED
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   The reviewer has requested changes. Address the feedback on the PR,
   push your fixes, then run /vit:complete-milestone {{version}} again.

   PR: [gh pr view URL]
   ```
   Stop here.

   If PR exists but simply not yet reviewed, print:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    VIT ► STILL AWAITING REVIEW
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   PR is open but not yet approved. Once approved, run:
     /vit:complete-milestone {{version}}

   PR: [gh pr view URL]
   ```
   Stop here.

   **Case C — PR exists and is approved:**

   Ask with AskUserQuestion:
   - header: "Merge & Cleanup"
   - question: "PR `$PR_NUMBER` is approved. Merge `$CURRENT_BRANCH` into main and remove the worktree?"
   - options:
     - "Yes — merge via PR and remove worktree"
     - "No — keep worktree open" — Leave branch and directory intact for now

   **If yes:**
   ```bash
   gh pr merge "$PR_NUMBER" --merge --delete-branch
   git -C "$MAIN_WORKTREE" fetch origin main
   git worktree remove "$CURRENT_DIR" --force
   ```

   Print:
   ```
   ✓ PR merged into main
   ✓ Branch $CURRENT_BRANCH deleted
   ✓ Worktree removed: $CURRENT_DIR

   You are now working in: $MAIN_WORKTREE
   ```

   **If no:** Print:
   ```
   Worktree kept at: $CURRENT_DIR
   Branch: $CURRENT_BRANCH
   PR #$PR_NUMBER is approved — merge when ready with:
     gh pr merge $PR_NUMBER --merge --delete-branch  (from any directory)
   ```

</process>

<success_criteria>

- Milestone archived to `.planning/milestones/v{{version}}-ROADMAP.md`
- Requirements archived to `.planning/milestones/v{{version}}-REQUIREMENTS.md`
- `.planning/REQUIREMENTS.md` deleted (fresh for next milestone)
- ROADMAP.md collapsed to one-line entry
- PROJECT.md updated with current state
- Git tag v{{version}} created
- Commit successful
- User knows next steps (including need for fresh requirements)
  </success_criteria>

<critical_rules>

- **Load workflow first:** Read complete-milestone.md before executing
- **Verify completion:** All phases must have SUMMARY.md files
- **User confirmation:** Wait for approval at verification gates
- **Archive before deleting:** Always create archive files before updating/deleting originals
- **One-line summary:** Collapsed milestone in ROADMAP.md should be single line with link
- **Context efficiency:** Archive keeps ROADMAP.md and REQUIREMENTS.md constant size per milestone
- **Fresh requirements:** Next milestone starts with `/vit:new-milestone` which includes requirements definition
  </critical_rules>
