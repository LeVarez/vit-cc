# Architecture Patterns: VitePress Docs for vit-cc

**Domain:** VitePress documentation site for a CLI framework
**Researched:** 2026-03-18
**Confidence:** HIGH (VitePress official docs verified via WebFetch; codebase read directly)

---

## Recommended Architecture

### Top-Level Placement

Place the docs site at `docs/` in the project root. VitePress's official guidance for projects where docs live alongside source code is to use a nested `docs/` directory to isolate it from `src/`, `bin/`, and `files/`. This keeps README.md and other root-level markdown out of the generated site.

```
vit-cc/
├── bin/
├── files/          ← VIT framework templates (source of truth for content)
│   ├── agents/
│   ├── commands/
│   └── vit/
├── src/
├── tests/
├── docs/           ← NEW: VitePress site root
│   ├── .vitepress/
│   │   ├── config.ts
│   │   └── theme/
│   │       └── index.ts    (optional, for custom CSS/components)
│   ├── public/
│   │   └── logo.svg
│   ├── index.md            ← Homepage (hero + feature grid)
│   ├── getting-started/
│   ├── concepts/
│   ├── commands/           ← 29 command pages
│   ├── agents/             ← 16 agent pages
│   ├── guides/
│   ├── internals/
│   └── config/
├── README.md
└── package.json
```

The `.vitepress/` directory is the only reserved folder inside `docs/`. All `.md` files outside it are source pages that map directly to URLs via file-based routing.

---

## Docs Folder Structure

```
docs/
├── .vitepress/
│   ├── config.ts               ← Sidebar, nav, title, search, deploy config
│   └── theme/
│       └── index.ts            ← Theme extension (custom CSS vars, components)
│
├── public/
│   └── logo.svg
│
├── index.md                    ← Landing page (hero + 3-4 feature cards)
│
├── getting-started/
│   ├── index.md                ← Install + quick start
│   ├── installation.md         ← npx vit-claude, what gets installed, directory layout
│   └── first-project.md        ← new-project → plan-phase → execute-phase walkthrough
│
├── concepts/
│   ├── index.md                ← Concepts map / overview
│   ├── phases.md               ← What phases are, PLAN.md structure
│   ├── milestones.md           ← Milestone lifecycle, worktree model
│   ├── agents.md               ← What agents are, how they are spawned, tool access
│   ├── state.md                ← STATE.md, .planning/ persistence, context reset survival
│   └── workflow-loop.md        ← Core loop: plan → execute → verify, when to use which
│
├── commands/
│   ├── index.md                ← All-commands table + category overview
│   │
│   ├── new-project.md
│   ├── new-milestone.md
│   ├── progress.md
│   │
│   ├── plan-phase.md
│   ├── discuss-phase.md
│   ├── research-phase.md
│   ├── list-phase-assumptions.md
│   │
│   ├── execute-phase.md
│   ├── quick.md
│   ├── pause-work.md
│   ├── resume-work.md
│   │
│   ├── verify-work.md
│   ├── review-feedback.md
│   ├── debug.md
│   │
│   ├── add-phase.md
│   ├── insert-phase.md
│   ├── remove-phase.md
│   ├── audit-milestone.md
│   ├── plan-milestone-gaps.md
│   ├── complete-milestone.md
│   │
│   ├── assign-phase.md
│   ├── team-status.md
│   ├── list-milestones.md
│   ├── map-codebase.md
│   ├── add-todo.md
│   ├── check-todos.md
│   │
│   ├── set-profile.md
│   ├── settings.md
│   ├── update.md
│   ├── help.md
│   └── join-discord.md
│
├── agents/
│   ├── index.md                ← All-agents table + category overview
│   │
│   ├── vit-planner.md
│   ├── vit-executor.md
│   ├── vit-verifier.md
│   ├── vit-phase-researcher.md
│   ├── vit-plan-checker.md
│   ├── vit-project-researcher.md
│   ├── vit-research-synthesizer.md
│   ├── vit-roadmapper.md
│   ├── vit-codebase-mapper.md
│   ├── vit-integration-checker.md
│   ├── vit-debugger.md
│   ├── vit-github-reviewer.md
│   ├── vit-test-writer.md
│   ├── vit-pr-reviewer.md
│   ├── vit-doc-updater.md
│   └── vit-changelog-writer.md
│
├── guides/
│   ├── index.md                ← Tutorial overview
│   ├── build-a-project.md      ← End-to-end: idea to shipped phase
│   ├── add-a-milestone.md      ← Versioning and milestone workflow
│   ├── debug-with-vit.md       ← Using /vit:debug effectively
│   └── custom-agents.md        ← How to author and register a new VIT agent
│
├── internals/
│   ├── index.md
│   ├── state-management.md     ← STATE.md schema, .planning/ directory map
│   ├── github-sync.md          ← phase-ci.yml, issue linking, PR lifecycle
│   ├── worktrees.md            ← Multi-milestone worktree strategy
│   └── hooks.md                ← vit-check-update.cjs, vit-statusline.js
│
└── config/
    ├── index.md
    ├── profiles.md             ← quality/balanced/budget model profiles
    ├── settings.md             ← settings.json toggles
    └── hooks.md                ← Hook configuration and authoring
```

