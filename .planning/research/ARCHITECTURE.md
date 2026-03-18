# Architecture Research

**Domain:** VitePress documentation site for a CLI framework (vit-cc)
**Researched:** 2026-03-18
**Confidence:** HIGH (VitePress official docs + verified plugin sources + direct codebase reading)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      Top Navigation Bar                       │
│    Home     Guide     Commands     Agents     Contributing    │
├──────────────────────────────────────────────────────────────┤
│  Left Sidebar (section-aware) │   Content Area               │
│                               │                              │
│  [active: /reference/cmds/]   │  ┌────────────────────────┐ │
│   ├─ Overview                 │  │  Page Content (.md)     │ │
│   ├─ [Project Setup]          │  │  - ASCII branding       │ │
│   │   ├─ new-project          │  │  - Code blocks (Shiki)  │ │
│   │   ├─ new-milestone        │  │  - Mermaid diagrams     │ │
│   │   └─ plan-phase           │  │  - Custom containers    │ │
│   ├─ [Phase Workflow]         │  │  - Tables               │ │
│   │   ├─ execute-phase        │  └────────────────────────┘ │
│   │   ├─ verify-work          │                              │
│   │   └─ progress             │  Right TOC (auto-generated) │
│   ├─ [State Management]       │   ├─ When to use            │
│   │   ├─ pause-work           │   ├─ Usage                  │
│   │   ├─ resume-work          │   ├─ What it does           │
│   │   └─ ...                  │   ├─ Creates                │
│   └─ [Utilities]              │   └─ See also               │
│       └─ ...                  │                              │
├───────────────────────────────┴──────────────────────────────┤
│                    Static Build Output                        │
│              (docs/.vitepress/dist/ → Deploy target)         │
└──────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|---------------|------------------------|
| `docs/.vitepress/config.ts` | Site metadata, nav, sidebar, theme config, Mermaid plugin | TypeScript config wrapped with `withMermaid()` |
| `docs/.vitepress/theme/index.ts` | Custom theme extension | Imports DefaultTheme + custom CSS |
| `docs/.vitepress/theme/custom.css` | Brand colors, monospace font, ASCII art styling | CSS variable overrides on `:root` |
| `docs/index.md` | Landing page with hero + features sections | VitePress `layout: home` frontmatter |
| `docs/guide/` | Getting started, installation, core concepts | Prose documentation, narrative flow |
| `docs/reference/commands/` | One file per command (29 total) | Structured reference pages, uniform template |
| `docs/reference/agents/` | One file per agent (16 total) | Structured reference pages, uniform template |
| `docs/architecture/` | System diagrams, data flows, internals | Mermaid-heavy technical pages |
| `docs/contributing/` | How to add commands/agents, dev setup | Tutorial-style walkthrough pages |

## Recommended Project Structure

