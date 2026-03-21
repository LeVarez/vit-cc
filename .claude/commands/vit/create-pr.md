---
name: vit:create-pr
description: Create a GitHub PR from head branch to base branch, auto-syncing with STATE.md
argument-hint: "<head-branch> <base-branch>"
allowed-tools:
  - Read
  - Edit
  - Bash
  - Grep
---

<objective>
Create a GitHub draft PR for a given head branch targeting a base branch. Automatically discovers matching phase context from STATE.md by branch name. Works for both phase branches (rich PR body) and non-phase branches (simple PR body).

This is branch-oriented — no phase number argument needed. Phase context is auto-discovered.
</objective>

<context>
Arguments: $ARGUMENTS (format: "head-branch base-branch", e.g. "feature/v1.1.0-01-readme-rewrite main")

@.planning/STATE.md
@.planning/ROADMAP.md
</context>

<process>

## 1. Parse Arguments

Extract head branch and base branch from $ARGUMENTS:
```bash
HEAD_BRANCH=$(echo "$ARGUMENTS" | awk '{print $1}')
BASE_BRANCH=$(echo "$ARGUMENTS" | awk '{print $2}')
```

Validate both are present:
```bash
if [ -z "$HEAD_BRANCH" ] || [ -z "$BASE_BRANCH" ]; then
  echo "Usage: /vit:create-pr <head-branch> <base-branch>"
  echo "Example: /vit:create-pr feature/v1.1.0-01-readme-rewrite main"
  echo "Example: /vit:create-pr my-fix-branch develop"
  exit 1
fi
```

## 2. Check gh CLI

```bash
gh --version 2>/dev/null && GH_AVAILABLE=true || GH_AVAILABLE=false
```

If `GH_AVAILABLE=false`:
- Display: `ERROR: gh CLI is not available. Install it from https://cli.github.com/`
- STOP — cannot create PR without gh

## 3. Ensure Head Branch is Pushed

```bash
REMOTE_EXISTS=$(git ls-remote --heads origin "$HEAD_BRANCH" 2>/dev/null | head -1)
```

If `REMOTE_EXISTS` is empty:
```bash
echo "Branch not on remote — pushing..."
git push -u origin "$HEAD_BRANCH"
```
If push fails: STOP with error message.

## 4. Idempotency Check

```bash
EXISTING_PR=$(gh pr list --head "$HEAD_BRANCH" --base "$BASE_BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")
```

If `EXISTING_PR` is non-empty:
- Log: `PR already exists: #$EXISTING_PR`
- Attempt STATE.md sync (see step 5 for phase resolution, then step 7 for sync)
- Display result banner and STOP (no duplicate creation)

## 5. Resolve Phase Context (Optional)

Search STATE.md for a row whose Branch column contains `$HEAD_BRANCH`:
```bash
# Find the STATE.md row matching this head branch
PHASE_ROW=$(grep "$HEAD_BRANCH" .planning/STATE.md 2>/dev/null | head -1)
```

If `PHASE_ROW` is non-empty (phase match found):
```bash
# Extract phase key (e.g. "v1.1.0/01") from the row
PHASE_KEY=$(echo "$PHASE_ROW" | grep -o '[v][0-9]*\.[0-9]*/[0-9]*\(\.[0-9]*\)\?' | head -1)
MILESTONE=$(echo "$PHASE_KEY" | cut -d'/' -f1)
PHASE_NUM=$(echo "$PHASE_KEY" | cut -d'/' -f2)

# Fall back to non-milestone-scoped phase number
if [ -z "$PHASE_NUM" ]; then
  PHASE_NUM=$(echo "$PHASE_ROW" | grep -o '| [0-9][0-9]* ' | head -1 | tr -d '| ')
fi

PHASE_FOUND=true

# Get feature issue number from the row
FEATURE_ISSUE=$(echo "$PHASE_ROW" | grep -o '#[0-9][0-9]*' | head -1 | tr -d '#')

# Get phase directory and metadata
PHASE_DIR=$(ls -d .planning/phases/${MILESTONE}/${PHASE_NUM}-* 2>/dev/null | head -1)
PHASE_NAME=$(basename "$PHASE_DIR" 2>/dev/null | sed 's/^[0-9]*-//')
PHASE_GOAL=$(grep -A2 "### Phase ${PHASE_NUM}:" .planning/ROADMAP.md 2>/dev/null | grep "Goal:" | sed 's/.*\*\*Goal\*\*: //')

# Get plan list for checklist
PLAN_LIST=$(ls -1 "$PHASE_DIR"/*-PLAN.md 2>/dev/null | while read f; do
  PLAN_NUM=$(basename "$f" | grep -o '^[0-9]*-[0-9]*')
  PLAN_OBJ=$(grep -A1 '<objective>' "$f" | tail -1 | sed 's/^ *//')
  echo "- [ ] ${PLAN_NUM}: ${PLAN_OBJ}"
done)

# Get success criteria from ROADMAP.md
SUCCESS_CRITERIA=$(sed -n "/### Phase ${PHASE_NUM}:/,/### Phase/p" .planning/ROADMAP.md 2>/dev/null | grep -A50 "Success Criteria" | grep "^  [0-9]" | sed 's/^  //')
```

