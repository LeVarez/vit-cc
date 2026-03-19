# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1] - 2026-03-19

### Added

- Phase 01-01 (readme-rewrite skeleton): Complete README.md rewrite with ASCII art hero banner, all prose sections, and HTML comment placeholder markers for downstream plans
- Phase 01-02 (readme-rewrite commands): All 31 VIT commands documented in compact table format across 11 groups with ASCII section headers, sourced from command frontmatter
- Phase 01-03 (readme-rewrite agents and settings): 16-agent table with spawner/role/output columns and full settings reference (11 config.json keys, sample config, model profile matrix)
- Phase 01-04 (readme-rewrite style audit): Style consistency audit confirming 53-char banners, zero placeholders, all ASCII art in fenced code blocks
- Phase 01-05 (readme-rewrite hero banner): ANSI Shadow block-letter VIT branding inside a diff code block, rendering green on GitHub via + prefix syntax
- Phase 02-01 (docs-site foundation): VitePress 1.6.4 documentation site with blue-violet brand theming (#7c6af5), 3-section sidebar (10 links), landing page hero, and GitHub Actions Pages deployment workflow
- Phase 02-02 (docs-site guide pages): Four guide pages — How VIT Works (core loop, state management, Mermaid flowchart), Architecture Deep Dive (orchestrator pattern, wave parallelization, model profiles), Workflow Files, and Templates/References — all with content derived from source files
- Phase 02-03 (docs-site contributing guides): Three contributor guides — Command Anatomy (plan-phase.md walkthrough), Agent Anatomy (vit-planner.md walkthrough), and Testing (vit-test-writer + phase-ci.yml) — totaling 1,227 lines
- Phase 02-04 (docs-site reference pages): GitHub Integration reference (PR lifecycle Mermaid diagram, branch naming, CI comment formats), Configuration Reference (full config.json schema, 11-agent × 3-profile model profiles matrix), and Hooks/Sessions reference
- Phase 02-05 (docs-site build verification): VitePress build verified passing (exit 0, 6.05s, 12 HTML pages, no dead links); Phase 02 VERIFICATION.md produced with all 4 must-have truths PASSED
- Phase 03-01 (docs-gap-closure content): Fixed three content inconsistencies (install command in hooks-sessions.md, docs URL in README.md, model profile naming in configuration.md) and added five cross-links to isolated pages
- Phase 03-02 (docs-gap-closure CI verification): Confirmed deploy-docs.yml validity (actions/setup-node@v6 confirmed), identified GitHub Pages enablement as deploy prerequisite, closing all 6 audit gaps from the v1.1 milestone audit

## [1.0] - 2026-03-18

### Added

- Phase 1-01 (PR Column and Draft PR Creation): Draft PR creation in `execute-phase` with idempotency guard via live `gh pr list --head`, milestone-targeting, PR body assembled from ROADMAP.md + PLAN.md, and STATE.md PR column schema (`—`, `pr#N`, `pr#N(ready)`, `pr:skipped`)
- Phase 1-02 (PR Promotion in verify-work): `gh pr ready` step 8.5 in `verify-work` on Route A (all pass, more phases remain) promoting draft PR and updating STATE.md from `pr#N` to `pr#N(ready)`
- Phase 2-01 (vit-pr-reviewer Agent): AI PR reviewer agent with two-step GitHub posting (body summary via `gh pr review --comment` + up to 5 inline diff comments via REST) and three severity tiers (block-merge, should-fix, nit)
- Phase 2-02 (Verify-Work Reviewer Wiring): `vit-pr-reviewer` wired into `verify-work` as non-blocking step 8.6, auto-spawning after PR promotion on Route A only, with sonnet/sonnet/haiku model profile
- Phase 3-01 (vit-doc-updater Agent): Documentation updater agent reading phase SUMMARY.md files to autonomously update targeted README/docs sections and append to CHANGELOG.md `[Unreleased]` with Keep a Changelog 1.1.0 format
- Phase 3-02 (vit-changelog-writer Agent): Changelog writer agent promoting `[Unreleased]` to versioned CHANGELOG entries and updating milestone-wide README/docs via section-scoped Edit tool, with two-step atomic promotion logic
- Phase 3-03 (Wire Doc-Updater into Execute-Phase): `vit-doc-updater` wired into `execute-phase` as step 10.6 — spawns automatically after phase completion commit, before push, with all 5 context variables, non-blocking
- Phase 3-04 (Wire Changelog-Writer into Complete-Milestone): `vit-changelog-writer` spawned at step 3.5 in `complete-milestone` (after accomplishments extraction, before archive) with non-blocking `|| log` error handling

[Unreleased]: https://github.com/LeVarez/vit-cc/compare/v1.1...HEAD
[1.1]: https://github.com/LeVarez/vit-cc/compare/v1.0...v1.1
[1.0]: https://github.com/LeVarez/vit-cc/releases/tag/v1.0
