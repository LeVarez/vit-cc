---
name: vit:review-feedback
description: Read developer feedback on a GitHub feature issue and implement requested changes
argument-hint: "<phase-number>"
allowed-tools:
  - Read
  - Bash
  - Task
---

<objective>
Read developer comments left on the GitHub feature issue for a phase (after the verification guide was posted), implement each requested change as an atomic commit, and reply on the issue confirming what was done.

Use this after `/vit:verify-work` posts the verification guide and a developer leaves feedback requesting changes.
</objective>

<execution_context>
@.planning/STATE.md
@.planning/ROADMAP.md
</execution_context>

<context>
Phase: $ARGUMENTS
</context>

<process>

<step name="parse_arguments">
Parse the phase number from `$ARGUMENTS`.

If no argument provided:
```
ERROR: Phase number required
Usage: /vit:review-feedback <phase>
Example: /vit:review-feedback 44
```
Exit.
</step>

<step name="resolve_work_dir">
Extract the phase number and look up the designated branch + feature issue in STATE.md:

```bash
PHASE_NUM=$(echo "$ARGUMENTS" | grep -o '^[0-9]*')
MILESTONE=$(grep "^Milestone:" .planning/STATE.md 2>/dev/null | sed 's/Milestone: //' | tr -d ' ')
if [ -z "$MILESTONE" ]; then
  MILESTONE=$(git branch --show-current | grep -o 'v[0-9]*\.[0-9]*' | head -1)
fi
DESIGNATED_BRANCH=$(grep "| ${MILESTONE}/${PHASE_NUM} " .planning/STATE.md 2>/dev/null | grep -o 'feature/[^ |]*')
if [ -z "$DESIGNATED_BRANCH" ]; then
  DESIGNATED_BRANCH=$(grep "| ${PHASE_NUM} " .planning/STATE.md 2>/dev/null | grep -o 'feature/[^ |]*')
fi
FEATURE_ISSUE=$(grep "| ${MILESTONE}/${PHASE_NUM} " .planning/STATE.md 2>/dev/null | grep -o '#[0-9][0-9]*' | head -1 | tr -d '#')
if [ -z "$FEATURE_ISSUE" ]; then
  FEATURE_ISSUE=$(grep "| ${PHASE_NUM} " .planning/STATE.md 2>/dev/null | grep -o '#[0-9][0-9]*' | head -1 | tr -d '#')
fi
MAIN_WORKTREE=$(git worktree list --porcelain | grep "^worktree " | head -1 | sed 's/worktree //')
CURRENT_DIR=$(pwd)
```

Use the same worktree resolution logic as execute-phase:
- If worktree for the branch exists: use it as WORK_DIR
- Otherwise: create it or use current directory

If `FEATURE_ISSUE` is empty: warn that no GitHub mapping was found for this phase and suggest running `/vit:new-milestone` to set up GitHub integration. Offer to continue anyway (changes will be local only).
</step>

<step name="check_gh_available">
Verify gh CLI is available and authenticated:

```bash
gh auth status 2>/dev/null && echo "ok" || echo "not_authenticated"
```

If not authenticated:
```
ERROR: GitHub CLI not authenticated.
Run: gh auth login
Then retry: /vit:review-feedback {N}
```
Exit.
</step>

<step name="model_profile">
Read model profile for agent spawning:

```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

Model lookup:
| Profile | Executor model |
|---------|---------------|
| quality | opus |
| balanced | sonnet |
| budget | sonnet |
</step>

<step name="spawn_reviewer">
Read plan and state contents before spawning (@ syntax doesn't work across Task boundaries):

```bash
STATE_CONTENT=$(cat "$WORK_DIR/.planning/STATE.md" 2>/dev/null || echo "")
ROADMAP_CONTENT=$(cat "$WORK_DIR/.planning/ROADMAP.md" 2>/dev/null || echo "")
```

Spawn the `vit-github-reviewer` agent:

```
Task(
  prompt="Working directory: {work_dir}

All git commands and file operations must be run as: cd {work_dir} && ...

Phase: {phase_num}
Feature issue: #{feature_issue}

Read developer feedback comments on GitHub issue #{feature_issue} for phase {phase_num}.
Implement all requested changes. Commit each fix. Reply on the issue.

Project state:
{state_content}

Roadmap:
{roadmap_content}",
  subagent_type="vit-github-reviewer",
  model="{executor_model}"
)
```
</step>

<step name="present_results">
When the reviewer agent completes, present the results to the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► REVIEW FEEDBACK IMPLEMENTED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase {N}: {Name}

{N} changes implemented
Reply posted on #{FEATURE_ISSUE}

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Verify fixes** — confirm all changes pass

/vit:verify-work {N}

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────
```
</step>

</process>

<success_criteria>
- [ ] Phase argument parsed
- [ ] Worktree and feature issue resolved
- [ ] GitHub CLI available
- [ ] vit-github-reviewer spawned with full context
- [ ] Changes implemented and committed
- [ ] Reply posted on GitHub issue
- [ ] User directed to /vit:verify-work
</success_criteria>
