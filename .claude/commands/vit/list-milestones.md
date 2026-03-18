---
name: vit:list-milestones
description: Show all active milestone worktrees and their current state
allowed-tools:
  - Bash
  - Read
---

<objective>
Show all active git worktrees that contain VIT milestones, with each milestone's
current phase, status, and last activity.
</objective>

<process>

## 1. Scan Worktrees

```bash
git worktree list --porcelain
```

Parse each worktree's path and branch from the output.

## 2. Read State for Each

For each worktree path, check if a VIT `.planning/` directory exists and read its state:

```bash
STATE="$WORKTREE_PATH/.planning/STATE.md"
ROADMAP="$WORKTREE_PATH/.planning/ROADMAP.md"
if [ -f "$STATE" ]; then
  MILESTONE=$(grep -o 'Current Milestone: [^\n]*' "$ROADMAP" 2>/dev/null | head -1 || echo "Unknown")
  PHASE=$(grep "^Phase:" "$STATE" | head -1 | sed 's/Phase: //')
  STATUS=$(grep "^Status:" "$STATE" | head -1 | sed 's/Status: //')
  LAST=$(grep "^Last activity:" "$STATE" | head -1 | sed 's/Last activity: //')
fi
```

## 3. Present Table

If one or more worktrees have `.planning/STATE.md`:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► ACTIVE MILESTONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Directory              | Branch              | Milestone   | Phase     | Status       | Last Activity         |
|------------------------|---------------------|-------------|-----------|--------------|----------------------|
| . (current)            | main                | v1.5 [Name] | 37 of 42  | In progress  | 2026-03-15 — plan 03 |
| ../project-v2.0        | milestone/v2.0      | v2.0 [Name] | 1 of 8    | Not started  | 2026-03-16 — init    |

To switch:  cd ../project-v2.0
To resume:  /vit:resume-work  (run in target directory)
```

Mark the current directory with `(current)`.

If a worktree path has no `.planning/STATE.md`, show it as:
```
| ../some-path   | branch-name    | —           | —         | No VIT state | — |
```

If no worktrees beyond the main one:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► ACTIVE MILESTONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Only one active milestone. Use /vit:new-milestone to start a parallel one.
```

</process>
