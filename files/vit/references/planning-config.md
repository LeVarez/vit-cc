<planning_config>

Configuration options for `.planning/` directory behavior.

<config_schema>
```json
"planning": {
  "commit_docs": true,
  "search_gitignored": false
},
"team": {
  "enabled": false,
  "roster": [],
  "default_reviewer": ""
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `commit_docs` | `true` | Whether to commit planning artifacts to git |
| `search_gitignored` | `false` | Add `--no-ignore` to broad rg searches |
| `team.enabled` | `false` | Enable team mode (multi-engineer collaboration) |
| `team.roster` | `[]` | Array of `{"handle": "alice", "role": "backend"}` objects |
| `team.default_reviewer` | `""` | GitHub handle to auto-assign as PR reviewer |
</config_schema>

<commit_docs_behavior>

**When `commit_docs: true` (default):**
- Planning files committed normally
- SUMMARY.md, STATE.md, ROADMAP.md tracked in git
- Full history of planning decisions preserved

**When `commit_docs: false`:**
- Skip all `git add`/`git commit` for `.planning/` files
- User must add `.planning/` to `.gitignore`
- Useful for: OSS contributions, client projects, keeping planning private

**Checking the config:**

```bash
# Check config.json first
COMMIT_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")

# Auto-detect gitignored (overrides config)
git check-ignore -q .planning 2>/dev/null && COMMIT_DOCS=false
```

**Auto-detection:** If `.planning/` is gitignored, `commit_docs` is automatically `false` regardless of config.json. This prevents git errors when users have `.planning/` in `.gitignore`.

**Conditional git operations:**

```bash
if [ "$COMMIT_DOCS" = "true" ]; then
  git add .planning/STATE.md
  git commit -m "docs: update state"
fi
```

</commit_docs_behavior>

<search_behavior>

**When `search_gitignored: false` (default):**
- Standard rg behavior (respects .gitignore)
- Direct path searches work: `rg "pattern" .planning/` finds files
- Broad searches skip gitignored: `rg "pattern"` skips `.planning/`

**When `search_gitignored: true`:**
- Add `--no-ignore` to broad rg searches that should include `.planning/`
- Only needed when searching entire repo and expecting `.planning/` matches

**Note:** Most VIT operations use direct file reads or explicit paths, which work regardless of gitignore status.

</search_behavior>

<setup_uncommitted_mode>

To use uncommitted mode:

1. **Set config:**
   ```json
   "planning": {
     "commit_docs": false,
     "search_gitignored": true
   }
   ```

2. **Add to .gitignore:**
   ```
   .planning/
   ```

3. **Existing tracked files:** If `.planning/` was previously tracked:
   ```bash
   git rm -r --cached .planning/
   git commit -m "chore: stop tracking planning docs"
   ```

</setup_uncommitted_mode>

<team_config>

**When `team.enabled: false` (default):**
- Solo mode: `assigned_to` fields in plans are left empty
- Claude executes all plans
- No reviewer auto-assigned on PRs

**When `team.enabled: true`:**
- vit-planner distributes plans to engineers based on roster and file ownership
- `assigned_to` is set on each plan during `/vit:plan-phase`
- `default_reviewer` is assigned to PRs when they go ready-for-review
- `/vit:team-status` shows all assignments and blockers

**Roster format:**
```json
"team": {
  "enabled": true,
  "roster": [
    { "handle": "alice", "role": "full-stack" },
    { "handle": "bob", "role": "backend" },
    { "handle": "carol", "role": "frontend" }
  ],
  "default_reviewer": "alice"
}
```

**Role values:** `full-stack`, `backend`, `frontend`, `devops`, `data`, `ml` — used as hints for plan assignment, not enforced.

**Reading team config in commands:**
```bash
TEAM_ENABLED=$(cat .planning/config.json 2>/dev/null | grep '"enabled"' | grep -o 'true\|false' | head -1 || echo "false")
TEAM_ROSTER=$(cat .planning/config.json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(' '.join(m['handle'] for m in d.get('team',{}).get('roster',[])))" 2>/dev/null || echo "")
DEFAULT_REVIEWER=$(cat .planning/config.json 2>/dev/null | grep '"default_reviewer"' | sed 's/.*"default_reviewer"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")
```

</team_config>

</planning_config>
