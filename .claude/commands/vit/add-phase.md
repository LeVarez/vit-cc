---
name: vit:add-phase
description: Add phase to end of current milestone in roadmap
argument-hint: <description>
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Add a new integer phase to the end of the current milestone in the roadmap.

This command appends sequential phases to the current milestone's phase list, automatically calculating the next phase number based on existing phases.

Purpose: Add planned work discovered during execution that belongs at the end of current milestone.
</objective>

<execution_context>
@.planning/ROADMAP.md
@.planning/STATE.md
</execution_context>

<process>

<step name="parse_arguments">
Parse the command arguments:
- All arguments become the phase description
- Example: `/vit:add-phase Add authentication` → description = "Add authentication"
- Example: `/vit:add-phase Fix critical performance issues` → description = "Fix critical performance issues"

If no arguments provided:

```
ERROR: Phase description required
Usage: /vit:add-phase <description>
Example: /vit:add-phase Add authentication system
```

Exit.
</step>

<step name="load_roadmap">
Load the roadmap file:

```bash
if [ -f .planning/ROADMAP.md ]; then
  ROADMAP=".planning/ROADMAP.md"
else
  echo "ERROR: No roadmap found (.planning/ROADMAP.md)"
  exit 1
fi
```

Read roadmap content for parsing.
</step>

<step name="find_current_milestone">
Detect current milestone identifier:

```bash
MILESTONE=$(grep "^Milestone:" .planning/STATE.md 2>/dev/null | sed 's/Milestone: //' | tr -d ' ')
if [ -z "$MILESTONE" ]; then
  MILESTONE=$(git branch --show-current | grep -o 'v[0-9]*\.[0-9]*\.[0-9]*' | head -1)
fi
```

Parse the roadmap to find the current milestone section:

1. Locate the "## Current Milestone:" heading
2. Extract milestone name and version
3. Identify all phases under this milestone (before next "---" separator or next milestone heading)
4. Parse existing phase numbers (including decimals if present)

Example structure:

```
## Current Milestone: v1.0.0 Foundation

### Phase 4: Focused Command System
### Phase 5: Path Routing & Validation
### Phase 6: Documentation & Distribution
```

</step>

<step name="calculate_next_phase">
Find the highest integer phase number in the current milestone:

1. Extract all phase numbers from phase headings (### Phase N:)
2. Filter to integer phases only (ignore decimals like 4.1, 4.2)
3. Find the maximum integer value
4. Add 1 to get the next phase number

Example: If phases are 4, 5, 5.1, 6 → next is 7

Format as two-digit: `printf "%02d" $next_phase`
</step>

<step name="generate_slug">
Convert the phase description to a kebab-case slug:

```bash
# Example transformation:
# "Add authentication" → "add-authentication"
# "Fix critical performance issues" → "fix-critical-performance-issues"

slug=$(echo "$description" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
```

Phase directory name: `{two-digit-phase}-{slug}`
Example: `07-add-authentication`
</step>

<step name="create_phase_directory">
Create the phase directory structure under the milestone namespace:

```bash
phase_dir=".planning/phases/${MILESTONE}/${phase_num}-${slug}"
mkdir -p "$phase_dir"
```

Confirm: "Created directory: $phase_dir"
</step>

<step name="update_roadmap">
Add the new phase entry to the roadmap:

1. Find the insertion point (after last phase in current milestone, before "---" separator)
2. Insert new phase heading:

   ```
   ### Phase {N}: {Description}

   **Goal:** [To be planned]
   **Depends on:** Phase {N-1}
   **Plans:** 0 plans

   Plans:
   - [ ] TBD (run /vit:plan-phase {N} to break down)

   **Details:**
   [To be added during planning]
   ```

3. Write updated roadmap back to file

Preserve all other content exactly (formatting, spacing, other phases).
</step>

<step name="update_project_state">
Update STATE.md to reflect the new phase:

1. Read `.planning/STATE.md`
2. Under "## Current Position" → "**Next Phase:**" add reference to new phase
3. Under "## Accumulated Context" → "### Roadmap Evolution" add entry:
   ```
   - Phase {N} added: {description}
   ```

If "Roadmap Evolution" section doesn't exist, create it.
</step>

<step name="github_sync">
Check if STATE.md has a `## GitHub Issue Mapping` section (signals GitHub-connected project):

```bash
grep -q "## GitHub Issue Mapping" .planning/STATE.md 2>/dev/null
```

If yes, create feature issue + branch using the same template as `vit:new-milestone` Phase 10:

1. Get milestone title from ROADMAP.md `## Current Milestone:` heading
2. Create feature issue:
   ```bash
   FEATURE_ISSUE=$(gh issue create \
     --title "Phase {N}: {description}" \
     --body "## Phase {N}: {description}

   **Milestone:** {milestone-title}
   **Goal:** To be planned — run \`/vit:plan-phase {N}\`

   Part of milestone: {milestone-title}" \
     --label "feature" 2>/dev/null | grep -o '[0-9]*$' || echo "")
   ```
3. Create feature branch linked to the issue via Development panel:
   ```bash
   gh issue develop $FEATURE_ISSUE \
     --base main \
     --name "feature/${MILESTONE}-{N}-{slug}" \
     2>/dev/null || {
       git checkout -b "feature/${MILESTONE}-{N}-{slug}" main 2>/dev/null || true
       git checkout - 2>/dev/null || true
       git push -u origin "feature/${MILESTONE}-{N}-{slug}" 2>/dev/null || true
     }
   ```
4. Append row to `## GitHub Issue Mapping` table in STATE.md:
   ```
   | ${MILESTONE}/{N} | #{FEATURE_ISSUE} | feature/${MILESTONE}-{N}-{slug} |
   ```

Store FEATURE_ISSUE and branch name for completion summary.
</step>

<step name="completion">
Present completion summary:

```
Phase {N} added to current milestone:
- Description: {description}
- Directory: .planning/phases/{phase-num}-{slug}/
- Status: Not planned yet

Roadmap updated: {roadmap-path}
Project state updated: .planning/STATE.md
{If GitHub: GitHub: #{FEATURE_ISSUE} created — feature/{N}-{slug}}

---

## ▶ Next Up

**Phase {N}: {description}**

`/vit:plan-phase {N}`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/vit:add-phase <description>` — add another phase
- Review roadmap

---
```
</step>

</process>

<anti_patterns>

- Don't modify phases outside current milestone
- Don't renumber existing phases
- Don't use decimal numbering (that's /vit:insert-phase)
- Don't create plans yet (that's /vit:plan-phase)
- Don't commit changes (user decides when to commit)
  </anti_patterns>

<success_criteria>
Phase addition is complete when:

- [ ] Phase directory created: `.planning/phases/{NN}-{slug}/`
- [ ] Roadmap updated with new phase entry
- [ ] STATE.md updated with roadmap evolution note
- [ ] New phase appears at end of current milestone
- [ ] Next phase number calculated correctly (ignoring decimals)
- [ ] User informed of next steps
      </success_criteria>
