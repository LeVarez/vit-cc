# Phase 01: README Rewrite with ASCII Art Branding - Research

**Researched:** 2026-03-19
**Domain:** Technical documentation / Markdown README authoring with ASCII art branding
**Confidence:** HIGH

---

## Summary

This phase is a pure documentation writing task — no code to implement. The deliverable is a single `README.md` file that replaces the existing one. All content sources already exist in the repository: 31 command files, 16 agent files, `ui-brand.md`, `planning-config.md`, `model-profiles.md`, and `phase-ci.yml`. The research job is to understand the constraints and patterns for the output document, not to discover external libraries.

The primary technical challenge is GitHub rendering of ASCII art / box-drawing characters. Research confirms: box-drawing characters (━, ─, ╔, ║, etc.) must be placed inside fenced code blocks (triple backticks) to render correctly on GitHub. Outside code blocks, GitHub renders them as regular Unicode text with a proportional font, causing misalignment. Inside code blocks, monospace font is guaranteed. This constraint applies to the hero banner, section dividers, architecture diagrams, and project structure tree.

The phase maps to 13 requirements (README-01 through README-13). All content can be derived from existing project files with no external research needed. The planner must ensure each requirement maps to a distinct task and that the correct source files are referenced for each section.

**Primary recommendation:** Write all ASCII art elements (banner, section headers, diagrams, tree) inside fenced code blocks. Derive all content from existing project files. Use ui-brand.md as the visual authority for symbol choices.

---

## Standard Stack

This phase has no software library dependencies. The "stack" is the set of source files the README author must read.

### Content Sources (complete inventory)

| Source File | Used For |
|-------------|---------|
| `.claude/commands/vit/*.md` (31 files) | Commands reference (README-05) |
| `.claude/agents/vit-*.md` (16 files) | Agents reference (README-06) |
| `.claude/vit/references/ui-brand.md` | Visual style authority (README-01, README-12) |
| `.claude/vit/references/planning-config.md` | Config keys reference (README-07) |
| `.claude/vit/references/model-profiles.md` | Model profile matrix table (README-07) |
| `.github/workflows/phase-ci.yml` | CI integration section (README-08) |
| `.planning/REQUIREMENTS.md` | Project requirements context |
| `.planning/ROADMAP.md` | Architecture + project context |
| `.planning/PROJECT.md` | Project overview, decisions |
| `.planning/codebase/STRUCTURE.md` | Directory tree (README-10) |
| Existing `README.md` | Baseline to replace |

### No External Libraries Required

This phase installs nothing. No `npm install`. The output is a single Markdown file.

---

## Architecture Patterns

### README Section Order

The 13 requirements map to a logical reading order:

```
1. Hero banner (README-01)              — visual hook, first impression
2. What is VIT? + core loop (README-02) — orient the reader
3. Install section (README-03)          — get them started fast
4. Quick Start walkthrough (README-04)  — first success path
5. Commands reference (README-05)       — 31 commands, 11 groups
6. Agents reference (README-06)         — 16 agents table
7. Settings reference (README-07)       — config.json keys + model matrix
8. GitHub CI Integration (README-08)    — phase-ci.yml explanation
9. Architecture diagram (README-09)     — ASCII agent pipeline diagram
10. Project structure (README-10)       — .planning/ + .claude/ tree
11. Common Workflows (README-11)        — 6 recipes
12. [Style is cross-cutting] (README-12)
13. Footer (README-13)
```

### ASCII Art Rendering Rule (CRITICAL)

**Finding:** GitHub renders Markdown with a proportional font by default. Box-drawing characters (━, ─, ╔, ║, ╗, ╚, ╝, ╠, ╣, ◆, etc.) only align correctly when wrapped in a fenced code block.

**Rule:** Every multi-character ASCII art element goes in a fenced code block:

```
\`\`\`
╔══════════════════════════════════════════════════════════════╗
║  VIT ► PLANNING                                              ║
╚══════════════════════════════════════════════════════════════╝
\`\`\`
```

