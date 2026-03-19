# Phase 02: GitHub Pages Technical Documentation Site - Research

**Researched:** 2026-03-19
**Domain:** VitePress static site generation, GitHub Pages deployment
**Confidence:** HIGH

## Summary

This phase builds a VitePress documentation site in `docs/` and deploys it to GitHub Pages. VitePress 1.6.4 is the current stable release. It uses a `docs/` directory as the VitePress root with a separate `docs/package.json` (as specified in DOCS-01), keeping docs dependencies isolated from the main project.

The GitHub Pages deployment uses a standard GitHub Actions workflow that runs `npm ci` and `npm run docs:build` from the root, uploading `docs/.vitepress/dist`. The repo is `LeVarez/vit-cc`, so the Pages URL will be `https://levarez.github.io/vit-cc/` — the VitePress `base` config **must** be `/vit-cc/` for all asset paths to resolve correctly.

The 13 documentation pages (DOCS-02 through DOCS-12, plus sidebar and visual consistency) all have substantive content derived from the existing codebase: command files in `files/commands/vit/`, agents in `files/agents/`, references in `files/vit/references/`, workflows in `files/vit/workflows/`, hooks in `files/hooks/`, and the existing `phase-ci.yml`. Mermaid diagrams are supported via `vitepress-plugin-mermaid` (current version 2.0.16).

**Primary recommendation:** Use VitePress 1.6.4 in `docs/` with a separate `docs/package.json`, configure `base: '/vit-cc/'` in `.vitepress/config.ts`, and deploy via the official GitHub Actions workflow pattern.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitepress | 1.6.4 | Static site generator | Official Vue/Vite docs framework, ESM-only, excellent DX |
| Node.js | >=20 | Runtime | VitePress requirement; project already uses >=18 but VitePress requires 20+ |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitepress-plugin-mermaid | 2.0.16 | Mermaid diagram support | DOCS-04 state flow diagram, DOCS-14 visual consistency requirement |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vitepress-plugin-mermaid | Custom Mermaid.vue component | Plugin is simpler; custom component needed only if plugin has breaking compat issues |
| Separate docs/package.json | Root package.json with docs: scripts | DOCS-01 explicitly requires docs/package.json; separate package.json isolates docs deps from the npm package |

### Installation (from docs/ directory)

```bash
# In docs/ directory
npm init -y
npm add -D vitepress vitepress-plugin-mermaid
```

Root package.json gets scripts pointing into docs/:
```json
{
  "scripts": {
    "docs:dev": "npm --prefix docs run dev",
    "docs:build": "npm --prefix docs run build",
    "docs:preview": "npm --prefix docs run preview"
  }
}
```

docs/package.json scripts:
```json
{
  "type": "module",
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview"
  },
  "devDependencies": {
    "vitepress": "^1.6.4",
    "vitepress-plugin-mermaid": "^2.0.16"
  }
}
```

## Architecture Patterns

### Recommended Project Structure

```
docs/
├── .vitepress/
│   ├── config.ts          # Main VitePress config
│   └── theme/
│       ├── index.ts        # Theme entry: import DefaultTheme + custom.css
│       └── custom.css      # Override --vp-c-brand-* variables
├── package.json            # VitePress deps (DOCS-01 requirement)
├── index.md                # Landing page (layout: home)
├── guide/
│   ├── how-vit-works.md    # DOCS-03
│   ├── architecture.md     # DOCS-04
│   ├── workflow-files.md   # DOCS-07
│   └── templates-references.md  # DOCS-08
├── contributing/
│   ├── command-anatomy.md  # DOCS-05
│   ├── agent-anatomy.md    # DOCS-06
│   └── testing.md          # DOCS-12
└── reference/
    ├── github-integration.md  # DOCS-09
    ├── configuration.md       # DOCS-10
    └── hooks-sessions.md      # DOCS-11
```

### Pattern 1: VitePress Config with Mermaid and GitHub Pages Base

**What:** Main config.ts wires up sidebar, nav, Mermaid plugin, and base path.
**When to use:** Required for the site to function correctly on GitHub Pages.
**Example:**
```typescript
// Source: https://vitepress.dev/reference/site-config + vitepress-plugin-mermaid docs
import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: 'VIT',
  description: 'Phase-based project execution framework for Claude Code',
  base: '/vit-cc/',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/how-vit-works' },
      { text: 'Contributing', link: '/contributing/command-anatomy' },
      { text: 'Reference', link: '/reference/configuration' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'How VIT Works', link: '/guide/how-vit-works' },
          { text: 'Architecture Deep Dive', link: '/guide/architecture' },
          { text: 'Workflow Files', link: '/guide/workflow-files' },
          { text: 'Templates & References', link: '/guide/templates-references' },
        ]
      },
      {
        text: 'Contributing',
        items: [
          { text: 'Command Anatomy', link: '/contributing/command-anatomy' },
          { text: 'Agent Anatomy', link: '/contributing/agent-anatomy' },
          { text: 'Testing', link: '/contributing/testing' },
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'GitHub Integration', link: '/reference/github-integration' },
          { text: 'Configuration', link: '/reference/configuration' },
          { text: 'Hooks & Sessions', link: '/reference/hooks-sessions' },
        ]
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/LeVarez/vit-cc' }
    ]
  }
}))
```

