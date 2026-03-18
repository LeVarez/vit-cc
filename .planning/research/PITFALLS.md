# Domain Pitfalls: VitePress Documentation Site for vit-cc

**Domain:** Documentation site for a CLI framework (developer tool)
**Researched:** 2026-03-18
**Confidence:** HIGH for VitePress-specific issues (verified via official docs and GitHub Issues); MEDIUM for documentation strategy pitfalls (multiple credible sources, community-verified)

---

## Critical Pitfalls

Mistakes that cause broken builds, user abandonment, or rewrites.

---

### Pitfall 1: Documentation Drift — Docs Fall Out of Sync with Commands

**What goes wrong:** Command names, flags, agent roles, or workflow steps in the docs describe behavior from a previous version. Users run a command and get a different result than what the docs show. Trust collapses quickly in developer tooling documentation.

**Why it happens:** The docs are written once during the milestone that creates them, then the code evolves without a process requiring corresponding doc updates. vit-cc already has a `vit-doc-updater` agent — but if it's scoped only to README/CHANGELOG updates and not triggered for the docs site, the entire docs site remains un-maintained as code changes.

**Consequences:**
- Users open issues or abandon the tool when commands behave differently than documented
- The 29 commands and 16 agents represent a large surface area — any API change creates multiple stale pages simultaneously
- Command reference pages become actively misleading rather than simply incomplete

**Prevention:**
- Co-locate documentation source files in the same repository as the code (already true — use `/docs/` in the vit-cc repo, not a separate repo)
- Treat each command reference page as owned by the phase that implements the command — any change to a command requires a corresponding docs PR reviewed as part of the same merge
- Add a CI check: when a command's Markdown agent file under `files/` is modified, flag the corresponding reference page for review
- Document the docs update responsibility explicitly in the Contributing guide

**Detection (warning signs):**
- Code changes merged without a corresponding docs update in the same PR
- The `/vit:execute-phase` description in docs does not match current behavior described in ARCHITECTURE.md
- Users ask "how do I do X" in GitHub Issues and the answer is already in the docs but the docs are wrong

**Which phase:** Phase 1 (site setup). Establish co-location and update process before writing content, so the practice is built in from the start.

---

### Pitfall 2: VitePress Base Path Misconfiguration on Deployment

**What goes wrong:** The docs build and preview correctly locally, but after deploying to GitHub Pages (or any subdirectory host), all assets return 404, navigation breaks, and the site renders as a blank page.

**Why it happens:** VitePress defaults to assuming deployment at the root of a domain (`/`). If deployed to `https://user.github.io/vit-cc/`, the `base` option must be set to `/vit-cc/` — with both leading and trailing slashes. This is not inferred from the repository name.

**Consequences:**
- Entire site is broken in production while working perfectly in dev (`vitepress dev` always uses `/` locally)
- CSS, JS bundles, and images all fail to load — the site looks blank
- Every internal link breaks simultaneously
- Debugging is non-obvious because dev works perfectly

**Prevention:**
- Set `base` in `.vitepress/config.ts` before writing any content, even during the initial scaffold
- For GitHub Pages: `base: '/vit-cc/'`
- For custom domain at root: `base: '/'` — make this explicit, not implicit (the default)
- Test with `vitepress build && vitepress preview` before the first deployment; preview simulates the base path behavior

**Detection:**
- Browser console shows 404s for `/assets/*.js` and `/assets/*.css`
- Navigation links point to `/page` instead of `/vit-cc/page`

