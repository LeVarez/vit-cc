# Phase 3: Documentation & Changelog Agents - Research

**Researched:** 2026-03-18
**Domain:** Markdown section-scoped editing, Keep a Changelog format, Claude Code agent authoring, bash/markdown orchestration
**Confidence:** HIGH (codebase patterns), HIGH (Keep a Changelog format), MEDIUM (section identification heuristics)

## Summary

Phase 3 adds two new agents (`vit-doc-updater` and `vit-changelog-writer`) and wires them into the two orchestrators that bracket a phase's lifecycle: `execute-phase` (after all waves complete) and `complete-milestone` (before the archive step). This phase is structurally very similar to Phase 2 — same file mirror pattern, same agent frontmatter contract, same Task()-based spawning, same non-blocking requirement.

The core technical challenge is section-scoped markdown editing: the doc-updater must update only targeted sections of README/docs files without overwriting surrounding content. The standard solution — confirmed by the existing codebase pattern and how Claude operates — is to treat markdown `##` headings as section boundaries, read the SUMMARY.md + PLAN.md to determine which sections need updating, then write only those sections in place. Claude (as the agent) performs this natively as an LLM; no bash library is needed.

For the changelog, the CHANGELOG.md follows Keep a Changelog 1.1.0 format. The `[Unreleased]` section is the accumulation point: doc-updater appends to it after each phase, and changelog-writer promotes it to a versioned entry (e.g., `## [1.0] - 2026-03-18`) when `complete-milestone` runs. git-cliff is NOT appropriate here — it generates from git commit history, not from SUMMARY.md files, and would require a cliff.toml config that VIT doesn't have. The LLM-native approach (agent reads SUMMARY.md files, writes structured entry) is the correct choice.

**Primary recommendation:** Use Claude as the text-manipulation engine for both agents — it already understands markdown structure and can identify sections by heading without additional tooling. No npm packages required.

## Standard Stack

This phase is pure bash/markdown agent work — no npm packages. The "stack" is tools already present in the VIT codebase.

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Claude (the agent itself) | — | Section identification, text generation, content merging | LLMs read and write structured markdown natively; no separate tool needed |
| `Read` tool | Claude Code built-in | Read SUMMARY.md, PLAN.md, README, CHANGELOG | Standard for all VIT agents |
| `Write`/`Edit` tools | Claude Code built-in | Write section-scoped updates to docs, append to CHANGELOG | Standard for all VIT agents |
| `Bash` tool | Claude Code built-in | git operations, file listing, grep for heading detection | Standard for all VIT agents |
| `Task()` subagent call | Claude Code built-in | Spawn vit-doc-updater from execute-phase, vit-changelog-writer from complete-milestone | Same spawning mechanism as all Phase 1/2 agents |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `grep -n "^## "` | system | Find heading line numbers in markdown files for section boundary detection | Verification step to confirm section exists before update |
| `ls .planning/phases/*/` | system | Enumerate SUMMARY.md files for changelog-writer to read | Finding all phase summaries for milestone entry |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Claude native text ops | git-cliff | git-cliff parses git commit history; VIT's source of truth is SUMMARY.md files, not commit subjects. Requires cliff.toml config. Wrong tool for this job. |
| Claude native text ops | Node.js markdown parser (remark, unified) | Adds npm dependency; overkill for simple heading-based section isolation. Also has Node.js version constraints. |
| Append to `[Unreleased]` per phase | Write full versioned entry per phase | Versioned entries must cover the full milestone (per pre-phase decision). Appending to Unreleased is the correct accumulation pattern. |

**Installation:** No new packages required.

## Architecture Patterns

### Recommended File Locations

```
.claude/agents/vit-doc-updater.md      # New agent definition (Plan 03-01)
.claude/agents/vit-changelog-writer.md # New agent definition (Plan 03-02)
.claude/commands/vit/execute-phase.md  # Add spawn_doc_updater step (Plan 03-03)
files/commands/vit/execute-phase.md    # Identical copy (project convention)
.claude/vit/workflows/execute-phase.md # Mirror spawn step (Plan 03-03)
files/vit/workflows/execute-phase.md   # Identical copy (project convention)
.claude/commands/vit/complete-milestone.md  # Add spawn_changelog_writer step (Plan 03-04)
files/commands/vit/complete-milestone.md    # Identical copy (project convention)
```