### Pattern 2: Landing Page (index.md)

**What:** VitePress `layout: home` frontmatter creates the hero + features grid.
**When to use:** DOCS-02 requires hero with 4 features.
**Example:**
```markdown
---
# Source: https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "VIT"
  text: "Phase-based execution for Claude Code"
  tagline: "Every step reflected in GitHub. Zero manual operations."
  actions:
    - theme: brand
      text: Get Started
      link: /guide/how-vit-works
    - theme: alt
      text: GitHub
      link: https://github.com/LeVarez/vit-cc

features:
  - title: Phase Execution
    details: ...
  - title: GitHub Integration
    details: ...
  - title: Multi-Agent Architecture
    details: ...
  - title: Context Resilience
    details: ...
---
```

### Pattern 3: Brand Color Override via Custom CSS

**What:** Override VitePress CSS variables for VIT branding.
**When to use:** DOCS-14 requires VIT brand colors.
**Example:**
```css
/* Source: https://vitepress.dev/guide/extending-default-theme */
/* docs/.vitepress/theme/custom.css */
:root {
  --vp-c-brand-1: #646cff;
  --vp-c-brand-2: #747bff;
  --vp-c-brand-3: #535bf2;
  --vp-c-brand-soft: rgba(100, 108, 255, 0.14);
}
```

```typescript
// docs/.vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import './custom.css'
export default DefaultTheme
```

**Note on brand color:** No official VIT brand color is defined in `files/vit/references/ui-brand.md` — that file defines ASCII UI patterns, not hex colors. The color palette is at Claude's discretion. Use a blue-purple to match Claude's aesthetic and the diff-block green from the README hero.

### Pattern 4: GitHub Actions Deployment Workflow

