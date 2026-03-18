# Feature Research

**Domain:** GitHub-integrated agentic development workflow — PR lifecycle automation and auto-documentation
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH (GitHub CLI docs HIGH, AI reviewer patterns MEDIUM, doc update patterns MEDIUM)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that make the milestone scope feel complete. Missing any of these means the workflow has visible holes.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Draft PR creation on phase start | Feature branches exist but are invisible to GitHub workflow; PRs represent in-progress work | LOW | `gh pr create --draft -t title -b body -B base`. Must be idempotent: check with `gh pr list --head branch --state open` before creating. |
| PR title + body from phase context | A PR with no description is noise; reviewers need context without reading the branch | LOW | Title: phase name + issue number. Body: link to feature issue, phase goals from ROADMAP.md, link to PLAN.md. |
| Draft → ready-for-review promotion | Reviewers should not be notified until the work is actually done and verified | LOW | `gh pr ready` (gh CLI). Must be triggered only after `verify-work` passes. GraphQL `markPullRequestReadyForReview` mutation is the underlying API. |
| PR review comment (AI reviewer) | Code review is table stakes for any team workflow; automating it removes the "who reviews the AI's code?" question | MEDIUM | Agent reads the git diff, posts a structured review as a PR review comment via `gh pr review --comment`. |
| CHANGELOG entry generation | Every release needs a changelog; the vit workflow already has SUMMARY.md files per phase — they should become release notes | MEDIUM | Reads all phase SUMMARY.md files when `complete-milestone` runs. Output follows Keep a Changelog format: Added / Changed / Fixed / Removed / Security / Deprecated under versioned heading. |
| Incremental README updates | README drifts from code over time; per-plan updates keep it honest | MEDIUM | Agent reads diff of completed plan tasks, updates README sections that reference changed components. Scope-limited: only touch sections affected by the plan. |
| Idempotent GitHub operations | The same command may be run twice (retries, reruns); duplicate PRs or double changelog entries break trust | LOW | All GH operations check state before acting. PR creation uses `gh pr list` guard. Changelog check reads CHANGELOG.md before appending. |
| Graceful degradation without gh CLI | Not all users have `gh` installed or authenticated; existing VIT features must keep working | LOW | Wrap all GH operations in existence + auth checks. Skip silently, emit warning to issue comment if possible. Already a stated constraint in PROJECT.md. |

### Differentiators (Competitive Advantage)

Features that go beyond what manual or basic CI automation provides.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Structured AI review with severity tiers | Unlike generic review bots, a severity-categorized review (block-merge / should-fix / nit) lets the developer know exactly what requires action | MEDIUM | Industry standard emerging in 2026: "Action Required" / "Recommended" / "Minor". Categories: correctness, security, performance, style, standards. File + line + severity + rationale in each finding. |
| Review scoped to phase diff, not full codebase | Reviewing only what changed in this phase avoids noise from existing code debt | LOW | Pass `git diff milestone/vX.Y...feature/vX.Y-N` to reviewer agent, not full codebase scan. |
| Auto-linking PR to feature issue | Closes the issue automatically when PR merges, no manual `Closes #N` needed | LOW | Include `Closes #ISSUE_NUMBER` in PR body using issue number from STATE.md. |
| Per-plan doc update (not per-merge) | Docs updated incrementally as plans complete means docs are never more than one plan behind | MEDIUM | Post-plan hook in `vit-executor` spawns `vit-doc-updater`. Agent reads plan SUMMARY.md + git diff for that plan's commits, then patches README and updates JSDoc on changed public APIs. |
| CHANGELOG sourced from VIT phase summaries | Phase SUMMARY.md files are already human-readable; using them as changelog source is more accurate than parsing commit messages | MEDIUM | `vit-changelog-writer` reads `.planning/phases/*/SUMMARY.md` files. Conventional commits tooling parses commit messages — VIT's approach uses higher-level phase summaries instead. More accurate because summaries describe outcomes, not individual commits. |
| PR body linked to sub-issues and test results | PR body shows phase issue, sub-issues, and links to CI test result comments already posted | MEDIUM | PR body template references: feature issue, milestone, PLAN.md path, link to CI result comment (if available from STATE.md). |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem natural but add complexity without delivering value in this context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-merge after reviewer approves | Feels like full automation — no human needed | Bypasses the human review step that is explicitly part of the vit workflow; PRs ready-for-review signals human reviewers, not auto-merge | Let `gh pr ready` + reviewer assignment do the work; human merges |
| Webhook-driven state sync (GitHub → VIT) | Keep VIT STATE.md in sync with GitHub PR state in real time | Requires server infrastructure; VIT is a CLI tool with no server component. Already listed as out-of-scope in PROJECT.md | Push-only: VIT writes to GitHub, never reads back PR state into STATE.md |
| Full JSDoc regeneration on every plan | Keep docs always complete | Expensive (full AST parse), creates noise diffs, fails if one file has syntax error | Targeted JSDoc updates: only touch functions/files changed in the plan |
| Changelog diff from commit messages | Standard approach (conventional-changelog, git-cliff) used by many tools | VIT commits don't use Conventional Commits format; parsing them would produce low-quality entries | Use phase SUMMARY.md files as source — they already describe outcomes at the right granularity |
| PR labels / projects board management | Visibility on GitHub kanban boards | GitHub Projects is out-of-scope (PROJECT.md). Labels add configuration surface area with little value for a dev-only tool | Focus on issue + PR linking; skip label/project management |
| Review gating on merge (required status check) | Enforce that AI review runs before merge | Requires GitHub branch protection rules configuration on the target repo — VIT can't own that | Document recommendation for teams to add the AI review step as a recommended (not required) check |
| Global README rewrite | Keep the full README accurate | Too destructive per plan; high chance of introducing regressions in unrelated sections | Section-scoped updates based on plan task manifest |