Note: There is no `.claude/vit/workflows/complete-milestone.md` — the complete-milestone command uses a workflow file referenced as `@./.claude/vit/workflows/complete-milestone.md` which IS in `files/vit/workflows/complete-milestone.md`. Check: `files/vit/workflows/complete-milestone.md` may or may not exist. The plan must only modify files that actually exist.

### Pattern 1: Agent Frontmatter Structure

**What:** Every agent in `.claude/agents/` uses YAML frontmatter with `name`, `description`, `tools`, `color`.
**When to use:** Always — same contract as vit-pr-reviewer.

```yaml
---
name: vit-doc-updater
description: Updates targeted documentation sections after a phase completes. Spawned by execute-phase after all waves pass verification. Reads SUMMARY.md and PLAN.md to identify which docs/sections to update.
tools: Read, Write, Edit, Bash, Glob, Grep
color: green
---
```

```yaml
---
name: vit-changelog-writer
description: Writes versioned CHANGELOG entry at milestone completion. Spawned by complete-milestone before the archive step. Reads all phase SUMMARY.md files to generate the entry and updates all project documentation.
tools: Read, Write, Edit, Bash, Glob, Grep
color: blue
---
```

### Pattern 2: Section-Scoped Markdown Update (the key blocker resolution)

**What:** Update only a named section in a markdown file, preserving all other content verbatim.
**When to use:** Every time vit-doc-updater writes to README or docs/ files.

**Heading identification heuristic (concrete algorithm):**

1. Read the target documentation file.
2. Identify candidate headings by searching for lines that match `^## ` (H2) or `^### ` (H3).
3. Match the section to update by comparing heading text to what SUMMARY.md describes was built (e.g., "Commands reference" when a new command was added).
4. Find the byte range: from the matched heading line to the next heading of the same or higher level (i.e., next `^## ` for an H2 section).
5. Replace only that range with new content; output all other lines verbatim.

**Claude as the text engine:** Since the agent IS Claude, it can read a markdown file and understand section boundaries directly — no regex required. The agent reads the full file, identifies the section to update by its heading, writes the replacement, and uses the `Edit` tool (which operates on character ranges) to apply the change. This is how Claude Code itself edits files.

**Concrete bash verification pattern:**
```bash
# Source: VIT codebase conventions (existing grep usage in execute-phase.md)
# Check that target section exists before attempting update
grep -n "^## Commands reference" README.md
# If no match: section doesn't exist — agent should CREATE it, not fail silently
```

**Edge cases to handle:**
- Section heading doesn't exist → append new section at end of file
- Section exists but is empty → replace with new content
- Multiple files need the same section updated → update each independently

### Pattern 3: Keep a Changelog Format

**What:** Standardized CHANGELOG.md structure.
**When to use:** All CHANGELOG operations by both agents.

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Phase 3: vit-doc-updater and vit-changelog-writer agents

## [1.0] - 2026-03-18

### Added
- Phase 1: Draft PR creation in execute-phase
- Phase 2: AI PR reviewer spawned after verification

[unreleased]: https://github.com/owner/repo/compare/v1.0...HEAD
[1.0]: https://github.com/owner/repo/releases/tag/v1.0
```

**Key format rules (confirmed from keepachangelog.com 1.1.0):**
- `## [Unreleased]` — always at the top, accumulates phase entries
- `## [VERSION] - YYYY-MM-DD` — versioned entries, most recent first
- `### Added | Changed | Deprecated | Removed | Fixed | Security` — subsections within each entry
- Link definitions at the bottom (optional but standard)

**Doc-updater appends to Unreleased:**
```markdown
## [Unreleased]

### Added
- Phase N: [one-liner from SUMMARY.md] (existing content, already there)

### Added
- Phase N+1: [one-liner from new SUMMARY.md] (new content appended)
```

Better approach — aggregate under shared `### Added` (not duplicate subsections):
```markdown
## [Unreleased]

### Added
- Phase 2: AI PR reviewer with severity-tiered block-merge/should-fix/nit tiers
- Phase 3: vit-doc-updater and vit-changelog-writer agents
```

**Changelog-writer promotes `[Unreleased]` to versioned entry:**
- Read all `[Unreleased]` content
- Replace `## [Unreleased]` with `## [VERSION] - DATE`
- Insert new empty `## [Unreleased]` above it
- Add link definition at bottom

