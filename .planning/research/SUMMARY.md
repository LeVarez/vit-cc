# Project Research Summary

**Project:** vit-cc — GitHub PR lifecycle automation + auto-documentation agents
**Domain:** GitHub-integrated agentic development workflow (CLI tooling, Markdown agent definitions)
**Researched:** 2026-03-18
**Confidence:** HIGH (stack and architecture derived from official docs and direct codebase reading; features and pitfalls validated across multiple sources)

## Executive Summary

vit-cc is extending its CLI-driven agentic workflow to cover the full GitHub PR lifecycle and automated documentation maintenance. The core pattern is well-understood: the existing three-layer architecture (slash commands as orchestrators, specialist agents as workers, `.planning/` as state store) is mature and ready to absorb these additions without structural changes. New capabilities — draft PR creation, review posting, changelog generation, and doc updates — all fit cleanly as agent additions and targeted command modifications rather than new architectural paradigms.

The recommended approach is to build in dependency order: STATE.md schema first (all commands read from it), then the three new specialist agents in parallel (they have no inter-dependencies), then command modifications that wire agents into the existing workflow. All GitHub operations should use the `gh` CLI directly from within the correct worktree, with consistent graceful degradation for environments without `gh`. The stack additions are minimal: `git-cliff` for changelog generation and `recast` + `@babel/parser` for JSDoc write-back — both are targeted, low-overhead tools that install as dev dependencies in the target project, not vit-cc itself.

The key risks cluster around two areas: PR lifecycle correctness (wrong base branch, duplicate creation, premature promotion) and doc agent discipline (scope creep on README updates, CHANGELOG write conflicts between agents). Both risk areas are preventable with explicit guards already identified in the pitfalls research, and the existing codebase already uses `|| true` patterns and idempotency checks as precedents to follow.

## Key Findings

### Recommended Stack

The existing stack (Node.js CLI, `gh` CLI, GitHub Actions, Markdown agent definitions) requires no structural additions. Three targeted library additions are needed for the new agents, and all install in the target project rather than vit-cc itself.

**Core technologies:**
- `gh` CLI v2.88.1: All PR lifecycle operations (create, promote, review) — already installed; no new dependency needed
- `git-cliff` v2.12.0: CHANGELOG generation from phase SUMMARY.md files — fastest in class, clean programmatic Node.js API, Keep a Changelog output format
- `recast` ^0.23.x + `@babel/parser` ^7.x: Format-preserving JSDoc write-back — critical for doc-only patches that must not cause diff noise across entire files
- `jsdoc-api` v9.3.5: JSDoc extraction to structured JSON — needed when agents read existing docs before writing updates

One version constraint to document: `git-cliff` requires Node.js >=18.19, while vit-cc's current engine requirement is >=18.0. Versions 18.0–18.18 will fail with git-cliff.

For inline PR review comments (per-line diff annotations), `gh api` against the REST endpoint must be used — `gh pr review` does not support inline comments natively.

See `/Users/aleix/Documents/ViT/vit-cc/.planning/research/STACK.md` for full command references and alternative evaluation.

### Expected Features

vit-cc's milestone centers on eliminating all manual GitHub operations from the phase lifecycle. The feature set is tightly scoped to what achieves that goal.

**Must have (table stakes):**
- Idempotent draft PR creation on `execute-phase` start — feature branches are invisible to GitHub workflow without this
- Draft to ready-for-review promotion after `verify-work` Route A passes — PRs must not stay draft forever
- AI PR reviewer posts structured, severity-tiered review comment (diff-scoped to phase only) — the core differentiator; answers "who reviews the AI's code?"
- CHANGELOG entry generation in `complete-milestone` — every release needs documented outcomes
- Graceful `gh` CLI degradation — backwards compatibility for projects without GitHub integration is a stated constraint

**Should have (competitive):**
- PR body with phase context (issue links, PLAN.md path, `Closes #N`) — reviewers need context without reading the branch
- Per-plan doc updater (README section updates) — prevents doc drift; triggered as post-phase hook
- Severity-tiered review categories (block-merge / should-fix / nit) — emerging 2026 standard for AI reviewers

