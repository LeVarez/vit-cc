# Project Research Summary

**Project:** vit-cc Documentation & Developer Guide (v1.1)
**Domain:** Framework documentation — agentic AI tooling for Claude Code
**Researched:** 2026-03-19
**Confidence:** HIGH

---

## Executive Summary

vit-cc is not a code library and must not be documented like one. It is a framework of markdown files — 30 slash commands, 16 specialist agents, 12 workflow fragments, 9 reference modules, and 33 templates — that runs entirely inside Claude Code. The "runtime" is Claude itself. This means the audience splits cleanly: users who run `/vit:*` commands without needing to understand internals, and developers who extend the framework by adding agents and commands. Every structural decision in the documentation must respect this split from day one. Merging the two audiences into the same pages is the single most dangerous pitfall identified across all four research dimensions — it causes both groups to bounce before finding what they need.

The recommended approach is a phased `docs/` folder of plain GitHub-flavored markdown, organized into user guide, command reference, agent reference, developer guide, and reference sections. Plain markdown is the non-negotiable baseline because two existing agents (`vit-doc-updater`, `vit-changelog-writer`) already write and update documentation as part of the normal execution cycle — they must not be broken by a build pipeline. VitePress is the recommended upgrade path for a hosted site once the baseline exists, but it is out of scope for v1.1. Mermaid diagrams in fenced code blocks are the correct diagramming choice: GitHub renders them natively, they are text-based and version-controllable, and agents can write them.

The critical risk is producing a thorough reference catalog without a mental model that makes it navigable. Research is unambiguous: getting-started and conceptual overview content must be written before any reference documentation. Users who encounter `/vit:execute-phase` documentation without first understanding what a "phase" is, what STATE.md does, or how commands spawn agents will not recover from reference docs alone. The documentation phases must be ordered with the mental model and core workflow guide first, command and agent reference second, workflow guides and GitHub integration third, and developer extension guide fourth.

---

## Key Findings

### Recommended Stack

The tooling decision is settled: plain markdown in a structured `docs/` folder, with VitePress as an optional hosted-site layer and Mermaid for diagrams. No auto-generation tooling is needed — vit-cc commands are markdown files, not code with parseable signatures. The correct approach is one authored `.md` file per command and per agent, maintained by `vit-doc-updater` as the framework evolves.

**Core technologies:**
- **Plain GFM markdown in `docs/`:** Primary format — GitHub renders natively, agent-writable without tooling, compatible with VitePress as a future layer; this is the baseline that cannot be skipped
- **VitePress 1.x (when needed):** Optional hosted-site layer — markdown-first, minimal config, built-in minisearch, GitHub Pages deploy in under 5 minutes; add when a web presence is required, not before
- **Mermaid (fenced code blocks):** Architecture and flow diagrams — GitHub-native rendering since 2022, text-based and diffable, writable by agents; `flowchart`, `sequenceDiagram`, and `graph` types cover all vit-cc documentation needs
- **YAML frontmatter on command docs:** Machine-readable metadata (command name, category, inputs, spawned agents) enables future tooling without requiring a toolchain today

**Avoid:** GitHub Wiki (outside repo tree, cannot be PR-updated by agents, not versioned with code), Docusaurus (React overhead, versioning features not needed, longer setup), Mintlify/GitBook (SaaS cost and external dependency for an open source tool), single mega-README (does not scale past 200 lines, no deep linking), binary diagram formats (draw.io, Visio — not agent-writable, not version-controllable as readable diffs).

See: `.planning/research/STACK.md`

### Expected Features — What Must Be Documented

All components enumerated by direct filesystem traversal. No inference was required; every file was read.

**Table stakes — must have for v1.1:**
- All 30 slash commands: syntax, arguments, flags, expected output, prerequisites, common errors
- `vit:new-project` full walkthrough — most complex command, first thing every user runs
- `vit:plan-phase` + `vit:execute-phase` as the core loop — runs dozens of times per project
- All 16 agents: role, when spawned, inputs consumed, outputs produced, behavioral contract
- `.planning/` directory structure and file schemas — users see these files every session
- `config.json` complete reference — all keys, values, and effects
- Model profiles with cost/quality tradeoff explanation per agent
- GitHub integration overview (issues, PRs, and branch hierarchy created automatically)
- Wave-based parallelization concept (users see multiple agents running, need to understand why)
- Verification flow and gap-closure loop (users encounter verification failures, need to know what to do)
- Conceptual glossary: canonical definitions for milestone, phase, plan, wave, checkpoint, must_have, structured return

