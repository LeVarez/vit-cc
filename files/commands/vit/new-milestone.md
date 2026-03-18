---
name: vit:new-milestone
description: Start a new milestone cycle — update PROJECT.md and route to requirements
argument-hint: "[milestone name, e.g., 'v1.1 Notifications']"
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - AskUserQuestion
---

<objective>
Start a new milestone through unified flow: questioning → research (optional) → requirements → roadmap.

This is the brownfield equivalent of new-project. The project exists, PROJECT.md has history. This command gathers "what's next", updates PROJECT.md, then continues through the full requirements → roadmap cycle.

**Creates/Updates:**
- `.planning/PROJECT.md` — updated with new milestone goals
- `.planning/research/` — domain research (optional, focuses on NEW features)
- `.planning/REQUIREMENTS.md` — scoped requirements for this milestone
- `.planning/ROADMAP.md` — phase structure (continues numbering)
- `.planning/STATE.md` — reset for new milestone

**After this command:** Run `/vit:plan-phase [N]` to start execution.
</objective>

<execution_context>
@./.claude/vit/references/questioning.md
@./.claude/vit/references/ui-brand.md
@./.claude/vit/templates/project.md
@./.claude/vit/templates/requirements.md
</execution_context>

<context>
Milestone name: $ARGUMENTS (optional - will prompt if not provided)

**Load project context:**
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/MILESTONES.md
@.planning/config.json

**Load milestone context (if exists, from /vit:discuss-milestone):**
@.planning/MILESTONE-CONTEXT.md
</context>

<process>

## Phase 0: Worktree Check

Check if there is already an in-progress milestone in this directory:

```bash
CURRENT_MILESTONE=$(grep -o 'Current Milestone: [^|]*' .planning/STATE.md 2>/dev/null | head -1)
HAS_INCOMPLETE=$(grep -c "Status: In progress\|Status: Not started\|Phase:.*of.*[^0]" .planning/STATE.md 2>/dev/null || echo "0")
```

If `.planning/STATE.md` exists AND has an in-progress milestone:

Ask with AskUserQuestion:
- header: "Parallel Milestone"
- question: "You have an active milestone in progress (`[CURRENT_MILESTONE]`). Create an isolated git worktree for the new milestone so you can work on both simultaneously?"
- options:
  - "Yes — create worktree (recommended)" — New milestone gets its own directory
  - "No — overwrite current state" — Replace existing milestone state (destructive)

Store response as `USE_WORKTREE`.

If `.planning/STATE.md` doesn't exist or no milestone in progress: set `USE_WORKTREE=false`, continue normally.

**If `USE_WORKTREE=true`:**
- Defer worktree creation to after Phase 3 (version must be determined first)
- Set a flag: `WORKTREE_MODE=true`
- Continue through Phases 1–3 normally (read context, gather goals, confirm version)

## Phase 1: Load Context

- Read PROJECT.md (existing project, Validated requirements, decisions)
- Read MILESTONES.md (what shipped previously)
- Read STATE.md (pending todos, blockers)
- Check for MILESTONE-CONTEXT.md (from /vit:discuss-milestone)

## Phase 2: Gather Milestone Goals

**If MILESTONE-CONTEXT.md exists:**
- Use features and scope from discuss-milestone
- Present summary for confirmation

**If no context file:**
- Present what shipped in last milestone
- Ask: "What do you want to build next?"
- Use AskUserQuestion to explore features
- Probe for priorities, constraints, scope

## Phase 3: Determine Milestone Version

- Parse last version from MILESTONES.md
- Suggest next version (v1.0 → v1.1, or v2.0 for major)
- Confirm with user

## Phase 3.5: Create Milestone Branch (always)

This phase always runs to ensure planning docs land on `milestone/v${NEW_VERSION}`, not on `main`.

**If `WORKTREE_MODE=true`** (parallel milestone — separate directory):
```bash
PROJECT_DIR=$(basename "$(git rev-parse --show-toplevel)")
WORKTREE_PATH="../${PROJECT_DIR}-v${NEW_VERSION}"

# Create the worktree on a new branch
git worktree add "$WORKTREE_PATH" -b "milestone/v${NEW_VERSION}"

# Seed .planning/ with shared project context
mkdir -p "$WORKTREE_PATH/.planning"
cp .planning/PROJECT.md "$WORKTREE_PATH/.planning/"
cp .planning/config.json "$WORKTREE_PATH/.planning/" 2>/dev/null || true
cp .planning/MILESTONES.md "$WORKTREE_PATH/.planning/" 2>/dev/null || true

MILESTONE_WORKTREE="$WORKTREE_PATH"
```

