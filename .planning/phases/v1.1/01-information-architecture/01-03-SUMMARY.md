---
phase: 01-information-architecture
plan: "03"
subsystem: documentation
tags: [mermaid, diataxis, core-concepts, glossary, user-guide]

requires:
  - phase: 01-01
    provides: docs/user-guide/ folder structure and README.md user guide index

provides:
  - docs/user-guide/core-concepts.md — explanation-oriented VIT mental model with Mermaid hierarchy diagram
  - docs/user-guide/glossary.md — alphabetical reference of 22 VIT-specific terms with cross-links

affects:
  - v1.1/02-command-agent-reference (agents and commands need consistent terminology with glossary)
  - v1.1/03-workflow-guides (workflow docs can link to core-concepts and glossary)
  - v1.1/04-developer-extension-guide (developer-facing terms should align with glossary)

tech-stack:
  added: []
  patterns:
    - Diátaxis explanation pattern for core-concepts (understanding-oriented, no instructions)
    - Diátaxis reference pattern for glossary (alphabetical, 1-3 sentences per entry, cross-linked)
    - Mermaid hierarchy diagram in fenced code block (GitHub-native rendering)

key-files:
  created:
    - docs/user-guide/core-concepts.md
    - docs/user-guide/glossary.md
  modified: []

key-decisions:
  - "Core concepts page covers 7 sections: Milestones, Phases, Plans, Tasks, Waves, Agents, State — matching the VIT hierarchy top-to-bottom"
  - "Glossary has 22 entries (2 more than the ~20 minimum) to cover all terms encountered in plans: balanced, budget, quality model profiles included"
  - "Mermaid diagram kept to structural hierarchy only; agent spawn relationships deferred to Phase 02 Agent Reference"

patterns-established:
  - "Explanation pages: present tense, no numbered steps, 3-8 sentences per section, links to reference pages"
  - "Glossary entries: 1-3 sentences hard limit, See: cross-links to core-concepts.md sections, backticks for file names and field names"

duration: 4min
completed: 2026-03-19
---

# Phase 01 Plan 03: Core Concepts and Glossary Summary

**Explanation page and alphabetical reference establishing the VIT mental model: milestone → phase → plan → task hierarchy with Mermaid diagram, plus 22 term definitions cross-linked to core-concepts.md**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T08:46:17Z
- **Completed:** 2026-03-19T08:50:23Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Core concepts page covering all 7 hierarchy levels with a GitHub-native Mermaid diagram
- Glossary with 22 VIT-specific term definitions in alphabetical order (1-3 sentences each)
- Bidirectional cross-links: core-concepts links to glossary, glossary links back to core-concepts sections
- Both pages are Diátaxis-compliant: explanation-oriented (no instructions) and reference-oriented (no explanations)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the core concepts page** - `85b4fb6` (docs)
2. **Task 2: Write the glossary** - `fca286e` (docs)

**Plan metadata:** (pending)

## Files Created/Modified

- `docs/user-guide/core-concepts.md` — VIT mental model with Mermaid hierarchy diagram and 8 concept sections
- `docs/user-guide/glossary.md` — 22 VIT-specific term definitions grouped alphabetically with cross-references

## Decisions Made

- Mermaid diagram restricted to structural hierarchy (Milestone → Phase → Wave → Plan → Task, plus Agents and State nodes on Phase). Agent spawn relationships intentionally deferred to Phase 02 Agent Reference to avoid scope creep.
- Glossary expanded to 22 entries (vs. ~20 in the plan) to include all model profile terms (`quality`, `balanced`, `budget`) and `key_links` — terms users will encounter in plan frontmatter.
- Line-wrapped paragraphs in core-concepts.md at ~90 characters for readability in text editors and code review diffs.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Core concepts and glossary provide the terminology foundation for Phase 02 Command and Agent Reference
- All 22 glossary terms are consistent with how agents and commands are named in the VIT codebase
- Phase 02 can cross-link from command/agent reference pages to core-concepts.md and glossary.md

---
*Phase: 01-information-architecture*
*Completed: 2026-03-19*
