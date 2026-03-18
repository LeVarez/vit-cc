---
name: vit:verify-work
description: Validate built features through conversational UAT
argument-hint: "[phase number, e.g., '4']"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Edit
  - Write
  - Task
---

<objective>
Validate built features through conversational testing with persistent state.

Purpose: Confirm what Claude built actually works from user's perspective. One test at a time, plain text responses, no interrogation. When issues are found, automatically diagnose, plan fixes, and prepare for execution.

Output: {phase}-UAT.md tracking all test results. If issues found: diagnosed gaps, verified fix plans ready for /vit:execute-phase
</objective>

<execution_context>
@./.claude/vit/workflows/verify-work.md
@./.claude/vit/templates/UAT.md
</execution_context>

<context>
Phase: $ARGUMENTS (optional)
- If provided: Test specific phase (e.g., "4")
- If not provided: Check for active sessions or prompt for phase

@.planning/STATE.md
@.planning/ROADMAP.md
</context>

<process>
0. **Check CI status on feature branch**

   ```bash
   PHASE_NUM=$(echo "$ARGUMENTS" | grep -o '^[0-9]*')
   MILESTONE=$(grep "^Milestone:" .planning/STATE.md 2>/dev/null | sed 's/Milestone: //' | tr -d ' ')
   if [ -z "$MILESTONE" ]; then
     MILESTONE=$(git branch --show-current | grep -o 'v[0-9]*\.[0-9]*' | head -1)
   fi
   DESIGNATED_BRANCH=$(grep "| ${MILESTONE}/${PHASE_NUM} " .planning/STATE.md 2>/dev/null | grep -o 'feature/[^ |]*' | head -1)
   if [ -z "$DESIGNATED_BRANCH" ]; then
     DESIGNATED_BRANCH=$(grep "| ${PHASE_NUM} " .planning/STATE.md 2>/dev/null | grep -o 'feature/[^ |]*' | head -1)
   fi

   if [ -n "$DESIGNATED_BRANCH" ]; then
     CI_STATUS=$(gh run list --branch "$DESIGNATED_BRANCH" --limit 1 --json conclusion,status,url --jq '.[0]' 2>/dev/null || echo "")
     CI_CONCLUSION=$(echo "$CI_STATUS" | grep -o '"conclusion":"[^"]*"' | cut -d'"' -f4)
     CI_URL=$(echo "$CI_STATUS" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
   fi
   ```

   - **If `CI_CONCLUSION=failure`:** Show: "CI is failing on `{branch}`. Fix test failures before UAT."
     Show the CI run URL. Ask: "View failures and fix, or proceed to manual UAT anyway? (fix/proceed)"
     - `fix` → stop here, user goes to fix CI
     - `proceed` → continue (log that UAT ran with failing CI)
   - **If `CI_CONCLUSION=success`:** Show: "✓ CI green on `{branch}`. Proceeding to human review."
   - **If no CI run found:** Note "No CI run found — proceeding to UAT directly."

1. Check for active UAT sessions (resume or start new)
2. Find SUMMARY.md files for the phase
3. Extract testable deliverables (user-observable outcomes)
4. Create {phase}-UAT.md with test list
   **Filter automatable tests:** Skip any test that maps 1:1 to a passing unit test in `tests/phases/`. Only present tests requiring human judgment (visual checks, UX feel, wording, edge case behavior).
5. Present tests one at a time:
   - Show expected behavior
   - Wait for plain text response
   - "yes/y/next" = pass, anything else = issue (severity inferred)
6. Update UAT.md after each response
7. On completion: commit, present summary
8. Post UAT comment on GitHub feature issue (if mapped):
   Look up feature issue from STATE.md `## GitHub Issue Mapping` for current phase.
   If found, post a structured developer-executable test guide (not just a summary):

   **All pass (Route A/B):**
   Build the comment from VERIFICATION.md must_haves and UAT results. Post:
   ```bash
   gh issue comment $FEATURE_ISSUE --body "## ✓ Verification Guide — Phase {N}: {Name}

   **Status:** All automated checks passed. Ready for developer sign-off.

   ### How to test this phase

   {For each must-have from VERIFICATION.md — write as executable step:}
   **{Observable outcome}**
   1. {Step to reproduce — exact command or URL}
   2. {What to check}
   ✓ Expected: {what success looks like}

   ### Test environment
   - Branch: \`feature/${MILESTONE}-{N}-{slug}\`
   - Start dev server: \`{build/start command from package.json scripts}\`

   ### Automated checks passed
   {List must_haves confirmed by vit-verifier, each with ✓}

   ---
   Reply with **'approved'** to proceed to the next phase, or describe any issues found." \
   2>/dev/null || true
   ```

   **Issues found (Route C):**
   ```bash
   gh issue comment $FEATURE_ISSUE --body "## ⚠ UAT Issues Found — Phase {N}: {Name}

   **Status:** {N}/{M} tests passed — fix plans created and ready to execute.

   ### Issues Found
   {For each issue from UAT.md — severity + description}

   ### Fix Plans Ready
   Run \`/vit:execute-phase {N} --gaps-only\` to apply fixes.

   ---
   Re-run \`/vit:verify-work {N}\` after fixes to confirm resolution." \
   2>/dev/null || true
   ```

   **Blocked (Route D):**
   ```bash
   gh issue comment $FEATURE_ISSUE --body "## ✗ UAT Blocked — Phase {N}: {Name}

   **Status:** Manual intervention needed before testing can continue.

   ### Blocking Issues
   {List unresolved blockers}

   ---
   Provide guidance and re-run \`/vit:verify-work {N}\`." \
   2>/dev/null || true
   ```

   Do NOT close the issue here — execute-phase closes it after verified.

