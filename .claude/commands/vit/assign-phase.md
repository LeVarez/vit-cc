---
name: vit:assign-phase
description: Assign a phase or individual plan to an engineer
argument-hint: "<phase> [engineer-handle]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - AskUserQuestion
---

<objective>
Assign a phase's plans to a specific engineer and optionally set execute_by mode.

Updates:
- Each PLAN.md in the phase: `assigned_to` and optionally `execute_by`
- STATE.md GitHub Issue Mapping `Assigned` column
- GitHub feature issue assignee (if gh available)
</objective>

<context>
Phase: $ARGUMENTS (format: "N" or "N engineer-handle")

@.planning/STATE.md
</context>

<process>

## 1. Parse Arguments

Extract phase number and optional engineer handle from $ARGUMENTS:
```bash
PHASE_NUM=$(echo "$ARGUMENTS" | grep -o '^[0-9]*\(\.[0-9]*\)\?' | head -1)
ENGINEER=$(echo "$ARGUMENTS" | awk '{print $2}' | tr -d '@')
```

Normalize phase to zero-padded format:
```bash
if [[ "$PHASE_NUM" =~ ^[0-9]+$ ]]; then
  PHASE_NUM=$(printf "%02d" "$PHASE_NUM")
fi
```

## 2. Validate Phase

```bash
MILESTONE=$(grep "^Milestone:" .planning/STATE.md 2>/dev/null | sed 's/Milestone: //' | tr -d ' ')
PHASE_DIR=$(ls -d ".planning/phases/${MILESTONE}/${PHASE_NUM}-"* 2>/dev/null | head -1)
if [ -z "$PHASE_DIR" ]; then
  PHASE_DIR=$(ls -d ".planning/phases/${PHASE_NUM}-"* 2>/dev/null | head -1)
fi
```

If no phase directory found: Error — "Phase ${PHASE_NUM} not found. Run /vit:plan-phase ${PHASE_NUM} first."

## 3. Resolve Engineer

If engineer not provided in arguments:

Read team roster from config.json:
```bash
TEAM_ROSTER=$(cat .planning/config.json 2>/dev/null \
  | python3 -c "import json,sys; d=json.load(sys.stdin); r=d.get('team',{}).get('roster',[]); print('\n'.join(m['handle'] for m in r))" 2>/dev/null || echo "")
```

If roster is non-empty:
```
AskUserQuestion({
  question: "Assign Phase [N] to which engineer?",
  header: "Assign Phase",
  options: [
    { label: "@[handle1]" },
    { label: "@[handle2]" },
    { label: "Enter manually" }
  ]
})
```

If no roster or "Enter manually": Ask for handle as free text.

Strip @ from handle.

## 4. Check Existing Plans

```bash
PLAN_FILES=$(ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null)
PLAN_COUNT=$(echo "$PLAN_FILES" | grep -c "PLAN.md" || echo "0")
```

If no plans found:
- Warn: "No plans found in Phase ${PHASE_NUM}. Run /vit:plan-phase ${PHASE_NUM} first."
- Ask if user wants to pre-assign for when plans are created. If yes, continue with assignment to STATE.md only. If no, abort.

## 5. Show Assignment Preview

Display:
```
Assigning Phase [N] plans to @[engineer]:

[List plan files and their current assigned_to values]

Plans will be updated:
- assigned_to: [engineer]
- execute_by: claude (unchanged)
```

Ask to confirm:
```
AskUserQuestion({
  question: "Confirm assignment?",
  header: "Assign Phase [N] → @[engineer]",
  options: [
    { label: "Assign", description: "Update all plans in this phase" },
    { label: "Cancel" }
  ]
})
```

## 6. Update Plan Files

For each PLAN.md in phase directory:

```bash
for PLAN_FILE in $PLAN_FILES; do
  # Update assigned_to field
  if grep -q "^assigned_to:" "$PLAN_FILE"; then
    sed -i '' "s/^assigned_to:.*$/assigned_to: \"${ENGINEER}\"/" "$PLAN_FILE" 2>/dev/null || \
    sed -i "s/^assigned_to:.*$/assigned_to: \"${ENGINEER}\"/" "$PLAN_FILE"
  else
    # Insert after autonomous: line
    sed -i '' "/^autonomous:/a\\
assigned_to: \"${ENGINEER}\"" "$PLAN_FILE" 2>/dev/null || \
    sed -i "/^autonomous:/a assigned_to: \"${ENGINEER}\"" "$PLAN_FILE"
  fi
done
```

## 7. Update STATE.md Assigned Column

```bash
sed -i '' "s/| ${MILESTONE}\/${PHASE_NUM} \([^|]*\)| \([^|]*\)| \([^|]*\)| \([^|]*\)| —/| ${MILESTONE}\/${PHASE_NUM} \1| \2| \3| \4| @${ENGINEER}/" \
  .planning/STATE.md 2>/dev/null || \
sed -i "s/| ${MILESTONE}\/${PHASE_NUM} \([^|]*\)| \([^|]*\)| \([^|]*\)| \([^|]*\)| —/| ${MILESTONE}\/${PHASE_NUM} \1| \2| \3| \4| @${ENGINEER}/" \
  .planning/STATE.md 2>/dev/null || true
```

## 8. Assign GitHub Feature Issue

```bash
gh --version 2>/dev/null && GH_AVAILABLE=true || GH_AVAILABLE=false
```

If `GH_AVAILABLE=true`:
```bash
FEATURE_ISSUE=$(grep "| ${MILESTONE}/${PHASE_NUM} " .planning/STATE.md 2>/dev/null \
  | grep -o '#[0-9]*' | head -1 | tr -d '#')
if [ -n "$FEATURE_ISSUE" ]; then
  gh issue edit "$FEATURE_ISSUE" --assignee "$ENGINEER" 2>/dev/null && \
    echo "◆ GitHub issue #${FEATURE_ISSUE} assigned to @${ENGINEER}" || true
fi
```

## 9. Commit Changes

```bash
git add "${PHASE_DIR}"/*-PLAN.md .planning/STATE.md
git commit -m "chore(phase-${PHASE_NUM}): assign to @${ENGINEER}"
```

## 10. Display Result

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► PHASE [N] ASSIGNED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase [N]: [Name]
Assigned to: @[engineer]
Plans updated: [N]

@[engineer] can now run:
  /vit:execute-phase [N]

Or check status with:
  /vit:team-status
```

</process>

<success_criteria>
- [ ] Phase directory found
- [ ] Engineer handle resolved (from args, roster, or manual)
- [ ] All PLAN.md files in phase updated with assigned_to
- [ ] STATE.md Assigned column updated
- [ ] GitHub feature issue assigned (if gh available)
- [ ] Changes committed
- [ ] User sees confirmation
</success_criteria>