**Should have — differentiating documentation:**
- Architecture guide with Mermaid diagrams: orchestrators → workflows → agents → state store data flow
- "How to extend vit-cc" custom agents tutorial with end-to-end walkthrough
- "How to extend vit-cc" custom commands tutorial
- Design philosophy: why agents not macros, why orchestrators stay lean, why `.planning/` is file-based state
- GitHub integration deep-dive: full PR lifecycle (draft → execute → verify → ready → review → merge)
- Multi-engineer team workflow guide (assign-phase, team-status, worktree isolation)
- Context management guide (context budget concept, when to `/clear`)
- UAT workflow guide (persistent UAT.md state, how gaps feed back to plan-phase)
- Debugging guide using `vit:debug` (scientific method, persistent sessions across context resets)

**Defer to post-v1.1:**
- Per-workflow deep-dives (implementation-level internals, high maintenance cost relative to value)
- Video walkthroughs
- Interactive examples
- Migration guides for version upgrades
- Agent system prompt internals (unstable, Claude-internal scaffolding — documents what, not how)

See: `.planning/research/FEATURES.md`

### Architecture Approach

vit-cc is a three-layer system. Documentation must explain this model as a conceptual foundation before any component-level reference is presented. The folder structure is secondary to the model.

**The three layers (what documentation must convey as a mental model):**
1. **Commands (Orchestrators):** `.claude/commands/vit/*.md` — user-invoked; coordinate work, spawn agents, route results, update state; they do NOT implement features
2. **Agents (Workers):** `.claude/agents/*.md` — spawned by commands via `Task()`; each has a scoped tool set; they do NOT orchestrate and users do NOT invoke them directly
3. **State Store (.planning/):** file-based persistent state across sessions; every command and agent reads `STATE.md` as its first operation

**Core patterns documentation must explain:**
- **Context budget management:** Orchestrators stay lean (10-15% context) so agents each get a fresh 200k window; file contents are inlined before `Task()` calls because the `@`-import syntax does NOT cross `Task()` boundaries
- **Wave-based parallel execution:** Plans are pre-grouped into numbered waves during `plan-phase`; plans in the same wave run in parallel (in dedicated worktrees for file isolation), waves run sequentially
- **Goal-backward verification:** `must_haves` in PLAN.md frontmatter check what must be TRUE, not what tasks completed; three-level verification (existence → substantive → wired); gap-closure loop runs until `passed`
- **Checkpoint and continuation:** Agents stop at checkpoint tasks and return structured state; a fresh continuation agent receives all prior state inlined; this is why checkpoints work across context boundaries
- **Structured returns:** Every agent returns with a defined status prefix (`## PLAN COMPLETE`, `## CHECKPOINT REACHED`, etc.) enabling orchestrator routing without free-form text parsing
- **Atomic commits:** Per-task, per-plan, per-phase, per-milestone commit hierarchy; never `git add .` or `git add -A`; always stage files individually
- **Model profile resolution:** Three profiles (quality/balanced/budget) map each agent to a specific model; read from `config.json` before every spawn

**Extension points documentation must cover:**
- Adding a new command: create `.claude/commands/vit/<name>.md` with YAML frontmatter and orchestrator body pattern
- Adding a new agent: create `.claude/agents/vit-<name>.md`, scope tools to what the agent needs, define structured return format, add to `model-profiles.md`
- Adding a new optional workflow stage: config key addition + conditional spawn pattern
- The `@`-import system for references and workflows, and its critical limitation

See: `.planning/research/ARCHITECTURE.md`

### Critical Pitfalls

1. **Treating two audiences as one** — Documentation written for users (running commands) and developers (writing custom agents) merged into the same pages causes both groups to bounce. Prevention: enforce a hard structural split in the information architecture before any content is written; two distinct entry points with cross-links only where necessary; command reference pages never explain architectural rationale; architecture pages never repeat command syntax.

