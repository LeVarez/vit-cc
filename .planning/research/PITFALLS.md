# Pitfalls Research

**Domain:** VitePress documentation site for CLI/agentic developer framework
**Researched:** 2026-03-18
**Confidence:** HIGH for VitePress-specific issues (verified via official docs and GitHub issues); HIGH for content organization patterns (multiple converging sources); MEDIUM for Mermaid compatibility (actively shifting ecosystem)

---

## Critical Pitfalls

### Pitfall 1: Mermaid Plugin Version Lock-in Breaks Diagrams

**What goes wrong:**
`vitepress-plugin-mermaid` has an unstable dependency relationship with the `mermaid` package itself. Mermaid 11.x broke gitgraph diagrams that worked on 10.x. Version upgrades — even patch-level — can silently break rendered diagrams while still building successfully. The diagram block in Markdown renders blank or shows a raw text block instead.

**Why it happens:**
The plugin wraps Mermaid in a Vue component and re-renders on navigation. When the underlying Mermaid version changes rendering behavior, the plugin's Vue wrapper doesn't catch the failure — it just produces an empty SVG. The plugin is community-maintained with irregular release cadence, creating a mismatch with Mermaid's faster release cycle.

**How to avoid:**
Pin exact versions in `package.json` for both `mermaid` and `vitepress-plugin-mermaid`. Test all diagram types (flowchart, sequenceDiagram, graph, any gitgraph if used) in CI after any dependency update. Do NOT use `^` (caret) ranges for either package. In CI, add a smoke test that verifies the built HTML contains `<svg` elements inside `.mermaid` containers.

**Warning signs:**
- Diagram blocks show raw Mermaid text in development mode
- SVG container present in DOM but empty
- Console errors referencing `mermaid.initialize is not a function` or version-related init failures
- Gitgraph specifically rendering as blank

**Phase to address:** Phase 1 (VitePress foundation setup)

---

### Pitfall 2: GitHub Pages Deployment Fails Silently on Wrong `base` Config

**What goes wrong:**
VitePress deployed to `https://user.github.io/vit-cc/` requires `base: '/vit-cc/'` in `.vitepress/config.ts`. Without it, the site deploys but all CSS, JS, and internal navigation links are broken — they resolve to the root domain instead of the repo sub-path. The build itself succeeds with no errors; the failure only appears in the deployed browser.

**Why it happens:**
VitePress uses the `base` config to prefix all asset URLs in generated HTML. The dev server always runs at `/`, masking the misconfiguration during development. The error only manifests in production on a sub-path host like GitHub Pages.

**How to avoid:**
Set `base` in config before the first deployment. Use the pattern `base: process.env.VITEPRESS_BASE ?? '/'` so local development stays unaffected. Verify with `vitepress build && vitepress preview` locally (preview also respects `base`) before pushing to CI.

Never enable Netlify/GitHub Pages "Auto Minify" on the deployed directory — it strips HTML comments that Vue's hydration runtime uses as component markers, causing hydration mismatch errors in browser console even when the page appears to render.

**Warning signs:**
- Deployed site shows raw HTML with no CSS applied
- Navigation links redirect to the wrong domain
- Browser console shows "Failed to load resource" on `.js` or `.css` files
- Vue hydration errors in console after minification

**Phase to address:** Phase 1 (VitePress foundation setup)

---

### Pitfall 3: SSR Build Breaks on Browser-Only Custom Components

**What goes wrong:**
VitePress pre-renders all pages in Node.js during `vitepress build`. Any Vue component or markdown extension that accesses browser APIs (`window`, `document`, `localStorage`) at import time throws during the build, not during dev. This is especially relevant if ASCII art components, interactive terminal demos, or animated diagrams are added as custom Vue components.

**Why it happens:**
The VitePress dev server runs in a browser environment. `window` and `document` are always available. Developers test interactivity in dev, everything works, they push, and the CI build fails with cryptic SSR errors like `ReferenceError: window is not defined`.

**How to avoid:**
Wrap any component that uses browser APIs in `<ClientOnly>`. For components that need browser APIs on import (not just in lifecycle hooks), use `defineClientComponent()` or dynamic `import()` inside `onMounted`. Test SSR locally by running `vitepress build` before pushing — don't rely only on dev server.

