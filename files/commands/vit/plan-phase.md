---
name: vit:plan-phase
description: Create detailed execution plan for a phase (PLAN.md) with verification loop
argument-hint: "[phase] [--research] [--skip-research] [--gaps] [--skip-verify]"
agent: vit-planner
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebFetch
  - mcp__context7__*
---

<execution_context>
@./.claude/vit/references/ui-brand.md
</execution_context>

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Orchestrator role:** Parse arguments, validate phase, research domain (unless skipped or exists), spawn vit-planner agent, verify plans with vit-plan-checker, iterate until plans pass or max iterations reached, present results.

**Why subagents:** Research and planning burn context fast. Verification uses fresh context. User sees the flow between agents in main context.
</objective>

<context>
Phase number: $ARGUMENTS (optional - auto-detects next unplanned phase if not provided)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research entirely, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip planner → checker verification loop

Normalize phase input in step 2 before any directory lookups.
</context>

<process>

## 1. Validate Environment and Resolve Model Profile

```bash
ls .planning/ 2>/dev/null
```

**If not found:** Error - user should run `/vit:new-project` first.

**Resolve model profile for agent spawning:**

```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

Default to "balanced" if not set.

**Model lookup table:**

| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| vit-phase-researcher | opus | sonnet | haiku |
| vit-planner | opus | opus | sonnet |
| vit-plan-checker | sonnet | sonnet | haiku |

Store resolved models for use in Task calls below.

## 1.5. Determine WORK_DIR

```bash
PHASE_NUM=$(echo "$ARGUMENTS" | grep -o '^[0-9]*')
MILESTONE=$(grep "^Milestone:" .planning/STATE.md 2>/dev/null | sed 's/Milestone: //' | tr -d ' ')
if [ -z "$MILESTONE" ]; then
  MILESTONE=$(git branch --show-current | grep -o 'v[0-9]*\.[0-9]*' | head -1)
fi
# Try milestone-scoped key first, fall back to legacy global key
DESIGNATED_BRANCH=$(grep "| ${MILESTONE}/${PHASE_NUM} " .planning/STATE.md 2>/dev/null | grep -o 'feature/[^ |]*' | head -1)
if [ -z "$DESIGNATED_BRANCH" ]; then
  DESIGNATED_BRANCH=$(grep "| ${PHASE_NUM} " .planning/STATE.md 2>/dev/null | grep -o 'feature/[^ |]*' | head -1)
fi
MAIN_WORKTREE=$(git worktree list --porcelain | head -1 | sed 's/worktree //')
IN_MAIN_WORKTREE=$([ "$(pwd)" = "$MAIN_WORKTREE" ] && echo "yes" || echo "no")
WORK_DIR="$(pwd)"  # default

if [ -n "$DESIGNATED_BRANCH" ] && [ "$IN_MAIN_WORKTREE" = "yes" ]; then
  EXISTING=$(git worktree list --porcelain | grep -B2 "branch refs/heads/$DESIGNATED_BRANCH" | head -1 | sed 's/worktree //')
  if [ -n "$EXISTING" ]; then
    WORK_DIR="$EXISTING"
  else
    WORKTREE_PATH="../$(basename $(git rev-parse --show-toplevel))-${DESIGNATED_BRANCH//\//-}"
    git worktree add "$WORKTREE_PATH" "$DESIGNATED_BRANCH" 2>/dev/null
    WORK_DIR="$WORKTREE_PATH"
  fi
fi
```

All subsequent file reads and bash commands use `$WORK_DIR` as base. Pass `WORK_DIR` to all spawned subagents.

## 2. Parse and Normalize Arguments

Extract from $ARGUMENTS:

- Phase number (integer or decimal like `2.1`)
- `--research` flag to force re-research
- `--skip-research` flag to skip research
- `--gaps` flag for gap closure mode
- `--skip-verify` flag to bypass verification loop

**If no phase number:** Detect next unplanned phase from roadmap.

**Normalize phase to zero-padded format:**

```bash
# Normalize phase number (8 → 08, but preserve decimals like 2.1 → 02.1)
if [[ "$PHASE" =~ ^[0-9]+$ ]]; then
  PHASE=$(printf "%02d" "$PHASE")