2. **Writing reference before the guide** — Complete command and agent reference documentation produced without a getting-started guide leaves users with an encyclopedia and no map. Reference docs are only useful to users who already understand the core loop. Prevention: getting-started and core workflow walkthrough must be written and reviewed before any reference work begins.

3. **Documenting what it is instead of what it does** — Pages describe components as objects (what they contain) rather than outcomes (what users accomplish). Prevention: every page leads with the user outcome; command pages start with the job the user is trying to accomplish, not the mechanism; agent pages start with what they produce for the user's workflow.

4. **Missing the mental model** — Complete reference coverage without a page that explains: what is a phase, what is a plan, what does STATE.md do, how do commands spawn agents, what "atomic commit" means in this context. Prevention: write mental model pages before any reference documentation; establish a glossary in Phase 1 and enforce it throughout.

5. **Assuming readers understand AI agents** — Most vit-cc users do not know what a Claude Code sub-agent is, that commands spawn them automatically, or that users never invoke agents directly. Prevention: one dedicated conceptual page early in the user guide defining the agent model, backed by explicit agent reference templates that describe behavioral contracts rather than reproducing system prompts.

Additional pitfalls requiring attention during execution:
- Examples with placeholder values (angle brackets, abstract `N`) that do not run without explanation — every example needs realistic values and explicit prerequisites
- Agent docs that reproduce system prompts instead of describing behavioral contracts (inputs → action sequence → outputs → invariants)
- Architecture docs that are file tree listings without explaining design intent or why layer boundaries exist
- Extension guide that explains the file format mechanically but does not include an end-to-end custom agent walkthrough
- Inconsistent terminology across pages — glossary from Phase 1 must be enforced during every review

See: `.planning/research/PITFALLS.md`

---

## Implications for Roadmap

Four phases are recommended. The ordering is determined by two hard constraints from PITFALLS.md: (1) the information architecture split must be established before any content is written, and (2) getting-started and conceptual overview must precede reference documentation.

### Phase 1: Information Architecture and Core Concepts

**Rationale:** The audience split, folder structure, and glossary are foundations that every subsequent phase builds on. Errors here require rewrites in every subsequent phase. The getting-started guide and conceptual overview must exist before reference docs because reference docs are only useful to users who understand the core loop. Writing the guide before the reference is a non-negotiable constraint identified in PITFALLS.md (Pitfall 4).

**Delivers:**
- `docs/` folder structure established (all subdirectories created, index files scaffolded)
- README restructured to serve as entry point linking into `docs/`
- Getting started guide: installation and first project walkthrough with realistic output
- Core workflow walkthrough: `new-project` → `plan-phase` → `execute-phase` → `verify-work` end-to-end
- Conceptual overview: what is a phase, what is a plan, what is STATE.md, how commands spawn agents, what parallelization looks like from the user's perspective
- Glossary: canonical definitions for all vit-cc-specific terms (milestone, phase, plan, wave, checkpoint, route, must_have, structured return, atomic commit)

**Avoids:** Pitfall 4 (reference before guide), Pitfall 3 (assuming agent knowledge), Pitfall 5 (missing mental model), Pitfall 13 (jargon without definition on first use)

**Research flag:** No `/vit:research-phase` needed — standard documentation architecture patterns apply.

---

### Phase 2: Command and Agent Reference

**Rationale:** With the mental model established in Phase 1, reference documentation becomes useful rather than confusing. Command and agent reference belong in the same phase because they are deeply interrelated — every agent entry references which command spawns it; every command entry references which agents it spawns. Producing them together ensures cross-reference consistency. A template exemplar for agent behavioral contracts should be written and reviewed before scaling to all 16 agents.

**Delivers:**
- All 30 slash commands documented: syntax, arguments, flags, realistic example invocations, expected output, prerequisites, common errors, "what if it doesn't work?" for core commands
- All 16 agents documented with behavioral contracts: inputs received, action sequence, outputs produced, invariants maintained, what breaks if invariants are violated
- Agent documentation written as user-facing behavioral description — NOT as system prompt reproduction
- Command template enforcing a "Prerequisites" section
- Agent template enforcing behavioral contract coverage (inputs / sequence / outputs / invariants)