If adding interactive ASCII art animations or terminal emulators, wrap them in `<ClientOnly>` unconditionally.

**Warning signs:**
- Build succeeds locally via `vitepress dev` but fails in CI
- Error messages like `ReferenceError: window is not defined` or `document is not defined` in build output
- Component only tested in browser, not via `vitepress build`

**Phase to address:** Phase 1 (VitePress foundation setup); Phase 3 (custom components/branding)

---

### Pitfall 4: Dead Links Silently Break the Build

**What goes wrong:**
VitePress checks internal links during build by default. Any Markdown file that references a heading anchor or internal page that doesn't exist (due to rename, reorganization, or typo) causes the entire build to fail with `dead link found`. This is especially likely during content reorganization: rename a page and every file that linked to it breaks.

**Why it happens:**
Documentation for 20+ commands and 15+ agents will have many cross-references. As pages get reorganized across phases, the links left behind aren't obvious — the dev server may not show them as broken, but `vitepress build` will fail.

**How to avoid:**
Do not set `ignoreDeadLinks: true` globally — that defeats link checking entirely. Instead, run `vitepress build` in CI on every PR. When renaming pages, use your editor's "find in files" to locate all references before renaming. Keep a naming convention stable from Phase 1 (e.g., all command pages at `/commands/[command-name]`) to minimize renames.

If temporary placeholders are needed during initial scaffolding, use `ignoreDeadLinks: ['./placeholder']` with an explicit allowlist rather than disabling checking globally.

**Warning signs:**
- Build output shows `[vitepress] X dead link(s) found`
- Pages added during one phase link to pages planned for a future phase
- Section headers renamed without updating anchor references (`#old-name` links)

**Phase to address:** Phase 1 (establish stable URL structure); all phases (enforce in CI)

---

### Pitfall 5: Content Written for One Audience Alienates the Others

**What goes wrong:**
vit-cc serves three distinct audiences: newcomers (need conceptual explanation, "what is this?"), existing users (need command reference, "how do I do X?"), and contributors (need agent internals, "how does this work and how do I extend it?"). Writing that assumes the reader is a developer already using VIT confuses newcomers. Writing that over-explains fundamentals buries the command reference for power users. Contributor docs mixed into user guides create noise for both.

**Why it happens:**
Documentation is often written by the person who built the system, who has one mental model of "how users think about this." The builder knows the internals and tends to over-reference them even in user-facing guides.

**How to avoid:**
Structure navigation into explicit audience tracks from Phase 1:
- Getting Started (newcomers only — no internals)
- Command Reference (users — what to type and what happens)
- Agent Guides (advanced users / contributors — how agents work, how to create them)
- Architecture / Internals (contributors — state machine, file structure)

Never mix "here's how to use this" with "here's how this is implemented" in the same page. Use a callout (`:::tip For contributors`) to gate internal detail when a brief note is appropriate.

**Warning signs:**
- Command reference page contains explanation of agent source code structure
- Getting started guide references STATE.md file paths
- Agent creation guide assumes reader hasn't used VIT yet

**Phase to address:** Phase 1 (navigation structure definition); Phase 2 (command reference writing)

---

### Pitfall 6: Command Reference Becomes Stale As the Framework Evolves

**What goes wrong:**
Documentation written once becomes incorrect as commands are updated. vit-cc has 20+ commands and is actively developed. A command reference page that describes behavior from 6 months ago misleads users and generates support overhead. This is the "documentation drift" pattern: the code changes, the docs don't, users find the mismatch only when something fails.

**Why it happens:**
Documentation and code live in separate mental namespaces. When a command flag is added or behavior changes, the developer updates the source file and the CHANGELOG, but doesn't trace that change through to the VitePress documentation pages.

**How to avoid:**
Maintain the single-source-of-truth principle: the authoritative description of each command lives in the command's `.md` file under `files/commands/vit/`. The VitePress page for that command should either include that file via VitePress's `<!--@include:-->` mechanism OR be generated/checked by the existing `vit-doc-updater` agent as part of the VIT workflow.

Document the update process in the Contributor Guide: "When modifying a command, update its corresponding docs page." Add a VitePress docs update step to the PR checklist.

