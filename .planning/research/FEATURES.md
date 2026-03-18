# Feature Research

**Domain:** Documentation site for a CLI/agentic framework (vit-cc)
**Researched:** 2026-03-18
**Confidence:** HIGH (VitePress official docs), MEDIUM (documentation best practices from multiple sources), MEDIUM (anti-feature patterns from practitioner community)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that any credible developer tool documentation site must have. Missing these signals immaturity.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Getting started / quick-start guide | First thing every new user looks for; absence causes immediate abandonment | LOW | Should cover: install → first command → first project workflow in under 5 minutes of reading |
| Complete command reference | CLI users bookmark reference docs; 30 commands with no canonical reference means constant README hunting | MEDIUM | One page per command: purpose, syntax, arguments, options, example output, GitHub effects. 30 commands = real content work, not code work |
| Sidebar navigation with clear hierarchy | Users expect tree-nav with sections (Guide, Commands, Agents, Internals); absence breaks orientation | LOW | VitePress built-in. Requires careful IA design before implementation. Multi-level collapse needed |
| Built-in search | "Ctrl+K to search" is universal expectation for docs sites; users search by keyword, not browse | LOW | VitePress has local search built in. Algolia DocSearch as upgrade option. No code required — config only |
| Dark mode | Developer audiences default to dark mode; docs with only light mode feel unfinished | LOW | VitePress default theme built-in. No implementation cost beyond ensuring branding works in both modes |
| Code blocks with copy button | Every code example should have one-click copy; typing commands from docs is friction | LOW | VitePress built-in behavior. Zero implementation cost |
| Syntax highlighting in code blocks | Bash, YAML, JSON, Markdown code blocks need highlighting; unhighlighted blocks look unpolished | LOW | VitePress uses Shiki — built in, zero configuration beyond language selection |
| Mobile responsive layout | Docs are read on phones and tablets; broken mobile = poor impression even if most users are on desktop | LOW | VitePress default theme is responsive. No additional work |
| Clear installation instructions | New users need to know exactly how to install the tool; must cover npm/npx paths | LOW | Single page covering prerequisites, install commands, verification step |
| Stable URLs / anchor links | Users share links to specific sections; if anchors change, shared links break | LOW | VitePress generates header anchors by default. Requires discipline in heading naming |

### Differentiators (Competitive Advantage)

Features that elevate vit-cc docs above generic tool docs and reflect the framework's identity.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| ASCII art branding | vit-cc uses ASCII stage banners throughout the CLI; the docs should feel like part of the same product — not a generic Docusaurus clone | LOW | Custom CSS + static ASCII asset. One-time effort with high visual impact. Requires testing across dark/light and fonts |
| Mermaid architecture diagrams | The framework has layered orchestration (commands → workflows → agents → state); visualizing this is the single most effective way to explain it | MEDIUM | Requires `vitepress-plugin-mermaid` (not built-in). Dependency has known compatibility issues; use `vitepress-mermaid-renderer` as safer alternative. Diagrams needed: workflow flow, agent orchestration, state file relationships, PR lifecycle |
| Layered depth (Diataxis structure) | vit-cc serves three audiences: discoverers, users, contributors. One depth level fails all three. The Diataxis framework (Tutorials / How-To / Reference / Explanation) maps directly to this need | MEDIUM | Content architecture decision, not tech. Requires planning content across four quadrants before writing. Most documentation debt comes from skipping this |
| Agent deep-dive section | "How agents work internally" and "how to create a new agent" is the key differentiator vs just another CLI docs site; this is where contributors land | MEDIUM | Not just reference — needs conceptual explanation + annotated example agent file. Existing agent .md files are the source material |
| Contributor guide for new agents | Lowers the barrier for extending the framework; without it the agent system is opaque | MEDIUM | Cover: agent file structure, spawning patterns, tool strategy, how the orchestrator calls agents, how to register a new agent |
| GitHub effects documentation per command | vit-cc has deep GitHub integration; documenting exactly what each command does to GitHub (issues created, PRs opened, labels applied) is a unique value — most CLI docs ignore side effects | LOW | Content effort, not code. Adds a "GitHub effects" section to each command reference page |
| State system reference (.planning/ internals) | Advanced users debugging or extending vit-cc need to understand STATE.md, ROADMAP.md, config.json schema; no docs = black box | MEDIUM | Reference section: one page per state file. Machine-generated schema docs would be ideal but manual initially |
| "What to expect" workflow walkthroughs | Step-by-step narratives showing exactly what happens when you run `/vit:new-project` end-to-end; reduces the "did it work?" uncertainty | MEDIUM | Screenshot-equivalent for CLI: expected terminal output, state file changes, GitHub artifacts created. Complements the command reference |
| Social/version links in header | Points to GitHub repo, CHANGELOG, current version; signals the project is alive and maintained | LOW | VitePress `socialLinks` config + `editLink` to GitHub. Near-zero cost |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem natural for a docs site but add maintenance cost or distract from content quality.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Interactive playground / live CLI demo | "Let users try VIT in the browser!" — sounds impressive | vit-cc requires Claude Code + GitHub + local filesystem; there is no sandboxed version possible. This would be a fake demo or require major infrastructure | Provide copy-paste quickstart that runs in 2 minutes locally. Real experience beats fake demo |
| Versioned documentation (v1.0 / v1.1 branches) | "What if users are on old versions?" | vit-cc is early-stage; maintaining multiple doc versions multiplies maintenance cost with near-zero user benefit. VitePress versioning adds real complexity | Single docs site tracking latest. Add "Added in v1.1" badges to individual features where relevant |
| Internationalization / translations | "Reach non-English users" | Translations become stale immediately without dedicated translators. vit-cc is developer-targeted; English is the working language of the CLI | Focus on exceptional English docs; add i18n scaffolding only if user demand is demonstrated |
| AI chatbot / docs assistant | Trendy in 2026; seems like natural fit for an AI framework | Adds third-party dependency (Kapa.ai, Mintlify chat, etc.) and monthly cost. For a framework used by developers, search is more reliable and auditable | Invest in excellent search (local search → Algolia when traffic justifies) instead |
| Auto-generated API docs from source | "Docs from code comments is less work" | vit-cc commands are Markdown files with structured prose, not typed APIs. Auto-generation tools (TypeDoc, etc.) don't map to this format | Write command reference from the existing .md command files — they're already structured, just reformatting |
| Video tutorial embeds | "Videos show things better than text" | Videos go stale when the CLI output changes; maintaining them is high-cost. vit-cc outputs text — text docs are the right medium | Use annotated terminal output blocks (code + callout containers). Easier to update, searchable |
| Blog / release notes section in the docs site | "Announce features in docs" | Splits the changelog across CHANGELOG.md (already maintained by vit-changelog-writer agent) and a docs blog. Creates duplication and confusion about canonical source | Link to CHANGELOG.md from docs. Let the existing agent-maintained changelog be the release notes |
| Full-text search with AI re-ranking | "Better than keyword search" | VitePress local search is sufficient for a docs site of this size. Algolia is the right upgrade path if needed | Start with local search (zero cost, zero infra). Add Algolia only when search quality becomes a real user complaint |