```
docs/                                    # VitePress project root
├── .vitepress/
│   ├── config.ts                        # Site config: nav, sidebar, theme, Mermaid
│   ├── sidebar.ts                       # Extracted sidebar arrays (avoids 300-line config)
│   ├── theme/
│   │   ├── index.ts                     # Theme entry (extends DefaultTheme)
│   │   └── custom.css                   # Brand CSS variables, ASCII art font styles
│   ├── cache/                           # .gitignore — VitePress build cache
│   └── dist/                            # .gitignore — Build output
│
├── index.md                             # Landing page (layout: home)
│
├── guide/
│   ├── index.md                         # What is VIT?
│   ├── installation.md                  # npx vit-claude setup, what gets installed
│   ├── quick-start.md                   # Core loop walkthrough (new-project → plan → execute → verify)
│   ├── core-concepts.md                 # Phases, milestones, agents, state explained
│   └── github-integration.md           # CI workflow setup, issue linking, review loop
│
├── reference/
│   ├── commands/
│   │   ├── index.md                     # Quick-reference table: all 29 commands
│   │   │
│   │   ├── new-project.md
│   │   ├── new-milestone.md
│   │   ├── plan-phase.md
│   │   ├── execute-phase.md
│   │   ├── verify-work.md
│   │   ├── progress.md
│   │   ├── pause-work.md
│   │   ├── resume-work.md
│   │   ├── quick.md
│   │   ├── complete-milestone.md
│   │   ├── audit-milestone.md
│   │   ├── plan-milestone-gaps.md
│   │   ├── list-milestones.md
│   │   ├── discuss-phase.md
│   │   ├── insert-phase.md
│   │   ├── add-phase.md
│   │   ├── remove-phase.md
│   │   ├── assign-phase.md
│   │   ├── list-phase-assumptions.md
│   │   ├── research-phase.md
│   │   ├── map-codebase.md
│   │   ├── debug.md
│   │   ├── review-feedback.md
│   │   ├── team-status.md
│   │   ├── add-todo.md
│   │   ├── check-todos.md
│   │   ├── set-profile.md
│   │   ├── settings.md
│   │   ├── update.md
│   │   ├── help.md
│   │   └── join-discord.md
│   │
│   └── agents/
│       ├── index.md                     # Overview table: all 16 agents + when spawned
│       ├── vit-planner.md
│       ├── vit-executor.md
│       ├── vit-verifier.md
│       ├── vit-phase-researcher.md
│       ├── vit-plan-checker.md
│       ├── vit-project-researcher.md
│       ├── vit-research-synthesizer.md
│       ├── vit-roadmapper.md
│       ├── vit-codebase-mapper.md
│       ├── vit-integration-checker.md
│       ├── vit-debugger.md
│       ├── vit-github-reviewer.md
│       ├── vit-test-writer.md
│       ├── vit-pr-reviewer.md
│       ├── vit-doc-updater.md
│       └── vit-changelog-writer.md
│
├── architecture/
│   ├── index.md                         # Architecture overview with top-level diagram
│   ├── command-flow.md                  # How commands orchestrate agents (Mermaid flowchart)
│   ├── state-model.md                   # STATE.md, PLAN.md, MILESTONE.md lifecycle
│   ├── github-ci.md                     # CI workflow mechanics, branch patterns
│   └── agent-system.md                 # Agent tool access, spawning patterns, parallelism
│
└── contributing/
    ├── index.md                         # Contributor overview
    ├── creating-commands.md             # How to add a new slash command
    ├── creating-agents.md               # How to add a new agent, tool access
    ├── templates.md                     # Template system reference
    └── development-setup.md            # Local dev for vit-cc itself
```

### Structure Rationale

- **`docs/` as VitePress root:** Keeps the docs site separate from CLI source code (`src/`, `bin/`, `files/`). VitePress `package.json` scripts reference `docs` as root: `"dev": "vitepress dev docs"`.
- **`guide/` vs `reference/`:** Classic split. Guide is narrative and task-oriented (how to accomplish goals). Reference is exhaustive and lookup-oriented (what does this command do). Users approach these with different intent.
- **Flat files in `reference/commands/` and `reference/agents/`:** 29 commands and 16 agents are each a flat list — no hierarchy between them. Navigation grouping happens in the sidebar config, not the filesystem.
- **`reference/commands/index.md` and `reference/agents/index.md`:** These become the highest-traffic reference pages. Quick-reference tables let users find what they need without opening individual pages. Essential for a 29-command framework.
- **`docs/.vitepress/sidebar.ts`:** At 29 commands + 16 agents, the sidebar config alone would be 200+ lines. Extracting into a separate file keeps `config.ts` readable and the sidebar arrays independently maintainable.
- **`architecture/` separate from `contributing/`:** Architecture is for users trying to understand the system internals. Contributing is for developers who want to extend VIT. Different audiences, different depth requirements.

## Architectural Patterns

### Pattern 1: Path-Based Multi-Sidebar

**What:** VitePress supports object-keyed sidebar configuration where each URL prefix renders a different sidebar. This is the correct pattern for a site with distinct sections (guide, commands, agents, architecture, contributing) each containing 5–30 pages.

**When to use:** Any section with more than 6 pages that benefits from section-local navigation. Avoid global single-sidebar for large reference sites — 45 items in one sidebar is unusable.

