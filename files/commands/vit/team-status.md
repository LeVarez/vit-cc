---
name: vit:team-status
description: Show team assignment status — who's working on what, what's blocked, what's unassigned
argument-hint: "[phase]"
allowed-tools:
  - Read
  - Bash
---

<objective>
Display team assignment status for the current milestone.

Shows:
- Per-engineer: which phases/plans they own and current status
- Unassigned phases
- Active blockers by owner
- PR review queue
</objective>

<context>
Phase filter: $ARGUMENTS (optional — show all phases if not provided)

@.planning/STATE.md
@.planning/ROADMAP.md
</context>

<process>

## 1. Read Team Config

```bash
TEAM_ENABLED=$(cat .planning/config.json 2>/dev/null | grep '"enabled"' | grep -o 'true\|false' | head -1 || echo "false")
TEAM_ROSTER=$(cat .planning/config.json 2>/dev/null \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print('\n'.join(m['handle'] for m in d.get('team',{}).get('roster',[])))" 2>/dev/null || echo "")
DEFAULT_REVIEWER=$(cat .planning/config.json 2>/dev/null \
  | grep '"default_reviewer"' | sed 's/.*"default_reviewer"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")
```

## 2. Read GitHub Issue Mapping

Parse STATE.md GitHub Issue Mapping table:
```bash
MILESTONE=$(grep "^Milestone:" .planning/STATE.md 2>/dev/null | sed 's/Milestone: //' | tr -d ' ')
```

For each row in the mapping table, extract: Phase, Feature Issue, Branch, PR, Assigned.

## 3. Read Plan Assignment Details

For each phase with plans, read PLAN.md files to get per-plan `assigned_to` and `execute_by`:

```bash
for PHASE_DIR in .planning/phases/${MILESTONE}/*/; do
  PHASE_NUM=$(basename "$PHASE_DIR" | grep -o '^[0-9]*')
  for PLAN_FILE in "${PHASE_DIR}"*-PLAN.md 2>/dev/null; do
    [ -f "$PLAN_FILE" ] || continue
    ASSIGNED=$(grep "^assigned_to:" "$PLAN_FILE" 2>/dev/null | sed 's/^assigned_to:[[:space:]]*//' | tr -d '"')
    EXECUTE_BY=$(grep "^execute_by:" "$PLAN_FILE" 2>/dev/null | sed 's/^execute_by:[[:space:]]*//' | tr -d '"')
    HAS_SUMMARY=$([ -f "${PLAN_FILE/PLAN/SUMMARY}" ] && echo "done" || echo "pending")
    # Collect per-engineer plan data
  done
done
```

## 4. Read Active Blockers

```bash
BLOCKERS=$(grep -A20 "### Blockers/Concerns" .planning/STATE.md 2>/dev/null \
  | grep "^\- " | grep "owner:" | head -20)
```

## 5. Check PR Review Queue

```bash
gh --version 2>/dev/null && GH_AVAILABLE=true || GH_AVAILABLE=false
if [ "$GH_AVAILABLE" = "true" ]; then
  OPEN_PRS=$(gh pr list --json number,title,reviewDecision,assignees \
    --jq '.[] | "\(.number) \(.title) — \(.reviewDecision // "REVIEW_REQUIRED")"' 2>/dev/null | head -10 || echo "")
fi
```

## 6. Display Team Status

Display a formatted status board:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► TEAM STATUS — [Milestone]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## By Engineer

[For each engineer with at least one assignment:]

**@[engineer]**
  Phase [N]: [Phase Name] — [status: planning/executing/complete/not started]
    Plan 01: [pending/done] — [plan title]
    Plan 02: [pending/done] — [plan title]
  Blockers: [count or "none"]

[If no engineers have assignments:]
  No assignments yet. Run /vit:assign-phase [N] [handle] to assign.

───────────────────────────────────────────────────────────────

## Unassigned Phases

[For each phase with Assigned = — in STATE.md:]
  Phase [N]: [Phase Name] — [status]
    /vit:assign-phase [N] [handle] to assign

[If all phases assigned:]
  All phases assigned ✓

───────────────────────────────────────────────────────────────

## Active Blockers

[For each blocker in STATE.md with status:open:]
  [Phase X] owner:@[name] — [description]

[If no open blockers:]
  No active blockers ✓

───────────────────────────────────────────────────────────────

[If GH_AVAILABLE and OPEN_PRS is non-empty:]
## PR Review Queue

[For each open PR:]
  #[N] [title] — [review status]
  Reviewer: [default_reviewer or "unassigned"]

───────────────────────────────────────────────────────────────

**Commands:**
- /vit:assign-phase [N] [handle] — assign a phase to an engineer
- /vit:progress — see milestone progress
- /vit:execute-phase [N] — execute a phase
```

</process>

<success_criteria>
- [ ] Team config read
- [ ] GitHub Issue Mapping parsed from STATE.md
- [ ] Per-engineer plan assignments collected
- [ ] Active blockers with owners shown
- [ ] PR review queue shown (if gh available)
- [ ] Unassigned phases highlighted
- [ ] Commands suggested
</success_criteria>
