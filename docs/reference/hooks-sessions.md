---
title: Hooks and Sessions
---

# Hooks and Sessions

VIT integrates with Claude Code's hook and statusline system to provide session-aware features: automatic update checking, a live terminal status display, and persistent session state across Claude Code restarts.

## Hook Files

Two hook files are installed into `.claude/hooks/` during `npx vit-claude`:

| File | Type | Trigger |
|------|------|---------|
| `vit-check-update.cjs` | SessionStart | Runs once at the start of each Claude Code session |
| `vit-statusline.js` | Statusline | Runs continuously to populate the terminal status bar |

### vit-check-update.cjs

Checks npm for a newer version of `vit-cc` in the background, non-blocking.

**What it does:**

1. Reads the installed VIT version from `.claude/vit/VERSION` (project-local) or `~/.claude/vit/VERSION` (global). Checks the project path first to handle local installs.
2. Spawns a detached child process (`child.unref()`) that runs `npm view vit-cc version` with a 10-second timeout.
3. Writes the result to `~/.claude/cache/vit-update-check.json`:
   ```json
   {
     "update_available": true,
     "installed": "1.0.0",
     "latest": "1.1.0",
     "checked": 1737000000
   }
   ```
4. The parent process exits immediately — the check never blocks your session start.

**Non-blocking design:** The version check runs in a completely detached subprocess. If npm is unavailable or the check times out, the cache file is simply not updated and no error is shown.

**Cache location:** `~/.claude/cache/vit-update-check.json` — shared across all projects.

### vit-statusline.js

Renders a live status line in the Claude Code terminal interface, showing model, current task, directory, and context window usage.

**Reads from stdin:** Claude Code passes session data as JSON on stdin. The statusline script parses this to extract:

- `data.model.display_name` — the current Claude model (e.g., `claude-sonnet-4-5`)
- `data.workspace.current_dir` — working directory
- `data.session_id` — used to find the active todo file
- `data.context_window.remaining_percentage` — context usage

**Context window display:**

The context bar scales 80% real usage to 100% display (Claude Code enforces an 80% limit), with color coding:

| Usage | Color | Meaning |
|-------|-------|---------|
| 0–62% | Green | Plenty of context remaining |
| 63–80% | Yellow | Getting full — consider `/clear` soon |
| 81–94% | Orange | Near limit |
| 95–100% | Red (blinking skull) | Critical — `/clear` immediately |

The 10-segment progress bar uses `█` for filled and `░` for empty segments.

**Current task display:**

The script reads `~/.claude/todos/` to find the most recently modified todo file for the current session. If a task with `status === "in_progress"` is found, its `activeForm` is shown between the model name and directory:

```
claude-sonnet-4-5 │ Task 2: Write reference pages │ v1.1-02-04 ████░░░░░░ 42%
```

**Update badge:**

If `~/.claude/cache/vit-update-check.json` shows `update_available: true`, a yellow badge appears at the start of the status line:

```
⬆ /vit:update │ claude-sonnet-4-5 │ v1.1-02-04 ████░░░░░░ 42%
```

## settings.json Integration

VIT registers its hooks by merging into `.claude/settings.json` during installation. The `mergeSettings()` function in `src/install.js` preserves any existing configuration while adding VIT's entries.

**Merge logic:**

```js
// Existing hooks are preserved — VIT only adds if not already registered
const alreadyRegistered = sessionStartHooks.some(block => {
  return block.hooks.some(h => h.type === 'command' && h.command === checkCmd);
});

if (!alreadyRegistered) {
  sessionStartHooks.push({
    hooks: [{ type: 'command', command: 'node .claude/hooks/vit-check-update.cjs' }]
  });
}

// statusLine is added only if not already set
if (!settings.statusLine) {
  settings.statusLine = {
    type: 'command',
    command: 'node .claude/hooks/vit-statusline.js'
  };
}
```

**Resulting settings.json structure:**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/vit-check-update.cjs"
          }
        ]
      }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "node .claude/hooks/vit-statusline.js"
  }
}
```

If you have existing `SessionStart` hooks, they are preserved — VIT appends to the array rather than replacing it.

## Pause and Resume

VIT supports pausing mid-phase and resuming in a future session via continuation files.

### Pausing work

`/vit:pause-work` creates a `.continue-here` file at the project root capturing the current execution state:

```
PLAN: .planning/phases/v1.1/02-docs-site/02-04-PLAN.md
TASK: 2
STATUS: in_progress
COMPLETED_TASKS:
  - task: 1
    name: Write GitHub Integration reference
    commit: a1b2c3d
    files: docs/reference/github-integration.md
CONTEXT: Paused mid-task — configuration reference started but not committed
```

All in-progress work is committed as a `wip:` commit before the pause, ensuring nothing is lost:

```
wip: 02-docs-site paused at task 2/2

Current: Write Configuration Reference and Hooks/Sessions reference
```

### Resuming work

`/vit:resume-work` reads `.continue-here` and spawns a fresh agent with the continuation context. The fresh agent:

1. Verifies the `wip:` commit exists in git history
2. Reads the plan file at the specified path
3. Skips completed tasks (already committed)
4. Resumes from the specified task number

The `.continue-here` file is deleted after successful resume.

## Session Management

VIT maintains execution context across Claude Code restarts through `STATE.md`.

### Session Continuity section

`.planning/STATE.md` includes a `Session Continuity` block updated after every plan completion:

```markdown
## Session Continuity

Last session: 2026-03-19
Stopped at: Completed v1.1/02 Plan 01 — VitePress site foundation
Resume file: None
```

When you start a new Claude Code session and run a VIT command, this section tells the agent exactly where the project was left off.

### Accumulated Context

The `Accumulated Context` section in STATE.md persists key decisions and concerns across sessions:

```markdown
## Accumulated Context

### Decisions

**v1.1/02 Plan 01 decisions:**
- vitepress-plugin-mermaid included from the start
- base: '/vit-cc/' set in config.ts — mandatory for GitHub Pages
```

This context is not stored in Claude Code's conversation history (which is reset with `/clear`) — it lives in git and is always available to fresh agent sessions.

### Context budget

VIT commands instruct you to run `/clear` before each major command (`/vit:execute-phase`, `/vit:plan-phase`, etc.). This gives each command a full context window. STATE.md and the plan file provide all the continuity needed — Claude Code's conversation history is not required.