**Total pages:** ~62 (29 command pages + 16 agent pages + ~17 guide/concept/config pages)

---

## Sidebar Navigation Hierarchy

VitePress supports path-based sidebar configuration: each directory path prefix shows a different sidebar. This is the correct pattern for multi-section sites with large reference sections.

The top nav (always visible) has 5 entries:

```
Get Started | Concepts | Commands | Agents | Guides | GitHub ↗
```

Sidebar per section:

### `/getting-started/` sidebar

```
Getting Started
  - Overview
  - Installation
  - First Project
```

### `/concepts/` sidebar

```
Concepts
  - Overview
  - Phases
  - Milestones
  - Agents
  - State
  - Workflow Loop
```

### `/commands/` sidebar (grouped by workflow stage)

```
Command Reference
  - All Commands

Project Setup
  - new-project
  - new-milestone
  - progress

Planning
  - plan-phase
  - discuss-phase
  - research-phase
  - list-phase-assumptions

Execution
  - execute-phase
  - quick
  - pause-work
  - resume-work

Verification
  - verify-work
  - review-feedback
  - debug

Roadmap Management
  - add-phase
  - insert-phase
  - remove-phase
  - audit-milestone
  - plan-milestone-gaps
  - complete-milestone

Team & State
  - assign-phase
  - team-status
  - list-milestones
  - map-codebase
  - add-todo
  - check-todos

Configuration
  - set-profile
  - settings
  - update
  - help
  - join-discord
```

### `/agents/` sidebar (grouped by function)

```
Agent Reference
  - All Agents

Planning Agents
  - vit-planner
  - vit-phase-researcher
  - vit-plan-checker
  - vit-roadmapper
  - vit-project-researcher
  - vit-research-synthesizer

Execution Agents
  - vit-executor
  - vit-integration-checker
  - vit-codebase-mapper

Verification Agents
  - vit-verifier
  - vit-debugger

GitHub Integration Agents
  - vit-github-reviewer
  - vit-pr-reviewer
  - vit-test-writer
  - vit-doc-updater
  - vit-changelog-writer
```

### `/guides/` sidebar

```
Tutorials
  - Overview
  - Build a Project
  - Add a Milestone
  - Debug with VIT
  - Custom Agents
```

### `/internals/` and `/config/` sidebars

Small sections, each with 4-5 items — no grouping needed.

---

## Component Boundaries