**Exception:** Single Unicode status symbols inline in prose are fine (e.g., "✓ Complete", "◆ In Progress") because they're single characters, not alignment-dependent multi-character constructions.

**Source:** GitHub issue `github/markup#334`, `isaacs/github#1164` — both confirm font substitution breaks alignment outside code blocks.

### The 11 Command Groups

The requirements specify 31 commands in 11 groups. Current groupings (verified against actual command files):

| # | Group Name | Commands |
|---|-----------|---------|
| 1 | Project Init | `new-project`, `new-milestone`, `map-codebase` |
| 2 | Planning | `plan-phase`, `discuss-phase`, `research-phase`, `list-phase-assumptions` |
| 3 | Execution | `execute-phase`, `quick` |
| 4 | Verification | `verify-work`, `audit-milestone` |
| 5 | Progress | `progress`, `list-milestones` |
| 6 | Roadmap | `add-phase`, `insert-phase`, `remove-phase`, `plan-milestone-gaps` |
| 7 | Session | `pause-work`, `resume-work` |
| 8 | Team | `assign-phase`, `team-status` |
| 9 | Maintenance | `complete-milestone`, `review-feedback`, `debug` |
| 10 | Config | `settings`, `set-profile`, `update` |
| 11 | Meta | `help`, `join-discord`, `add-todo`, `check-todos` |

**Count check:** 3+4+2+2+2+4+2+2+3+3+4 = 31. Confirmed.

**Note:** The old STRUCTURE.md (dated 2026-03-18) listed 29 commands in 10 groups and merged "Meta" and "Progress" differently. The correct current state is 31 commands. `assign-phase` and `team-status` are the two additions — they belong in a new "Team" group (group 8 above).

### Command Entry Format

Each command entry in README-05 needs: name, description, usage example, produced artifacts. Derive from command `.md` files using the `description:` frontmatter field and the command's `<objective>` section.

### Agent Table Format

README-06 requires a table with: agent name, spawner command, role description, output artifact. All 16 agents have `description:` frontmatter. Spawner information is in the description field itself (e.g., "Spawned by /vit:plan-phase").

### config.json Keys (README-07)

Verified against `planning-config.md` and the live `config.json`:

| Key | Default | Description |
|-----|---------|-------------|
| `mode` | `"yolo"` | Execution mode (yolo = no confirmations) |
| `depth` | `"standard"` | Planning depth |
| `parallelization` | `true` | Enable parallel agent spawning |
| `commit_docs` | `true` | Commit planning artifacts to git |
| `model_profile` | `"balanced"` | Agent model selection profile |
| `workflow.research` | `true` | Enable research step in plan-phase |
| `workflow.plan_check` | `true` | Enable plan checker before execution |
| `workflow.verifier` | `true` | Enable verifier after execution |
| `team.enabled` | `false` | Enable team mode |
| `team.roster` | `[]` | Array of `{handle, role}` engineer objects |
| `team.default_reviewer` | `""` | GitHub handle for PR reviewer auto-assignment |

**Model profile matrix** — from `model-profiles.md` (11 agents mapped across quality/balanced/budget).

### Architecture Diagram Content (README-09)

The diagram must show three command pipelines with their spawned agents. Based on existing README + ROADMAP.md:

```
/vit:plan-phase
    ├── vit-phase-researcher  → RESEARCH.md
    ├── vit-planner           → PLAN.md
    └── vit-plan-checker      → verification

/vit:execute-phase
    ├── Draft PR (gh pr create --draft)
    ├── Wave N: vit-executor(s) → atomic commits
    ├── vit-integration-checker
    ├── vit-test-writer        → tests/phases/
    ├── vit-doc-updater        → README/CHANGELOG
    └── git push → phase-ci.yml → GitHub issue comment

/vit:verify-work
    ├── vit-verifier           → VERIFICATION.md
    ├── gh pr ready (Route A)
    └── vit-pr-reviewer        → GitHub review comments
```

State files: `.planning/STATE.md`, `.planning/MILESTONE.md`, per-phase `PLAN.md`

### Project Structure Tree (README-10)

Two trees needed: `.planning/` and `.claude/`. Source: `STRUCTURE.md`. Must be in code block.