If `PHASE_ROW` is empty (no phase match):
```bash
PHASE_FOUND=false
```

## 6. Create Draft PR

### If phase was found — rich PR body:

```bash
PR_TITLE="feat(phase-${PHASE_NUM}): $(echo "$PHASE_NAME" | tr '-' ' ')"

PR_BODY="## Goal
${PHASE_GOAL}

## Plans
${PLAN_LIST}

## Success Criteria
${SUCCESS_CRITERIA}

## Links
Feature issue: #${FEATURE_ISSUE}
Closes #${FEATURE_ISSUE}"
```

### If no phase match — simple PR body:

Build a simple PR from the branch name and recent commits:
```bash
# Derive a title from the branch name
PR_TITLE=$(echo "$HEAD_BRANCH" | sed 's|.*/||' | tr '-' ' ' | sed 's/\b\(.\)/\u\1/')

# Get recent commits on head branch not in base
RECENT_COMMITS=$(git log --oneline "$BASE_BRANCH".."$HEAD_BRANCH" 2>/dev/null | head -10)

PR_BODY="## Summary
Branch: \`${HEAD_BRANCH}\` -> \`${BASE_BRANCH}\`

## Changes
\`\`\`
${RECENT_COMMITS}
\`\`\`"
```

### Create the PR:

```bash
NEW_PR=$(gh pr create --draft \
  --base "$BASE_BRANCH" \
  --head "$HEAD_BRANCH" \
  --title "$PR_TITLE" \
  --body "$PR_BODY" \
  2>/dev/null || echo "")
```

If `NEW_PR` is empty (creation failed):
- Log: `[PR creation failed]`
- If phase was found, update STATE.md PR column to `pr:skipped` (best-effort)
- Display error and STOP

Extract PR number:
```bash
PR_NUM=$(echo "$NEW_PR" | grep -o '[0-9]*$')
```

## 7. Sync STATE.md

Only if `PHASE_FOUND=true` and a phase key was resolved:

Update STATE.md PR column from `—` to `pr#$PR_NUM`:
```bash
sed -i '' "s/| ${PHASE_KEY} \([^|]*\)| \([^|]*\)| \([^|]*\)| —[[:space:]]*/| ${PHASE_KEY} \1| \2| \3| pr#${PR_NUM} /" .planning/STATE.md 2>/dev/null || \
sed -i "s/| ${PHASE_KEY} \([^|]*\)| \([^|]*\)| \([^|]*\)| —[[:space:]]*/| ${PHASE_KEY} \1| \2| \3| pr#${PR_NUM} /" .planning/STATE.md 2>/dev/null || true
```

If `PHASE_FOUND=false`: skip STATE.md update (nothing to sync).

## 8. Display Result

### If phase was found:

Output this banner directly:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT > PR CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {PHASE_NUM}: {PHASE_NAME}**
**Branch:** {HEAD_BRANCH} -> {BASE_BRANCH}
**PR:** #{PR_NUM} (draft)

STATE.md updated with pr#{PR_NUM}

---

**Next steps:**
- /vit:execute-phase {PHASE_NUM} — execute phase plans
- `gh pr view {PR_NUM} --web` — open PR in browser
- `gh pr ready {PR_NUM}` — promote to ready-for-review when done

### If no phase match:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT > PR CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Branch:** {HEAD_BRANCH} -> {BASE_BRANCH}
**PR:** #{PR_NUM} (draft)

No matching phase found in STATE.md — STATE.md not updated.

---

**Next steps:**
- `gh pr view {PR_NUM} --web` — open PR in browser
- `gh pr ready {PR_NUM}` — promote to ready-for-review when done

</process>

<success_criteria>
- [ ] Head branch and base branch parsed from arguments
- [ ] gh CLI availability verified
- [ ] Head branch verified on remote (pushed if needed)
- [ ] Existing PR detected and synced (idempotency)
- [ ] Phase context auto-discovered from STATE.md by matching head branch
- [ ] Rich PR body created if phase found; simple PR body if not
- [ ] Draft PR created with explicit --head and --base flags
- [ ] STATE.md PR column updated only if matching phase exists
- [ ] Result banner displayed with next steps
</success_criteria>