| Component | Responsibility | Location |
|-----------|---------------|----------|
| VitePress config | Nav, sidebar, search, cleanUrls | `docs/.vitepress/config.ts` |
| Theme extension | Custom CSS variables, optional Vue components | `docs/.vitepress/theme/index.ts` |
| Static assets | Logo, favicon, OG image | `docs/public/` |
| Homepage | Hero section, feature grid, CTA | `docs/index.md` |
| Section pages | One `.md` per command, agent, concept, guide | `docs/**/*.md` |
| Package scripts | dev, build, preview | root `package.json` |
| VitePress package | devDependency | root `package.json` |

VitePress does NOT require a separate `package.json` inside `docs/` when added to an existing Node project. Add `vitepress` as a `devDependency` to the root `package.json` and add scripts there.

---

## Auto-Generated vs Hand-Written Pages

### Hand-Written (no automation shortcut)

| Section | Page count | Reason |
|---------|-----------|--------|
| `index.md` (homepage) | 1 | Requires marketing copy, value framing |
| `getting-started/*.md` | 3 | Tutorial narrative, not extractable from source |
| `concepts/*.md` | 6 | Explanatory prose, mental models |
| `guides/*.md` | 5 | Step-by-step walkthroughs, narrative flow |
| `internals/*.md` | 5 | Technical depth beyond what source files expose |
| `config/*.md` | 4 | Structured but requires explanation |
| `commands/index.md` | 1 | Summary table + prose overview |
| `agents/index.md` | 1 | Summary table + prose overview |

### Extractable from Existing Source Files (45 reference pages)

This is the highest-leverage automation in the entire docs build. The `.claude/commands/vit/*.md` and `.claude/agents/*.md` files contain structured frontmatter and documented behavior that directly seeds the reference pages.

**From command files** (`.claude/commands/vit/<name>.md`):

| Frontmatter field | Maps to docs content |
|-------------------|---------------------|
| `name:` | Page title, URL slug |
| `description:` | Lede paragraph |
| `argument-hint:` | Usage line in code block |

**Caution:** The body of command files contains agent prompt instructions (XML blocks like `<objective>`, `<process>`, `<execution_context>`). These are NOT suitable for docs verbatim — they contain internal prompt engineering. Extract only the human-readable sections and the frontmatter.

**From agent files** (`.claude/agents/*.md`):

| Frontmatter field | Maps to docs content |
|-------------------|---------------------|
| `name:` | Page title |
| `description:` | Lede paragraph (includes spawn trigger — valuable) |

The `<role>` block in agent files is readable prose and CAN be extracted to seed the "Role" section of each agent page.

**Recommended stub template for command pages:**

```markdown
# /vit:<command-name>

> <description from frontmatter>

## Usage

\`\`\`
/vit:<command-name> <argument-hint>
\`\`\`

## What It Does

<!-- Hand-written: explain the command's behavior in plain language -->

## Options

<!-- Hand-written: explain each argument option -->

## Examples

<!-- Hand-written: 1-2 realistic usage examples -->

## Related

<!-- Links to spawned agents, commands in the same workflow stage -->
```

**Recommended stub template for agent pages:**

```markdown
# vit-<agent-name>

> <description from frontmatter>

## Role

<!-- Extracted from <role> block, lightly edited for readability -->

## When It Runs

<!-- Extracted from description's "Spawned by" clause -->

## Inputs

<!-- Hand-written: what files/context the agent receives -->

## Outputs

<!-- Hand-written: what files/artifacts the agent produces -->

## See Also

<!-- Commands that spawn it; related agents -->
```

**Extraction process:** A script (or the executor in a dedicated plan) reads each source `.md`, parses the YAML frontmatter, optionally extracts the `<role>` block, and writes a stub `.md` file in the correct `docs/` location. This creates 45 stubs in one automated pass. Human review then fills in the hand-written sections.

This stub generation is a single contained task, suitable for one plan in an execution wave.

---

## Integration with Existing Codebase

### What Is New (does not exist yet)