### Common Workflows (README-11) — 6 Recipes

Requirements specify exactly 6 recipes:
1. Greenfield — start a new project from scratch
2. Brownfield — adopt VIT on an existing project
3. Resume — pick up after a context reset
4. Urgent work — insert a hotfix/urgent phase
5. Team collaboration — team mode setup and handoffs
6. Debugging — use /vit:debug for systematic issue investigation

### Footer (README-13)

Must include: MIT license, Discord link, GitHub issues link, docs site link. Discord and docs site URLs need to be verified or left as placeholders.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command descriptions | Manually write from memory | Read `description:` frontmatter from each `.md` file | Frontmatter is authoritative; memory is stale |
| Agent spawner info | Manually write | Parse agent `description:` fields (they include "Spawned by X") | Already documented there |
| config.json schema | Guess from config.json alone | Cross-reference with `planning-config.md` | planning-config.md has descriptions, not just keys |
| Model profile table | Recreate from memory | Copy directly from `model-profiles.md` | Has all 11 agents and 3 profiles, already correct |
| Directory tree | Write from memory | Read `STRUCTURE.md` | Already has verified tree |

**Key insight:** All content for this README already exists in the repository. The executor's job is accurate transcription and organization, not invention.

---

## Common Pitfalls

### Pitfall 1: ASCII Art Outside Code Blocks

**What goes wrong:** Box-drawing characters (━, ─, ╔, ║) misalign on GitHub because the font is proportional.
**Why it happens:** GitHub renders Markdown with a proportional font; only `<code>` elements use monospace.
**How to avoid:** Every multi-line ASCII art construction goes in a fenced code block.
**Warning signs:** If you're writing `━━━━━━━━━━━━━━` directly in a Markdown heading line, that's wrong.

### Pitfall 2: Wrong Command Count

**What goes wrong:** Documentation says "29 commands" (old count) instead of 31.
**Why it happens:** STRUCTURE.md was written at v1.0 when there were 29 commands. Two were added (assign-phase, team-status).
**How to avoid:** Count the actual files in `.claude/commands/vit/` before writing. Current count: 31.
**Warning signs:** If your group breakdown sums to anything other than 31, recount.

### Pitfall 3: Using Unapproved Emoji

**What goes wrong:** Random emoji (🚀, ✨, 💡) appear in the README, violating README-12.
**Why it happens:** LLM tendency to add visual flair.
**How to avoid:** Approved symbols only per ui-brand.md: ✓ ✗ ◆ ○ ⚡ ⚠ 🎉 (milestone complete banner only).
**Warning signs:** Any emoji not in that list is a violation.

### Pitfall 4: Banner Width Inconsistency

**What goes wrong:** Section headers and checkpoint boxes have different widths.
**Why it happens:** ui-brand.md specifies 62-character checkpoint boxes; stage banners use 53 characters. Mixing them breaks visual consistency.
**How to avoid:** Stage banners: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` (53 `━`). Checkpoint boxes: 62 chars wide with `╔══` borders. For README section headers, the style is `━━━` divider lines (length consistent within the document).
**Warning signs:** Counting the characters in each banner and finding different lengths.

### Pitfall 5: Incomplete Commands Reference

**What goes wrong:** Some commands missing from README-05 because the author used memory instead of reading all 31 files.
**Why it happens:** It's easy to forget `list-phase-assumptions`, `assign-phase`, `team-status`, or `plan-milestone-gaps`.
**How to avoid:** Enumerate all 31 files from the directory, don't write from memory.
**Warning signs:** Group counts don't sum to 31.

### Pitfall 6: Missing "Produced Artifacts" Column

**What goes wrong:** Commands reference only has name + description, missing usage example and produced artifacts per README-05.
**Why it happens:** Simpler table format temptation.
**How to avoid:** Each command entry must have 4 data points: name, description, usage example, produced artifacts.
**Warning signs:** The table only has 2 columns.

---

## Code Examples

### Section Header Pattern (ui-brand.md)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VIT ► {STAGE NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Source: `.claude/vit/references/ui-brand.md` — Stage Banners section

### Checkpoint Box Pattern (ui-brand.md)

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: {Type}                                          ║
╚══════════════════════════════════════════════════════════════╝
```

