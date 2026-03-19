# Technology Stack: Documentation Tooling

**Project:** vit-cc Documentation & Developer Guide
**Researched:** 2026-03-19
**Confidence:** HIGH for VitePress; HIGH for Mermaid; HIGH for plain-docs baseline

---

## Scope

This research covers tooling for documenting vit-cc as an agentic framework — a collection of
markdown files, not a traditional code library. The question is: what format, structure, and tooling
produces documentation that is readable on GitHub, maintainable by agents, and usable by developers?

The existing stack (Node.js CLI, `gh` CLI, markdown agent definitions) is validated and not
re-evaluated here. This is purely documentation-layer tooling.

---

## Recommended Stack

### Primary: Plain `docs/` Folder with VitePress as Optional Layer

**Verdict:** Start with a structured `docs/` folder of plain markdown. Add VitePress on top for a
site if the project needs web presence. Both are complementary, not competing.

The insight driving this recommendation: vit-cc's documentation audience reaches content through
two channels — GitHub (README, linked markdown files in `docs/`) and potentially a hosted site.
Plain markdown that renders well on GitHub is the non-negotiable baseline. VitePress is the upgrade
path once that baseline is solid.

---

### Tier 1: Documentation Structure

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Format | Plain `.md` files in `docs/` | GitHub renders natively; agents can write/update without tooling |
| Structure | Multi-file with clear hierarchy | One file per command, one file per agent, plus guides |
| Diagrams | Mermaid in fenced code blocks | GitHub renders natively since 2022; no export step needed |
| Entry point | `docs/README.md` or top-level `README.md` with links | GitHub surfaces `README.md` automatically |
| Naming | Kebab-case `.md` files | GitHub renders file names as page titles; `command-reference.md` > `CommandReference.md` |

**Why plain markdown over a static site generator as the starting point:**

vit-cc's content is markdown files authored and updated by agents (`vit-doc-updater`,
`vit-changelog-writer`). Adding a build step means agents must understand build output, not just
file content. Plain markdown is agent-native. A static site can be layered on top without changing
the underlying files.

---

### Tier 2: Static Site (When Needed)

**Recommendation: VitePress 1.x**

If vit-cc needs a hosted documentation site (vitejs.dev-style), VitePress is the correct choice.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| VitePress | 1.x (stable) | Static site from markdown | Purpose-built for markdown docs; minimal config; GitHub Pages deploy in <5 min; built-in local search |
| vitepress-sidebar | 1.x | Auto-generate sidebar from folder structure | Eliminates manual sidebar maintenance as files are added |

**Why VitePress over alternatives:**

- **vs. Docusaurus:** Docusaurus is React-heavy and designed for large-scale docs with versioning
  (e.g., React, Jest docs). vit-cc does not need versioned docs or React components. VitePress has
  significantly lower configuration overhead for the same markdown-first result. Setup is 2-5 minutes
  vs. Docusaurus's 5-10 minutes, and VitePress produces smaller bundle sizes.

- **vs. MkDocs:** MkDocs requires Python. VitePress requires Node.js, which is already a vit-cc
  dependency. Keeping the toolchain in one runtime is simpler for contributors and CI.

- **vs. Mintlify/GitBook (hosted):** These are SaaS products. Mintlify Pro is $300/month.
  GitBook's collaborative editing is irrelevant for agent-authored docs. VitePress is self-hosted,
  zero cost, and source-controlled.

- **vs. GitHub Wiki:** GitHub Wikis are not part of the main repo tree, cannot be updated by
  automated agents via PR, and are not included in releases. Avoid.

**VitePress key features for this project:**

- Built-in fuzzy full-text search via minisearch (no Algolia account needed for an open source CLI)
- File-based routing: `docs/commands/execute-phase.md` → `/commands/execute-phase`
- Custom containers (tip, warning, danger) for callouts
- Mermaid via `vitepress-plugin-mermaid` (plugin adds ~5 lines of config)
- GitHub Pages deployment via one GitHub Actions workflow

**VitePress minimal setup:**

```bash
npm add -D vitepress
npx vitepress init
```

Then add to `package.json`:

```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  }
}
```

---

### Tier 3: Diagrams

**Recommendation: Mermaid in fenced code blocks**

```markdown
```mermaid
flowchart TD
  A[/vit:plan-phase] --> B[vit-phase-researcher]
  B --> C[vit-planner]
  C --> D[vit-plan-checker]
```
```

| Property | Status |
|----------|--------|
| GitHub native rendering | YES — since Feb 2022, confirmed stable through 2025 |
| VitePress support | Via `vitepress-plugin-mermaid` (one npm install) |
| Export to PNG/SVG | Via `@mermaid-js/mermaid-cli` if static images needed |
| Version control friendly | YES — text-based, diffable |

**Why Mermaid over alternatives:**

- **vs. draw.io / Lucidchart:** Binary or XML formats; not agent-writable; not version-controllable
  as readable diffs.
- **vs. PlantUML:** Requires Java runtime or external service. Mermaid is JavaScript-native.
- **vs. D2:** Newer, less GitHub support, smaller ecosystem. Mermaid has 80,000+ weekly npm
  downloads (2025).
- **vs. SVG exports embedded in docs:** SVGs can't be authored by agents writing markdown;
  Mermaid syntax can.

**What Mermaid covers for vit-cc docs:**

- `flowchart` — command orchestration flows (plan → execute → verify)
- `sequenceDiagram` — agent spawning sequences
- `graph` — component dependency maps

---

### Tier 4: Command Reference Generation

**Recommendation: No generation tooling. Author directly.**