| Component | Location | Notes |
|-----------|----------|-------|
| VitePress site directory | `docs/` | Entire directory is new |
| VitePress config | `docs/.vitepress/config.ts` | New file |
| Landing page | `docs/index.md` | New file |
| All section pages | `docs/**/*.md` | ~62 new markdown files total |

### What Is Modified (existing files)

| Component | Location | Change |
|-----------|----------|--------|
| `package.json` | root | Add `vitepress` devDependency; add `docs:dev`, `docs:build`, `docs:preview` scripts |
| `README.md` | root | Add "Documentation" section with link to hosted docs URL |

### What Feeds the Docs (read-only, not modified)

| Source file | Content it provides |
|------------|---------------------|
| `.claude/commands/vit/*.md` | Command stubs: name, description, argument-hint (29 files) |
| `.claude/agents/*.md` | Agent stubs: name, description, role (16 files) |
| `.claude/vit/references/model-profiles.md` | Config/profiles page content |
| `.claude/vit/references/git-integration.md` | Internals/github-sync content |
| `.claude/vit/references/planning-config.md` | Config/settings content |
| `.claude/vit/references/verification-patterns.md` | Concepts/workflow-loop content |
| `README.md` | Getting-started content (repurpose install section) |
| `CHANGELOG.md` | Can link to or embed in the site |

These source files are NOT modified. They remain the ground truth for VIT internals. Docs extract from them; they do not replace them.

---

## Key VitePress Config Settings

```typescript
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'VIT',
  description: 'Phase-based project execution framework for Claude Code',

  // docs/ is VitePress's project root by default when running
  // `vitepress dev docs` — no srcDir needed

  cleanUrls: true,  // /commands/plan-phase not /commands/plan-phase.html
                    // Requires deployment target with URL rewriting
                    // (Vercel, Netlify: native; GitHub Pages: needs workaround)

  themeConfig: {
    search: {
      provider: 'local'  // minisearch, built-in, no external service needed
    },

    nav: [
      { text: 'Get Started', link: '/getting-started/' },
      { text: 'Concepts', link: '/concepts/' },
      { text: 'Commands', link: '/commands/' },
      { text: 'Agents', link: '/agents/' },
      { text: 'Guides', link: '/guides/' },
      {
        text: 'GitHub',
        link: 'https://github.com/LeVarez/vit-cc',
        target: '_blank'
      }
    ],

    sidebar: {
      '/getting-started/': [ /* ... */ ],
      '/concepts/': [ /* ... */ ],
      '/commands/': [ /* ... 7 groups ... */ ],
      '/agents/': [ /* ... 4 groups ... */ ],
      '/guides/': [ /* ... */ ],
      '/internals/': [ /* ... */ ],
      '/config/': [ /* ... */ ],
    }
  }
})
```

`cleanUrls: true` matters for a CLI tool docs site — `/commands/plan-phase` reads better in copy-paste contexts than `/commands/plan-phase.html`. Vercel and Netlify handle this natively. GitHub Pages requires either a `_redirects` file or accepting `.html` extension URLs.

**Package scripts to add to root `package.json`:**

```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
  "devDependencies": {
    "vitepress": "^1.x"
  }
}
```

---

## Build Order for Docs Phases

### Phase 1: Foundation

Install VitePress, create the `docs/` directory structure, wire `package.json` scripts, configure nav and sidebar (with placeholder pages), build the homepage (`docs/index.md`) with hero and feature grid. Deploy pipeline (GitHub Pages or Vercel).

**Deliverable:** Site builds and deploys. All sidebar links exist (even if pages are stubs with placeholder content).

**Why first:** Every subsequent phase adds content to a working site. A non-deployable site means phase 2 content has no visible effect.

### Phase 2: Getting Started + Concepts

Write `getting-started/` (installation, first-project) and `concepts/` (phases, milestones, agents, state, workflow-loop). These are the highest-traffic pages for new users and establish the mental model that makes reference pages useful.

**Why second:** Users land on getting-started before any command reference. Concepts establish vocabulary used in all subsequent pages.

