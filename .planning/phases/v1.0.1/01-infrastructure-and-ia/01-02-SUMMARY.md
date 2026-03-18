---
phase: 01-infrastructure-and-ia
plan: "02"
subsystem: docs
tags: [vitepress, sidebar, information-architecture, homepage, markdown]

requires:
  - phase: 01-infrastructure-and-ia/plan-01
    provides: VitePress installed, config.mts scaffolded, deployment workflow ready

provides:
  - Complete sidebar configuration for all 7 doc sections (sidebars.ts with named exports)
  - Homepage with hero section, 6 feature cards, Get Started CTA
  - 25 placeholder .md files covering all non-command/non-agent pages
  - Wired sidebar into config.mts; removed ignoreDeadLinks

affects:
  - 02-getting-started-and-concepts (content fills placeholder pages)
  - 03-command-reference (adds individual command pages under /commands/)
  - 04-agent-reference (adds individual agent pages under /agents/)
  - 05-advanced-guides (fills guides, internals, config pages)

tech-stack:
  added: []
  patterns:
    - "Sidebar configuration extracted to sidebars.ts with one named export per section"
    - "Search _render skips title injection when page already has H1 (prevents MiniSearch duplicate ID)"
    - "Placeholder pages use frontmatter title + H1 + phase reference sentence"

key-files:
  created:
    - docs/.vitepress/sidebars.ts
    - docs/getting-started/index.md
    - docs/getting-started/installation.md
    - docs/getting-started/first-project.md
    - docs/concepts/index.md
    - docs/concepts/phases.md
    - docs/concepts/milestones.md
    - docs/concepts/agents.md
    - docs/concepts/state.md
    - docs/concepts/workflow-loop.md
    - docs/commands/index.md
    - docs/agents/index.md
    - docs/guides/index.md
    - docs/guides/build-a-project.md
    - docs/guides/add-a-milestone.md
    - docs/guides/debug-with-vit.md
    - docs/guides/custom-agents.md
    - docs/internals/index.md
    - docs/internals/state-management.md
    - docs/internals/github-sync.md
    - docs/internals/worktrees.md
    - docs/internals/hooks.md
    - docs/config/index.md
    - docs/config/profiles.md
    - docs/config/settings.md
    - docs/config/hooks.md
  modified:
    - docs/.vitepress/config.mts
    - docs/index.md

key-decisions:
  - "Search _render must guard against injecting title heading when H1 already present — MiniSearch uses path+anchor as ID and two pages with same H1 text on the same path cause duplicate ID crash"
  - "sidebars.ts exports 7 named functions (not default object) — each section can be imported individually and reassigned without touching config.mts"
  - "ignoreDeadLinks removed in this plan now that all sidebar link targets exist as files"

patterns-established:
  - "All sidebar link values begin with / (leading slash required by VitePress)"
  - "Command and agent sidebar groups link to /commands/<name> and /agents/<name> — individual pages added in phases 03-04, not here"
  - "Section index pages (index.md) serve as landing pages; sidebar first item is always Overview pointing to section root"

duration: 3min
completed: "2026-03-19"
---

# Phase 01 Plan 02: Homepage, Sidebar Structure, and Placeholder Pages Summary

**VitePress sidebar with 7 sections (29 commands, 16 agents), homepage with hero/features/CTA, and 25 placeholder pages — site fully navigable with zero dead links**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T23:11:38Z
- **Completed:** 2026-03-18T23:14:28Z
- **Tasks:** 2
- **Files modified:** 28

## Accomplishments

- Created `sidebars.ts` with 7 fully-populated sidebar sections covering all 29 commands (7 groups) and 16 agents (4 groups)
- Replaced stub homepage with VitePress `layout: home` page: hero with tagline/CTA, 6 feature cards with icons derived from README copy
- Created 25 placeholder `.md` files — every sidebar link now resolves to a real page (build passes with `ignoreDeadLinks` removed)
- Fixed MiniSearch duplicate-ID bug in search renderer by guarding against injecting a title heading when the page already has an H1

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sidebar structure and all placeholder pages** - `cf041b9` (feat)
2. **Task 2: Create the homepage with hero, features, and CTA** - `4106fa5` (feat)

**Plan metadata:** _(pending docs commit)_

## Files Created/Modified

- `docs/.vitepress/sidebars.ts` - 7 named sidebar exports; all section/group/item structure
- `docs/.vitepress/config.mts` - Imports sidebars, wires sidebar map, removes ignoreDeadLinks, fixes search renderer
- `docs/index.md` - Homepage: layout: home, hero, 6 features
- `docs/getting-started/` - index, installation, first-project (3 placeholders)
- `docs/concepts/` - index, phases, milestones, agents, state, workflow-loop (6 placeholders)
- `docs/commands/index.md` - Commands section landing with stub copy
- `docs/agents/index.md` - Agents section landing with stub copy
- `docs/guides/` - index, build-a-project, add-a-milestone, debug-with-vit, custom-agents (5 placeholders)
- `docs/internals/` - index, state-management, github-sync, worktrees, hooks (5 placeholders)
- `docs/config/` - index, profiles, settings, hooks (4 placeholders)

## Decisions Made

- **Search renderer guard:** The custom `_render` function in search options prepends `# ${frontmatter.title}` to improve search result quality for pages without H1. But if the page already has an H1, this creates two `#heading` anchors on the same page — MiniSearch indexes both and throws a duplicate ID error. Fixed by checking `!src.match(/^#\s/m)` before injecting the title heading.
- **Named sidebar exports vs default object:** Exporting each section as a named constant keeps `config.mts` clean — new sections only require adding one import and one key to the sidebar map.
- **ignoreDeadLinks removed:** Was a temporary workaround during plan 01-01 when no content pages existed. Removed now that all 25 sidebar link targets are real files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed MiniSearch duplicate ID crash in local search**

- **Found during:** Task 1 build verification (`npm run docs:build`)
- **Issue:** VitePress local search `_render` function injected `# Agents` title heading for `concepts/agents.md`, while `agents/index.md` also has `# Agents`. Both pages contribute the same heading anchor to MiniSearch's index, triggering a "duplicate ID" exception and crashing the build.
- **Fix:** Added `!src.match(/^#\s/m)` guard to skip title injection when the page source already contains an H1. This prevents double-indexing same-named headings.
- **Files modified:** `docs/.vitepress/config.mts`
- **Verification:** Build completes in 1.4s with no errors; `docs/config/hooks.md` and `docs/internals/hooks.md` (both titled "Hooks") also build cleanly.
- **Committed in:** `cf041b9` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required to make the build pass. Fix is minimal and doesn't change any user-visible behavior.

## Issues Encountered

None beyond the MiniSearch bug documented above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 25 placeholder pages exist; sidebar links resolve; build is clean
- Phase 02 can fill getting-started and concepts pages without touching sidebar or config
- Phases 03-04 add individual command/agent pages under `/commands/<name>` and `/agents/<name>` — sidebar entries already exist pointing to those paths
- `ignoreDeadLinks` is removed; any new dead links introduced in future phases will fail the build immediately (good gate)

---
*Phase: 01-infrastructure-and-ia*
*Completed: 2026-03-19*
