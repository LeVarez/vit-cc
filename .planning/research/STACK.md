# Technology Stack: VitePress Documentation Site

**Project:** vit-cc documentation site (v1.0.1 milestone)
**Researched:** 2026-03-18
**Scope:** Stack additions only — does not re-document the existing Node.js CLI framework

---

## Version Decision: Use `vitepress@next` (v2 alpha)

**Confidence: MEDIUM** — Verified via official getting-started page and maintainer statements on GitHub.

The official VitePress getting-started docs (vitepress.dev) instruct new users to install `vitepress@next`. As of the research date, `@next` resolves to v2.0.0-alpha.16 (released January 2025). The stable tag is v1.6.4.

**Recommendation: Install `vitepress@next`.** Rationale:

1. The official documentation site itself documents v2 alpha. Starting on v1 means migrating later with no documentation help.
2. VitePress maintainer @brc-dd stated: "New users can start using v2-alpha. Some new features are there but most of the documentation still applies to v1 too. And there are no major breaking changes yet."
3. For a documentation site (not a production app), alpha risk is low — the worst outcome is a minor config rename at stable release.
4. v2 alpha ships with Shiki (not shikiji), which is the actively maintained highlighter going forward.

**Do not** pin to v1.6.4 — it is unmaintained, the docs site no longer covers it, and you will inherit the migration cost later.

---

## Core Addition

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| vitepress | `@next` (v2.0.0-alpha.16+) | Static site generator | Official recommendation for new projects; built-in search, Shiki highlighting, Vue-powered theming |

**Install command:**
```bash
npm add -D vitepress@next
```

VitePress bundles Vue 3, Vite, Shiki, and markdown-it. No separate installs are needed for those.

**Node.js requirement:** VitePress requires Node.js 20 or higher. The existing project declares `"engines": { "node": ">=18" }`. This needs to be updated to `>=20` in `package.json`.

**ESM requirement:** VitePress is ESM-only. The existing `package.json` does not have `"type": "module"`. The `docs/` folder will need its own config files with `.mts` or `.mjs` extensions, or you add `"type": "module"` to the root. **Recommendation: use `.mts` extension for the VitePress config** (`docs/.vitepress/config.mts`) — this avoids changing the root `package.json` and breaking the existing CommonJS CLI code.

---

## Search: Use Built-in Local Search (MiniSearch)

**Confidence: HIGH** — Verified from vitepress.dev official search reference docs.

VitePress ships with client-side full-text search using MiniSearch. Enable it with a single config line:

```typescript
// docs/.vitepress/config.mts
themeConfig: {
  search: {
    provider: 'local'
  }
}
```

**Why local over Algolia:**
- Zero external dependencies or API keys
- Works offline and in PR preview deployments
- Sufficient for a single-product documentation site
- Algolia DocSearch requires an application review process and is overkill for a framework docs site

**Why not vitepress-plugin-pagefind or vitepress-plugin-search:**
- These are third-party community plugins, not officially maintained
- The built-in MiniSearch covers all needed use cases
- Fewer dependencies to keep updated

---

## Code Highlighting: Shiki (Built-in)

**Confidence: HIGH** — Verified from vitepress.dev site-config reference.

VitePress v2 uses Shiki for syntax highlighting. No additional install required. Shiki supports all languages used in vit-cc documentation (bash, typescript, markdown, yaml, json).

Configure transformer-level options in `config.mts` if custom themes are needed, but the default (GitHub dark/light adaptive) is suitable for a developer-facing docs site.

---

## Deployment: GitHub Pages via GitHub Actions

**Confidence: HIGH** — Verified from vitepress.dev deploy guide.

**Recommendation: GitHub Pages.** Rationale:
- The project is already on GitHub (github.com/LeVarez/vit-cc)
- Zero additional infrastructure — no Vercel or Netlify accounts needed
- Free for public repos
- Official VitePress docs provide a ready-made workflow file

**Required GitHub Actions workflow** (`.github/workflows/deploy-docs.yml`):

```yaml
name: Deploy docs

on:
  push:
    branches: [main]
    paths: ['docs/**']
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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run docs:build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

**Required `base` config** — Because the site deploys to `https://levarez.github.io/vit-cc/`, set:

```typescript
// docs/.vitepress/config.mts
export default defineConfig({
  base: '/vit-cc/',
  // ...
})
```

**Trigger condition** — The workflow is scoped to `paths: ['docs/**']` to avoid rebuilding docs on every code commit. This is important: the existing CI workflow (`phase-ci.yml`) should not trigger doc deployments.

**Alternative: Vercel** — Faster previews per-PR, no `base` config needed. Trade-off is needing a Vercel account and project setup. Prefer GitHub Pages to keep the stack self-contained. Re-evaluate if per-PR preview deployments become valuable.

**Alternative: Netlify** — Similar to Vercel. Avoid the HTML auto-minification option (known to cause Vue hydration errors). No strong reason to choose it over GitHub Pages.

---

## npm Scripts to Add

Add these to the root `package.json`:

```json
"scripts": {
  "docs:dev": "vitepress dev docs",
  "docs:build": "vitepress build docs",
  "docs:preview": "vitepress preview docs"
}
```

---

## What NOT to Add

| What | Why Not |
|------|---------|
| `vue` as explicit dep | VitePress bundles it; adding separately can cause version conflicts |
| `vite` as explicit dep | Same reason — bundled by VitePress |
| `@shikijs/transformers` | Not needed unless adding line-diff or focus-line features; defer until content phase if ever |
| Algolia DocSearch | Requires external account and crawler; overkill for a single framework's docs |
| `vitepress-plugin-pagefind` | Third-party, adds a dep for no gain over built-in MiniSearch |
| `typedoc` or `jsdoc` | The CLI has no TypeScript types to extract; docs are guide-form, not API reference |
| A separate docs `package.json` | Adds complexity with no benefit; docs should share the root package |

---

## Final Dependency Summary

**One new devDependency:**

```bash
npm add -D vitepress@next
```

**Zero new runtime dependencies.**

**One new GitHub Actions workflow file** for deployment.

**Two changes to existing files:**
1. `package.json` — update `engines.node` to `>=20`, add `docs:*` scripts
2. `.github/workflows/` — add `deploy-docs.yml`

---

## Sources

- VitePress Getting Started (official): https://vitepress.dev/guide/getting-started — HIGH confidence
- VitePress Deploy Guide (official): https://vitepress.dev/guide/deploy — HIGH confidence
- VitePress Search Reference (official): https://vitepress.dev/reference/default-theme-search — HIGH confidence
- VitePress releases: https://github.com/vuejs/vitepress/releases — HIGH confidence
- Maintainer recommendation on v2 alpha: https://github.com/vuejs/vitepress/issues/4945 — MEDIUM confidence
- npm package page: https://www.npmjs.com/package/vitepress — MEDIUM confidence (403 on direct fetch)