If `git worktree add` fails (e.g. path already exists), catch the error, inform the user:
```
Error: Worktree path "$WORKTREE_PATH" already exists.
Please choose a different version number or remove the existing directory first.
```
Then abort.

**If `WORKTREE_MODE=false`** (single directory — no parallel milestone):
```bash
# Create and switch to milestone branch so all planning commits land there, not on main
git checkout -b "milestone/v${NEW_VERSION}"
MILESTONE_WORKTREE="."
```

From this point on, **all .planning/ writes and git commits go to `$MILESTONE_WORKTREE/.planning/`** via `cd "$MILESTONE_WORKTREE"`.
That means: REQUIREMENTS.md, ROADMAP.md, STATE.md, research/ all land in the milestone branch.

## Phase 4: Update PROJECT.md

Add/update these sections:

```markdown
## Current Milestone: v[X.Y] [Name]

**Goal:** [One sentence describing milestone focus]

**Target features:**
- [Feature 1]
- [Feature 2]
- [Feature 3]
```

Update Active requirements section with new goals.

Update "Last updated" footer.

## Phase 5: Update STATE.md

```markdown
## Current Position

Milestone: v[X.Y]
Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: [today] — Milestone v[X.Y] started
```

Keep Accumulated Context section (decisions, blockers) from previous milestone.

## Phase 6: Cleanup and Commit

Delete MILESTONE-CONTEXT.md if exists (consumed).

Check planning config:
```bash
COMMIT_PLANNING_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
git check-ignore -q .planning 2>/dev/null && COMMIT_PLANNING_DOCS=false
```

If `COMMIT_PLANNING_DOCS=false`: Skip git operations

If `COMMIT_PLANNING_DOCS=true` (default):
```bash
cd "$MILESTONE_WORKTREE" && git add .planning/PROJECT.md .planning/STATE.md
cd "$MILESTONE_WORKTREE" && git commit -m "docs: start milestone v[X.Y] [Name]"
```

## Phase 6.5: Resolve Model Profile

Read model profile for agent spawning:

```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

Default to "balanced" if not set.

**Model lookup table:**

| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| vit-project-researcher | opus | sonnet | haiku |
| vit-research-synthesizer | sonnet | sonnet | haiku |
| vit-roadmapper | opus | sonnet | sonnet |

Store resolved models for use in Task calls below.

## Phase 7: Research Decision

Use AskUserQuestion:
- header: "Research"
- question: "Research the domain ecosystem for new features before defining requirements?"
- options:
  - "Research first (Recommended)" — Discover patterns, expected features, architecture for NEW capabilities
  - "Skip research" — I know what I need, go straight to requirements

**If "Research first":**

Display stage banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► RESEARCHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Researching [new features] ecosystem...
```

Create research directory:
```bash
mkdir -p .planning/research
```

Display spawning indicator:
```
◆ Spawning 4 researchers in parallel...
  → Stack research (for new features)
  → Features research
  → Architecture research (integration)
  → Pitfalls research
```

Spawn 4 parallel vit-project-researcher agents with milestone-aware context:

```
Task(prompt="
<research_type>
Project Research — Stack dimension for [new features].
</research_type>

<milestone_context>
SUBSEQUENT MILESTONE — Adding [target features] to existing app.

Existing validated capabilities (DO NOT re-research):
[List from PROJECT.md Validated requirements]

Focus ONLY on what's needed for the NEW features.
</milestone_context>

<question>
What stack additions/changes are needed for [new features]?
</question>

<project_context>
[PROJECT.md summary - current state, new milestone goals]
</project_context>

<downstream_consumer>
Your STACK.md feeds into roadmap creation. Be prescriptive:
- Specific libraries with versions for NEW capabilities
- Integration points with existing stack
- What NOT to add and why
</downstream_consumer>

<quality_gate>
- [ ] Versions are current (verify with Context7/official docs, not training data)
- [ ] Rationale explains WHY, not just WHAT
- [ ] Integration with existing stack considered
</quality_gate>

<output>
Write to: .planning/research/STACK.md
Use template: ./.claude/vit/templates/research-project/STACK.md
</output>
", subagent_type="vit-project-researcher", model="{researcher_model}", description="Stack research")

Task(prompt="
<research_type>
Project Research — Features dimension for [new features].
</research_type>

<milestone_context>
SUBSEQUENT MILESTONE — Adding [target features] to existing app.

Existing features (already built):
[List from PROJECT.md Validated requirements]

Focus on how [new features] typically work, expected behavior.
</milestone_context>

<question>
How do [target features] typically work? What's expected behavior?
</question>

<project_context>
[PROJECT.md summary - new milestone goals]
</project_context>

<downstream_consumer>
Your FEATURES.md feeds into requirements definition. Categorize clearly:
- Table stakes (must have for these features)
- Differentiators (competitive advantage)
- Anti-features (things to deliberately NOT build)
</downstream_consumer>

<quality_gate>
- [ ] Categories are clear (table stakes vs differentiators vs anti-features)
- [ ] Complexity noted for each feature
- [ ] Dependencies on existing features identified
</quality_gate>

<output>
Write to: .planning/research/FEATURES.md
Use template: ./.claude/vit/templates/research-project/FEATURES.md
</output>
", subagent_type="vit-project-researcher", model="{researcher_model}", description="Features research")

Task(prompt="
<research_type>
Project Research — Architecture dimension for [new features].
</research_type>

<milestone_context>
SUBSEQUENT MILESTONE — Adding [target features] to existing app.

Existing architecture:
[Summary from PROJECT.md or codebase map]

Focus on how [new features] integrate with existing architecture.
</milestone_context>

<question>
How do [target features] integrate with existing [domain] architecture?
</question>

<project_context>
[PROJECT.md summary - current architecture, new features]
</project_context>

<downstream_consumer>
Your ARCHITECTURE.md informs phase structure in roadmap. Include:
- Integration points with existing components
- New components needed
- Data flow changes
- Suggested build order
</downstream_consumer>

<quality_gate>
- [ ] Integration points clearly identified
- [ ] New vs modified components explicit
- [ ] Build order considers existing dependencies
</quality_gate>

<output>
Write to: .planning/research/ARCHITECTURE.md
Use template: ./.claude/vit/templates/research-project/ARCHITECTURE.md
</output>
", subagent_type="vit-project-researcher", model="{researcher_model}", description="Architecture research")

Task(prompt="
<research_type>
Project Research — Pitfalls dimension for [new features].
</research_type>

<milestone_context>
SUBSEQUENT MILESTONE — Adding [target features] to existing app.

Focus on common mistakes when ADDING these features to an existing system.
</milestone_context>

<question>
What are common mistakes when adding [target features] to [domain]?
</question>

<project_context>
[PROJECT.md summary - current state, new features]
</project_context>

<downstream_consumer>
Your PITFALLS.md prevents mistakes in roadmap/planning. For each pitfall:
- Warning signs (how to detect early)
- Prevention strategy (how to avoid)
- Which phase should address it
</downstream_consumer>

<quality_gate>
- [ ] Pitfalls are specific to adding these features (not generic)
- [ ] Integration pitfalls with existing system covered
- [ ] Prevention strategies are actionable
</quality_gate>

<output>
Write to: .planning/research/PITFALLS.md
Use template: ./.claude/vit/templates/research-project/PITFALLS.md
</output>
", subagent_type="vit-project-researcher", model="{researcher_model}", description="Pitfalls research")
```

After all 4 agents complete, spawn synthesizer to create SUMMARY.md:

```
Task(prompt="
<task>
Synthesize research outputs into SUMMARY.md.
</task>

<research_files>
Read these files:
- .planning/research/STACK.md
- .planning/research/FEATURES.md
- .planning/research/ARCHITECTURE.md
- .planning/research/PITFALLS.md
</research_files>

<output>
Write to: .planning/research/SUMMARY.md
Use template: ./.claude/vit/templates/research-project/SUMMARY.md
Commit after writing.
</output>
", subagent_type="vit-research-synthesizer", model="{synthesizer_model}", description="Synthesize research")
```

Display research complete banner and key findings:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► RESEARCH COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Key Findings

**Stack additions:** [from SUMMARY.md]
**New feature table stakes:** [from SUMMARY.md]
**Watch Out For:** [from SUMMARY.md]

Files: `.planning/research/`
```

**If "Skip research":** Continue to Phase 8.

## Phase 8: Define Requirements

Display stage banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► DEFINING REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Load context:**

Read PROJECT.md and extract:
- Core value (the ONE thing that must work)
- Current milestone goals
- Validated requirements (what already exists)

**If research exists:** Read research/FEATURES.md and extract feature categories.

**Present features by category:**

```
Here are the features for [new capabilities]:

## [Category 1]
**Table stakes:**
- Feature A
- Feature B