**Trade-offs:** Config verbosity grows proportional to pages. Mitigate by extracting sidebar arrays into `sidebar.ts`.

**Example:**
```typescript
// docs/.vitepress/config.ts
import { withMermaid } from "vitepress-plugin-mermaid";
import { commandsSidebar, agentsSidebar, guideSidebar,
         architectureSidebar, contributingSidebar } from './sidebar';

export default withMermaid({
  themeConfig: {
    sidebar: {
      '/guide/':               guideSidebar,
      '/reference/commands/':  commandsSidebar,
      '/reference/agents/':    agentsSidebar,
      '/architecture/':        architectureSidebar,
      '/contributing/':        contributingSidebar,
    }
  }
});
```

### Pattern 2: Collapsible Command Groups in Sidebar

**What:** Group the 29 commands by workflow stage within the commands sidebar, with collapsible sections. Start groups open (default). This reduces the overwhelming impression of a flat 29-item list.

**When to use:** Any reference section with 10+ pages. Flat lists beyond 10 items impede navigation.

**Trade-offs:** Users must know which group their command falls into. Mitigate with the `reference/commands/index.md` quick-reference table that lists all commands with descriptions.

**Recommended groupings:**
```typescript
// docs/.vitepress/sidebar.ts
export const commandsSidebar = [
  { text: 'Overview', link: '/reference/commands/' },
  {
    text: 'Project Setup',
    collapsed: false,
    items: [
      { text: '/vit:new-project', link: '/reference/commands/new-project' },
      { text: '/vit:new-milestone', link: '/reference/commands/new-milestone' },
    ]
  },
  {
    text: 'Phase Workflow',
    collapsed: false,
    items: [
      { text: '/vit:plan-phase', link: '/reference/commands/plan-phase' },
      { text: '/vit:execute-phase', link: '/reference/commands/execute-phase' },
      { text: '/vit:verify-work', link: '/reference/commands/verify-work' },
      { text: '/vit:progress', link: '/reference/commands/progress' },
    ]
  },
  {
    text: 'State Management',
    collapsed: false,
    items: [
      { text: '/vit:pause-work', link: '/reference/commands/pause-work' },
      { text: '/vit:resume-work', link: '/reference/commands/resume-work' },
      { text: '/vit:quick', link: '/reference/commands/quick' },
    ]
  },
  {
    text: 'Milestone Management',
    collapsed: false,
    items: [
      { text: '/vit:complete-milestone', link: '/reference/commands/complete-milestone' },
      { text: '/vit:audit-milestone', link: '/reference/commands/audit-milestone' },
      { text: '/vit:plan-milestone-gaps', link: '/reference/commands/plan-milestone-gaps' },
      { text: '/vit:list-milestones', link: '/reference/commands/list-milestones' },
    ]
  },
  {
    text: 'Phase Editing',
    collapsed: true,  // Less common — start collapsed
    items: [
      { text: '/vit:discuss-phase', link: '/reference/commands/discuss-phase' },
      { text: '/vit:insert-phase', link: '/reference/commands/insert-phase' },
      { text: '/vit:add-phase', link: '/reference/commands/add-phase' },
      { text: '/vit:remove-phase', link: '/reference/commands/remove-phase' },
      { text: '/vit:assign-phase', link: '/reference/commands/assign-phase' },
      { text: '/vit:list-phase-assumptions', link: '/reference/commands/list-phase-assumptions' },
      { text: '/vit:research-phase', link: '/reference/commands/research-phase' },
    ]
  },
  {
    text: 'Tools',
    collapsed: true,
    items: [
      { text: '/vit:map-codebase', link: '/reference/commands/map-codebase' },
      { text: '/vit:debug', link: '/reference/commands/debug' },
      { text: '/vit:review-feedback', link: '/reference/commands/review-feedback' },
      { text: '/vit:team-status', link: '/reference/commands/team-status' },
      { text: '/vit:add-todo', link: '/reference/commands/add-todo' },
      { text: '/vit:check-todos', link: '/reference/commands/check-todos' },
    ]
  },
  {
    text: 'Settings',
    collapsed: true,
    items: [
      { text: '/vit:set-profile', link: '/reference/commands/set-profile' },
      { text: '/vit:settings', link: '/reference/commands/settings' },
      { text: '/vit:update', link: '/reference/commands/update' },
      { text: '/vit:help', link: '/reference/commands/help' },
      { text: '/vit:join-discord', link: '/reference/commands/join-discord' },
    ]
  },
]
```