**Defer (v2+):**
- Targeted JSDoc updates — requires AST-level diff parsing; high cost for unproven value at this stage
- Review suggestion attribution tracking — useful for calibrating reviewer quality but requires persistent state

Key anti-features to avoid: auto-merge (bypasses human review step), webhook-driven state sync (requires server infrastructure VIT cannot own), full JSDoc regeneration per plan (expensive and produces noise diffs), full README rewrite (destructive to manual sections).

See `/Users/aleix/Documents/ViT/vit-cc/.planning/research/FEATURES.md` for full prioritization matrix and dependency graph.

### Architecture Approach

All new components slot into the existing three-layer pipeline without structural changes. The command layer orchestrates, agents do the work, and `.planning/STATE.md` carries state across command boundaries. The one schema change needed is adding a `PR` column to the existing GitHub Issue Mapping table in STATE.md — this single addition enables all cross-command PR number handoff.

**Major components:**
1. `STATE.md` PR Mapping column — carries `pr#N` from execute-phase (creation) to verify-work (promotion) and enables cross-command PR number lookup
2. `vit-pr-reviewer` agent — reads PR diff via `gh pr diff`, posts structured severity-categorized review via `gh pr review --comment`; must use `--comment` only (self-review approval blocked by GitHub)
3. `vit-doc-updater` agent — spawned once after all phase waves complete; reads phase SUMMARY.md files, updates targeted README sections; must not touch `.planning/` files
4. `vit-changelog-writer` agent — spawned inside `complete-milestone` step 3; reads all phase SUMMARY.md files for milestone, writes versioned CHANGELOG entry; is the sole writer of versioned changelog entries
5. `execute-phase.md` modification — adds step 10.7 (draft PR creation + doc-updater spawn) after final wave
6. `verify-work.md` modification — adds step 8.5 (PR promotion + pr-reviewer spawn) on Route A only
7. `complete-milestone.md` modification — adds changelog-writer spawn before step 4 archive

Build order is strictly determined by dependencies: STATE.md schema first, then the three agents in parallel (no inter-dependencies), then command modifications in any order (each only depends on schema + its target agent).

See `/Users/aleix/Documents/ViT/vit-cc/.planning/research/ARCHITECTURE.md` for full data flow diagrams and integration point specifications.

### Critical Pitfalls

Eight pitfalls identified; the top five are build-time requirements, not optional hardening.

1. **Duplicate PR creation on re-run** — Guard every `gh pr create` call with `gh pr list --head <branch> --json number -q '.[0].number'`; only create if result is empty. Failing to do this causes execute-phase to error on re-run.

2. **PR targeting `main` instead of `milestone/vX.Y.Z`** — Always pass `--base milestone/v${MILESTONE_VERSION}` explicitly; `gh pr create` defaults to the repo's default branch. Wrong base branch breaks the entire merge order.

3. **`gh pr ready` called before verification passes** — Promotion must be gated strictly on Route A of `verify-work`. Routes B, C, and D must leave the PR as draft. An explicit `if [[ "$ROUTE" == "A" ]]` guard is required.

4. **Worktree path confusion in `gh` commands** — Every `gh` call must be prefixed with `cd "$WORK_DIR" &&`. The `gh` CLI resolves repo from cwd; in parallel milestone worktrees, missing this prefix silently operates on the wrong repo.

5. **Self-review approval blocked by GitHub** — `gh pr review --approve` or `--request-changes` on your own PR returns HTTP 422. `vit-pr-reviewer` must use `--comment` flag only, always.

Additional pitfalls (Phase 3): README overwrites destroying manual sections (use section-scoped updates), JSDoc write-back reformatting entire files (use `recast`, not `ts.createPrinter()`), CHANGELOG write conflicts between doc-updater and changelog-writer (doc-updater writes only to `[Unreleased]`; changelog-writer is sole writer of versioned entries).

See `/Users/aleix/Documents/ViT/vit-cc/.planning/research/PITFALLS.md` for full checklist and phase mapping.

## Implications for Roadmap

Based on the dependency graph in ARCHITECTURE.md and the pitfall-to-phase mapping in PITFALLS.md, a three-phase structure is recommended.

### Phase 1: PR Lifecycle Foundation

