---
name: vit:insert-phase
description: Insert urgent work as decimal phase (e.g., 72.1) between existing phases
argument-hint: <after> <description>
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Insert a decimal phase for urgent work discovered mid-milestone that must be completed between existing integer phases.

Uses decimal numbering (72.1, 72.2, etc.) to preserve the logical sequence of planned phases while accommodating urgent insertions.

Purpose: Handle urgent work discovered during execution without renumbering entire roadmap.
</objective>

<execution_context>
@.planning/ROADMAP.md
@.planning/STATE.md
</execution_context>

<process>

<step name="parse_arguments">
Parse the command arguments:
- First argument: integer phase number to insert after
- Remaining arguments: phase description

Example: `/vit:insert-phase 72 Fix critical auth bug`
→ after = 72
→ description = "Fix critical auth bug"

Validation:

```bash
if [ $# -lt 2 ]; then
  echo "ERROR: Both phase number and description required"
  echo "Usage: /vit:insert-phase <after> <description>"
  echo "Example: /vit:insert-phase 72 Fix critical auth bug"
  exit 1
fi
```

Parse first argument as integer:

```bash
after_phase=$1
shift
description="$*"

# Validate after_phase is an integer
if ! [[ "$after_phase" =~ ^[0-9]+$ ]]; then
  echo "ERROR: Phase number must be an integer"
  exit 1
fi
```

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

<step name="verify_target_phase">
Verify that the target phase exists in the roadmap:

1. Search for "### Phase {after_phase}:" heading
2. If not found:

   ```
   ERROR: Phase {after_phase} not found in roadmap
   Available phases: [list phase numbers]
   ```

   Exit.

3. Verify phase is in current milestone (not completed/archived)
   </step>

<step name="find_existing_decimals">
Find existing decimal phases after the target phase:

1. Search for all "### Phase {after_phase}.N:" headings
2. Extract decimal suffixes (e.g., for Phase 72: find 72.1, 72.2, 72.3)
3. Find the highest decimal suffix
4. Calculate next decimal: max + 1

Examples:

- Phase 72 with no decimals → next is 72.1
- Phase 72 with 72.1 → next is 72.2
- Phase 72 with 72.1, 72.2 → next is 72.3

Store as: `decimal_phase="$(printf "%02d" $after_phase).${next_decimal}"`
</step>

<step name="generate_slug">
Convert the phase description to a kebab-case slug:

```bash
slug=$(echo "$description" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
```

Phase directory name: `{decimal-phase}-{slug}`
Example: `06.1-fix-critical-auth-bug` (phase 6 insertion)
</step>

<step name="create_phase_directory">
Create the phase directory structure:

```bash
MILESTONE=$(grep "^Milestone:" .planning/STATE.md 2>/dev/null | sed 's/Milestone: //' | tr -d ' ')
if [ -z "$MILESTONE" ]; then
  MILESTONE=$(git branch --show-current | grep -o 'v[0-9]*\.[0-9]*' | head -1)
fi
phase_dir=".planning/phases/${MILESTONE}/${decimal_phase}-${slug}"
mkdir -p "$phase_dir"
```

Confirm: "Created directory: $phase_dir"
</step>

<step name="update_roadmap">
Insert the new phase entry into the roadmap:

1. Find insertion point: immediately after Phase {after_phase}'s content (before next phase heading or "---")
2. Insert new phase heading with (INSERTED) marker:

   ```
   ### Phase {decimal_phase}: {Description} (INSERTED)

   **Goal:** [Urgent work - to be planned]
   **Depends on:** Phase {after_phase}
   **Plans:** 0 plans

   Plans:
   - [ ] TBD (run /vit:plan-phase {decimal_phase} to break down)

   **Details:**
   [To be added during planning]
   ```

3. Write updated roadmap back to file

The "(INSERTED)" marker helps identify decimal phases as urgent insertions.

Preserve all other content exactly (formatting, spacing, other phases).
</step>

<step name="update_project_state">
Update STATE.md to reflect the inserted phase:

1. Read `.planning/STATE.md`
2. Under "## Accumulated Context" → "### Roadmap Evolution" add entry:
   ```
   - Phase {decimal_phase} inserted after Phase {after_phase}: {description} (URGENT)
   ```

If "Roadmap Evolution" section doesn't exist, create it.

Add note about insertion reason if appropriate.
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
     --title "Phase {decimal_phase}: {description} (INSERTED)" \
     --body "## Phase {decimal_phase}: {description}

   **Milestone:** {milestone-title}
   **Inserted after:** Phase {after_phase}
   **Goal:** To be planned — run \`/vit:plan-phase {decimal_phase}\`
   **Priority:** Urgent insertion" \
     --label "feature" 2>/dev/null | grep -o '[0-9]*$' || echo "")
   ```
3. Create feature branch linked to the issue via Development panel:
   ```bash
   gh issue develop $FEATURE_ISSUE \
     --base main \
     --name "feature/${MILESTONE}-{decimal_phase}-{slug}" \
     2>/dev/null || {
       git checkout -b "feature/${MILESTONE}-{decimal_phase}-{slug}" main 2>/dev/null || true
       git checkout - 2>/dev/null || true
       git push -u origin "feature/${MILESTONE}-{decimal_phase}-{slug}" 2>/dev/null || true
     }
   ```
4. Append row to `## GitHub Issue Mapping` table in STATE.md:
   ```
   | ${MILESTONE}/{decimal_phase} | {description} | #{FEATURE_ISSUE} | feature/${MILESTONE}-{decimal_phase}-{slug} |
   ```

Store FEATURE_ISSUE and branch name for completion summary.
</step>

<step name="completion">
Present completion summary:

```
Phase {decimal_phase} inserted after Phase {after_phase}:
- Description: {description}
- Directory: .planning/phases/{decimal-phase}-{slug}/
- Status: Not planned yet
- Marker: (INSERTED) - indicates urgent work

Roadmap updated: {roadmap-path}
Project state updated: .planning/STATE.md
{If GitHub: GitHub: #{FEATURE_ISSUE} created — feature/{decimal_phase}-{slug}}

---

## ▶ Next Up

**Phase {decimal_phase}: {description}** — urgent insertion

`/vit:plan-phase {decimal_phase}`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- Review insertion impact: Check if Phase {next_integer} dependencies still make sense
- Review roadmap

---
```
</step>

</process>

<anti_patterns>

- Don't use this for planned work at end of milestone (use /vit:add-phase)
- Don't insert before Phase 1 (decimal 0.1 makes no sense)
- Don't renumber existing phases
- Don't modify the target phase content
- Don't create plans yet (that's /vit:plan-phase)
- Don't commit changes (user decides when to commit)
  </anti_patterns>

<success_criteria>
Phase insertion is complete when:

- [ ] Phase directory created: `.planning/phases/{N.M}-{slug}/`
- [ ] Roadmap updated with new phase entry (includes "(INSERTED)" marker)
- [ ] Phase inserted in correct position (after target phase, before next integer phase)
- [ ] STATE.md updated with roadmap evolution note
- [ ] Decimal number calculated correctly (based on existing decimals)
- [ ] User informed of next steps and dependency implications
      </success_criteria>