### Pattern 4: Spawning from Orchestrators

**What:** Use Task() to spawn agents from execute-phase and complete-milestone.
**When to use:** Same pattern as vit-pr-reviewer spawning from verify-work (Phase 2).

**execute-phase spawn (after update_roadmap, before offer_next):**
```
Task(
  prompt="""
<context>
Phase Number: {PHASE_NUM}
Phase Name: {PHASE_NAME}
Phase Directory: {PHASE_DIR}
Working Directory: {WORK_DIR}
Milestone: {MILESTONE}
</context>

Read all SUMMARY.md and PLAN.md files in the phase directory.
Determine which documentation sections need updating.
Update only those sections in README.md and docs/ files.
Append a new entry to the [Unreleased] section of CHANGELOG.md.
""",
  subagent_type="vit-doc-updater",
  model="{doc_updater_model}",
  description="Update docs for Phase {PHASE_NUM}"
) || log "[doc-updater failed — continuing]"
```

**complete-milestone spawn (before step 4 archive step, after step 3 accomplishments):**
```
Task(
  prompt="""
<context>
Version: {VERSION}
Milestone: {MILESTONE}
Phases Dir: {WORK_DIR}/.planning/phases/
Working Directory: {WORK_DIR}
</context>

Read all phase SUMMARY.md files in the milestone.
Update all project documentation (README.md, docs/).
Generate a versioned CHANGELOG entry [VERSION] - DATE from the [Unreleased] section.
""",
  subagent_type="vit-changelog-writer",
  model="{changelog_writer_model}",
  description="Write versioned CHANGELOG for v{VERSION}"
) || log "[changelog-writer failed — continuing]"
```

### Pattern 5: SUMMARY.md Reading for Section Determination (DOC-02, DOC-04)

**What:** The agent reads SUMMARY.md and PLAN.md to autonomously determine which docs need updating — no manual configuration.
**When to use:** Every doc-updater run.

**Heuristic algorithm:**
1. Read the PLAN.md `files_modified` frontmatter list — these are the primary files changed.
2. Read all SUMMARY.md `provides` list — these describe what was delivered.
3. Read SUMMARY.md `Accomplishments` section — plain English description of what was built.
4. Map accomplishments to documentation sections:
   - New command added → update "Commands reference" section in README
   - New agent added → update "Agents reference" section in README
   - New workflow step → update relevant workflow documentation in docs/
   - New configuration option → update "Configuration" section
5. For each identified section: check if it exists in the target file, update or create.

**No static mapping file needed.** Claude understands "I added a new slash command called `/vit:execute-phase`" → "this should appear in the Commands reference section of the README." The mapping is semantic, not syntactic.

### Anti-Patterns to Avoid

- **Full file overwrite:** Writing the entire README from scratch — destroys all manually-added content. Always use Edit tool for targeted section replacement.
- **Using git-cliff for SUMMARY.md-sourced changelogs:** git-cliff reads git commit messages, not SUMMARY.md prose. Wrong tool for VIT's source of truth.
- **Blocking complete-milestone on doc failures:** Like the PR reviewer, both agents must be non-blocking. Doc failures log one line and continue.
- **Hardcoding section names:** The agent must discover sections by reading actual file headings, not by assuming a fixed list.
- **Creating CHANGELOG.md on first run without a header:** If CHANGELOG.md doesn't exist yet, the agent must create it with the proper header and `## [Unreleased]` section before appending.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Section-scoped file editing | Custom bash sed/awk replace-between-headings script | Claude's Edit tool + Claude's native understanding of markdown structure | Bash scripts break on nested headings, special characters, and multi-line content; Claude handles all edge cases natively |
| Changelog generation | git-cliff or custom commit-parser | Claude reads SUMMARY.md directly and writes prose entries | SUMMARY.md is richer than commit subjects; no cliff.toml config needed; no Node.js version constraint |
| Section heading discovery | Static hardcoded section list | Grep for `^## ` + semantic matching via LLM | Files evolve; static lists go stale; LLM matching is adaptive |
| CHANGELOG format enforcement | Custom validator | Keep a Changelog 1.1.0 spec taught to agent in prompt | Spec is stable, well-documented, LLM-native |

**Key insight:** The agent IS Claude. Claude understands markdown structure natively. The "library" is the LLM itself, not a bash script or npm package.

## Common Pitfalls