8.5. **Promote PR — Route A only** (all pass AND more phases remain)

   Gate: Skip entirely on Routes B, C, and D.
   - If issues > 0 (Route C or D): Skip. PR remains draft.
   - If this is the last phase (Route B): Skip. PR remains draft.
   - Only proceed when all tests passed AND more phases remain (Route A).

   ```bash
   # Check gh availability
   gh --version 2>/dev/null && GH_AVAILABLE=true || GH_AVAILABLE=false
   ```

   If `GH_AVAILABLE=false`: log `[PR promotion skipped — gh not available]`, continue.

   ```bash
   # Look up PR number from STATE.md
   PR_ENTRY=$(grep "| ${MILESTONE}/${PHASE_NUM} " .planning/STATE.md 2>/dev/null | grep -o 'pr#[0-9]*' | head -1)
   if [ -z "$PR_ENTRY" ]; then
     PR_ENTRY=$(grep "| ${PHASE_NUM} " .planning/STATE.md 2>/dev/null | grep -o 'pr#[0-9]*' | head -1)
   fi
   PR_NUM=$(echo "$PR_ENTRY" | grep -o '[0-9]*')
   ```

   If `PR_NUM` is empty, or entry is `—` or `pr:skipped`: log `No draft PR found for this phase — skipping promotion`, continue.

   ```bash
   # Promote draft PR to ready-for-review
   gh pr ready $PR_NUM 2>/dev/null && PR_PROMOTED=true || PR_PROMOTED=false
   ```

   On success (`PR_PROMOTED=true`):
   - Log: `PR #$PR_NUM promoted to ready-for-review`
   - Update STATE.md: `sed -i '' "s/pr#${PR_NUM}/pr#${PR_NUM}(ready)/" .planning/STATE.md`

   On failure (`PR_PROMOTED=false`):
   - Log: `[PR promotion failed — PR #$PR_NUM may already be ready or closed]`
   - Continue (non-blocking)

9. If issues found:
   - Spawn parallel debug agents to diagnose root causes
   - Spawn vit-planner in --gaps mode to create fix plans
   - Spawn vit-plan-checker to verify fix plans
   - Iterate planner ↔ checker until plans pass (max 3)
   - Present ready status with `/clear` then `/vit:execute-phase`
</process>

<anti_patterns>
- Don't use AskUserQuestion for test responses — plain text conversation
- Don't ask severity — infer from description
- Don't present full checklist upfront — one test at a time
- Don't run automated tests — this is manual user validation
- Don't fix issues during testing — log as gaps, diagnose after all tests complete
</anti_patterns>

<offer_next>
Output this markdown directly (not as a code block). Route based on UAT results:

| Status | Route |
|--------|-------|
| All tests pass + more phases | Route A (next phase) |
| All tests pass + last phase | Route B (milestone complete) |
| Issues found + fix plans ready | Route C (execute fixes) |
| Issues found + planning blocked | Route D (manual intervention) |

---

**Route A: All tests pass, more phases remain**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► PHASE {Z} VERIFIED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {Z}: {Name}**

{N}/{N} tests passed
UAT complete ✓

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Phase {Z+1}: {Name}** — {Goal from ROADMAP.md}

/vit:discuss-phase {Z+1} — gather context and clarify approach

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- /vit:plan-phase {Z+1} — skip discussion, plan directly
- /vit:execute-phase {Z+1} — skip to execution (if already planned)

───────────────────────────────────────────────────────────────

---

**Route B: All tests pass, milestone complete**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► PHASE {Z} VERIFIED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {Z}: {Name}**

{N}/{N} tests passed
Final phase verified ✓

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Audit milestone** — verify requirements, cross-phase integration, E2E flows

/vit:audit-milestone

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- /vit:complete-milestone — skip audit, archive directly

───────────────────────────────────────────────────────────────

---

**Route C: Issues found, fix plans ready**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► PHASE {Z} ISSUES FOUND ⚠
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {Z}: {Name}**

{N}/{M} tests passed
{X} issues diagnosed
Fix plans verified ✓

### Issues Found

{List issues with severity from UAT.md}

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Execute fix plans** — run diagnosed fixes

/vit:execute-phase {Z} --gaps-only

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- cat .planning/phases/{phase_dir}/*-PLAN.md — review fix plans
- /vit:plan-phase {Z} --gaps — regenerate fix plans

───────────────────────────────────────────────────────────────

---

**Route D: Issues found, planning blocked**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► PHASE {Z} BLOCKED ✗
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {Z}: {Name}**

{N}/{M} tests passed
Fix planning blocked after {X} iterations

### Unresolved Issues

{List blocking issues from planner/checker output}

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Manual intervention required**

Review the issues above and either:
1. Provide guidance for fix planning
2. Manually address blockers
3. Accept current state and continue

───────────────────────────────────────────────────────────────

**Options:**
- /vit:plan-phase {Z} --gaps — retry fix planning with guidance
- /vit:discuss-phase {Z} — gather more context before replanning

───────────────────────────────────────────────────────────────
</offer_next>

<success_criteria>
- [ ] UAT.md created with tests from SUMMARY.md
- [ ] Tests presented one at a time with expected behavior
- [ ] Plain text responses (no structured forms)
- [ ] Severity inferred, never asked
- [ ] Batched writes: on issue, every 5 passes, or completion
- [ ] Committed on completion
- [ ] If issues: parallel debug agents diagnose root causes
- [ ] If issues: vit-planner creates fix plans from diagnosed gaps
- [ ] If issues: vit-plan-checker verifies fix plans (max 3 iterations)
- [ ] Ready for `/vit:execute-phase` when complete
</success_criteria>