**What:** Deploys the docs site to GitHub Pages on push to main.
**When to use:** DOCS-01 requires this workflow.
**Example:**
```yaml
# Source: https://vitepress.dev/guide/deploy#github-pages
# .github/workflows/deploy-docs.yml
name: Deploy VitePress site to Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - name: Setup Node
        uses: actions/setup-node@v6
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: docs/package-lock.json
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Install dependencies
        run: npm ci
        working-directory: docs
      - name: Build with VitePress
        run: npm run build
        working-directory: docs
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Important:** Since DOCS-01 requires a separate `docs/package.json`, the `working-directory: docs` is needed for `npm ci` and `npm run build`. The `cache-dependency-path` must point to `docs/package-lock.json`.

### Anti-Patterns to Avoid

- **Wrong base path:** Omitting `base: '/vit-cc/'` causes 404s for all assets on GitHub Pages. Local dev still works fine without it, masking the problem.
- **Putting VitePress in root package.json:** DOCS-01 explicitly requires `docs/package.json`. Keep them separate.
- **Using `npm run docs:build` in workflow:** With separate `docs/package.json`, run `npm run build` from `working-directory: docs`, not the root-level `docs:build` script.
- **Jekyll interference:** GitHub Pages defaults to Jekyll. The workflow must use the "GitHub Actions" source in Pages settings, not the branch-based Jekyll build.
- **Missing GitHub Pages settings change:** The repository's Pages settings must be set to "GitHub Actions" (not "Deploy from a branch") before the workflow runs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mermaid diagram rendering | Custom Vue component with mermaid import | vitepress-plugin-mermaid | Handles dark/light theme switching, SSR issues, and mermaid version compat |
| Sidebar auto-generation | Script to scan markdown files | Manual sidebar config in config.ts | 13 pages is small enough; auto-gen adds complexity for little gain |
| Search | Custom search implementation | VitePress built-in local search | VitePress 1.x includes local search out of the box via `themeConfig.search` |
| Brand colors | Inline styles or hardcoded colors | CSS variable overrides in custom.css | VitePress theming system handles dark mode automatically |
| Syntax highlighting | Custom highlighter | VitePress built-in Shiki | Shiki is built in, supports all languages including `bash`, `typescript`, `json`, `yaml` |

**Key insight:** VitePress ships with local search, Shiki syntax highlighting, dark mode, and responsive sidebar — do not replicate these with custom code.

## Common Pitfalls

### Pitfall 1: Wrong Base Path for GitHub Pages
**What goes wrong:** Site loads at the root URL but all JS/CSS assets 404, or nav links are broken.
**Why it happens:** GitHub Pages serves repos at `/<repo-name>/` by default. VitePress generates absolute asset paths that don't include the subpath.
**How to avoid:** Set `base: '/vit-cc/'` in `config.ts`. Must match the repo name exactly (case-sensitive).
**Warning signs:** `npm run dev` works fine but deployed site shows blank page or broken styles.

### Pitfall 2: Node Version Incompatibility
**What goes wrong:** VitePress install or build fails with syntax errors.
**Why it happens:** VitePress 1.x requires Node 20+. The project's root `package.json` specifies `"node": ">=18"`, but `docs/package.json` should target 20+.
**How to avoid:** Use `node-version: 20` in the workflow. Add `"engines": {"node": ">=20"}` to `docs/package.json`.
**Warning signs:** Build errors mentioning ESM or fetch API unavailability.

### Pitfall 3: `docs/package-lock.json` Missing
**What goes wrong:** The GitHub Actions `cache: npm` with `cache-dependency-path: docs/package-lock.json` fails because `package-lock.json` was gitignored or not committed.
**Why it happens:** Developers sometimes add `package-lock.json` to `.gitignore` for nested packages.
**How to avoid:** Commit `docs/package-lock.json`. The workflow depends on it for caching and reproducible builds.
**Warning signs:** CI warning about cache miss on every run.

### Pitfall 4: GitHub Pages Source Not Set to GitHub Actions
**What goes wrong:** Pages deployment succeeds in Actions but the site isn't published or shows wrong content.
**Why it happens:** GitHub defaults to "Deploy from a branch" (Jekyll). The Actions-based deployment requires "GitHub Actions" selected in Settings → Pages → Build and deployment → Source.
**How to avoid:** After first workflow run, go to repo Settings → Pages → Source and select "GitHub Actions".
**Warning signs:** Pages tab shows "Your site is live at" with content from main branch index.html, not VitePress output.

### Pitfall 5: Mermaid SSR Issues
**What goes wrong:** VitePress build fails with `window is not defined` or similar browser-only API errors during SSR.
**Why it happens:** Mermaid uses browser APIs. During VitePress static build, it runs in Node (SSR context).
**How to avoid:** Use `vitepress-plugin-mermaid` which wraps Mermaid in a client-only component. Do NOT import mermaid directly in markdown or theme.
**Warning signs:** Build succeeds in dev but fails in `npm run build`.

### Pitfall 6: Internal Link Resolution
**What goes wrong:** VitePress warns about broken links during build, or links 404 on the deployed site.
**Why it happens:** VitePress resolves links relative to the `docs/` root. Links must start with `/` for root-relative or be relative to the current file. Missing trailing slashes or `.md` extensions cause issues.
**How to avoid:** Use root-relative links without `.md` extension (e.g., `/guide/how-vit-works`). Run `npm run build` locally before merging to catch broken links.
**Warning signs:** Build output shows "dead link" warnings.

## Code Examples

Verified patterns from official sources:

### Local Search Configuration
```typescript
// Source: https://vitepress.dev/reference/default-theme-config
themeConfig: {
  search: {
    provider: 'local'
  }
}
```

### Collapsible Sidebar Section
```typescript
// Source: https://vitepress.dev/reference/default-theme-sidebar
sidebar: [
  {
    text: 'Guide',
    collapsed: false,
    items: [...]
  }
]
```

### Page Frontmatter (non-home pages)
```markdown
---
title: Command Anatomy
description: How to create a new VIT command
---