**Warning signs:**
- Command reference page has a "Last updated" date older than the corresponding `.md` file's git modification date
- Users report that documented flags don't work
- CHANGELOG contains entries not reflected in docs

**Phase to address:** Phase 2 (establish docs-as-code pattern for commands); all subsequent phases

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Manual sidebar in `config.ts` | Simple for small sites | Every new command/agent page requires manual sidebar update; easy to forget, creating orphan pages | Only during initial scaffolding (Phase 1); replace with automation or clear convention by Phase 2 |
| `ignoreDeadLinks: true` | Silences build errors | Dead links accumulate silently; users hit 404s; no CI safety net | Never — use explicit allowlist `ignoreDeadLinks: ['./specific-link']` instead |
| Write docs from memory (not from source) | Faster than reading source | Inaccuracies from day one; drift inevitable | Never — always verify against command/agent `.md` source files |
| Single flat nav (no audience separation) | Simpler config | Newcomers overwhelmed by internals; power users wade through basics | Never for a tool serving three distinct audiences |
| Copy/paste command descriptions instead of `<!--@include:-->` | No include syntax to learn | Two sources of truth diverge immediately; one will go stale | Only if include would pull in internal implementation details not appropriate for docs |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `vitepress-plugin-mermaid` | Allowing `^` range on `mermaid` version | Pin exact `mermaid` version; test all diagram types after any dep update |
| GitHub Pages | Omitting `base` config for sub-path deployment | Set `base: '/vit-cc/'` before first deploy; test with `vitepress preview` locally |
| GitHub Pages CI | Enabling "Auto Minify" in repo settings | Leave minification off — strips Vue hydration comments, causes runtime errors |
| `<!--@include:-->` file includes | Including a file that was renamed or deleted | VitePress will NOT throw an error; include fails silently — check all includes in CI |
| Local search | Expecting full-text search to index frontmatter fields | MiniSearch does not index frontmatter by default; configure `_render` if frontmatter content must be searchable |
| VitePress build | Testing only with `vitepress dev` | `dev` doesn't catch SSR errors or dead links; always run `vitepress build` in CI |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Local search on 50+ pages | Dev server indexing noticeably slow; build takes 4+ hours at large scale | Local search is fine for this project size (20+ commands, 15+ agents ≈ 50–80 pages); only a concern if content scales past ~500 pages | Not a concern for v1.1; revisit if content doubles |
| All Mermaid diagrams loaded at page load | Mermaid JS bundle (~2MB) loaded on every page even without diagrams | Mermaid is loaded lazily by `vitepress-plugin-mermaid` only on pages with diagrams — this is the default behavior | Only matters if the plugin is misconfigured to eager-load globally |
| Unoptimized images in docs | Slow page loads, poor Core Web Vitals | Use SVG where possible (diagrams are already SVG); reference images via VitePress's asset pipeline so they get hashed and cached | Not critical for a developer docs site, but worth noting |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Command reference organized alphabetically | Users can't discover related commands; `add-phase` and `insert-phase` appear far apart | Group commands by workflow stage (initialization → planning → execution → review → completion) matching how users think about the tool |
| Agent reference with no "when would I use this?" context | Contributors don't know which agent to extend or spawn | Each agent page needs: what problem it solves, which command spawns it, what it reads/writes |
| Getting started guide that shows full command syntax on page 1 | Newcomers bounce; too much to absorb | Start with mental model ("VIT manages a planning folder"), then show one end-to-end example with 3 commands, then link to full reference |
| No "what just happened" explanation after command examples | Users run the command but don't understand the state change | Every command example should include "After running this, check: [STATE.md location] or [GitHub effect]" |
| ASCII art only in terminal screenshots | Branding not visible in docs | Render ASCII art as preformatted text (`<pre>`) in docs, not just as images — VitePress renders `pre` blocks well and they stay crisp at all zoom levels |

---

## "Looks Done But Isn't" Checklist