---

## Feature Dependencies

```
[Getting started guide]
    └──requires──> [Installation instructions]
    └──requires──> [At least one workflow walkthrough]

[Command reference]
    └──requires──> [Stable URL structure decided upfront]
    └──enhances──> [Workflow walkthroughs (cross-links)]

[Architecture diagrams (Mermaid)]
    └──requires──> [vitepress-plugin-mermaid or vitepress-mermaid-renderer installed]
    └──enhances──> [Agent deep-dive section]
    └──enhances──> [Workflow walkthroughs]

[Agent deep-dive]
    └──requires──> [Architecture overview first]
    └──requires──> [Existing agent .md files as source material]
    └──enhances──> [Contributor guide for new agents]

[Contributor guide]
    └──requires──> [Agent deep-dive]
    └──requires──> [State system reference]

[State system reference]
    └──requires──> [.planning/ internals documented]

[ASCII branding]
    └──requires──> [Custom CSS or component slot]
    └──conflicts-with──> [Generic Docusaurus/VitePress theme left at defaults]

[Sidebar navigation]
    └──requires──> [Information architecture designed before content written]
    └──gates──> [All other content pages]
```

### Dependency Notes

- **Sidebar IA must be designed first:** The navigation hierarchy determines URL structure. Changing URLs after publishing breaks external links. Decide the tree before writing a single page.
- **Mermaid plugin requires explicit install:** Not bundled with VitePress. `vitepress-plugin-mermaid` has version compatibility issues as of early 2026; `vitepress-mermaid-renderer` (last updated 7 days ago) is the safer current choice.
- **Agent deep-dive requires architecture overview:** Users reading the agent internals need context from the architecture diagram. These sections must be sequenced, not written independently.
- **Getting started depends on installation:** Installation must be complete and testable before the quickstart can be validated. Write and test these together.

---

## MVP Definition

### Launch With (v1.1)

Minimum needed for the docs site to serve real users and justify the VitePress investment.

- [ ] **Getting started guide** — new users need this before anything else; absence makes the site useless
- [ ] **Complete command reference** (all 30 commands) — existing users who are the immediate audience need this
- [ ] **Architecture overview with Mermaid diagram** — one diagram showing commands → workflows → agents → state is worth more than 1000 words of explanation
- [ ] **Mermaid plugin configured** — prerequisite for architecture diagram; configure early to avoid blocking
- [ ] **Sidebar navigation with correct IA** — gate on all content pages; must be correct before content is written
- [ ] **ASCII branding** — differentiator that makes VIT feel like a real product; low cost, high signal
- [ ] **Installation page** — prerequisite for getting started guide

### Add After Validation (v1.x)

Add once the core site is live and users are engaging with it.