### Pitfall 1: Doc-Updater Overwrites Manual Content

**What goes wrong:** The agent rewrites an entire section or entire file, destroying manually-written paragraphs.
**Why it happens:** Agent uses Write tool instead of Edit tool; or generates section from scratch without reading existing content first.
**How to avoid:** Agent MUST read the existing section content before writing. Use Edit tool (character-range replacement) not Write tool (full file replacement). Explicitly instruct: "Preserve all existing content in this section. Merge new information in."
**Warning signs:** Documentation loses hand-crafted examples or context after a phase runs.

### Pitfall 2: Duplicate `## [Unreleased]` Entries

**What goes wrong:** Each phase run appends a new full `## [Unreleased]` block instead of adding to the existing one.
**Why it happens:** Agent doesn't check if `[Unreleased]` section already exists before creating it.
**How to avoid:** Agent must check for existing `## [Unreleased]` heading. If it exists: find the `### Added` subsection and append the new bullet. If `[Unreleased]` doesn't exist: create the full section. Never create a second `## [Unreleased]`.
**Warning signs:** CHANGELOG has multiple `## [Unreleased]` blocks.

### Pitfall 3: Changelog-Writer Runs Before CHANGELOG Exists

**What goes wrong:** CHANGELOG.md doesn't exist in new projects; agent crashes or creates malformed file.
**Why it happens:** File assumed to exist.
**How to avoid:** Agent checks for file existence first. If missing: create with standard header, `## [Unreleased]`, then proceed. Doc-updater should also create CHANGELOG.md if absent on first phase run.
**Warning signs:** Agent fails with file-not-found on a new project.

### Pitfall 4: Doc-Updater Targets Wrong File

**What goes wrong:** Agent updates README.md when the change only affects a docs/ file, or vice versa.
**Why it happens:** Imprecise SUMMARY.md→documentation mapping.
**How to avoid:** Use the `files_modified` frontmatter from PLAN.md as primary signal. If `.claude/commands/vit/*.md` was modified → update "Commands reference" in README. If `.claude/agents/*.md` was modified → update "Agents reference" in README. Agent-level files don't require README updates at all (implementation detail, not user-facing).
**Warning signs:** README has internal file paths like `.claude/vit/workflows/` mentioned in user-facing sections.

### Pitfall 5: Complete-Milestone Blocked by Doc-Writer Failure

**What goes wrong:** If vit-changelog-writer crashes, complete-milestone stops.
**Why it happens:** Task() call without graceful error handling.
**How to avoid:** Always wrap the Task() call in `|| log "[changelog-writer failed — continuing]"`. The archive step must proceed regardless.
**Warning signs:** `/vit:complete-milestone` aborts after CHANGELOG step; milestone never gets archived.

### Pitfall 6: Changelog-Writer Doesn't Consume `[Unreleased]`

**What goes wrong:** Versioned entry gets added but `[Unreleased]` section remains populated with the same items, creating duplicate entries in next cycle.
**Why it happens:** Writer adds versioned entry but forgets to clear `[Unreleased]`.
**How to avoid:** Changelog-writer must replace the entire `[Unreleased]` section with an empty one (`## [Unreleased]\n\n`) after creating the versioned entry. Two-step atomic operation: (1) write versioned entry, (2) clear `[Unreleased]`.
**Warning signs:** After milestone, `[Unreleased]` still shows old phase entries.

### Pitfall 7: Node.js Version Constraint (git-cliff, if ever used)

**What goes wrong:** Silent failures on Node 18.0–18.18.
**Why it happens:** git-cliff npm requires `>=18.19, >=20.6, >=21`. Older 18.x users get errors without clear message.
**How to avoid:** **Don't use git-cliff.** Use the Claude-native approach. If git-cliff is ever introduced, add a pre-flight check: `node --version` and warn if < 18.19.
**Warning signs:** Changelog not generated; no error visible in output.

## Code Examples

### Section-Scoped README Update

```bash
# Source: VIT codebase conventions + Keep a Changelog spec

# Step 1: Check if section exists
HEADING="## Commands reference"
SECTION_LINE=$(grep -n "^${HEADING}" README.md | head -1 | cut -d: -f1)

if [ -z "$SECTION_LINE" ]; then
  # Section doesn't exist — append at end of file
  echo "" >> README.md
  echo "${HEADING}" >> README.md
  echo "" >> README.md
  echo "${NEW_CONTENT}" >> README.md
else
  # Section exists — use Edit tool for targeted replacement
  # Claude reads the file, locates the section boundary,
  # and uses Edit tool to replace only the section content
  echo "Section '${HEADING}' found at line ${SECTION_LINE} — using Edit for targeted update"
fi
```