Source: `.claude/vit/references/ui-brand.md` — Checkpoint Boxes section (62 chars wide)

### Divider Pattern (ui-brand.md)

```
───────────────────────────────────────────────────────────────
```

Source: `.claude/vit/references/ui-brand.md` — Next Up Block section

### Core Loop Diagram (from existing README)

```
/vit:new-project  →  /vit:plan-phase  →  /vit:execute-phase  →  /vit:verify-work
```

Source: Existing `README.md` lines 19-23 — this is the canonical representation

---

## State of the Art

| Old Approach | Current Approach | Impact |
|---|---|---|
| 29 commands in README | 31 commands (added assign-phase, team-status) | Must add "Team" group (11th group) |
| Agents listed in simple role table | Full table with spawner + output artifact | Richer reference |
| No ASCII art / visual branding | ASCII art hero + section headers | README-12 requirement |
| Minimal install section | Visual install with component listing | README-03 requirement |

**Note:** The existing README.md is a functional but minimal reference. This phase replaces it wholesale.

---

## Open Questions

1. **Footer URLs for Discord and docs site**
   - What we know: README-13 requires Discord link and docs site link
   - What's unclear: The actual URLs. The docs site doesn't exist yet (Phase 02). Discord URL not found in project files.
   - Recommendation: Use placeholder text like `[Discord](https://discord.gg/vit-claude)` and `[Docs](https://vit-claude.dev)` with a note, or leave as `TBD` anchors. The planner should flag this for the executor to verify with the maintainer.

2. **Hero banner ASCII art content**
   - What we know: Must use box-drawing characters consistent with ui-brand.md, render correctly on GitHub and terminal (README-01)
   - What's unclear: The specific text/art of the banner — no existing banner exists. Design is at executor discretion.
   - Recommendation: Executor creates a banner using the VIT name, the `VIT ►` prefix style, and `━`/`╔`/`║` characters, wrapped in a fenced code block. Width should be consistent with ui-brand.md (53-char stage banner width or 62-char checkpoint box width — pick one and stay consistent).

3. **"Produced artifacts" for every command**
   - What we know: README-05 requires "produced artifacts" per command
   - What's unclear: Some commands produce no files (e.g., `join-discord`, `help`) — "produced artifacts" is N/A
   - Recommendation: Use "None" or "—" for commands that produce no artifacts. Use the actual file names for ones that do (e.g., plan-phase → `PLAN.md`, execute-phase → commits + `SUMMARY.md`).

---

## Sources

### Primary (HIGH confidence)
- `.claude/vit/references/ui-brand.md` — visual patterns, approved symbols, banner formats
- `.claude/vit/references/planning-config.md` — config.json schema and all keys
- `.claude/vit/references/model-profiles.md` — complete model profile matrix
- `.claude/commands/vit/*.md` (31 files) — command descriptions and behaviors
- `.claude/agents/vit-*.md` (16 files) — agent descriptions and spawner info
- `.github/workflows/phase-ci.yml` — CI workflow behavior
- `.planning/codebase/STRUCTURE.md` — directory tree

### Secondary (MEDIUM confidence)
- GitHub issue `github/markup#334` + `isaacs/github#1164` — ASCII art must be in code blocks for correct rendering on GitHub (WebSearch verified with official GitHub issue tracker)

### Tertiary (LOW confidence)
- Proposed Discord URL and docs site URL — not found in any project file; flagged as open questions

---

## Metadata

**Confidence breakdown:**
- Content inventory: HIGH — all 31 commands and 16 agents verified by directory listing
- Visual style rules: HIGH — sourced directly from ui-brand.md
- ASCII rendering constraint: MEDIUM — verified via GitHub issue tracker, well-established community knowledge
- Command groupings (11 groups): HIGH — derived by adding "Team" group to existing 10-group categorization; count verified at 31
- Footer URLs: LOW — not found in project files

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (static project, no fast-moving dependencies)