**Differentiators:**
- Feature C
- Feature D

**Research notes:** [any relevant notes]

---

## [Next Category]
...
```

**If no research:** Gather requirements through conversation instead.

Ask: "What are the main things users need to be able to do with [new features]?"

For each capability mentioned:
- Ask clarifying questions to make it specific
- Probe for related capabilities
- Group into categories

**Scope each category:**

For each category, use AskUserQuestion:

- header: "[Category name]"
- question: "Which [category] features are in this milestone?"
- multiSelect: true
- options:
  - "[Feature 1]" — [brief description]
  - "[Feature 2]" — [brief description]
  - "[Feature 3]" — [brief description]
  - "None for this milestone" — Defer entire category

Track responses:
- Selected features → this milestone's requirements
- Unselected table stakes → future milestone
- Unselected differentiators → out of scope

**Identify gaps:**

Use AskUserQuestion:
- header: "Additions"
- question: "Any requirements research missed? (Features specific to your vision)"
- options:
  - "No, research covered it" — Proceed
  - "Yes, let me add some" — Capture additions

**Generate REQUIREMENTS.md:**

Create `.planning/REQUIREMENTS.md` with:
- v1 Requirements for THIS milestone grouped by category (checkboxes, REQ-IDs)
- Future Requirements (deferred to later milestones)
- Out of Scope (explicit exclusions with reasoning)
- Traceability section (empty, filled by roadmap)

**REQ-ID format:** `[CATEGORY]-[NUMBER]` (AUTH-01, NOTIF-02)

Continue numbering from existing requirements if applicable.

**Requirement quality criteria:**

Good requirements are:
- **Specific and testable:** "User can reset password via email link" (not "Handle password reset")
- **User-centric:** "User can X" (not "System does Y")
- **Atomic:** One capability per requirement (not "User can login and manage profile")
- **Independent:** Minimal dependencies on other requirements

**Present full requirements list:**

Show every requirement (not counts) for user confirmation:

```
## Milestone v[X.Y] Requirements

### [Category 1]
- [ ] **CAT1-01**: User can do X
- [ ] **CAT1-02**: User can do Y

### [Category 2]
- [ ] **CAT2-01**: User can do Z

[... full list ...]

---

Does this capture what you're building? (yes / adjust)
```

If "adjust": Return to scoping.

**Commit requirements:**

Check planning config (same pattern as Phase 6).

If committing:
```bash
cd "$MILESTONE_WORKTREE" && git add .planning/REQUIREMENTS.md
cd "$MILESTONE_WORKTREE" && git commit -m "$(cat <<'EOF'
docs: define milestone v[X.Y] requirements

[X] requirements across [N] categories
EOF
)"
```

## Phase 9: Create Roadmap

Display stage banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► CREATING ROADMAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning roadmapper...
```

**Determine starting phase number:**

Phase numbering starts at `01` for each milestone and is scoped to the milestone directory. Phase `v1.6/01` and phase `v1.7/01` are distinct phases — there is no global phase counter. This prevents collision when two milestones run in parallel worktrees.

Spawn vit-roadmapper agent with context:

```
Task(prompt="
<planning_context>

**Project:**
@.planning/PROJECT.md

**Requirements:**
@.planning/REQUIREMENTS.md

**Research (if exists):**
@.planning/research/SUMMARY.md

**Config:**
@.planning/config.json

**Previous milestone (for phase numbering):**
@.planning/MILESTONES.md

</planning_context>

<instructions>
Create roadmap for milestone v[X.Y]:
1. Start phase numbering at 01 (milestone-scoped — NOT continuing from global count)
2. Phase directories go under .planning/phases/v[X.Y]/ (e.g., .planning/phases/v[X.Y]/01-foundation/)
3. Derive phases from THIS MILESTONE's requirements (don't include validated/existing)
4. Map every requirement to exactly one phase
5. Derive 2-5 success criteria per phase (observable user behaviors)
6. Validate 100% coverage of new requirements
7. Write files immediately (ROADMAP.md, STATE.md, update REQUIREMENTS.md traceability)
   - STATE.md must include `Milestone: v[X.Y]` field under ## Current Position
   - GitHub Issue Mapping uses `v[X.Y]/NN` keys (e.g., `v[X.Y]/01`)
8. Return ROADMAP CREATED with summary

Write files first, then return. This ensures artifacts persist even if context is lost.
</instructions>
", subagent_type="vit-roadmapper", model="{roadmapper_model}", description="Create roadmap")
```