---

## Feature Dependencies

```
[Draft PR creation]
    └──required by──> [Draft → ready-for-review promotion]
                          └──required by──> [AI PR reviewer runs]
                                                └──required by──> [PR review comment posted]

[feature issue in STATE.md]
    └──required by──> [PR body with issue link]
    └──required by──> [Closes #N in PR body]

[Phase SUMMARY.md exists]
    └──required by──> [CHANGELOG entry generation]
    └──enhances──> [PR body content]

[Plan SUMMARY.md exists]
    └──required by──> [Per-plan doc update (vit-doc-updater)]

[verify-work passes]
    └──gates──> [Draft → ready-for-review promotion]
    └──gates──> [AI PR reviewer spawned]

[gh CLI available + authenticated]
    └──required by──> [all GitHub operations]
    └──degrades-gracefully-without──> [workflow continues without GH steps]
```

### Dependency Notes

- **Draft PR creation requires nothing new**: only `gh pr create --draft` + idempotency guard. Can be added to `execute-phase` start.
- **Promotion requires verify-work to pass**: the existing `verify-work` step already exists; promotion is an additional step after it completes successfully.
- **AI reviewer requires promotion first (or can run in parallel)**: reviewer should run after verify-work passes, before or simultaneously with promotion — not before.
- **Doc updater requires plan SUMMARY.md**: executor already creates SUMMARY.md after each plan. Doc updater is triggered as a post-plan hook.
- **Changelog writer requires all phase SUMMARY.md files**: runs inside `complete-milestone`, where all phases are already done.
- **All GH operations conflict with absent gh CLI**: need a single shared `isGhAvailable()` guard used consistently.

---

## MVP Definition

### Launch With (v1)

Minimum to deliver the milestone value: zero-manual-GitHub-operations for the full phase lifecycle.

- [ ] **Idempotent draft PR creation** on `execute-phase` start — without this, the feature branch never becomes a PR
- [ ] **Draft → ready-for-review promotion** after `verify-work` passes — without this, PRs stay draft forever
- [ ] **AI PR reviewer** posts structured review comment (severity-tiered, diff-scoped) — the core differentiator of this milestone
- [ ] **CHANGELOG entry generation** in `complete-milestone` — required for each milestone release to be documented
- [ ] **Graceful gh CLI degradation** — required for backwards compatibility with users who haven't set up GH integration

### Add After Validation (v1.x)

Add once the core PR lifecycle is proven working.

- [ ] **Per-plan doc updater** — trigger: core PR lifecycle is stable and executor post-plan hook architecture is validated
- [ ] **PR body with full phase context** (sub-issue links, CI result links) — trigger: PR creation is solid, then enrich the body

### Future Consideration (v2+)

Defer until product-market fit on the milestone is established.