### Append to `[Unreleased]` CHANGELOG Section

```bash
# Check if CHANGELOG.md exists
if [ ! -f CHANGELOG.md ]; then
  cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

EOF
fi

# Check if [Unreleased] section exists
UNRELEASED_LINE=$(grep -n "^## \[Unreleased\]" CHANGELOG.md | head -1 | cut -d: -f1)

if [ -z "$UNRELEASED_LINE" ]; then
  # No [Unreleased] section — insert at top (after header)
  # Claude reads the file and uses Edit to insert
  echo "[doc-updater] Creating [Unreleased] section in CHANGELOG.md"
else
  # [Unreleased] exists — Claude reads it and appends the new bullet
  # using Edit tool targeted to the ### Added subsection
  echo "[doc-updater] Appending to existing [Unreleased] at line ${UNRELEASED_LINE}"
fi
```

### Versioned CHANGELOG Entry Format (changelog-writer output)

```markdown
## [1.0] - 2026-03-18

### Added
- Phase 1 (PR Lifecycle Foundation): Draft PR creation in execute-phase with idempotency guard; PR column in STATE.md GitHub Issue Mapping
- Phase 2 (AI PR Reviewer): vit-pr-reviewer agent spawns after verify-work PR promotion; posts block-merge/should-fix/nit findings with inline diff comments
- Phase 3 (Documentation & Changelog Agents): vit-doc-updater updates docs after each phase; vit-changelog-writer generates versioned CHANGELOG entries at milestone completion
```

### SUMMARY.md → Section Mapping Heuristic (agent reasoning)

```
When reading SUMMARY.md provides/accomplishments:

"Added new slash command /vit:execute-phase"
→ Update README.md "## Commands reference" section
→ Add to command table or list

"Created new agent vit-pr-reviewer.md in .claude/agents/"
→ Update README.md "## Agents reference" section
→ Add row to agent table

"Modified execute-phase workflow to add step 0.7"
→ Update README.md "## GitHub Integration" section (if user-facing)
→ OR skip if it's implementation detail only

"Modified .planning/STATE.md template"
→ No README update needed — internal template change
```

### Exact Insertion Point: execute-phase command (step 10.5)

The doc-updater spawns in the execute-phase command AFTER step 10 (commit phase completion) and BEFORE step 10.5 (push to GitHub). This ensures:
- All SUMMARY.md files are committed before the agent reads them
- Doc updates can be committed and included in the same push

Alternatively, after step 10.5. The critical constraint is: **after all waves pass verification** (after `verify_phase_goal` returns `passed`) and after STATE.md/ROADMAP.md are committed.

Recommended placement: **after step 10 (commit phase completion) and before step 10.5 (push to GitHub)**. This allows doc-updater commits to be included in the same push.

In the execute-phase command file, the step sequence is:
```
8. Update roadmap and state
8.5. Sync GitHub
8.7. Readiness notifications
8.8. Create HANDOFF.md
9. Update requirements
10. Commit phase completion
10.5. Push to GitHub   ← INSERT DOC-UPDATER SPAWN HERE (as step 10.6)
11. Offer next steps
```

In execute-phase workflow file, after `update_roadmap` step and before `offer_next`.

### Exact Insertion Point: complete-milestone command (step 3.5)

The changelog-writer spawns in complete-milestone AFTER step 3 (extract accomplishments) and BEFORE step 4 (archive milestone). This ensures:
- All SUMMARY.md files are available to read
- The CHANGELOG update is committed as part of the archive commit (step 7)