vit-cc commands are markdown files, not code with parseable signatures. There is no equivalent of
JSDoc or OpenAPI for Claude Code slash commands. Attempts to auto-generate command references from
markdown sources produce output of the same quality as hand-authoring, with added complexity.

The correct pattern is: one `.md` file per command in `docs/commands/`, one `.md` per agent in
`docs/agents/`, each authored by the `vit-doc-updater` agent which already has the source content.

**If structured frontmatter is desired for future tooling:**

Add YAML frontmatter to command docs:

```yaml
---
command: /vit:execute-phase
category: execution
inputs:
  - phase_number
spawns:
  - vit-executor
  - vit-integration-checker
  - vit-test-writer
---
```

This makes docs machine-readable without requiring a separate tool chain today. A future script
could generate an index from frontmatter if needed.

---

## Folder Structure Recommendation

```
docs/
├── index.md                    # Landing page (getting started)
├── user-guide/
│   ├── getting-started.md      # Install + first project walkthrough
│   ├── core-loop.md            # new-project → plan → execute → verify
│   └── github-integration.md  # CI, PR automation, feedback loop
├── commands/
│   ├── index.md                # Commands overview table
│   ├── execute-phase.md        # One file per command
│   ├── plan-phase.md
│   ├── verify-work.md
│   └── ...                     # 29 commands total
├── agents/
│   ├── index.md                # Agents overview + spawning map
│   ├── vit-executor.md         # One file per agent
│   ├── vit-planner.md
│   └── ...                     # 16 agents total
├── developer-guide/
│   ├── architecture.md         # System structure + data flow diagrams
│   ├── design-patterns.md      # Patterns used across agents/commands
│   ├── custom-agents.md        # How to create custom agents
│   ├── custom-commands.md      # How to create custom slash commands
│   └── state-management.md    # STATE.md, PLAN.md lifecycle
└── reference/
    ├── configuration.md        # config.json options
    └── templates.md            # Template file reference
```

This maps directly to the three documentation goals from PROJECT.md:
1. User guide — `docs/user-guide/` + `docs/commands/` + `docs/agents/`
2. Developer guide — `docs/developer-guide/`
3. Architecture — `docs/developer-guide/architecture.md` with Mermaid diagrams

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| GitHub Wiki | Not in repo tree; agents can't PR-update it; not versioned with code | `docs/` folder in main repo |
| Mintlify / GitBook (SaaS) | Paid tiers; external dependency; docs updates can't be atomic commits | VitePress self-hosted |
| Docusaurus | React overhead; built for versioned API docs; overkill for a CLI framework | VitePress |
| Auto-generating command reference from source | No parseable structure in `.md` agent files; adds toolchain for zero gain | Hand-authored per-command docs updated by vit-doc-updater |
| Single mega-README | Already 200 lines and growing; non-linkable sections; poor discoverability | Multi-file `docs/` hierarchy |
| Binary diagram formats (draw.io, Visio) | Not version-controllable; not agent-writable | Mermaid in markdown |
| Sphinx | Python ecosystem; RST-first; no advantage over VitePress for a Node.js project | VitePress |

---

## Integration with Existing Agent Workflow

Two existing agents write documentation today:

**`vit-doc-updater`** — spawned after each phase, reads `SUMMARY.md`, updates README/docs sections
and appends to `CHANGELOG.md [Unreleased]`.

**`vit-changelog-writer`** — spawned at milestone completion, promotes `[Unreleased]` to versioned
entry and updates project docs.

Both agents write plain markdown. The recommended `docs/` structure keeps them functional: agents
find and update the relevant `.md` file by path without needing to understand a build pipeline.

The only constraint: if VitePress is added, agent-written files must not include VitePress-specific
syntax (custom containers, Vue components) unless the agents are explicitly taught to use them.
Start conservative — plain GFM markdown that works on both GitHub and VitePress.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Static site | VitePress | Docusaurus | React overhead; versioning features not needed; longer setup |
| Static site | VitePress | MkDocs | Python runtime adds dependency; no advantage for Node.js project |
| Static site | VitePress | Mintlify | $300/month Pro; SaaS dependency for open source tool |
| Static site | VitePress | Nextra (Next.js) | Next.js is web app framework; documentation use is secondary; heavier than VitePress |
| Diagrams | Mermaid | PlantUML | Requires Java; no GitHub native render |
| Diagrams | Mermaid | D2 | Less GitHub support; smaller ecosystem |
| Structure | Multi-file `docs/` | Single README | Doesn't scale past 200 lines; no deep linking |
| Structure | Multi-file `docs/` | GitHub Wiki | Outside repo tree; not PR-updateable by agents |

---

## Sources

- https://vitepress.dev/guide/getting-started — VitePress setup and features (HIGH)
- https://vitepress.dev/reference/default-theme-search — built-in minisearch confirmed (HIGH)
- https://vitepress.dev/guide/markdown — Markdown extensions list, no native Mermaid (HIGH)
- https://okidoki.dev/documentation-generator-comparison — VitePress vs Docusaurus vs MkDocs setup comparison (MEDIUM)
- https://github.com/jooy2/vitepress-sidebar — vitepress-sidebar auto-generation plugin (MEDIUM)
- https://github.blog/developer-skills/github/include-diagrams-markdown-files-mermaid/ — GitHub native Mermaid rendering (HIGH)
- https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams — GitHub Mermaid docs (HIGH)
- https://mermaid.js.org/ — Mermaid diagram types and syntax (HIGH)
- https://dev.to/infrasity-learning/best-developer-documentation-tools-in-2025-mintlify-gitbook-readme-docusaurus-10fc — tool comparison (MEDIUM)

---

*Stack research for: vit-cc Documentation & Developer Guide milestone*
*Researched: 2026-03-19*