- [ ] **JSDoc targeted updates** — requires more investment in AST-level diff parsing; add when README-level updates are proven valuable
- [ ] **Attribution tracking for reviewer suggestions** — useful for calibrating reviewer quality, but requires persistent state across sessions

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Idempotent draft PR creation | HIGH | LOW | P1 |
| Draft → ready-for-review promotion | HIGH | LOW | P1 |
| AI PR reviewer (structured review comment) | HIGH | MEDIUM | P1 |
| CHANGELOG entry generation | HIGH | MEDIUM | P1 |
| Graceful gh CLI degradation | HIGH | LOW | P1 |
| PR body with phase/issue context | MEDIUM | LOW | P2 |
| Per-plan doc updater (README) | MEDIUM | MEDIUM | P2 |
| Severity-tiered review categories | MEDIUM | LOW | P2 (add to reviewer) |
| Targeted JSDoc updates | LOW | HIGH | P3 |
| Review suggestion attribution tracking | LOW | HIGH | P3 |

---

## Competitor Feature Analysis

Reference tools surveyed: CodeRabbit, Qodo, conventional-changelog, git-cliff, semantic-release.

| Feature | CodeRabbit / Qodo (external tools) | conventional-changelog / git-cliff | vit-cc approach |
|---------|------------------------------------|------------------------------------|-----------------|
| PR review comments | Line-by-line, severity-ranked, full diff scan | N/A | Diff-scoped (phase diff only), structured severity tiers, Claude-powered |
| Review categories | Correctness, security, performance, style, standards | N/A | Correctness + security + style; performance as optional category |
| CHANGELOG source | Commit messages or PR titles | Conventional commit messages | Phase SUMMARY.md files (higher-level, outcome-focused) |
| Doc updates | AI-generated diffs, full README rewrite | N/A | Section-scoped README updates, targeted JSDoc on changed APIs |
| PR lifecycle management | External service, requires app install | N/A | Built into vit-cc agents using `gh` CLI, zero extra installs |
| Degradation | Hard failure if service unavailable | N/A | Silent skip with warning when `gh` not available |

**Key differentiation:** vit-cc owns the full context (phase goals, PLAN.md, SUMMARY.md, issue numbers) that external tools never have. This makes the reviewer, doc updater, and changelog writer more accurate than tools that only see the git diff.

---

## Sources

- [GitHub Docs: Changing the stage of a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/changing-the-stage-of-a-pull-request) — HIGH confidence (official docs)
- [GitHub CLI: gh pr create](https://cli.github.com/manual/gh_pr_create) — HIGH confidence (official docs). Confirmed: `--draft`, `--title`, `--body`, `--base` flags.
- [GitHub CLI: gh pr ready](https://cli.github.com/manual/gh_pr_ready) — HIGH confidence (official docs). Confirmed: `--undo` for draft conversion.
- [GitHub REST API: pulls](https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28) — HIGH confidence (official docs). `PATCH /repos/{owner}/{repo}/pulls/{pull_number}` updates draft state.
- [DEV Community: Automatic Ready-for-Review GitHub Action](https://dev.to/potloc/automatic-ready-for-review-github-action-5eb6) — MEDIUM confidence. Confirmed idempotency pattern using `gh pr list --head branch --state open`.
- [gh/cli discussion #5792: idempotent PR creation](https://github.com/cli/cli/discussions/5792) — MEDIUM confidence. Confirmed check-before-create pattern.
- [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) — HIGH confidence (official spec). Six standard sections: Added, Changed, Deprecated, Removed, Fixed, Security.
- [Qodo: 5 AI Code Review Pattern Predictions in 2026](https://www.qodo.ai/blog/5-ai-code-review-pattern-predictions-in-2026/) — MEDIUM confidence. Confirmed severity tiers and specialist-agent categories.
- [CodeRabbit AI PR Reviewer](https://github.com/coderabbitai/ai-pr-reviewer) — MEDIUM confidence (README). Confirmed GitHub API comment posting pattern.
- [WebSearch: Best AI Code Review Tools 2026](https://dev.to/heraldofsolace/the-best-ai-code-review-tools-of-2026-2mb3) — LOW confidence (single source). Used for ecosystem survey only.

---
*Feature research for: GitHub PR lifecycle automation and auto-documentation in vit-cc*
*Researched: 2026-03-18*