**Rationale:** STATE.md schema is a prerequisite for all three command modifications. The four Phase 1 pitfalls (duplicate PR creation, wrong base branch, premature promotion, worktree confusion) are correctness issues that must be solved before any downstream agents are useful. This phase delivers the minimum viable GitHub automation: feature branches become PRs, PRs promote to ready-for-review automatically.

**Delivers:** Idempotent draft PR creation, PR promotion on verification pass, STATE.md PR Mapping column, graceful `gh` degradation pattern for all subsequent work.

**Addresses:** Draft PR creation (P1), Draft-to-ready promotion (P1), Graceful gh CLI degradation (P1) from FEATURES.md.

**Avoids:** Duplicate PR creation, wrong base branch, premature promotion, worktree confusion (all Phase 1 pitfalls from PITFALLS.md).

**Files touched:** `files/vit/templates/state.md` (MODIFY), `files/commands/vit/execute-phase.md` (MODIFY — step 10.7), `files/commands/vit/verify-work.md` (MODIFY — step 8.5, promotion only, no reviewer yet).

### Phase 2: AI PR Reviewer

**Rationale:** The reviewer agent is independent of the doc-updater and changelog-writer but depends on PR Mapping being in STATE.md (Phase 1). Isolating it allows focused testing of the review comment posting pattern (and the self-review constraint) before adding more agent complexity.

**Delivers:** `vit-pr-reviewer` agent posting severity-tiered structured review comments on promoted PRs.

**Addresses:** AI PR reviewer (P1), severity-tiered review categories (P2) from FEATURES.md.

**Avoids:** Self-review approval block (GitHub 422) — `--comment`-only enforcement.

**Uses:** `gh pr review --comment --body-file`, `gh api` for inline diff comments (from STACK.md).

**Files touched:** `files/agents/vit-pr-reviewer.md` (NEW), `files/commands/vit/verify-work.md` (MODIFY — add reviewer spawn to step 8.5).

### Phase 3: Documentation and Changelog Agents

**Rationale:** These two agents share the same source material (SUMMARY.md files) and the same risk profile (scope creep, write conflicts). Grouping them ensures the CHANGELOG write discipline (doc-updater writes `[Unreleased]`, changelog-writer writes versioned) is implemented as a coordinated pair and tested together.

**Delivers:** `vit-doc-updater` agent (section-scoped README updates after each phase), `vit-changelog-writer` agent (versioned CHANGELOG entry per milestone), `complete-milestone.md` wired to spawn changelog-writer at step 3.

**Addresses:** CHANGELOG entry generation (P1), per-plan doc updater (P2), PR body enrichment (P2) from FEATURES.md.

**Avoids:** README overwrite destroying manual sections, JSDoc reformat via non-preserving printer, CHANGELOG incoherence between agents (Phase 3 pitfalls from PITFALLS.md).

**Uses:** `git-cliff` v2.12.0 (CHANGELOG generation), `recast` + `@babel/parser` (JSDoc write-back if in scope) from STACK.md.

**Files touched:** `files/agents/vit-doc-updater.md` (NEW), `files/agents/vit-changelog-writer.md` (NEW), `files/commands/vit/execute-phase.md` (MODIFY — add doc-updater spawn), `files/commands/vit/complete-milestone.md` (MODIFY — add changelog-writer spawn at step 3).

### Phase Ordering Rationale

- Phase 1 must come first because the PR Mapping column in STATE.md is a hard dependency for both Phase 2 (reviewer needs PR number) and Phase 3 (doc-updater spawned from the same execute-phase step that creates the PR).
- Phase 2 can be built before Phase 3 — the reviewer only depends on Phase 1 completion. Building it second keeps each phase independently testable.
- Phase 3 groups doc-updater and changelog-writer together because their CHANGELOG write discipline must be co-designed. Implementing them in separate phases risks the `[Unreleased]` vs. versioned boundary being inconsistent.
- ARCHITECTURE.md's build order suggestion of collapsing Phases 2 and 3 into one phase (agents as wave 1, command modifications as wave 2) is viable if the team prefers fewer phases; the three-phase split above optimizes for isolated risk.

### Research Flags