**Confidence:** HIGH — verified in VitePress official deploy docs and multiple GitHub Issues (#252, #319, #3057)

**Source:** https://vitepress.dev/guide/deploy

**Which phase:** Phase 1 (site setup). Get deployment working with a placeholder index page before writing any content.

---

### Pitfall 3: No Information Architecture Before Content Creation

**What goes wrong:** Pages are created ad-hoc as content is written. The sidebar grows organically. After 30+ pages exist, users cannot find anything, navigation is inconsistent, and restructuring requires updating dozens of sidebar config entries and fixing broken cross-links throughout the content.

**Why it happens:** vit-cc has dense, interconnected concepts (phases, milestones, agents, state management, worktrees, GitHub sync). Without deliberate information architecture, writers default to mirroring internal code structure rather than user mental models. The people most motivated to write docs are the people who know the internals — so internals get documented first and get the most depth.

**Consequences:**
- Newcomers land on a page that assumes knowledge from another page they have not read
- Reference docs, tutorials, and conceptual explanations are mixed together on the same pages
- Search results are confusing because multiple pages cover overlapping ground
- Restructuring post-hoc requires rewriting the entire `config.ts` sidebar configuration and fixing cross-links throughout all pages

**Prevention:**
- Adopt the Diátaxis framework before writing any content: separate tutorials (learning-oriented), how-to guides (task-oriented), explanations/concepts (understanding-oriented), and reference (information-oriented) into distinct sections with distinct sidebar groups
- Map the full sidebar structure in a design document and commit it before creating any `.md` files — the sidebar outline is the information architecture
- Enforce the decision rule: each page answers one question (teach, guide, or list facts) — not all three

**Detection:**
- A page titled "Commands" contains both "what the command does" and a tutorial for trying it
- A newcomer must read 5 pages in a non-obvious order to understand how to run their first workflow
- The sidebar has more than 7 top-level sections

**Which phase:** Phase 1 (site setup). The information architecture is a deliverable of Phase 1, not Phase 2+.

---

### Pitfall 4: Overwhelming Newcomers with Internals Before the First Command

**What goes wrong:** The most prominent entry point in the docs is the concepts or internals section. Newcomers who install vit-cc and want to run their first command hit a wall of concepts — phases, milestones, agents, state management, worktrees — before seeing a single working example.

**Why it happens:** The people most motivated to write the docs are the people who built the internals, so they write what they know. The internals section receives the most attention. The quickstart path gets written last.

**Consequences:**
- Developers leave the docs before reaching a working example
- GitHub issues fill up with "how do I get started?" questions that are already answered in the docs — but buried
- The 29 commands become intimidating rather than useful when presented before context

**Prevention:**
- Treat the front page and Getting Started section as the primary user path — write them first, not last
- Progressive disclosure: the getting-started guide introduces only the 3-5 commands needed to run a minimal workflow; all 29 commands are in the reference section, linked but not embedded
- Explicitly label the Internals section as "for contributors and power users" and place it last in the sidebar
- Test the new-user path: a developer unfamiliar with vit-cc should be able to install it and run their first command in under 10 minutes using only the docs

**Detection:**
- The quickstart guide mentions "agents," "state management," and "worktrees" before showing a single command invocation
- The sidebar places "Internals" or "Architecture" above "Getting Started"
- No working command example appears in the first 500 words of the front page

**Which phase:** Phase 2 (getting started guide). This is the highest-priority content section — it is not an afterthought written after the reference section is complete.

---

## Moderate Pitfalls

Mistakes that create technical debt or degrade docs quality over time.

---

### Pitfall 5: Manual Sidebar Maintenance Becomes a Bottleneck

**What goes wrong:** Every new `.md` file requires a manual update to the `sidebar` array in `.vitepress/config.ts`. After 40+ pages, this is error-prone — pages exist on disk but are not linked in the sidebar (invisible to users), or sidebar entries point to files that have been renamed (silent 404s).

**Why it happens:** VitePress does not auto-generate sidebars from the file system. The sidebar is entirely manual configuration by design.

**Consequences:**
- New reference pages are invisible — they exist but no navigation path reaches them
- Renamed files create sidebar entries that look valid but 404
- Build failures if `ignoreDeadLinks` is not set — but silent success if it is (masking the problem)

**Prevention:**
- Use the community `vitepress-sidebar` plugin (npm: `vitepress-sidebar`) to auto-generate sidebar entries from directory structure — removes the manual sync requirement entirely
- OR adopt a strict naming convention and validate sidebar entries in CI: a simple script that checks each sidebar link resolves to an existing file catches regressions before they ship
- Keep sidebar config in a separate file (`sidebar.ts`) so it is easy to audit independently

**Confidence:** MEDIUM for the plugin (community-maintained); HIGH for the manual sidebar requirement (official docs)

**Source:** https://github.com/jooy2/vitepress-sidebar

**Which phase:** Phase 1 (site setup). Choose the sidebar strategy before content creation begins.

---

### Pitfall 6: Local Search Not Indexing Frontmatter Titles

**What goes wrong:** Pages use `title` in frontmatter and reference it in headings via `{{ $frontmatter.title }}`. The built-in local search index stores the literal template string rather than the resolved title. Search results show `{{ $frontmatter.title }}` as garbled text.

**Why it happens:** VitePress's local search (MiniSearch) renders markdown before indexing, but frontmatter template expressions in headings are not resolved during the search render pass.

**Consequences:**
- Search results for command or agent names return pages with broken, unreadable titles
- Users who rely on search (the primary navigation strategy for large docs) get confused output
- This is not visible during development — it only manifests in the built search index

**Prevention:**
- Configure a custom `_render` function in the local search options:
  ```ts
  search: {
    provider: 'local',
    options: {
      async _render(src, env, md) {
        const html = await md.renderAsync(src, env)
        if (env.frontmatter?.title)
          return (await md.renderAsync(`# ${env.frontmatter.title}`)) + html
        return html
      }
    }
  }
  ```
- Alternatively: use explicit H1 headings in each page rather than frontmatter-based headings — simpler, avoids the issue entirely, and is easier to read in raw Markdown
- Test search immediately after enabling it, using pages with frontmatter titles

**Confidence:** HIGH — confirmed in VitePress GitHub Issues (#3083) and multiple community bug reports

**Source:** https://vitepress.dev/reference/default-theme-search, https://dev.to/ahandsel/vitepress-debug-frontmattertitle-is-appearing-in-search-results-k60

**Which phase:** Phase 1 (site setup) — configure before content is written so the search works correctly from the first published page.

---

### Pitfall 7: HTML Auto-Minification Causing Vue Hydration Errors

**What goes wrong:** The CI/CD build pipeline or the hosting platform enables HTML minification. Vue hydration errors appear in the browser console. The site may render incorrectly or show flashes of unstyled content in production.

**Why it happens:** VitePress uses Vue for its runtime. Vue requires specific HTML comments as hydration markers. Aggressive HTML minifiers strip all comments, breaking the hydration contract.

**Consequences:**
- Pages render incorrectly in production but correctly in dev
- Dark mode, sidebar state, or other reactive features malfunction
- The failure mode is subtle — the page loads, but UI state is wrong

**Prevention:**
- Do not enable HTML minification anywhere in the build or deployment pipeline for a VitePress site
- For Netlify, Vercel, or Cloudflare Pages: verify platform build settings do not add post-processing minification steps
- VitePress handles its own asset optimization — additional optimization layers break it

**Confidence:** HIGH — explicitly called out as a warning in official VitePress deploy docs

**Source:** https://vitepress.dev/guide/deploy

**Which phase:** Phase 1 (deployment setup). Verify before the first production deployment.

---

### Pitfall 8: Mixing Reference and Tutorial Content on the Same Page

**What goes wrong:** The `/vit:execute-phase` command reference page explains what the command does, then includes a tutorial example, then explains the internal execution model. Users looking up a flag have to scan through narrative prose. Users trying to learn the workflow find dense flag tables before any guidance.

**Why it happens:** It feels natural to put "everything about command X" on the command X page. The separation between reference and tutorials feels like extra work with no visible payoff.

**Consequences:**
- Reference pages are unusable for quick lookup
- Tutorial pages are incomplete because flag details are scattered across reference pages
- Content duplication: the same flag is partially described in both reference and tutorial contexts, and the two descriptions drift apart over time

**Prevention:**
- Reference pages: only what the command does, its flags, its inputs, and its outputs — no narrative, no tutorials
- Tutorial pages: only the walkthrough — links to reference for flag details, no embedded flag tables
- How-to guides: task-focused ("how to debug a failing phase") — links to reference, does not repeat it

**Which phase:** Phase 1 (information architecture). Enforce this separation in the sidebar structure design document — the section organization makes mixing impossible if the structure is clear.

---

### Pitfall 9: Links Using `.html` Extensions Breaking with cleanUrls

**What goes wrong:** Markdown files reference other pages as `[link](./other-page.html)`. If `cleanUrls: true` is enabled, these internal links produce incorrect URLs. If `cleanUrls` is toggled later (which happens as deployment targets change), all internal links break simultaneously.

**Why it happens:** VitePress supports both `.html` and no-extension links in Markdown, so both work at first. The issue appears only when `cleanUrls` mode changes.

**Prevention:**
- Adopt extension-less link format from day one: `[link](./other-page)` not `[link](./other-page.html)`
- The VitePress routing guide explicitly recommends omitting extensions for maximum compatibility with any `cleanUrls` setting
- Add this convention to the contributing guide or a content authoring checklist

**Confidence:** HIGH — from VitePress routing docs

**Source:** https://vitepress.dev/guide/routing

**Which phase:** Phase 1. Document as a content authoring convention in the initial contributing guide.

---

### Pitfall 10: Sidebar Link Missing Leading Slash Breaks Prev/Next Navigation

**What goes wrong:** Sidebar entries are configured without a leading slash: `{ text: 'Commands', link: 'guide/commands' }`. The sidebar renders correctly, but the "Previous page" and "Next page" navigation links at the bottom of each page are missing or point to the wrong pages.

**Why it happens:** VitePress uses sidebar link paths to generate prev/next navigation. Links without leading slashes are treated differently from links with leading slashes during this generation step. The sidebar renders correctly regardless — only prev/next is affected, so the bug is invisible until users try to navigate sequentially.

**Prevention:**
- All sidebar `link` values must begin with `/`: `link: '/guide/commands'`
- Enforce this in the initial `config.ts` template so every example shows the correct format

**Confidence:** HIGH — VitePress GitHub Issues (#3243)

**Which phase:** Phase 1 (site setup). Establish in the initial config template.

---

### Pitfall 11: `cleanUrls` Enabled Without Host Configuration

**What goes wrong:** `cleanUrls: true` creates links like `/guide/commands` instead of `/guide/commands.html`. This works locally but breaks on static hosts that return 404 for `/guide/commands` because they serve files, not routes.

**Why it happens:** VitePress performs a client-side redirect from `.html` paths to clean paths on first load — but if the server returns a 404 for the clean path, there is nothing to redirect from. GitHub Pages does not support this by default.

**Consequences:**
- Direct URL access to any page (shared links, bookmarks, search engine results) returns a 404
- Only navigating from the home page through the sidebar works correctly

**Prevention:**
- For GitHub Pages: avoid `cleanUrls: true` unless a 404 fallback is configured, or use a platform that supports it natively (Netlify, Vercel, Cloudflare Pages)
- Decide and document the deployment target before enabling this option

**Confidence:** HIGH — explicitly documented in VitePress site-config reference

**Which phase:** Phase 1 (deployment configuration).

---

## Minor Pitfalls

Mistakes that create annoyance but are fixable without a rewrite.

---

### Pitfall 12: `ignoreDeadLinks: true` Masking Broken Internal Links in CI

**What goes wrong:** Setting `ignoreDeadLinks: true` to unblock initial scaffolding is left in place permanently. VitePress dead-link detection never catches renamed pages, deleted content, or typos in internal links. Broken links accumulate silently.

**Prevention:**
- Use `ignoreDeadLinks: true` only temporarily during initial scaffolding — remove it before the first published version
- Use pattern-based ignoring for specific legitimate cases: `ignoreDeadLinks: ['localhostLinks']` or specific URL patterns
- Let VitePress dead-link detection run on every CI build — it is a free correctness check with no cost

**Confidence:** HIGH — VitePress site config docs; GitHub Issues (#1084, #941) confirm the setting does not always work as expected when set globally

**Which phase:** Phase 1 (CI setup). Remove the flag before the first content PR is merged.

---

### Pitfall 13: Missing `srcDir` When Docs Live in a Subdirectory

**What goes wrong:** Docs placed in a `docs/` subdirectory require running VitePress from inside that directory. Without `srcDir: './docs'` in config, the build command must always be run from `docs/` rather than the project root, confusing contributors.

**Prevention:** Set `srcDir` explicitly in `.vitepress/config.ts` when docs are not at the project root. All VitePress commands (`dev`, `build`, `preview`) can then run from the project root, matching the convention of every other `npm run` script.

**Confidence:** HIGH — VitePress site config docs

**Which phase:** Phase 1 (site setup).

---

### Pitfall 14: Agent Reference Pages Not Covering Spawn Triggers

**What goes wrong:** Agent reference pages document what an agent does but not when it is spawned, what input it expects, and what output it produces. Users who want to understand the workflow cannot determine which agents run automatically versus manually, or what triggers each agent.

**Why it happens:** The agent system prompt (in `files/agents/`) contains the behavior — writers document the behavior but forget the integration contract.

**Consequences:**
- Users cannot understand the workflow loop from the docs alone
- The custom agents guide has no concrete examples of spawn patterns to reference

**Prevention:**
- Each agent reference page includes: role, spawn trigger (which command or event), inputs (what it reads), outputs (what it writes or posts), and a minimal example of its output
- This information exists in the command implementations and STATE.md — extract it during the docs authoring phase

**Which phase:** Phase 4 (agent reference). Include spawn trigger as a required field in the agent reference page template.

---

### Pitfall 15: Tutorial Steps Becoming Outdated After Workflow Changes

**What goes wrong:** Tutorial steps reference specific command behavior that changes in a subsequent milestone. The tutorial silently becomes wrong — users follow the steps and get a different result.

**Why it happens:** Tutorials are narratives — they are harder to update incrementally than reference pages because they have sequencing dependencies. A change to step 3 may require rewriting steps 4-7 for consistency.

**Prevention:**
- Annotate tutorial steps with the command they invoke: "(this calls `/vit:execute-phase` internally)" — makes it easier to audit which tutorials are affected by a given command change
- When a command reference page is updated, flag all tutorials that use that command for review
- Consider dating tutorials or linking them to the milestone version they were written for

**Which phase:** Phase 5 (tutorials). Design tutorials with the maintenance burden in mind, not just the teaching objective.

---

## Phase-Specific Warnings for vit-cc Docs Milestone

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Site setup and deployment | Base path misconfiguration for GitHub Pages | Set `base: '/vit-cc/'` before first content push; test with `vitepress preview` |
| Information architecture | Ad-hoc sidebar growth, mixed content types | Design and commit full sidebar structure before writing any page |
| Getting started guide | Assuming too much prior knowledge; burying first command too deep | Test with someone unfamiliar with vit-cc; working command must appear in first 2 scrolls |
| Command reference (29 commands) | Manual sidebar maintenance diverges from file system | Decide auto-sidebar vs manual strategy in Phase 1 |
| Agent reference (16 agents) | Mixing role description with spawn trigger with how-to-create patterns | Agents reference = factual (role, trigger, I/O); custom agents guide = separate how-to |
| Custom agents guide | Describing implementation details that change rather than the agent contract | Document the Markdown prompt structure and spawn mechanism; not the internal execution engine |
| Internals section | Becoming the dominant section at the expense of the getting-started path | Write internals last; mark explicitly as "for contributors and power users" |
| Search configuration | Frontmatter titles appearing as template expressions in search results | Configure custom `_render` before first content is published; test with every major page type |
| Docs sync over time | Command behavior changes without docs following | Establish: every command file change requires a corresponding docs PR in the same merge |
| Tutorials | Tutorial steps becoming stale after workflow changes | Annotate steps with the commands they invoke; audit tutorials whenever a command reference changes |
| CI pipeline | HTML minification breaking Vue hydration | Verify no minification step exists in CI or hosting platform settings before first deployment |

---

## Sources

- https://vitepress.dev/guide/deploy — base path requirements and HTML minification warning (HIGH)
- https://vitepress.dev/reference/site-config — cleanUrls, ignoreDeadLinks, base, srcDir configuration (HIGH)
- https://vitepress.dev/guide/routing — file-based routing, link extension conventions, leading slash requirement (HIGH)
- https://vitepress.dev/reference/default-theme-search — local search configuration and _render hook (HIGH)
- https://github.com/vuejs/vitepress/issues/3243 — sidebar leading slash required for prev/next generation (HIGH)
- https://github.com/vuejs/vitepress/issues/319 — base path required even in dev behind proxy (MEDIUM)
- https://github.com/vuejs/vitepress/issues/1084 — ignoreDeadLinks not working reliably (HIGH)
- https://github.com/vuejs/vitepress/issues/3083 — frontmatter fields not indexed by MiniSearch (HIGH)
- https://dev.to/ahandsel/vitepress-debug-frontmattertitle-is-appearing-in-search-results-k60 — frontmatter title in search bug and fix (HIGH)
- https://gaudion.dev/blog/documentation-drift — documentation drift definition and prevention (MEDIUM)
- https://www.nngroup.com/articles/top-10-ia-mistakes/ — information architecture top mistakes (MEDIUM)
- https://idratherbewriting.com/files/doc-navigation-wtd/design-principles-for-doc-navigation/ — navigation best practices for docs (MEDIUM)
- https://github.com/jooy2/vitepress-sidebar — auto-sidebar plugin for VitePress (MEDIUM)
- https://idratherbewriting.com/ucd-progressive-disclosure/ — progressive disclosure in technical documentation (MEDIUM)
- https://thisisimportant.net/posts/docs-as-code-broken-promise/ — docs-as-code ownership and maintenance challenges (MEDIUM)

---

*Pitfalls research for: vit-cc documentation site milestone (v1.0.1)*
*Researched: 2026-03-18*