**Handle roadmapper return:**

**If `## ROADMAP BLOCKED`:**
- Present blocker information
- Work with user to resolve
- Re-spawn when resolved

**If `## ROADMAP CREATED`:**

Read the created ROADMAP.md and present it nicely inline:

```
---

## Proposed Roadmap

**[N] phases** | **[X] requirements mapped** | All milestone requirements covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| [N] | [Name] | [Goal] | [REQ-IDs] | [count] |
| [N+1] | [Name] | [Goal] | [REQ-IDs] | [count] |
...

### Phase Details

**Phase [N]: [Name]**
Goal: [goal]
Requirements: [REQ-IDs]
Success criteria:
1. [criterion]
2. [criterion]

[... continue for all phases ...]

---
```

**CRITICAL: Ask for approval before committing:**

Use AskUserQuestion:
- header: "Roadmap"
- question: "Does this roadmap structure work for you?"
- options:
  - "Approve" — Commit and continue
  - "Adjust phases" — Tell me what to change
  - "Review full file" — Show raw ROADMAP.md

**If "Approve":** Continue to commit.

**If "Adjust phases":**
- Get user's adjustment notes
- Re-spawn roadmapper with revision context:
  ```
  Task(prompt="
  <revision>
  User feedback on roadmap:
  [user's notes]

  Current ROADMAP.md: @.planning/ROADMAP.md

  Update the roadmap based on feedback. Edit files in place.
  Return ROADMAP REVISED with changes made.
  </revision>
  ", subagent_type="vit-roadmapper", model="{roadmapper_model}", description="Revise roadmap")
  ```
- Present revised roadmap
- Loop until user approves

**If "Review full file":** Display raw `cat .planning/ROADMAP.md`, then re-ask.

**Commit roadmap (after approval):**

Check planning config (same pattern as Phase 6).

If committing:
```bash
cd "$MILESTONE_WORKTREE" && git add .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md
cd "$MILESTONE_WORKTREE" && git commit -m "$(cat <<'EOF'
docs: create milestone v[X.Y] roadmap ([N] phases)

Phases:
[N]. [phase-name]: [requirements covered]
[N+1]. [phase-name]: [requirements covered]
...

All milestone requirements mapped to phases.
EOF
)"
```

## Phase 10: Create GitHub Milestone & Feature Issues

After roadmap is approved, create the GitHub milestone and one parent feature issue per phase.

**Check if gh CLI is available:**
```bash
gh --version 2>/dev/null && echo "gh available" || echo "gh not available"
```

If not available, skip this phase silently and proceed to Phase 11.

**Create GitHub milestone:**
```bash
GH_MILESTONE=$(gh api repos/:owner/:repo/milestones \
  --method POST \
  --field title="v[X.Y] — [Milestone Name]" \
  --field description="## Goal
[One sentence milestone goal from REQUIREMENTS.md]

## What we're building
[2-3 sentences describing what the milestone delivers to users — written in plain language, not technical. Focus on the user experience change or capability unlocked.]

## Out of scope
[Key things explicitly NOT in this milestone, from REQUIREMENTS.md Out of Scope section]

## Requirements
[X] requirements across [N] categories — see REQUIREMENTS.md for full list." \
  --jq '.number' 2>/dev/null || echo "")
```

If creation fails (repo not on GitHub, no auth, etc.), skip silently and proceed to Phase 11.

**For each phase in the roadmap, create a parent feature issue:**

Read ROADMAP.md to get each phase's number, name, goal, and requirements covered.

For each phase:

```bash
FEATURE_ISSUE=$(gh issue create \
  --title "feat(v[X.Y]): Phase [N] — [Phase Name]" \
  --label "enhancement" \
  --milestone "$GH_MILESTONE" \
  --body "## What we're building
[2-3 sentences describing what this phase delivers. Focus on the user-facing outcome or capability unlocked — not the technical implementation. Answer: what can users do after this phase that they couldn't before?]

## Why this phase
[1-2 sentences on why this is the right order — what does this phase unblock or depend on?]

## Goal
[Phase goal from ROADMAP.md — single sentence]

## Success criteria
[Success criteria from ROADMAP.md — bulleted list of observable user behaviors]

## Requirements covered
[REQ-IDs from ROADMAP.md]

## Sub-issues
Sub-issues will be created automatically by \`/vit:plan-phase [N]\`.

## Meta
milestone: v[X.Y]
phase: [N]
base-branch: feature/v[X.Y]-[N]-[phase-slug]" \
  --jq '.number' 2>/dev/null || echo "")
```

