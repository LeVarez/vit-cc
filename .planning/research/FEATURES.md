# Feature Landscape: vit-cc Documentation Site

**Domain:** Developer documentation site for a CLI workflow framework
**Researched:** 2026-03-18
**Confidence:** HIGH (VitePress official docs HIGH; developer documentation best practices MEDIUM-HIGH from multiple converging sources; anti-features MEDIUM from community surveys)

---

## Table Stakes

Features users expect. Missing any of these makes the docs feel incomplete or unusable.

### Content Sections

| Section | What It Covers | Who It Serves | Complexity to Write |
|---------|---------------|---------------|---------------------|
| **Home page / hero** | What VIT is, one-sentence value prop, install command, call to action | Both | LOW — the README already has this; adapt it |
| **Getting started guide** | Install (`npx vit-claude`), first project walkthrough, core loop explained | Newcomer | MEDIUM — must be sequential, tested end-to-end |
| **Concepts & mental model** | Phases, milestones, agents, state management, the workflow loop — why VIT works this way | Both | HIGH — requires accurate, jargon-free explanation of all core abstractions |
| **Command reference** | Every slash command: syntax, description, options, at least one example | Power user (also newcomers skimming) | HIGH — 29 commands, must stay in sync with source files |
| **Agent reference** | Every agent: role, what spawns it, inputs, outputs | Power user | MEDIUM — 16 agents; information is dense but structured |
| **Changelog** | Version history with links to releases | Both | LOW — already maintained in CHANGELOG.md; surface it |

### Site Features

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Full-text search** | Developers Cmd+K first, read second | LOW | VitePress includes local search built-in; configure it, done |
| **Sidebar navigation** | Multi-section docs require persistent orientation | LOW | VitePress built-in; configure sidebar groups per section |
| **Dark mode** | Developer default; jarring when absent | LOW | VitePress default theme ships dark mode toggle out of the box |
| **Mobile-responsive layout** | Developers read on phones more than expected | LOW | VitePress handles this; do not break it with custom CSS |
| **Syntax-highlighted code blocks** | Every command example must be readable at a glance | LOW | VitePress built-in; use appropriate language identifiers |
| **Previous / Next page navigation** | Linear reading path matters for getting started guides | LOW | VitePress built-in |
| **"On this page" outline** | Long reference pages need in-page navigation | LOW | VitePress built-in; shows headings automatically |

---

## Differentiators

Features that distinguish great docs from adequate ones. These are what users remember and recommend.

### Content Differentiators

| Feature | Value Proposition | Who It Serves | Complexity | Notes |
|---------|-------------------|---------------|------------|-------|
| **Interactive install command (copy button)** | One-click copy of `npx vit-claude` eliminates typos | Both | LOW | VitePress adds copy buttons to code blocks automatically |
| **Workflow diagram** | Visual representation of new-project → plan-phase → execute-phase → verify-work loop | Newcomer | MEDIUM | A single ASCII or SVG diagram in the Concepts section beats 500 words of explanation |
| **Step-by-step tutorials** | "Build a project from scratch with VIT" — complete, runnable walkthroughs | Newcomer | HIGH — requires scripted, tested narrative | Missing tutorials is the #1 reason users bounce back to the README |
| **Custom agent guide** | How to extend VIT by writing a new agent — system prompt structure, spawn triggers, inputs/outputs | Power user | MEDIUM | Differentiates VIT from black-box tools; opens the framework to contributors |
| **Internals / architecture deep-dive** | State management (.planning/ directory), worktrees, GitHub sync, hook system | Power user | HIGH — requires accurate documentation of internal conventions | Engineers who extend or debug VIT need this; no other source exists |
| **Command quick-reference table** | One-page summary of all 29 commands with one-line descriptions | Both | LOW — already in README; extract and format it | Provides orientation before reading individual command pages |
| **"What to do next" section per page** | Guides users toward the next logical step after reading any page | Newcomer | LOW | Pattern: after Getting Started → link to first Tutorial; after Command ref → link to Concepts |
| **Annotated file tree** | Show the `.claude/` directory structure installed by VIT with each component labeled | Newcomer | LOW | Removes anxiety about "what did this install on my machine?" |

