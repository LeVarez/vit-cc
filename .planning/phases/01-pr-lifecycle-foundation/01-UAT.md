---
status: complete
phase: 01-pr-lifecycle-foundation
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md
started: 2026-03-18T14:35:00Z
updated: 2026-03-18T14:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. execute-phase step 0.7 exists
expected: Open `.claude/commands/vit/execute-phase.md` and search for step "0.7". You should find a step labeled "0.7. **Create draft PR**" positioned between step 0.5 (worktree check) and step 1 (validate phase).
result: pass

### 2. execute-phase idempotency guard present
expected: In the same file, the draft PR creation logic should include a `gh pr list --head` check BEFORE `gh pr create --draft`. This prevents duplicate PRs when re-running execute-phase.
result: pass

### 3. execute-phase targets milestone branch
expected: The PR creation command in execute-phase should use `--base "$MILESTONE_BRANCH"` where `MILESTONE_BRANCH="milestone/${MILESTONE}"` — never `--base main`.
result: pass

### 4. execute-phase PR body includes Closes #N
expected: The PR body template in execute-phase should include `Closes #${FEATURE_ISSUE}` in the `## Links` section.
result: pass

### 5. execute-phase graceful gh skip
expected: If gh is unavailable, execute-phase should log something like `[PR skipped — gh not available]` and write `pr:skipped` to STATE.md — without aborting execution.
result: pass

### 6. STATE.md template has PR column
expected: Open `.claude/vit/templates/state.md`. It should document a `## GitHub Issue Mapping` section with a `PR` column and four value states: `—` (no PR), `pr#N` (draft), `pr#N(ready)` (promoted), `pr:skipped` (gh unavailable).
result: pass

### 7. new-milestone creates PR column
expected: Open `.claude/commands/vit/new-milestone.md` and find where the GitHub Issue Mapping table is written. The table header should include `| PR |` and rows should initialize with `| — |`.
result: pass

### 8. verify-work step 8.5 exists
expected: Open `.claude/commands/vit/verify-work.md` and search for "8.5". You should find a step that gates on Route A only (all pass AND more phases remain), reads `pr#N` from STATE.md, and runs `gh pr ready $PR_NUM`.
result: pass

### 9. verify-work Route A gate is explicit
expected: In verify-work step 8.5, the guard should explicitly name Route B as non-promotion: "If this is the last phase (Route B): Skip. PR remains draft."
result: pass

### 10. verify-work updates STATE.md to pr#N(ready)
expected: After `gh pr ready` succeeds, verify-work should run: `sed -i '' "s/pr#${PR_NUM}/pr#${PR_NUM}(ready)/" .planning/STATE.md`
result: pass

### 11. .claude/ and files/ copies are identical
expected: Run `diff .claude/commands/vit/execute-phase.md files/commands/vit/execute-phase.md` — output should be empty. Same for verify-work and templates/state.md.
result: pass

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