Phases with standard, well-documented patterns (can skip `research-phase`):
- **Phase 1:** All `gh` CLI commands are fully documented in official manual pages; idempotency pattern is established; no research needed.
- **Phase 2:** Review comment posting via `gh pr review --comment` is documented; self-review constraint is confirmed. No research needed.

Phases that may benefit from deeper research during planning:
- **Phase 3 (doc-updater):** Section-scoped README update strategy needs a concrete heading-identification approach; the pattern is known in principle but the exact implementation for varying README structures may need a targeted spike. Recommend a planning-time research step on README section identification heuristics.
- **Phase 3 (git-cliff config):** `cliff.toml` template customization for Keep a Changelog format is documented but configuration details (section mapping, tag patterns) benefit from a reference example. Low risk — can be addressed during Phase 3 plan creation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | `gh` CLI commands verified from official manual pages; git-cliff verified from git-cliff.org docs; `recast` recommendation from multiple converging community sources; only `jsdoc-api` version is MEDIUM (403 on npm direct fetch, confirmed via search) |
| Features | HIGH | GitHub CLI docs HIGH; AI reviewer severity-tier patterns MEDIUM (2026 industry surveys); feature dependency graph validated against existing codebase |
| Architecture | HIGH | Derived from direct codebase reading of all existing command and agent files; not based on external inference |
| Pitfalls | HIGH | Derived from architecture analysis + direct codebase reading; all pitfalls are concrete failure modes from the identified code paths |

**Overall confidence:** HIGH

### Gaps to Address

- **Node.js version constraint for git-cliff:** Target project users on Node 18.0–18.18 will get silent failures from git-cliff. Agent prompts must document this constraint and suggest `node --version` check before git-cliff use. Address in Phase 3 agent definition.

- **README section identification heuristics:** The doc-updater needs a reliable way to identify which README sections correspond to which changed components. Research during Phase 3 planning: consider heading-text matching against phase goal keywords vs. structured frontmatter.

- **Inline diff comment volume limits:** GitHub REST API for PR reviews with `comments` array has no documented hard limit in research, but large diffs from AI reviewers could hit rate limits or API size limits. Address in Phase 2 agent design: cap inline comments to top N findings, surface remainder in the overall review body.

## Sources

### Primary (HIGH confidence)
- https://cli.github.com/manual/gh_pr_create — `gh pr create` flags including `--draft`, `--base`, `--reviewer`
- https://cli.github.com/manual/gh_pr_ready — `gh pr ready` and `--undo` flag
- https://cli.github.com/manual/gh_pr_review — `gh pr review` flags and review type constraints
- https://cli.github.com/manual/gh_pr_edit — confirmed absence of draft status toggle
- https://docs.github.com/en/rest/pulls/reviews — REST endpoint schema for PR reviews with inline comments
- https://git-cliff.org/docs/installation/npm/ — git-cliff v2.12.0, Node.js requirements, programmatic API
- https://keepachangelog.com/en/1.1.0/ — Keep a Changelog 1.1.0 section format
- Direct codebase reading: `files/commands/vit/execute-phase.md`, `verify-work.md`, `complete-milestone.md`, `review-feedback.md`
- Direct codebase reading: `files/agents/vit-github-reviewer.md`
- Direct codebase reading: `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `INTEGRATIONS.md`
- Direct codebase reading: `files/vit/templates/state.md`

### Secondary (MEDIUM confidence)
- https://www.npmjs.com/package/jsdoc-api — version 9.3.5 (403 on direct fetch, confirmed via search)
- https://www.npmjs.com/package/recast — format-preserving AST printer (multiple community sources)
- https://github.com/cli/cli/issues/12396 — confirms `gh pr review` does not support inline comments natively
- https://dev.to/potloc/automatic-ready-for-review-github-action-5eb6 — idempotent PR creation pattern
- https://www.qodo.ai/blog/5-ai-code-review-pattern-predictions-in-2026/ — severity tier patterns for AI reviewers

### Tertiary (LOW confidence)
- https://dev.to/heraldofsolace/the-best-ai-code-review-tools-of-2026-2mb3 — ecosystem survey only, used for competitor feature comparison

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