### Site Feature Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Edit this page link** | Community can fix docs typos via GitHub | LOW | VitePress built-in; configure `editLink` with repo URL |
| **Last updated timestamp** | Signals whether docs are current; builds trust | LOW | VitePress built-in |
| **Consistent code example format** | All examples use the same shell, same variable names, same structure | LOW (discipline) | Inconsistency is the primary cause of "the docs confused me" reports |
| **Version badge or header** | "These docs are for vit-cc v1.0.1" — anchors the docs to a specific release | LOW | Add to site header or home page |

---

## Anti-Features

Patterns to explicitly avoid. These are commonly requested or assumed but harm the docs.

| Anti-Feature | Why It Seems Right | Why It's Wrong | What to Do Instead |
|--------------|-------------------|----------------|-------------------|
| **Video tutorials embedded in docs** | Rich learning format | Go stale immediately when commands change; not searchable; not skimmable | Write prose tutorials with copy-able code blocks; link to external videos in a "Community resources" footnote if they exist |
| **Auto-generated command reference from source** | Sounds DRY and always in-sync | Agent `.md` files are system prompts — their content is implementation detail, not user-facing reference. Auto-generating from them produces internal jargon | Write the command reference by hand; each page is a user-facing document, not a reflection of the source file |
| **Glossary-first information architecture** | Completeness theater | Newcomers stop reading when they hit a glossary upfront; jargon should be introduced in context | Define terms inline on first use; create a glossary only as a reference appendix, not a required prerequisite |
| **Changelog as the versioning story** | Engineers like changelogs | Users need to know "what version am I on and how do I update" — not a list of git commits | One update section: `npx vit-claude` re-runs to update. That is the version story. Surface the changelog as secondary. |
| **Full API/internals reference for newcomers** | Comprehensive == good | Overwhelming internals in the main navigation drives newcomers away before they start | Put internals under an "Advanced" or "Internals" section; keep it off the primary navigation path |
| **Separate "FAQ" section as main navigation item** | Common pattern | FAQs are a symptom of missing documentation — if you need a FAQ, the docs didn't answer the question | Write the answer in the appropriate guide page; mention FAQs organically via callout boxes where confusion is likely |
| **i18n / multi-language docs** | Accessibility | VIT is a developer-facing CLI tool with agent definitions in English; translating 29 commands + 16 agents is a significant ongoing maintenance burden with unclear ROI at this stage | Ship English-only; add i18n as a community contribution path if demand emerges |
| **Versioned docs (v1.0 / v1.1 / v2.0 branches)** | Correctness for multiple versions | VIT installs via `npx vit-claude`; the latest version is always what you get. Versioned docs add navigation complexity without real benefit at current scale | Single version docs; note breaking changes in the changelog |
| **Interactive playground / sandbox** | Show don't tell | A Claude Code workflow framework cannot be meaningfully demonstrated in a browser sandbox — it requires Claude Code, a real project, and a local file system | Use realistic, copy-ready code snippets and a clear "try it yourself" tutorial instead |

---

## Content Section Details

### Section 1: Home Page

**Covers:** Hero block (what is VIT, the one-sentence pitch), install command, core loop graphic, "Why VIT?" bullets, CTA to Getting Started.

**Who it serves:** Both — first page for newcomers; reference for people sharing the link.

**Complexity:** LOW. Content exists in README. Adapt, don't invent.

**Dependencies on codebase:** `npx vit-claude` install command must match `package.json` `bin` field. Value prop should reflect `PROJECT.md`.

---

### Section 2: Getting Started

**Covers:** Prerequisites (Claude Code, Node.js, optional `gh` CLI), install steps, first project walkthrough (run `npx vit-claude`, open a project, run `/vit:new-project`, follow the loop through one phase).

**Who it serves:** Newcomer. Power users already know this.

**Complexity:** MEDIUM. Must be accurate end-to-end — every step must work. Risk: commands or behavior change without the docs being updated.