- [ ] **Agent deep-dive section** — trigger: users asking "how do agents work?" in issues or Discord
- [ ] **Contributor guide for new agents** — trigger: first external contributor attempts to add a custom agent
- [ ] **State system reference (.planning/ internals)** — trigger: users debugging unexpected state file behavior
- [ ] **Workflow walkthroughs** — trigger: support burden from "what does this command actually do?" questions
- [ ] **GitHub effects per command** — can be added incrementally to existing command reference pages

### Future Consideration (v2+)

Defer until the docs site has established usage patterns.

- [ ] **Algolia DocSearch** — defer until local search is insufficient (measurable via support ticket volume)
- [ ] **"Added in vX.Y" version badges** — worth adding after multiple doc-tracked releases exist
- [ ] **i18n scaffolding** — defer until demonstrated non-English user demand

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Getting started guide | HIGH | LOW | P1 |
| Complete command reference | HIGH | MEDIUM | P1 |
| Architecture diagram (Mermaid) | HIGH | MEDIUM | P1 |
| Sidebar navigation / IA | HIGH | LOW | P1 |
| Installation page | HIGH | LOW | P1 |
| ASCII branding | MEDIUM | LOW | P1 |
| Built-in search (local) | HIGH | LOW | P1 (config-only) |
| Dark mode | MEDIUM | LOW | P1 (built-in) |
| Agent deep-dive section | HIGH | MEDIUM | P2 |
| Contributor guide | MEDIUM | MEDIUM | P2 |
| State system reference | MEDIUM | MEDIUM | P2 |
| Workflow walkthroughs | MEDIUM | MEDIUM | P2 |
| GitHub effects per command | MEDIUM | LOW | P2 (content-only) |
| Social links / version header | LOW | LOW | P2 |
| Algolia DocSearch | LOW | LOW | P3 |
| Version badges | LOW | LOW | P3 |
| i18n scaffolding | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch — the site is not useful without these
- P2: Should have — adds significant value, add in v1.x pass
- P3: Nice to have — future consideration based on user feedback

---

## Competitor Feature Analysis

Reference sites surveyed: Docusaurus docs (docusaurus.io), Mintlify showcase sites, VitePress docs (vitepress.dev), oclif docs, Claude Code documentation pattern.

| Feature | Generic CLI Docs (oclif, etc.) | Docusaurus-based projects | vit-cc approach |
|---------|-------------------------------|--------------------------|-----------------|
| Command reference | Usually a single long page | Per-command pages with generated API | Per-command pages written from existing .md files; includes GitHub effects section |
| Architecture docs | Often absent or a single README diagram | Occasional "how it works" overview | Mermaid diagram suite: workflow, agent orchestration, state relationships, PR lifecycle |
| Getting started | Usually covers install + one example | Quickstart + tutorial | Quickstart + "what to expect" walkthrough showing terminal output and GitHub artifacts |
| Navigation depth | Flat or 2 levels | 2-3 levels | 3 levels: Guide / Reference / Internals; each with sub-sections |
| Visual identity | Default theme | Customized theme | ASCII branding matching in-CLI visual language |
| Contributor docs | Rarely | Sometimes | Core section; agent creation is the primary extension point |
| Audience segmentation | Not explicit | Sometimes (beginner/advanced) | Explicit three-audience structure: discoverer, user, contributor (Diataxis model) |

---

## Sources

- [VitePress Default Theme Config](https://vitepress.dev/reference/default-theme-config) — HIGH confidence (official docs). Confirmed: built-in sidebar, nav, dark mode, social links, Algolia integration, edit links.
- [VitePress Markdown Extensions](https://vitepress.dev/guide/markdown) — HIGH confidence (official docs). Confirmed: built-in code copy, syntax highlighting (Shiki), code groups, custom containers. Mermaid NOT built in.
- [vitepress-plugin-mermaid](https://emersonbottero.github.io/vitepress-plugin-mermaid/) — MEDIUM confidence. Plugin exists, 55k weekly downloads, but has version compatibility issues as of early 2026.
- [vitepress-mermaid-renderer on npm](https://www.npmjs.com/package/vitepress-mermaid-renderer) — MEDIUM confidence. Alternative plugin, updated March 2026.
- [Diátaxis Framework](https://diataxis.fr/) — HIGH confidence (official framework site). Four documentation types: Tutorials, How-to, Reference, Explanation. Widely adopted.
- [Documentation Best Practices for Developer Tools — draft.dev](https://draft.dev/learn/documentation-best-practices-for-developer-tools) — MEDIUM confidence. Confirmed: quick-start, complete reference, interactive examples, search as key features.
- [10 Common Developer Documentation Mistakes — document360](https://document360.com/blog/developer-documentation-mistakes/) — MEDIUM confidence. Confirmed anti-patterns: no search, outdated content, poor organization, missing error handling, no visual aids.
- [Common Pitfalls in Developer Content — bekahhw.com](https://bekahhw.com/common-dev-content-pitfalls) — MEDIUM confidence. Confirmed "tutorial cliff" anti-pattern (no mid-level content between beginner and advanced).

---
*Feature research for: vit-cc documentation site (VitePress)*
*Researched: 2026-03-18*
