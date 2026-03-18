---
name: vit:quick
description: Execute a quick task with VIT guarantees (atomic commits, state tracking) but skip optional agents
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---

<objective>
Execute small, ad-hoc tasks with VIT guarantees (atomic commits, STATE.md tracking) while skipping optional agents (research, plan-checker, verifier).

Quick mode is the same system with a shorter path:
- Spawns vit-planner (quick mode) + vit-executor(s)
- Skips vit-phase-researcher, vit-plan-checker, vit-verifier
- Quick tasks live in `.planning/quick/` separate from planned phases
- Updates STATE.md "Quick Tasks Completed" table (NOT ROADMAP.md)

Use when: You know exactly what to do and the task is small enough to not need research or verification.
</objective>

<execution_context>
Orchestration is inline - no separate workflow file. Quick mode is deliberately simpler than full VIT.
</execution_context>

<context>
@.planning/STATE.md
</context>

<process>
**Step 0: Resolve Model Profile**

Read model profile for agent spawning:

```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

---

**Step 0.5: Detect MILESTONE**

```bash
MILESTONE=$(grep "^Milestone:" .planning/STATE.md 2>/dev/null | sed 's/Milestone: //' | tr -d ' ')
if [ -z "$MILESTONE" ]; then
  MILESTONE=$(git branch --show-current | grep -o 'v[0-9]*\.[0-9]*' | head -1)
fi
```

Default to "balanced" if not set.

**Model lookup table:**

| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| vit-planner | opus | opus | sonnet |
| vit-executor | opus | sonnet | sonnet |

Store resolved models for use in Task calls below.

---

**Step 1: Pre-flight validation**

Check that an active VIT project exists:

```bash
if [ ! -f .planning/ROADMAP.md ]; then
  echo "Quick mode requires an active project with ROADMAP.md."
  echo "Run /vit:new-project first."
  exit 1
fi
```

If validation fails, stop immediately with the error message.

Quick tasks can run mid-phase - validation only checks ROADMAP.md exists, not phase status.

---

**Step 2: Get task description**

Prompt user interactively for the task description:

```
AskUserQuestion(
  header: "Quick Task",
  question: "What do you want to do?",
  followUp: null
)
```

Store response as `$DESCRIPTION`.

If empty, re-prompt: "Please provide a task description."

Generate slug from description:
```bash
slug=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//' | cut -c1-40)
```

---

**Step 3: Calculate next quick task number**

Ensure `.planning/quick/` directory exists and find the next sequential number:

```bash
# Ensure .planning/quick/ exists
mkdir -p .planning/quick

# Find highest existing number and increment
last=$(ls -1d .planning/quick/[0-9][0-9][0-9]-* 2>/dev/null | sort -r | head -1 | xargs -I{} basename {} | grep -oE '^[0-9]+')

if [ -z "$last" ]; then
  next_num="001"
