# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Phase 01 (vitepress-foundation): VitePress 1.6.4 documentation site in docs/ with dark mode, local search, Mermaid diagram rendering via vitepress-plugin-mermaid, ASCII art logo on landing page, VIT branding in site header, five section stub pages, and GitHub Actions deploy workflow targeting GitHub Pages

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

[Unreleased]: https://github.com/LeVarez/vit-cc/compare/v1.0...HEAD
[1.0]: https://github.com/LeVarez/vit-cc/releases/tag/v1.0
