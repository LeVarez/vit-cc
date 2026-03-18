---
name: vit:settings
description: Configure VIT workflow toggles and model profile
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
---

<objective>
Allow users to toggle workflow agents on/off and select model profile via interactive settings.

Updates `.planning/config.json` with workflow preferences and model profile selection.
</objective>

<process>

## 1. Validate Environment

```bash
ls .planning/config.json 2>/dev/null
```

**If not found:** Error - run `/vit:new-project` first.

## 2. Read Current Config

```bash
cat .planning/config.json
```

Parse current values (default to `true` if not present):
- `workflow.research` — spawn researcher during plan-phase
- `workflow.plan_check` — spawn plan checker during plan-phase
- `workflow.verifier` — spawn verifier during execute-phase
- `model_profile` — which model each agent uses (default: `balanced`)
- `team.enabled` — multi-engineer collaboration mode (default: `false`)
- `team.roster` — array of engineer handles and roles
- `team.default_reviewer` — GitHub handle for auto-PR-reviewer assignment

## 3. Present Settings

Use AskUserQuestion with current values shown:

```
AskUserQuestion([
  {
    question: "Which model profile for agents?",
    header: "Model",
    multiSelect: false,
    options: [
      { label: "Quality", description: "Opus everywhere except verification (highest cost)" },
      { label: "Balanced (Recommended)", description: "Opus for planning, Sonnet for execution/verification" },
      { label: "Budget", description: "Sonnet for writing, Haiku for research/verification (lowest cost)" }
    ]
  },
  {
    question: "Spawn Plan Researcher? (researches domain before planning)",
    header: "Research",
    multiSelect: false,
    options: [
      { label: "Yes", description: "Research phase goals before planning" },
      { label: "No", description: "Skip research, plan directly" }
    ]
  },
  {
    question: "Spawn Plan Checker? (verifies plans before execution)",
    header: "Plan Check",
    multiSelect: false,
    options: [
      { label: "Yes", description: "Verify plans meet phase goals" },
      { label: "No", description: "Skip plan verification" }
    ]
  },
  {
    question: "Spawn Execution Verifier? (verifies phase completion)",
    header: "Verifier",
    multiSelect: false,
    options: [
      { label: "Yes", description: "Verify must-haves after execution" },
      { label: "No", description: "Skip post-execution verification" }
    ]
  },
  {
    question: "Team mode? (multi-engineer collaboration)",
    header: "Team",
    multiSelect: false,
    options: [
      { label: "Solo (default)", description: "Single engineer + Claude, no assignment" },
      { label: "Team", description: "Multiple engineers — plans assigned to team members" }
    ]
  }
])
```

**Pre-select based on current config values.**

## 4. Update Config

Merge new settings into existing config.json:

```json
{
  ...existing_config,
  "model_profile": "quality" | "balanced" | "budget",
  "workflow": {
    "research": true/false,
    "plan_check": true/false,
    "verifier": true/false
  },
  "team": {
    "enabled": true/false,
    "roster": [...existing roster or []],
    "default_reviewer": "...existing or empty"
  }
}
```

**If team mode is enabled:** After writing config, prompt for roster:

```
AskUserQuestion({
  question: "Add team members? (enter GitHub handles, one per line, or skip)",
  header: "Team Roster",
  freeText: true
})
```

For each handle entered, prompt for role:
```
AskUserQuestion({
  question: "Role for @[handle]?",
  header: "Role",
  options: [
    { label: "full-stack" },
    { label: "backend" },
    { label: "frontend" },
    { label: "devops" },
    { label: "data/ml" }
  ]
})
```

Also prompt for default PR reviewer:
```
AskUserQuestion({
  question: "Default PR reviewer? (GitHub handle, or skip)",
  header: "Default Reviewer",
  freeText: true
})
```

Write final roster to config.json `team.roster` array and `team.default_reviewer`.

Write updated config to `.planning/config.json`.

## 5. Confirm Changes

Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► SETTINGS UPDATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Setting              | Value |
|----------------------|-------|
| Model Profile        | {quality/balanced/budget} |
| Plan Researcher      | {On/Off} |
| Plan Checker         | {On/Off} |
| Execution Verifier   | {On/Off} |
| Team Mode            | {Solo/Team} |
| Team Roster          | {handles or —} |
| Default Reviewer     | {handle or —} |

These settings apply to future /vit:plan-phase and /vit:execute-phase runs.

Quick commands:
- /vit:set-profile <profile> — switch model profile
- /vit:plan-phase --research — force research
- /vit:plan-phase --skip-research — skip research
- /vit:plan-phase --skip-verify — skip plan check
```

</process>

<success_criteria>
- [ ] Current config read
- [ ] User presented with 5 settings (profile + 3 toggles + team mode)
- [ ] Config updated with model_profile, workflow, and team sections
- [ ] If team mode enabled: roster and default reviewer collected
- [ ] Changes confirmed to user
</success_criteria>