# Command Anatomy
```

### Mermaid Diagram in Markdown
```markdown
```mermaid
graph TD
    A[/vit:plan-phase] --> B[vit-phase-researcher]
    B --> C[vit-planner]
    C --> D[PLAN.md]
```
```

### Edit on GitHub Link
```typescript
// Source: https://vitepress.dev/reference/default-theme-config
themeConfig: {
  editLink: {
    pattern: 'https://github.com/LeVarez/vit-cc/edit/main/docs/:path',
    text: 'Edit this page on GitHub'
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| VuePress | VitePress | 2022 | VitePress is the official successor; faster, simpler, Vite-based |
| Algolia DocSearch | Built-in local search | VitePress 1.x | No external service needed for basic search |
| `actions/upload-pages-artifact@v1` | `@v3` | 2024 | v3 is current; v1 deprecated |
| `actions/checkout@v3` | `@v5` | 2025 | v5 uses Node 20 runner |
| `actions/setup-node@v3` | `@v6` | 2025 | v6 is current |

**Deprecated/outdated:**
- VuePress: Replaced by VitePress for all new Vue-ecosystem doc sites.
- VitePress `@next` / `2.0.0-alpha.*`: Alpha is available but use 1.6.4 stable for production.
- Algolia as primary search: Local search is now built-in for small-to-medium doc sites.

## Content Sources (What to Write)

The 13 doc pages all draw from existing codebase files. Content sources per page:

| Page | DOCS-# | Primary Source Files |
|------|--------|---------------------|
| How VIT Works | 03 | `files/vit/workflows/`, `files/vit/references/continuation-format.md`, `files/vit/templates/state.md` |
| Architecture Deep Dive | 04 | `files/vit/workflows/execute-phase.md`, `files/commands/vit/execute-phase.md`, `files/vit/references/model-profiles.md` |
| Command Anatomy | 05 | Any `files/commands/vit/*.md` file, `files/commands/vit/plan-phase.md` as walkthrough example |
| Agent Anatomy | 06 | Any `files/agents/*.md` file, `files/agents/vit-planner.md` as walkthrough example |
| Workflow Files | 07 | `files/vit/workflows/` directory contents |
| Templates & References | 08 | `files/vit/templates/`, `files/vit/references/`, `files/vit/references/ui-brand.md` |
| GitHub Integration | 09 | `files/vit/references/git-integration.md`, `.github/workflows/phase-ci.yml`, `files/commands/vit/execute-phase.md` |
| Configuration | 10 | `files/vit/references/planning-config.md`, `files/vit/references/model-profiles.md`, `.planning/config.json` schema |
| Hooks & Sessions | 11 | `files/hooks/vit-check-update.cjs`, `files/hooks/vit-statusline.js`, `src/install.js` (settings.json merge logic), `files/vit/references/continuation-format.md` |
| Testing | 12 | `files/agents/vit-test-writer.md`, `.github/workflows/phase-ci.yml`, `tests/` directory |

## Open Questions

1. **VIT brand color hex values**
   - What we know: `ui-brand.md` defines ASCII patterns and status symbols, not hex colors. The README uses diff blocks for green.
   - What's unclear: No authoritative VIT brand color exists in the codebase.
   - Recommendation: Use a blue-violet palette consistent with Claude Code's aesthetic (e.g., `#7c6af5` primary). The planner should pick concrete values — this is Claude's discretion.

2. **GitHub Pages repository settings**
   - What we know: The workflow will deploy correctly if Pages source is set to "GitHub Actions" in repo settings.
   - What's unclear: Whether this setting is already configured for `LeVarez/vit-cc`.
   - Recommendation: Include a checkpoint task in the plan for the human to confirm/set this in GitHub repo settings.

3. **Node version compatibility for docs/**
   - What we know: VitePress 1.6.4 requires Node 20+. Root project requires Node >=18.
   - What's unclear: Whether `docs/package.json` should declare its own `engines` field.
   - Recommendation: Set `node-version: 20` in the workflow and add `"engines": {"node": ">=20"}` in `docs/package.json`.

## Sources

### Primary (HIGH confidence)
- https://vitepress.dev/guide/getting-started — project structure, installation, VitePress 1.6.4 confirmed as stable
- https://vitepress.dev/guide/deploy#github-pages — complete deployment YAML with actions versions
- https://vitepress.dev/reference/default-theme-config — nav, sidebar, search, editLink config
- https://vitepress.dev/reference/default-theme-home-page — hero and features frontmatter schema
- https://vitepress.dev/guide/extending-default-theme — CSS variable override pattern

### Secondary (MEDIUM confidence)
- https://emersonbottero.github.io/vitepress-plugin-mermaid/ — version 2.0.16, `withMermaid()` wrapper pattern
- https://github.com/vuejs/vitepress/issues (multiple) — base path pitfalls confirmed by multiple reporters

### Tertiary (LOW confidence)
- `working-directory: docs` approach for separate `docs/package.json` — not in official VitePress docs, derived from GitHub Actions documentation + official VitePress deploy pattern. Needs validation that `cache-dependency-path: docs/package-lock.json` works correctly with `actions/setup-node@v6`.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — VitePress 1.6.4 confirmed current stable via official docs
- Architecture: HIGH — Official VitePress docs cover all config patterns
- Pitfalls: HIGH — Base path issue confirmed by multiple GitHub issues; others from official docs
- GitHub Actions workflow: MEDIUM — Official YAML confirmed, `working-directory` adaptation for separate docs/package.json is standard GitHub Actions but not VitePress-specific docs

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (VitePress 1.x is stable; check for 2.0 release which could change config API)