elif [[ "$PHASE" =~ ^([0-9]+)\.([0-9]+)$ ]]; then
  PHASE=$(printf "%02d.%s" "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}")
fi
```

**Check for existing research and plans:**

```bash
ls .planning/phases/${MILESTONE}/${PHASE}-*/*-RESEARCH.md 2>/dev/null
# Fallback for historical phases in root
ls .planning/phases/${PHASE}-*/*-RESEARCH.md 2>/dev/null
ls .planning/phases/${MILESTONE}/${PHASE}-*/*-PLAN.md 2>/dev/null
ls .planning/phases/${PHASE}-*/*-PLAN.md 2>/dev/null
```

## 3. Validate Phase

```bash
grep -A5 "Phase ${PHASE}:" .planning/ROADMAP.md 2>/dev/null
```

**If not found:** Error with available phases. **If found:** Extract phase number, name, description.

## 4. Ensure Phase Directory Exists

```bash
# PHASE is already normalized (08, 02.1, etc.) from step 2
# Try milestone-scoped path first, fall back to root for historical phases
PHASE_DIR=$(ls -d ".planning/phases/${MILESTONE}/${PHASE}-"* 2>/dev/null | head -1)
if [ -z "$PHASE_DIR" ]; then
  PHASE_DIR=$(ls -d ".planning/phases/${PHASE}-"* 2>/dev/null | head -1)