**Dependencies on codebase:** Accuracy depends on reading `files/commands/vit/new-project.md`, `plan-phase.md`, `execute-phase.md`, `verify-work.md` directly. Do not write from memory.

---

### Section 3: Concepts & Architecture

**Covers:**
- Phases — what a phase is, what it produces (PLAN.md, commits, state updates)
- Milestones — grouping of phases; milestone worktrees
- Agents — what they are, how they're spawned, why users don't invoke them directly
- State management — `.planning/` directory, STATE.md, PROJECT.md, ROADMAP.md structure
- The workflow loop — how new-project → plan-phase → execute-phase → verify-work works end-to-end
- GitHub integration — phase-ci.yml, PR lifecycle, issue mapping (optional but important context)

**Who it serves:** Both — newcomers need orientation; power users need conceptual precision to extend the framework.

**Complexity:** HIGH. This is the hardest section to write accurately because it requires understanding how every component interacts. Source of truth is the codebase, not the README.

**Dependencies on codebase:** Requires reading `files/vit/` directory (templates, workflows, VERSION), `files/commands/vit/` files, and `.planning/codebase/ARCHITECTURE.md` if it exists.

---

### Section 4: Command Reference

**Covers:** One page per command (or grouped thematically). For each: name, description, when to use it, syntax, arguments/options, at least one example, what state it reads/writes.

**Who it serves:** Power user primarily; newcomers reference it after getting started.

**Complexity:** HIGH because of scale (29 commands). Individual pages are LOW complexity but consistent formatting discipline is required across all 29.

**Dependencies on codebase:** Each page must be derived from the corresponding `files/commands/vit/*.md` file. Do not paraphrase from the README table; read the source.

**Suggested groupings:**
- Project lifecycle: `new-project`, `new-milestone`, `complete-milestone`, `audit-milestone`
- Phase management: `plan-phase`, `execute-phase`, `verify-work`, `quick`, `discuss-phase`, `research-phase`
- Phase manipulation: `add-phase`, `insert-phase`, `remove-phase`, `list-phase-assumptions`
- Session management: `progress`, `pause-work`, `resume-work`, `review-feedback`, `debug`
- Todos & utilities: `add-todo`, `check-todos`, `map-codebase`, `list-milestones`
- Configuration: `set-profile`, `settings`, `update`, `help`, `join-discord`

---

### Section 5: Agent Reference

**Covers:** One page per agent (or a single reference page). For each: role, what command spawns it, what it reads as input, what it produces as output.

**Who it serves:** Power user building custom workflows or debugging unexpected behavior.

**Complexity:** MEDIUM. 16 agents; structure is consistent so a template-driven approach works.

**Dependencies on codebase:** Source of truth is `files/agents/vit-*.md` files.

---

### Section 6: Guides (Advanced)

**Covers:**
- Creating custom agents — how to add a new `.md` file to `files/agents/`, spawn trigger conventions, input/output contracts
- Model profiles — what quality/balanced/budget mean, how to switch, when to use each
- Team workflows — assignments, onboarding new team members
- Debug sessions — how `/vit:debug` works, the checkpoint protocol

**Who it serves:** Power user.

**Complexity:** MEDIUM per guide. High priority: custom agents guide (differentiator). Lower priority: team workflows (can be deferred to later milestone).

**Dependencies on codebase:** Custom agents guide requires understanding of how existing agents are structured and spawned — read `files/commands/vit/execute-phase.md` and several agent files.

---

### Section 7: Tutorials

**Covers:** Narrative, step-by-step walkthroughs. Minimum viable set:
1. "Build a web app with VIT from scratch" — new-project through first verify-work
2. "Add a milestone to an existing project" — new-milestone, plan-phase, execute-phase cycle
3. "Debug a failing phase with VIT" — debug session walkthrough

**Who it serves:** Newcomer strongly; power users may reference for specific flows.

**Complexity:** HIGH. Tutorials require scripted, tested narratives. Untested tutorials erode trust faster than missing tutorials.

**Dependencies on codebase:** Must run through the actual commands to verify the narrative is accurate. Screenshots or terminal output recordings would help but are not required for launch.

---

## Feature Dependencies