else
  next_num=$(printf "%03d" $((10#$last + 1)))
fi
```

---

**Step 3.5: Create GitHub issue and branch (if gh CLI available)**

```bash
gh --version 2>/dev/null || SKIP_GITHUB=true

if [ -z "$SKIP_GITHUB" ]; then
  QUICK_BRANCH="quick/${MILESTONE}-${next_num}-${slug}"
  QUICK_ISSUE=$(gh issue create \
    --title "quick(${MILESTONE}): ${next_num} — ${DESCRIPTION}" \
    --label "quick" \
    --body "## Quick Task ${next_num}
${DESCRIPTION}

**Milestone:** ${MILESTONE}
**Branch:** \`${QUICK_BRANCH}\`
**Directory:** \`.planning/quick/${next_num}-${slug}/\`

_Created by \`/vit:quick\`. Closes automatically on completion._" \
    --jq '.number' 2>/dev/null || echo "")

  if [ -n "$QUICK_ISSUE" ]; then
    gh issue develop $QUICK_ISSUE \
      --base "$(git branch --show-current)" \
      --name "$QUICK_BRANCH" 2>/dev/null || {
        git checkout -b "$QUICK_BRANCH" 2>/dev/null
        git push -u origin "$QUICK_BRANCH" 2>/dev/null || true
        git checkout - 2>/dev/null
      }
  fi
fi
```

Set up WORK_DIR (worktree if on main worktree + branch was created):

```bash
CURRENT_DIR=$(pwd)
MAIN_WORKTREE=$(git worktree list --porcelain | grep "^worktree " | head -1 | sed 's/worktree //')
IN_MAIN_WORKTREE=$([ "$CURRENT_DIR" = "$MAIN_WORKTREE" ] && echo "yes" || echo "no")
WORK_DIR="$CURRENT_DIR"

if [ -n "$QUICK_BRANCH" ] && [ "$IN_MAIN_WORKTREE" = "yes" ]; then
  EXISTING=$(git worktree list --porcelain | grep -B2 "branch refs/heads/$QUICK_BRANCH" | grep "^worktree " | sed 's/worktree //')
  if [ -n "$EXISTING" ]; then
    WORK_DIR="$EXISTING"
  else
    WORKTREE_PATH="${MAIN_WORKTREE%/*}/$(basename $MAIN_WORKTREE)-quick-${MILESTONE}-${next_num}-${slug}"
    git worktree add "$WORKTREE_PATH" "$QUICK_BRANCH" 2>/dev/null && WORK_DIR="$WORKTREE_PATH"
  fi
fi
```

---

**Step 4: Create quick task directory**

Create the directory for this quick task:

```bash
QUICK_DIR="$WORK_DIR/.planning/quick/${next_num}-${slug}"
mkdir -p "$QUICK_DIR"
```

Report to user:
```
Creating quick task ${next_num}: ${DESCRIPTION}
Directory: ${QUICK_DIR}
Branch: ${QUICK_BRANCH:-local only}
```

Store `$QUICK_DIR` and `$WORK_DIR` for use in orchestration.

---

**Step 5: Spawn planner (quick mode)**

Spawn vit-planner with quick mode context:

```
Task(
  prompt="
<planning_context>

**Mode:** quick
**Working directory:** ${WORK_DIR}
**Directory:** ${QUICK_DIR}
**Description:** ${DESCRIPTION}

**Project State:**
@.planning/STATE.md

</planning_context>

<constraints>
- Create a SINGLE plan with 1-3 focused tasks
- Quick tasks should be atomic and self-contained
- No research phase, no checker phase
- Target ~30% context usage (simple, focused)
</constraints>

<output>
Write plan to: ${QUICK_DIR}/${next_num}-PLAN.md
Return: ## PLANNING COMPLETE with plan path
</output>
",
  subagent_type="vit-planner",
  model="{planner_model}",
  description="Quick plan: ${DESCRIPTION}"
)
```

After planner returns:
1. Verify plan exists at `${QUICK_DIR}/${next_num}-PLAN.md`
2. Extract plan count (typically 1 for quick tasks)
3. Report: "Plan created: ${QUICK_DIR}/${next_num}-PLAN.md"

If plan not found, error: "Planner failed to create ${next_num}-PLAN.md"

---

**Step 6: Spawn executor**

Spawn vit-executor with plan reference:

```
Task(
  prompt="
Execute quick task ${next_num}.

Working directory: ${WORK_DIR}
All git commands and file operations must be run as: cd ${WORK_DIR} && ...

Plan: @${QUICK_DIR}/${next_num}-PLAN.md
Project state: @.planning/STATE.md

<constraints>
- Execute all tasks in the plan
- Commit each task atomically
- Create summary at: ${QUICK_DIR}/${next_num}-SUMMARY.md
- Do NOT update ROADMAP.md (quick tasks are separate from planned phases)
</constraints>
",
  subagent_type="vit-executor",
  model="{executor_model}",
  description="Execute: ${DESCRIPTION}"
)
```

After executor returns:
1. Verify summary exists at `${QUICK_DIR}/${next_num}-SUMMARY.md`
2. Extract commit hash from executor output
3. Report completion status

If summary not found, error: "Executor failed to create ${next_num}-SUMMARY.md"

Note: For quick tasks producing multiple plans (rare), spawn executors in parallel waves per execute-phase patterns.

---

**Step 7: Update STATE.md**

Update STATE.md with quick task completion record.

**7a. Check if "Quick Tasks Completed" section exists:**

Read STATE.md and check for `### Quick Tasks Completed` section.

**7b. If section doesn't exist, create it:**

Insert after `### Blockers/Concerns` section:

```markdown
### Quick Tasks Completed

| # | Description | Date | Commit | Issue | Directory |
|---|-------------|------|--------|-------|-----------|
```

**7c. Append new row to table:**

```markdown
| ${next_num} | ${DESCRIPTION} | $(date +%Y-%m-%d) | ${commit_hash} | ${QUICK_ISSUE:+#${QUICK_ISSUE}} | [${next_num}-${slug}](./quick/${next_num}-${slug}/) |
```

**7d. Update "Last activity" line:**

Find and update the line:
```
Last activity: $(date +%Y-%m-%d) - Completed quick task ${next_num}: ${DESCRIPTION}
```

Use Edit tool to make these changes atomically

---

**Step 8: Final commit, push, and close**

Stage and commit quick task artifacts:

```bash
cd "$WORK_DIR"

# Stage quick task artifacts
git add ${QUICK_DIR}/${next_num}-PLAN.md
git add ${QUICK_DIR}/${next_num}-SUMMARY.md
git add .planning/STATE.md

# Commit with quick task format
git commit -m "$(cat <<'EOF'
docs(quick-${next_num}): ${DESCRIPTION}

Quick task completed.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

Get final commit hash:
```bash
commit_hash=$(git rev-parse --short HEAD)
```

Push branch and close GitHub issue:
```bash
cd "$WORK_DIR" && git push origin HEAD 2>/dev/null || true

if [ -n "$QUICK_ISSUE" ]; then
  SUMMARY=$(cat "$QUICK_DIR/${next_num}-SUMMARY.md" 2>/dev/null | head -20 || echo "Completed.")
  gh issue comment $QUICK_ISSUE --body "## ✅ Completed — ${commit_hash}

$SUMMARY" 2>/dev/null || true
  gh issue close $QUICK_ISSUE 2>/dev/null || true
fi
```

Display completion output:
```
---

VIT > QUICK TASK COMPLETE

Quick Task ${next_num}: ${DESCRIPTION}

Summary: ${QUICK_DIR}/${next_num}-SUMMARY.md
Commit: ${commit_hash}
${QUICK_BRANCH:+Branch: ${QUICK_BRANCH}}
${QUICK_ISSUE:+Issue: #${QUICK_ISSUE} (closed)}

---

Ready for next task: /vit:quick
```

</process>

<success_criteria>
- [ ] ROADMAP.md validation passes
- [ ] User provides task description
- [ ] Slug generated (lowercase, hyphens, max 40 chars)
- [ ] Next number calculated (001, 002, 003...)
- [ ] Directory created at `.planning/quick/NNN-slug/`
- [ ] `${next_num}-PLAN.md` created by planner
- [ ] `${next_num}-SUMMARY.md` created by executor
- [ ] STATE.md updated with quick task row
- [ ] Artifacts committed
</success_criteria>