- [ ] **Mermaid diagrams:** Visible in dev — verify with `vitepress build` that SVG renders in built output, not just in dev server
- [ ] **Navigation:** All pages reachable from sidebar — run `vitepress build` and check for dead link warnings
- [ ] **Getting started:** Tells newcomer what to run — verify someone unfamiliar with VIT can complete the guide without needing to read source code
- [ ] **Command reference:** Every command has a page — count pages against `files/commands/vit/` directory (27 commands as of v1.1)
- [ ] **Agent reference:** Every agent has a page — count pages against `files/agents/` directory (16 agents as of v1.1)
- [ ] **Contributor guide:** Agent creation walkthrough results in a working agent — test by following it from scratch
- [ ] **GitHub Pages:** Deployed site loads CSS/JS — verify on actual GitHub Pages URL, not localhost
- [ ] **Search:** Command names return correct pages — test searching "execute-phase", "plan-phase", "complete-milestone"
- [ ] **ASCII art:** Renders correctly in docs — verify `<pre>` blocks don't collapse whitespace or line-wrap
- [ ] **`<!--@include:-->` includes:** All included files exist — run `vitepress build` and confirm no silent include failures

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Mermaid version broke diagrams | LOW | Pin to last known working version in `package.json`; run `npm install --save-exact` for both `mermaid` and `vitepress-plugin-mermaid`; rebuild |
| Wrong `base` config deployed to GitHub Pages | LOW | Fix `base` in config; push to trigger redeploy; takes ~2 minutes |
| Dead links accumulated across phases | MEDIUM | Run `vitepress build` to get full dead link report; fix all broken links; establish URL stability convention going forward |
| Content written for wrong audience (too internal) | MEDIUM | Identify pages mixing user/contributor content; split into separate pages; update nav |
| Docs stale after major command changes | HIGH | Audit every command page against its source `.md` file; re-derive descriptions; establish `<!--@include:-->` or `vit-doc-updater` hook going forward |
| SSR build failures from custom components | LOW | Wrap offending component in `<ClientOnly>`; rebuild |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Mermaid version compatibility | Phase 1 (pin versions in initial package.json setup) | `vitepress build` produces SVG output for all diagram types |
| GitHub Pages base config | Phase 1 (set base before first deployment commit) | Deploy to GitHub Pages and verify CSS loads |
| SSR build failures | Phase 1 (establish `vitepress build` in CI, not just `dev`) | CI build passes with 0 errors |
| Dead links | Phase 1 (stable URL structure) + CI enforcement from Phase 1 | `vitepress build` exits 0 on all PRs |
| Audience mismatch in content | Phase 1 (navigation structure) + Phase 2 (command reference writing standards) | Each page clearly targets one audience (check: does the page mention implementation internals in user guide?) |
| Documentation drift | Phase 2 (docs-as-code pattern established) | Command reference page description matches current command `.md` source file |
| Auto Minify HTML comment stripping | Phase 1 (GitHub Actions config) | No Vue hydration errors in deployed site console |
| Silent `<!--@include:-->` failures | All phases | `vitepress build` runs in CI on every PR |

---

## Sources

- https://vitepress.dev/guide/ssr-compat — Official SSR compatibility guide; `<ClientOnly>` and `defineClientComponent()` patterns
- https://vitepress.dev/guide/deploy — GitHub Pages deployment steps; Auto Minify warning
- https://vitepress.dev/guide/markdown — `<!--@include:-->` silent failure behavior; frontmatter placement requirements
- https://vitepress.dev/reference/default-theme-search — MiniSearch configuration and frontmatter indexing behavior
- https://emersonbottero.github.io/vitepress-plugin-mermaid/guide/getting-started.html — Mermaid plugin setup
- https://github.com/emersonbottero/vitepress-plugin-mermaid/issues/80 — Gitgraph diagrams broken in Mermaid 11.1+
- https://github.com/vuejs/vitepress/issues/3377 — Local search indexing performance issues at scale
- https://github.com/vuejs/vitepress/issues/846 — Sidebar config build failure without `items` property
- https://github.com/vuejs/vitepress/issues/252 — Base path not generating correctly for nested pages
- https://document360.com/blog/developer-documentation-mistakes/ — Audience mismatch and consistency pitfalls
- https://gaudion.dev/blog/documentation-drift — Documentation drift root causes and prevention
- https://clig.dev/ — CLI documentation standards (command grouping by workflow vs. alphabetically)

---

*Pitfalls research for: VitePress documentation site — vit-cc CLI/agentic framework*
*Researched: 2026-03-18*