fi
if [ -z "$PHASE_DIR" ]; then
  # Create new phase directory under milestone namespace
  PHASE_NAME=$(grep "Phase ${PHASE}:" .planning/ROADMAP.md | sed 's/.*Phase [0-9]*: //' | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
  mkdir -p ".planning/phases/${MILESTONE}/${PHASE}-${PHASE_NAME}"
  PHASE_DIR=".planning/phases/${MILESTONE}/${PHASE}-${PHASE_NAME}"
fi
```

## 5. Handle Research

**If `--gaps` flag:** Skip research (gap closure uses VERIFICATION.md instead).

**If `--skip-research` flag:** Skip to step 6.

**Check config for research setting:**

```bash
WORKFLOW_RESEARCH=$(cat .planning/config.json 2>/dev/null | grep -o '"research"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
```

**If `workflow.research` is `false` AND `--research` flag NOT set:** Skip to step 6.

**Otherwise:**

Check for existing research:

```bash
ls "${PHASE_DIR}"/*-RESEARCH.md 2>/dev/null
```

**If RESEARCH.md exists AND `--research` flag NOT set:**
- Display: `Using existing research: ${PHASE_DIR}/${PHASE}-RESEARCH.md`
- Skip to step 6

**If RESEARCH.md missing OR `--research` flag set:**

Display stage banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► RESEARCHING PHASE {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning researcher...
```

Proceed to spawn researcher

### Spawn vit-phase-researcher

Gather context for research prompt:

```bash
# Get phase description from roadmap
PHASE_DESC=$(grep -A3 "Phase ${PHASE}:" .planning/ROADMAP.md)

# Get requirements if they exist
REQUIREMENTS=$(cat .planning/REQUIREMENTS.md 2>/dev/null | grep -A100 "## Requirements" | head -50)

# Get prior decisions from STATE.md
DECISIONS=$(grep -A20 "### Decisions Made" .planning/STATE.md 2>/dev/null)

# Get phase context if exists
PHASE_CONTEXT=$(cat "${PHASE_DIR}"/*-CONTEXT.md 2>/dev/null)
```

Fill research prompt and spawn:

```markdown
<objective>
Research how to implement Phase {phase_number}: {phase_name}

Answer: "What do I need to know to PLAN this phase well?"
</objective>

<context>
**Phase description:**
{phase_description}

**Requirements (if any):**
{requirements}

**Prior decisions:**
{decisions}

**Phase context (if any):**
{phase_context}
</context>

<output>
Write research findings to: {work_dir}/{phase_dir}/{phase}-RESEARCH.md
</output>

Working directory: {work_dir}
All file writes go to {work_dir}/.planning/...
All git commands must be prefixed with: cd {work_dir} &&
```

```
Task(
  prompt="First, read ./.claude/agents/vit-phase-researcher.md for your role and instructions.\n\n" + research_prompt,
  subagent_type="general-purpose",
  model="{researcher_model}",
  description="Research Phase {phase}"
)
```

### Handle Researcher Return

**`## RESEARCH COMPLETE`:**
- Display: `Research complete. Proceeding to planning...`
- Continue to step 6

**`## RESEARCH BLOCKED`:**
- Display blocker information
- Offer: 1) Provide more context, 2) Skip research and plan anyway, 3) Abort
- Wait for user response

## 6. Check Existing Plans

```bash
ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null
```

**If exists:** Offer: 1) Continue planning (add more plans), 2) View existing, 3) Replan from scratch. Wait for response.

## 7. Read Context Files

Read and store context file contents for the planner agent. The `@` syntax does not work across Task() boundaries - content must be inlined.

```bash
# Read required files
STATE_CONTENT=$(cat "$WORK_DIR/.planning/STATE.md")
ROADMAP_CONTENT=$(cat "$WORK_DIR/.planning/ROADMAP.md")

# Read optional files (empty string if missing)
REQUIREMENTS_CONTENT=$(cat "$WORK_DIR/.planning/REQUIREMENTS.md" 2>/dev/null)
CONTEXT_CONTENT=$(cat "$WORK_DIR/${PHASE_DIR}"/*-CONTEXT.md 2>/dev/null)
RESEARCH_CONTENT=$(cat "$WORK_DIR/${PHASE_DIR}"/*-RESEARCH.md 2>/dev/null)

# Gap closure files (only if --gaps mode)
VERIFICATION_CONTENT=$(cat "$WORK_DIR/${PHASE_DIR}"/*-VERIFICATION.md 2>/dev/null)
UAT_CONTENT=$(cat "$WORK_DIR/${PHASE_DIR}"/*-UAT.md 2>/dev/null)
```

## 8. Spawn vit-planner Agent

Display stage banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► PLANNING PHASE {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning planner...
```

Fill prompt with inlined content and spawn:

```markdown
<planning_context>

**Phase:** {phase_number}
**Mode:** {standard | gap_closure}

**Project State:**
{state_content}

**Roadmap:**
{roadmap_content}

**Requirements (if exists):**
{requirements_content}

**Phase Context (if exists):**
{context_content}

**Research (if exists):**
{research_content}

**Gap Closure (if --gaps mode):**
{verification_content}
{uat_content}

</planning_context>

<downstream_consumer>
Output consumed by /vit:execute-phase
Plans must be executable prompts with:

- Frontmatter (wave, depends_on, files_modified, autonomous)
- Tasks in XML format
- Verification criteria
- must_haves for goal-backward verification
</downstream_consumer>

<quality_gate>
Before returning PLANNING COMPLETE:

- [ ] PLAN.md files created in phase directory
- [ ] Each plan has valid frontmatter
- [ ] Tasks are specific and actionable
- [ ] Dependencies correctly identified
- [ ] Waves assigned for parallel execution
- [ ] must_haves derived from phase goal
</quality_gate>

Working directory: {work_dir}
All file writes go to {work_dir}/.planning/...
All git commands must be prefixed with: cd {work_dir} &&
```

```
Task(
  prompt="First, read ./.claude/agents/vit-planner.md for your role and instructions.\n\n" + filled_prompt,
  subagent_type="general-purpose",
  model="{planner_model}",
  description="Plan Phase {phase}"
)
```

## 9. Handle Planner Return

Parse planner output:

**`## PLANNING COMPLETE`:**
- Display: `Planner created {N} plan(s). Files on disk.`
- If `--skip-verify`: Skip to step 13
- Check config: `WORKFLOW_PLAN_CHECK=$(cat .planning/config.json 2>/dev/null | grep -o '"plan_check"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")`
- If `workflow.plan_check` is `false`: Skip to step 13
- Otherwise: Proceed to step 10

**`## CHECKPOINT REACHED`:**
- Present to user, get response, spawn continuation (see step 12)

**`## PLANNING INCONCLUSIVE`:**
- Show what was attempted
- Offer: Add context, Retry, Manual
- Wait for user response

## 10. Spawn vit-plan-checker Agent

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► VERIFYING PLANS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning plan checker...
```

Read plans and requirements for the checker:

```bash
# Read all plans in phase directory
PLANS_CONTENT=$(cat "${PHASE_DIR}"/*-PLAN.md 2>/dev/null)

# Read requirements (reuse from step 7 if available)
REQUIREMENTS_CONTENT=$(cat .planning/REQUIREMENTS.md 2>/dev/null)
```

Fill checker prompt with inlined content and spawn:

```markdown
<verification_context>

**Phase:** {phase_number}
**Phase Goal:** {goal from ROADMAP}

**Plans to verify:**
{plans_content}

**Requirements (if exists):**
{requirements_content}

</verification_context>

<expected_output>
Return one of:
- ## VERIFICATION PASSED — all checks pass
- ## ISSUES FOUND — structured issue list
</expected_output>
```

```
Task(
  prompt=checker_prompt,
  subagent_type="vit-plan-checker",
  model="{checker_model}",
  description="Verify Phase {phase} plans"
)
```

## 11. Handle Checker Return

**If `## VERIFICATION PASSED`:**
- Display: `Plans verified. Ready for execution.`
- Proceed to step 13

**If `## ISSUES FOUND`:**
- Display: `Checker found issues:`
- List issues from checker output
- Check iteration count
- Proceed to step 12

## 12. Revision Loop (Max 3 Iterations)

Track: `iteration_count` (starts at 1 after initial plan + check)

**If iteration_count < 3:**

Display: `Sending back to planner for revision... (iteration {N}/3)`

Read current plans for revision context:

```bash
PLANS_CONTENT=$(cat "${PHASE_DIR}"/*-PLAN.md 2>/dev/null)
```

Spawn vit-planner with revision prompt:

```markdown
<revision_context>

**Phase:** {phase_number}
**Mode:** revision

**Existing plans:**
{plans_content}

**Checker issues:**
{structured_issues_from_checker}

</revision_context>

<instructions>
Make targeted updates to address checker issues.
Do NOT replan from scratch unless issues are fundamental.
Return what changed.
</instructions>
```

```
Task(
  prompt="First, read ./.claude/agents/vit-planner.md for your role and instructions.\n\n" + revision_prompt,
  subagent_type="general-purpose",
  model="{planner_model}",
  description="Revise Phase {phase} plans"
)
```

- After planner returns → spawn checker again (step 10)
- Increment iteration_count

**If iteration_count >= 3:**

Display: `Max iterations reached. {N} issues remain:`
- List remaining issues

Offer options:
1. Force proceed (execute despite issues)
2. Provide guidance (user gives direction, retry)
3. Abandon (exit planning)

Wait for user response.

## 13. Create GitHub Sub-Issues

After plans are verified, create GitHub sub-issues for each plan in this phase.

**Check if gh CLI is available and if GitHub issue mapping exists:**
```bash
gh --version 2>/dev/null && echo "available" || echo "skip"
grep -A 20 "## GitHub Issue Mapping" .planning/STATE.md 2>/dev/null || echo "no mapping"
```

If gh not available or no GitHub Issue Mapping in STATE.md, skip silently and proceed to Step 14.

**Read the feature issue number and base branch for this phase from STATE.md:**

Look for the row matching `${MILESTONE}/{X}` in the GitHub Issue Mapping table (e.g., `v1.6/01`). For historical phases without a milestone prefix, fall back to matching phase `{X}` directly.
Extract: `FEATURE_ISSUE_NUMBER` and `BASE_BRANCH`.

**Read each PLAN.md file in the phase directory to extract title and objectives.**

For each plan (01-PLAN.md, 02-PLAN.md, etc.):

```bash
SUB_ISSUE=$(gh issue create \
  --title "feat(phase-{X}): Plan {N} — [Plan title from PLAN.md]" \
  --label "enhancement" \
  --body "## Goal
[Plan objective from PLAN.md — 1-2 sentences]

## Tasks
[Bulleted task list from PLAN.md]

## Acceptance criteria
[Success criteria from PLAN.md]

## Unit tests to write
[Test cases implied by the plan tasks]

## Meta
parent-issue: #${FEATURE_ISSUE_NUMBER}
base-branch: ${BASE_BRANCH}
phase: {X}
plan: {N}" \
  --jq '.number' 2>/dev/null || echo "")
```

**Update the parent feature issue body** to include sub-issue checklist:

```bash
# Build checklist of sub-issues
CHECKLIST="## Sub-issues\n- [ ] #[plan-01-issue] — [Plan 01 title]\n- [ ] #[plan-02-issue] — [Plan 02 title]"

gh issue edit ${FEATURE_ISSUE_NUMBER} \
  --body "$(gh issue view ${FEATURE_ISSUE_NUMBER} --json body -q '.body' | sed 's/Sub-issues will be created.*//')

${CHECKLIST}" 2>/dev/null || true
```

**Update STATE.md** — add sub-issue numbers to the GitHub Issue Mapping:

```markdown
## GitHub Issue Mapping

| Phase | Feature Issue | Branch | Sub-issues |
|-------|---------------|--------|------------|
| ${MILESTONE}/{X} | #[FEATURE_ISSUE] | [BASE_BRANCH] | #[01-issue], #[02-issue] |
```

**Print summary:**
```
GitHub issues created:
  Feature:   #[FEATURE_ISSUE] — Phase {X}: [Name]
  Sub-issues: #[01] Plan 01, #[02] Plan 02, ...

Add 'assign-to-claude' to any sub-issue to have Claude implement it automatically.
```

Commit STATE.md update:
```bash
cd "$WORK_DIR" && git add .planning/STATE.md
cd "$WORK_DIR" && git commit -m "docs(phase-{X}): link plans to GitHub sub-issues"
```

## 14. Present Final Status

Route to `<offer_next>`.

</process>

<offer_next>
Output this markdown directly (not as a code block):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► PHASE {X} PLANNED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {X}: {Name}** — {N} plan(s) in {M} wave(s)

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1    | 01, 02 | [objectives] |
| 2    | 03     | [objective]  |

Research: {Completed | Used existing | Skipped}
Verification: {Passed | Passed with override | Skipped}

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Execute Phase {X}** — run all {N} plans

/vit:execute-phase {X}

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- cat .planning/phases/{phase-dir}/*-PLAN.md — review plans
- /vit:plan-phase {X} --research — re-research first

───────────────────────────────────────────────────────────────
</offer_next>

<success_criteria>
- [ ] .planning/ directory validated
- [ ] Phase validated against roadmap
- [ ] Phase directory created if needed
- [ ] Research completed (unless --skip-research or --gaps or exists)
- [ ] vit-phase-researcher spawned if research needed
- [ ] Existing plans checked
- [ ] vit-planner spawned with context (including RESEARCH.md if available)
- [ ] Plans created (PLANNING COMPLETE or CHECKPOINT handled)
- [ ] vit-plan-checker spawned (unless --skip-verify)
- [ ] Verification passed OR user override OR max iterations with user decision
- [ ] GitHub sub-issues created for each plan (if gh CLI available and mapping exists)
- [ ] Parent feature issue updated with sub-issue checklist
- [ ] STATE.md updated with sub-issue numbers
- [ ] User sees status between agent spawns
- [ ] User knows next steps (execute or review)
</success_criteria>