```
[Concepts section]
    └── required reading for --> [Custom agents guide]
    └── required reading for --> [Internals section]
    └── referenced by --> [Getting started guide]

[Command source files in files/commands/vit/]
    └── source of truth for --> [Command reference pages]
    └── source of truth for --> [Getting started walkthrough steps]

[Agent source files in files/agents/]
    └── source of truth for --> [Agent reference pages]
    └── source of truth for --> [Custom agents guide]

[Getting started guide]
    └── prerequisite for --> [Tutorials]

[VitePress built-in search]
    └── enables --> [Cmd+K search across all sections]

[Sidebar configuration]
    └── determines --> [Navigation structure for all sections]
```

---

## MVP Definition

For launch, deliver:

1. **Home page** — value prop, install command, core loop, CTA
2. **Getting started guide** — prerequisites through first phase completion
3. **Concepts overview** — phases, milestones, agents, state management (can be one long page initially)
4. **Command reference** — all 29 commands (even brief pages are better than nothing)
5. **Agent reference** — all 16 agents (single reference page is acceptable for launch)
6. **Search, sidebar, dark mode** — VitePress defaults properly configured

Defer to post-launch:

- **Tutorials** — high value but high cost to write correctly; better to launch without than to ship untested tutorials
- **Custom agents guide** — power user content; add once the core reference is solid
- **Internals deep-dive** — write when contributors start asking questions that aren't answered by existing pages
- **Team workflows guide** — defer until team usage patterns are understood

---

## Feature Prioritization Matrix

| Feature | User Value | Write Complexity | Priority |
|---------|------------|------------------|----------|
| Home page | HIGH | LOW | P1 |
| Getting started guide | HIGH | MEDIUM | P1 |
| Command reference (all 29) | HIGH | HIGH (scale) | P1 |
| Concepts & mental model | HIGH | HIGH | P1 |
| VitePress search + sidebar | HIGH | LOW | P1 |
| Agent reference | MEDIUM | MEDIUM | P2 |
| Step-by-step tutorials | HIGH | HIGH | P2 |
| Custom agents guide | MEDIUM | MEDIUM | P2 |
| Model profiles guide | LOW | LOW | P3 |
| Internals deep-dive | MEDIUM | HIGH | P3 |
| Team workflows guide | LOW | MEDIUM | P3 |

---

## Sources

- [VitePress Default Theme Config](https://vitepress.dev/reference/default-theme-config) — HIGH confidence (official docs). Built-in features: search, sidebar, dark mode, edit link, last updated, outline.
- [VitePress Getting Started](https://vitepress.dev/guide/getting-started) — HIGH confidence (official docs). File-based routing, markdown extensions, deployment.
- [WorkOS: 9 Components of Great Developer Documentation](https://workos.com/blog/great-documentation-examples) — MEDIUM confidence. Clear home page, getting started guide, simple explainers, use cases, simple layout, interactive code, repetition, visuals.
- [draft.dev: 12 Documentation Examples](https://draft.dev/learn/12-documentation-examples-every-developer-tool-can-learn-from) — MEDIUM confidence. Interactive elements, search/autocomplete, role-based learning paths, feedback mechanisms.
- [APIdog: Why Stripe's API Docs Are the Benchmark](https://apidog.com/blog/stripe-docs/) — MEDIUM confidence. Three-column layout, live code samples, language selectors.
- [CLI Guidelines (clig.dev)](https://clig.dev/) — HIGH confidence (authoritative community reference). CLI tools need web docs that are searchable and linkable; examples should lead documentation.
- [Document360: 10 Common Developer Documentation Mistakes](https://document360.com/blog/developer-documentation-mistakes/) — MEDIUM confidence (multiple converging sources). Outdated examples, walls of text, poor structure, missing version info, lack of feedback mechanisms.
- [GitHub Blog: Documentation Done Right](https://github.blog/developer-skills/documentation-done-right-a-developers-guide/) — MEDIUM confidence. Separate Quick Starts, Tutorials, Reference, and Concepts as distinct content types.

---

*Feature research for: vit-cc v1.0.1 VitePress documentation site*
*Researched: 2026-03-18*