### Pattern 3: Uniform Reference Page Template

**What:** Every command page and every agent page follows an identical Markdown structure. Consistency across 45 reference pages is more valuable than optimal per-page formatting.

**When to use:** Always for reference pages. Deviating forces users to mentally re-orient on each page.

**Recommended command page template:**
```markdown
# /vit:command-name

> One-sentence description of what this command does.

## When to use

[Paragraph explaining the scenario where this command is appropriate]

## Usage

```
/vit:command-name [required-arg] [optional-arg]
```

## What it does

[Numbered steps or bullet list describing the execution flow]

## Spawns

| Agent | Purpose |
|-------|---------|
| [agent-name] | [what it does in this command's context] |

## Creates

| File | Purpose |
|------|---------|
| `.planning/FILE.md` | [description] |

## Example

[Concrete example with expected output or typical interaction]

## See also

- [/vit:related-command](/reference/commands/related-command)
```

**Recommended agent page template:**
```markdown
# vit-agent-name

> One-sentence role description.

## Role

[What question this agent answers / what job it performs]

## When spawned

| Command | Condition |
|---------|-----------|
| `/vit:command-name` | [when/why this command spawns this agent] |

## Inputs

| Input | Source |
|-------|--------|
| [file or param] | [where it comes from] |

## Outputs

| Output | Destination |
|--------|-------------|
| [file or return] | [where it goes] |

## Tools

[Tool list from agent definition]

## Flow diagram

```mermaid
flowchart LR
  Command --> Agent --> Output
```
```

### Pattern 4: Source Extraction, Not Copy-Paste

**What:** Command and agent `.md` files in `files/` are authoritative source-of-truth for behavior. They contain implementation instructions written for Claude — XML sections, internal process steps, tool lists. Documentation pages are derived summaries rewritten for users.

**Why this matters:** The internal `files/commands/vit/new-project.md` is 1174 lines of Claude-specific instructions. Dumping this into a documentation page produces an unusable page. The user-facing documentation for `/vit:new-project` should be a 100–200 line page describing what the command does for the user, not how Claude executes it.

**Build order implication:** Content authoring is a human-mediated transformation step. It cannot be fully automated. Each reference page requires reading the source file and rewriting from the user's perspective.

### Pattern 5: Mermaid for Flows, ASCII for Structure

**What:** Use Mermaid `flowchart LR` and `sequenceDiagram` for dynamic relationships (command flows, agent orchestration, CI loop). Use ASCII block diagrams for static structural overviews where relationships are hierarchical rather than causal.

**When to use:** Mermaid when showing causality or time sequence. ASCII when showing hierarchy or spatial structure. Never use both for the same concept on the same page.

**Plugin required:** VitePress does not support Mermaid natively. Install `vitepress-plugin-mermaid`:
```bash
npm i vitepress-plugin-mermaid mermaid -D
```
```typescript
import { withMermaid } from "vitepress-plugin-mermaid";
export default withMermaid({
  // existing config
  mermaid: {},
});
```

## Data Flow

### Content Authoring Flow

```
Source: files/commands/vit/*.md     (29 files — authoritative, Claude-facing)
Source: files/agents/*.md           (16 files — authoritative, Claude-facing)
    ↓
    Human reads source files, extracts user-facing content
    ↓
docs/reference/commands/*.md        (29 files — user-facing documentation)
docs/reference/agents/*.md          (16 files — user-facing documentation)
    ↓
vitepress build docs
    ↓
docs/.vitepress/dist/               (static HTML/CSS/JS)
    ↓
Deploy target (GitHub Pages / Netlify)
    ↓
User browser
```

