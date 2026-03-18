---
name: vit:resume-work
description: Resume work from previous session with full context restoration
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
  - SlashCommand
---

<objective>
Restore complete project context and resume work seamlessly from previous session.

Routes to the resume-project workflow which handles:

- STATE.md loading (or reconstruction if missing)
- Checkpoint detection (.continue-here files)
- Incomplete work detection (PLAN without SUMMARY)
- Status presentation
- Context-aware next action routing
  </objective>

<execution_context>
@./.claude/vit/workflows/resume-project.md
</execution_context>

<process>
**Follow the resume-project workflow** from `@./.claude/vit/workflows/resume-project.md`.

The workflow handles all resumption logic including:

1. Project existence verification
2. STATE.md loading or reconstruction
3. Checkpoint and incomplete work detection
4. Visual status presentation
5. Context-aware option offering (checks CONTEXT.md before suggesting plan vs discuss)
6. Routing to appropriate next command
7. Session continuity updates

**After restoring context, sync GitHub (if mapped):**
Look up feature issue for the resumed phase from STATE.md `## GitHub Issue Mapping`.
If found, remove "wip" label:
```bash
gh issue edit $FEATURE_ISSUE --remove-label "wip" 2>/dev/null || true
```
   </process>