### Phase 3: Command Reference (29 pages)

Run stub extraction from `.claude/commands/vit/*.md`, creating 29 draft pages in `docs/commands/`. Fill in examples, cross-links to spawned agents, and usage notes. Write `commands/index.md` with the full categorized table.

**Why third:** Stub extraction makes this phase mechanical for most of the 29 pages. Requires concepts to be done so cross-links work.

### Phase 4: Agent Reference (16 pages)

Run stub extraction from `.claude/agents/*.md`, creating 16 draft pages in `docs/agents/`. Fill in spawn triggers, inputs/outputs, and cross-links to commands. Write `agents/index.md`.

**Why fourth:** Agents reference commands in their descriptions. Commands must exist before agents link to them. Agent stubs are also extractable (same automation pattern as phase 3).

### Phase 5: Guides, Internals, Configuration + Search polish

Write tutorials (`guides/`), internals deep-dives, and configuration reference. Enable and test local search (built into VitePress default theme). Final polish: OG images, social links, edit page links pointing to GitHub.

**Why fifth:** Tutorials cite specific commands and agents — both must exist before walkthroughs can cross-link correctly. Internals and config are lower discovery traffic than the reference sections.

---

## Architecture Anti-Patterns to Avoid

### Flat directory for all pages

Putting all 62 pages directly in `docs/` without subdirectories breaks path-based sidebar scoping. Sidebar sections require the URL prefix to match a directory path (e.g., `/commands/` only shows the commands sidebar when ALL command pages are under `docs/commands/`).

### Extracting command file bodies verbatim into docs

The `.claude/commands/vit/*.md` files contain agent prompt instructions in XML-like blocks (`<objective>`, `<process>`, `<execution_context>`). These exist for Claude's benefit, not human readers. Extracting them verbatim produces unreadable docs and exposes internal prompt engineering. Extract only frontmatter fields and selectively extracted prose.

### Storing docs inside `.claude/` or `files/`

The `.claude/` directory has special meaning to Claude Code (agents, commands, hooks, settings). The `files/` directory is what `npx vit-claude` installs into user projects. Neither should contain the VitePress site. Docs go at `docs/` in the project root.

### Requiring a separate `package.json` for docs

Since vit-cc already has a root `package.json` with Node.js 18+ (compatible with VitePress), adding `vitepress` as a `devDependency` there is simpler. A nested `docs/package.json` adds complexity without benefit for a non-monorepo project.

### One massive sidebar config file

With 7 sidebar sections and 62 pages, the config.ts sidebar object will be large. Extract sidebar sections into separate objects or files imported into config.ts:

```typescript
// docs/.vitepress/sidebars.ts
export const commandsSidebar = [ /* ... */ ]
export const agentsSidebar = [ /* ... */ ]

// docs/.vitepress/config.ts
import { commandsSidebar, agentsSidebar } from './sidebars'
```

---

## Sources

- [VitePress Getting Started — Official Docs](https://vitepress.dev/guide/getting-started) (HIGH confidence)
- [VitePress Sidebar Configuration — Official Docs](https://vitepress.dev/reference/default-theme-sidebar) (HIGH confidence)
- [VitePress Routing — Official Docs](https://vitepress.dev/guide/routing) (HIGH confidence)
- [VitePress Site Config Reference](https://vitepress.dev/reference/site-config) (HIGH confidence)
- [Vitest Docs Structure](https://github.com/vitest-dev/vitest/tree/main/docs) (MEDIUM confidence — folder structure confirmed via WebFetch)
- Direct reading of `.claude/commands/vit/*.md` — all 29 command files (HIGH confidence)
- Direct reading of `.claude/agents/*.md` — all 16 agent files (HIGH confidence)
- Direct reading of `README.md`, `package.json`, `PROJECT.md` (HIGH confidence)

---

*Architecture research for: VitePress docs site milestone for vit-cc*
*Researched: 2026-03-18*