### Build Pipeline

```
docs/ (source .md files)
    +
docs/.vitepress/config.ts
    +
docs/.vitepress/theme/ (custom CSS)
    +
node_modules/vitepress-plugin-mermaid
    ↓
vitepress build docs
    ↓
docs/.vitepress/dist/
    ↓ (CI/CD)
GitHub Pages at /vit-cc/
```

### Sidebar Resolution Flow

```
User visits /reference/commands/plan-phase
    ↓
config.ts matches '/reference/commands/' key in sidebar object
    ↓
commandsSidebar array renders in left panel with groupings
    ↓
Right TOC auto-generates h2/h3 anchors for current page
    ↓
User navigates to /vit:plan-phase page with full command context
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| MVP (8 core commands documented) | Single sidebar array, no sidebar.ts split needed, skip Mermaid initially |
| Full site (all 29 commands + 16 agents) | Extract sidebar to sidebar.ts, enable collapsible groups, add local search |
| Post-launch | Versioned docs via VitePress versioning, Algolia DocSearch for large user base |

### Scaling Priorities

1. **First bottleneck — Config file size:** At 45 reference pages, sidebar config exceeds 200 lines. Extract into `sidebar.ts` before the site grows beyond MVP.
2. **Second bottleneck — Discoverability:** With 45 pages, search becomes essential. Enable VitePress local search from the start: `search: { provider: 'local' }`. This requires no external service and handles the full reference corpus.

## Anti-Patterns

### Anti-Pattern 1: Copying Internal Command Specs as Documentation

**What people do:** Copy the full content of `files/commands/vit/new-project.md` directly into `docs/reference/commands/new-project.md`.

**Why it's wrong:** Internal command files contain `<process>`, `<execution_context>`, `<objective>`, and other XML blocks that are instructions to Claude. Publishing them produces 1000-line pages of Claude-internal process steps that confuse users.

**Do this instead:** Read the internal file to understand behavior. Write a 100–200 line reference page from the user's perspective: when to use it, what arguments it takes, what files it creates, what happens step by step from the user's view.

### Anti-Pattern 2: Flat Navigation for 45 Pages

**What people do:** Put all 29 commands and 16 agents in a single flat sidebar list.

**Why it's wrong:** 45 undifferentiated items overwhelm users. The sidebar becomes a scroll target rather than a navigation aid. Users cannot find commands by workflow context.

**Do this instead:** Use path-based multi-sidebar (section per URL prefix) and collapsible groups within the commands sidebar. Start frequently-used groups open, collapse less-common groups (Phase Editing, Settings) by default.

### Anti-Pattern 3: Using Mermaid Fences Without the Plugin

**What people do:** Write ` ```mermaid ``` ` blocks assuming VitePress renders them natively.

**Why it's wrong:** VitePress has no native Mermaid support as of 2026. Without `vitepress-plugin-mermaid`, these blocks render as literal text. The site will appear to build correctly but diagrams will show as code.

**Do this instead:** Install `vitepress-plugin-mermaid` and wrap the config export with `withMermaid()` before writing any Mermaid diagrams. Verify locally that diagrams render.

### Anti-Pattern 4: VitePress at Repository Root

**What people do:** Initialize VitePress at `/` so `.vitepress/` lives next to `src/`, `files/`, and `bin/`.

**Why it's wrong:** `.vitepress/dist/` and `.vitepress/cache/` at the project root pollute the structure and create confusion with CLI source code. VitePress expects to own its root directory.

**Do this instead:** Initialize VitePress in a `docs/` subdirectory. Set scripts in `package.json`: `"docs:dev": "vitepress dev docs"`, `"docs:build": "vitepress build docs"`. This is the officially recommended pattern for projects with existing source code.

### Anti-Pattern 5: Agent Pages Without "When Spawned" Context

**What people do:** Document agents as isolated entities without explaining which commands invoke them and under what conditions.

**Why it's wrong:** Users don't invoke agents directly — they invoke commands, which spawn agents. An agent reference page that doesn't explain this relationship leaves users with no understanding of how to trigger the agent or why it exists.

**Do this instead:** Include a "When spawned" section on every agent page listing exactly which commands spawn it and the conditions under which spawning occurs.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Pages | `vitepress build docs` → deploy `docs/.vitepress/dist/` | Set `base: '/vit-cc/'` in config for subpath deploy |
| Netlify / Vercel | Auto-detect or set build command + publish dir | Zero-config if repo root has `docs/.vitepress/dist/` |
| VitePress Local Search | `search: { provider: 'local' }` in config | No external service; built on MiniSearch; sufficient for this scale |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Source files → Docs | Human-mediated extraction and rewriting | No automated pipeline; intentional transformation required |
| `config.ts` → sidebar | TypeScript import from `sidebar.ts` | Keeps config.ts readable at scale |
| Theme → Content | CSS variable overrides only | Content pages avoid embedded Vue components for maintainability |
| Mermaid plugin → Config | `withMermaid()` wrapper around entire config export | Must wrap the whole export, not merge separately |

## Content Build Order

Build order matters: some pages establish vocabulary used by later pages, and the landing page + config must exist before any content is useful.

**Stage 1 — Foundation (unblocks everything else):**
1. `docs/.vitepress/config.ts` with full nav and stub sidebars
2. `docs/.vitepress/theme/` with brand CSS and Mermaid enabled
3. `docs/index.md` — landing page with hero section

**Stage 2 — Guide section (establishes vocabulary for reference pages):**
4. `docs/guide/index.md` — what VIT is
5. `docs/guide/quick-start.md` — core loop
6. `docs/guide/core-concepts.md` — phases, milestones, agents defined here; reference pages assume this

**Stage 3 — Reference index pages (navigation anchors before individual pages exist):**
7. `docs/reference/commands/index.md` — quick-reference table, all 29 commands
8. `docs/reference/agents/index.md` — quick-reference table, all 16 agents

**Stage 4 — Core workflow command pages (highest traffic):**
9. `new-project.md`, `plan-phase.md`, `execute-phase.md`, `verify-work.md`
10. `progress.md`, `pause-work.md`, `resume-work.md`

**Stage 5 — Remaining command pages (batch, alphabetical, no dependencies):**
11. All remaining 22 command pages

**Stage 6 — Agent pages (batch, alphabetical, no dependencies):**
12. All 16 agent pages

**Stage 7 — Architecture and contributing (lower priority, specialized audience):**
13. `docs/architecture/` pages with Mermaid diagrams
14. `docs/contributing/` pages

**Rationale for this order:** The landing page and config must exist before deployment. The guide section establishes terminology referenced on every other page. Index pages let users navigate even when individual pages are stubs. Core workflow commands receive disproportionate traffic — document them before utilities. Architecture and contributing pages serve a small audience and can be written last.

## Sources

- [VitePress Getting Started — official docs](https://vitepress.dev/guide/getting-started) — HIGH confidence
- [VitePress Sidebar Configuration — official docs](https://vitepress.dev/reference/default-theme-sidebar) — HIGH confidence
- [VitePress Markdown Extensions — official docs](https://vitepress.dev/guide/markdown) — HIGH confidence (confirms no native Mermaid support)
- [VitePress Extending Default Theme — official docs](https://vitepress.dev/guide/extending-default-theme) — HIGH confidence
- [VitePress Home Page Layout — official docs](https://vitepress.dev/reference/default-theme-home-page) — HIGH confidence
- [VitePress Nav Configuration — official docs](https://vitepress.dev/reference/default-theme-nav) — HIGH confidence
- [vitepress-plugin-mermaid — official plugin docs](https://emersonbottero.github.io/vitepress-plugin-mermaid/guide/getting-started.html) — HIGH confidence
- Direct reading of `files/commands/vit/` (29 command files) — HIGH confidence — source inventory
- Direct reading of `files/agents/` (16 agent files) — HIGH confidence — source inventory

---
*Architecture research for: VitePress documentation site (vit-cc CLI framework)*
*Researched: 2026-03-18*