Then create the feature branch for this phase, linked to the issue via Development panel:
```bash
gh issue develop $FEATURE_ISSUE \
  --base "milestone/v${NEW_VERSION}" \
  --name "feature/v${NEW_VERSION}-[N]-[phase-slug]" \
  2>/dev/null || {
    # Fallback if gh issue develop fails (e.g. older gh version)
    git checkout -b "feature/v${NEW_VERSION}-[N]-[phase-slug]" "milestone/v${NEW_VERSION}" 2>/dev/null
    git push -u origin "feature/v${NEW_VERSION}-[N]-[phase-slug]" 2>/dev/null || true
    git checkout "milestone/v${NEW_VERSION}" 2>/dev/null
  }
```

Store the mapping of phase → feature issue number in STATE.md under a new section:

```markdown
## GitHub Issue Mapping

| Phase | Feature Issue | Branch |
|-------|---------------|--------|
| v[X.Y]/[N] | #[FEATURE_ISSUE] | feature/v[X.Y]-[N]-[phase-slug] |
| v[X.Y]/[N+1] | #[FEATURE_ISSUE] | feature/v[X.Y]-[N+1]-[phase-slug] |
```

**Print summary:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► GITHUB SYNC ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Milestone: v[X.Y] — [Name] (GitHub milestone #[GH_MILESTONE])

| Phase | Feature Issue | Branch |
|-------|---------------|--------|
| v[X.Y]/[N]   | #[X]          | feature/v[X.Y]-[N]-[slug] |
| v[X.Y]/[N+1] | #[X+1]        | feature/v[X.Y]-[N+1]-[slug] |

Sub-issues will be created when you run /vit:plan-phase [N].
```

Commit STATE.md with the mapping:
```bash
cd "$MILESTONE_WORKTREE" && git add .planning/STATE.md
cd "$MILESTONE_WORKTREE" && git commit -m "docs: link milestone v[X.Y] to GitHub milestone #[GH_MILESTONE]"
```

## Phase 11: Done

Present completion with next steps:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► MILESTONE INITIALIZED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Milestone v[X.Y]: [Name]**

| Artifact       | Location                    |
|----------------|-----------------------------|
| Project        | `.planning/PROJECT.md`      |
| Research       | `.planning/research/`       |
| Requirements   | `.planning/REQUIREMENTS.md` |
| Roadmap        | `.planning/ROADMAP.md`      |

**[N] phases** | **[X] requirements** | Ready to build ✓

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Phase [N]: [Phase Name]** — [Goal from ROADMAP.md]

`/vit:discuss-phase [N]` — gather context and clarify approach

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/vit:plan-phase [N]` — skip discussion, plan directly

───────────────────────────────────────────────────────────────
```

**If WORKTREE_MODE=true**, append to the completion message:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 WORKTREE ► $WORKTREE_PATH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your new milestone lives at: $WORKTREE_PATH
Open that directory in your IDE to start working on v[X.Y].
Your current milestone continues unchanged in this directory.

To context-switch:
  cd $WORKTREE_PATH    # v[X.Y] work
  cd -                 # back to current milestone
```

</process>

<success_criteria>
- [ ] PROJECT.md updated with Current Milestone section
- [ ] STATE.md reset for new milestone
- [ ] MILESTONE-CONTEXT.md consumed and deleted (if existed)
- [ ] Research completed (if selected) — 4 parallel agents spawned, milestone-aware
- [ ] Requirements gathered (from research or conversation)
- [ ] User scoped each category
- [ ] REQUIREMENTS.md created with REQ-IDs
- [ ] vit-roadmapper spawned with phase numbering context
- [ ] Roadmap files written immediately (not draft)
- [ ] User feedback incorporated (if any)
- [ ] ROADMAP.md created with phases numbered 01-NN within current milestone section
- [ ] All commits made (if planning docs committed)
- [ ] GitHub milestone created (if gh CLI available)
- [ ] Parent feature issue created per phase (if gh CLI available)
- [ ] Feature branch created per phase (if gh CLI available)
- [ ] STATE.md updated with GitHub Issue Mapping table
- [ ] User knows next step is `/vit:discuss-phase [N]`

- [ ] Worktree created at `../project-vX.Y` on branch `milestone/vX.Y` (if worktree mode)
- [ ] New milestone's `.planning/` files written to worktree (if worktree mode)

**Atomic commits:** Each phase commits its artifacts immediately. If context is lost, artifacts persist.
</success_criteria>