```
3. Extract accomplishments
3.5. Spawn vit-changelog-writer   ← INSERT HERE
4. Archive milestone
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual CHANGELOG editing | LLM-generated CHANGELOG from SUMMARY.md | This phase | Eliminates manual release note writing |
| Full-file overwrite for docs | Section-scoped Edit tool updates | This phase | Preserves manually-written content |
| git-cliff commit parsing | SUMMARY.md prose reading | Design decision | Richer changelog entries; no git format requirement |
| No doc automation | vit-doc-updater per phase | This phase | Docs stay in sync with code changes |

**Deprecated/outdated:**
- Manual CHANGELOG maintenance: superseded by the two-agent pattern in this phase.

## Open Questions

1. **Does `files/vit/workflows/complete-milestone.md` exist?**
   - What we know: The complete-milestone command references `@./.claude/vit/workflows/complete-milestone.md` in its `<execution_context>`. The `files/vit/workflows/` directory has many workflow files.
   - What's unclear: Whether this specific workflow file exists and needs to be mirrored like other commands.
   - Recommendation: Plan 03-04 executor must check `ls files/vit/workflows/complete-milestone.md` before assuming it exists. Update both `.claude/` and `files/` copies wherever they exist, per project convention.

2. **What if a phase's SUMMARY.md doesn't describe any user-facing changes?**
   - What we know: Some phases (e.g., internal refactors, planning-doc changes) may produce no user-visible documentation changes.
   - What's unclear: Should doc-updater skip all file updates and only append to CHANGELOG, or also skip the CHANGELOG?
   - Recommendation: Always append to CHANGELOG (even if just "Phase N: internal improvements"). Skip doc file updates only when no user-facing sections are affected. Document this decision in the agent.

3. **CHANGELOG.md location in vit-cc project**
   - What we know: `ls /` of the repo shows no CHANGELOG.md exists yet in the project root.
   - What's unclear: Should CHANGELOG.md live in the project root (standard) or in `.planning/`?
   - Recommendation: Project root. `CHANGELOG.md` at root is the ecosystem standard. The agents should default to `CHANGELOG.md` in `$WORK_DIR`.

4. **Multiple docs/ files: which ones to update?**
   - What we know: The vit-cc project currently has no `docs/` directory. README.md is the primary user-facing documentation.
   - What's unclear: When docs/ is added in future phases, how should the agent discover which file to update?
   - Recommendation: For now (vit-cc project), only target `README.md`. The agent should check for `docs/` and update files there if they exist, using the same section-identification heuristic.

## Sources

### Primary (HIGH confidence)
- VIT codebase (`.claude/commands/vit/execute-phase.md`) — verified exact step numbering (10, 10.5, 11) and insertion point for doc-updater spawn
- VIT codebase (`.claude/commands/vit/complete-milestone.md`) — verified step 3/4 structure and insertion point for changelog-writer spawn
- VIT codebase (`.claude/agents/vit-pr-reviewer.md`, `02-02-PLAN.md`) — established agent frontmatter contract, spawning pattern, model lookup table, non-blocking requirement
- VIT codebase (`.planning/STATE.md`, `02-02-SUMMARY.md`) — confirmed pre-phase decisions: doc-updater per-phase after all waves; changelog-writer on complete-milestone only
- `keepachangelog.com/en/1.1.0/` — verified exact format: `## [Unreleased]`, `## [VERSION] - YYYY-MM-DD`, `### Added/Changed/Fixed` subsections

### Secondary (MEDIUM confidence)
- `git-cliff.org/docs/installation/npm/` — confirmed Node.js version requirement `>=18.19, >=20.6, >=21`; confirmed git-cliff operates on git commit history (not SUMMARY.md) — this confirms git-cliff is wrong tool for this phase
- `git-cliff.org/docs/` — confirmed cliff.toml required for customization; further confirmed wrong tool for VIT's SUMMARY.md-based approach

### Tertiary (LOW confidence)
- WebSearch: "bash awk markdown section replace between headings" — confirmed awk/sed approach is feasible but complex; Claude native approach is simpler and more robust for this use case (single source, no separate script)

## Metadata

**Confidence breakdown:**
- Keep a Changelog format: HIGH — official spec verified from keepachangelog.com
- Section identification heuristic: HIGH — Claude native approach verified against existing VIT pattern of Claude reading/editing markdown; no external library uncertainty
- Spawn points (exact steps): HIGH — verified from reading execute-phase.md and complete-milestone.md command files
- git-cliff rejection: HIGH — confirmed from official docs that it works from git history, not SUMMARY.md
- Model profile for new agents: MEDIUM — using established pattern (haiku/sonnet/haiku for doc-writer tasks, matching vit-plan-checker)
- files/ mirror existence for complete-milestone workflow: LOW — need to verify at plan-time

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (30 days — Keep a Changelog spec is stable; codebase patterns verified today)