**Avoids:** Pitfall 2 (what it is vs. what it does), Pitfall 6 (examples that don't run), Pitfall 7 (system prompt reproduction), Pitfall 9 (capabilities vs. behavior), Pitfall 12 (state requirements missing from command pages)

**Research flag:** No `/vit:research-phase` needed. However: write `vit-executor` as the first agent reference entry and review it as a template exemplar before proceeding to the remaining 15 agents.

---

### Phase 3: Workflow Guides and GitHub Integration

**Rationale:** Beyond the core loop, vit-cc has workflow modes users encounter but cannot navigate without dedicated explanation: the verification and gap-closure loop, UAT sessions, debugging, team parallelization, context management, and the full GitHub PR lifecycle. These are "should have" differentiators. They require the command and agent reference to exist (Phase 2) so they can cross-reference rather than re-explain. Each guide must include error states, not only the happy path.

**Delivers:**
- Verification flow guide: goal-backward verification, gap-closure loop (gaps_found → plan --gaps → execute --gaps-only → re-verify), when to expect each outcome
- UAT workflow guide: persistent UAT.md state, how gaps feed back to plan-phase, Route A/B/C/D explained with what to do in each case
- Debugging guide: `vit:debug`, persistent DEBUG.md sessions across context resets, scientific method approach
- GitHub integration guide: full PR lifecycle from draft creation through merge, branch hierarchy, issue tracking, graceful degradation without `gh` CLI
- Team workflow guide: assign-phase, team-status, worktree isolation for parallel feature work
- Context management guide: context budget concept, when to `/clear`, what happens when context fills mid-phase

**Avoids:** Pitfall 14 (happy path only — each guide includes error states and recovery steps), Pitfall 11 (inconsistent terminology — glossary from Phase 1 enforced)

**Research flag:** Optional `/vit:research-phase` for GitHub integration guide to verify current `gh` CLI API surface (flags added since v1.0).

---

### Phase 4: Developer Guide and Architecture

**Rationale:** Developer-facing content comes last because it requires the user guide to be complete (developers read user docs first), and because extension tutorials are most useful when they can cross-reference concrete command and agent reference pages from Phase 2. Architecture documentation belongs in this phase alongside extension tutorials because the audience overlap is high — developers who want to extend the framework need both. The developer guide is a distinct entry point from the user guide.

**Delivers:**
- Architecture guide: three-layer model with Mermaid diagrams (orchestrators → workflows → agents → state store data flow), design rationale for each layer boundary, why commands stay lean, why `.planning/` is file-based state not in-memory context
- Design philosophy guide: why agents not macros, how the `@`-import system works, the structured returns contract, why content must be inlined before `Task()` calls
- Custom agents tutorial: end-to-end walkthrough from file creation to working invocation, tool scope conventions by agent category, structured return format requirement, model-profiles.md registration
- Custom commands tutorial: end-to-end walkthrough, orchestrator pattern with state-reading conventions, content-inlining before Task() calls
- Custom workflow stage tutorial: config key addition + conditional spawn pattern with example
- Reference file documentation: what each of the 9 reference modules defines, when to `@`-import it, what is stable vs. subject to change

**Avoids:** Pitfall 1 (two audiences as one — developer guide is a distinct entry point, not merged with user guide), Pitfall 8 (file tree listings instead of design intent), Pitfall 10 (abstract extension guide without concrete scenarios)

**Research flag:** No `/vit:research-phase` needed — extension guide patterns are well-established in the codebase.

---

### Phase Ordering Rationale

- **Phase 1 before everything:** Information architecture errors propagate to every subsequent phase; glossary and folder structure are dependencies for all other phases; getting-started must exist before reference or users have no entry point
- **Phase 2 before Phases 3 and 4:** Workflow guides and extension tutorials require cross-reference targets in the command/agent reference; agent behavioral contracts must be established before the architecture guide can reference them accurately
- **Phase 3 before Phase 4:** Workflow guides are user-facing and extend the user guide established in Phase 1; the developer guide is the final layer for extenders who have already absorbed the user guide and command reference
- **Phases 3 and 4 can overlap** if parallel resourcing is available, since they target different audiences and have no content dependencies on each other

### Research Flags Summary

| Phase | Research Needed | Reason |
|-------|----------------|--------|
| Phase 1 | No | Standard documentation architecture patterns; content enumerated in FEATURES.md |
| Phase 2 | No — but validate template first | Write `vit-executor` reference as exemplar before scaling to all 16 agents |
| Phase 3 | Optional for GitHub integration | Verify current `gh` CLI API surface |
| Phase 4 | No | Extension guide patterns derived directly from codebase structure |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | VitePress, Mermaid, and plain markdown recommendations verified against official documentation; confirmed compatible with existing agent-writing workflow constraints; alternatives evaluated with clear rationale |
| Features | HIGH | Direct filesystem enumeration of all 100 files — no inference; every component read directly; documentation scope counts verified (30 commands, 16 agents, 12 workflows, 9 references, 33 templates) |
| Architecture | HIGH | Derived from reading all 29+ command files, all 16 agent files, all 12 workflow files, all reference and template files, and actual `.planning/` state artifacts |
| Pitfalls | HIGH (codebase source) / MEDIUM (external sources) | Framework-specific pitfalls derived from direct codebase analysis are HIGH; general documentation pitfalls from external sources are MEDIUM but corroborated by the codebase analysis; pattern is consistent |

**Overall confidence: HIGH**

### Gaps to Address

- **VitePress scope decision:** Research recommends VitePress as an optional layer but the v1.1 milestone scope does not specify whether a hosted site is in scope. Recommendation: treat VitePress as out-of-scope for v1.1; focus on the plain `docs/` baseline that works on GitHub. Revisit in v1.2 if a hosted site is needed.

- **30 vs. 29 commands discrepancy:** ARCHITECTURE.md references 29 commands (from reading command files); FEATURES.md enumerates 30 commands (from directory listing). One command may have been added after ARCHITECTURE.md was written, or one is non-user-facing (`set-profile` lacks the `vit:` namespace prefix). Verify the canonical count and namespace at the start of Phase 2.

- **`vit-doc-updater` scope in new `docs/` structure:** The existing `vit-doc-updater` runs after phase completion and updates README/docs sections. Before Phase 1 begins, confirm whether its update behavior targets the new `docs/` folder structure or whether it needs adjustment to find and update the right paths.

- **Documentation maintenance protocol:** PITFALLS.md identifies documentation divergence from code changes as a long-term maintenance risk. Establishing an explicit rule during Phase 1 — no agent or command file change ships without a corresponding documentation update — will prevent this. The `vit-doc-updater` already provides partial coverage; the gap is framework contributor discipline.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase: `.claude/commands/vit/` — 30 command files enumerated and read in full
- Direct codebase: `.claude/agents/` — 16 agent files read, behavioral contracts documented
- Direct codebase: `.claude/vit/workflows/` — 12 workflow files read
- Direct codebase: `.claude/vit/references/` — 9 reference files read
- Direct codebase: `.claude/vit/templates/` — 33 template files read across 3 subdirectories
- Direct codebase: `.planning/` — STATE.md, ROADMAP.md, config.json, phase artifacts read
- https://vitepress.dev/guide/getting-started — VitePress setup and features confirmed
- https://vitepress.dev/reference/default-theme-search — built-in minisearch confirmed, no Algolia account needed
- https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams — GitHub native Mermaid rendering confirmed stable through 2025

### Secondary (MEDIUM confidence)

- https://okidoki.dev/documentation-generator-comparison — VitePress vs. Docusaurus vs. MkDocs setup comparison
- https://github.com/jooy2/vitepress-sidebar — auto-sidebar plugin for VitePress
- https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/ — agent documentation patterns
- https://smartbear.com/blog/13-things-people-hate-about-your-open-source-docs/ — common documentation failures in open source projects
- Diátaxis framework (tutorial / how-to / reference / explanation separation) — documentation structure patterns

### Tertiary (LOW confidence)

- https://dev.to/infrasity-learning/best-developer-documentation-tools-in-2025-mintlify-gitbook-readme-docusaurus-10fc — ecosystem survey, used for alternative elimination only

---

*Research completed: 2026-03-19*
*Ready for roadmap: yes*
