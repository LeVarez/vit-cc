---
title: GitHub Integration
---

# GitHub Integration

VIT keeps your GitHub repository in sync automatically — branches are created, PRs are opened as drafts, issues are linked, checkboxes are checked off, and PRs are promoted to ready-for-review without you touching GitHub directly.

This page is the technical reference for that integration. For a higher-level view of where GitHub fits in the workflow, see [How VIT Works](/guide/how-vit-works).

## Branch Naming Convention

VIT uses a three-level branch hierarchy that maps directly to its milestone → phase → plan structure.

| Level | Pattern | Example | Purpose |
|-------|---------|---------|---------|
| Milestone | `milestone/v{X.Y}` | `milestone/v1.1` | Base branch for all phase work in a milestone |
| Feature (phase) | `feature/v{X.Y}-{NN}-{slug}` | `feature/v1.1-02-docs-site` | One branch per phase; PRs target the milestone branch |
| Plan | `feature/v{X.Y}-{NN}-{PP}` | `feature/v1.1-02-04` | Worktree branch for parallel plan execution |

**Hierarchy rules:**
- Plan branches are merged into their feature branch as plans complete
- Feature branches target the milestone branch via PR
- The milestone branch is eventually merged to `main` when the milestone ships

**Branch creation:** Feature and plan branches are created by `/vit:new-milestone` (via `gh issue develop`) and by `/vit:execute-phase` (via `git worktree add`). You never create branches manually.

## PR Lifecycle

Each phase gets one draft PR opened at the start of execution and promoted to ready-for-review after verification passes.

```mermaid
flowchart TD
    A[/vit:execute-phase N/] --> B[Create draft PR\nfeature/vX.Y-NN → milestone/vX.Y]
    B --> C[Execute Wave 1 plans\nin parallel worktrees]
    C --> D[Execute Wave 2 plans\nin parallel worktrees]
    D --> E[Push commits to remote]
    E --> F[CI triggers on push\nphase-ci.yml runs]
    F --> G{All plans\ncomplete?}
    G -- gaps found --> H[vit-verifier reports gaps\nIssue comment posted]
    G -- passed --> I[Promote PR to ready-for-review\ngh pr ready]
    I --> J[vit-pr-reviewer runs\nPosts review comments]
    J --> K[Human reviews PR\nMerge to milestone branch]
    H --> L[/vit:plan-phase N --gaps/\nCreate gap closure plans]
    L --> C
```

**Key milestones in the lifecycle:**

1. **Draft PR created** — `/vit:execute-phase` opens a draft PR before any plans run. The PR body includes the phase goal, a checklist of plans, and links to the feature issue.

2. **Plans execute** — Sub-agents run in parallel worktrees. Each plan commit is pushed to the feature branch.

3. **Sub-issue checkboxes checked** — After each wave completes, the corresponding sub-issue checkbox in the feature issue body is automatically checked off.

4. **CI runs** — Pushing to the feature branch triggers `phase-ci.yml`, which runs type checks and phase tests, then posts results as a comment on the feature issue.

5. **Verification** — After all plans complete, `vit-verifier` checks the `must_haves` in each plan against the actual codebase. If gaps are found, the PR stays in draft.

6. **Ready-for-review** — When verification passes, the PR is promoted (`gh pr ready`) and the `default_reviewer` from `config.json` is assigned.

7. **Human review** — You review the PR and merge when satisfied.

## Issue Linking

VIT creates a two-level issue hierarchy that mirrors its milestone → phase → plan structure.

### Feature issues (one per phase)

Created by `/vit:new-milestone` for each phase in the roadmap:

```bash
gh issue create \
  --title "feat(v1.1): Phase 02 — docs-site" \
  --milestone "$GH_MILESTONE" \
  --body "..."
```

The feature branch is then linked to the issue via the GitHub Development panel:

```bash
gh issue develop $FEATURE_ISSUE \
  --base "milestone/v1.1" \
  --name "feature/v1.1-02-docs-site"
```

If `gh issue develop` is unavailable (older gh version), VIT falls back to creating and pushing the branch directly.

### Sub-issues (one per plan)

Created by `/vit:plan-phase` for each plan in the phase. Sub-issues are listed as checkboxes in the feature issue body:

```
## Sub-issues
- [ ] #61 Plan 01: VitePress foundation
- [ ] #62 Plan 02: Guide pages
- [ ] #63 Plan 03: Architecture diagrams
- [ ] #64 Plan 04: Reference pages
- [ ] #65 Plan 05: Gap closure
```

As each plan completes during `/vit:execute-phase`, its checkbox is checked off automatically:

```bash
UPDATED_BODY=$(echo "$CURRENT_BODY" | sed "s/- \[ \] $SUB_ISSUE/- [x] $SUB_ISSUE/g")
gh issue edit "$FEATURE_ISSUE" --body "$UPDATED_BODY"
```

### Refs and Closes

Task commits reference sub-issues (`Refs #64`) so GitHub links commits to issues. The final plan metadata commit uses `Closes #64` to auto-close the sub-issue on merge.

## CI Workflow

The `phase-ci.yml` GitHub Actions workflow triggers automatically on pushes to `feature/**`, `milestone/**`, and `quick/**` branches.

**Trigger:**
```yaml
on:
  push:
    branches:
      - 'feature/**'
      - 'milestone/**'
      - 'quick/**'
```

**Permissions:** `contents: read`, `issues: write` (to post comments).

**Steps:**

1. **Type check** — Runs `npm run check` (TypeScript). Continues on error so tests still run.
2. **Phase tests** — Runs Vitest against `tests/phases/` if tests exist. Supports both milestone-scoped (`tests/phases/v1.6/`) and legacy (`tests/phases/`) layouts.
3. **Parse results** — Extracts `numTotalTests`, `numPassedTests`, `numFailedTests` from the JSON reporter output.
4. **Find linked issue** — Extracts the milestone and phase from the branch name, then looks up the feature issue number from `STATE.md`.
5. **Post results** — Posts a comment to the feature issue with the CI outcome.

**Comment format — no tests yet:**
```
## CI — Phase v1.1/02 @ `a1b2c3d`

**Branch:** `feature/v1.1-02-docs-site`
**Status:** No phase tests yet — waiting for test generation

Tests are created by `vit-test-writer` after phase execution completes.
```

**Comment format — all passing:**
```
## CI Passed — Phase v1.1/02 @ `a1b2c3d`

**Branch:** `feature/v1.1-02-docs-site`
**Tests:** 12/12 passed

All unit tests green. Ready for human review.

Run `/vit:verify-work 02` to complete manual UAT.
```

**Comment format — failures:**
```
## CI Failed — Phase v1.1/02 @ `a1b2c3d`

**Branch:** `feature/v1.1-02-docs-site`
**Tests:** 10/12 passed — **2 failing**

### Failing tests
  FAIL src/tests/...
```

The job exits with code 1 if any tests fail, making the PR check red.

## PR Review Gates

After a phase passes verification, `vit-pr-reviewer` is spawned automatically. It performs a structured review of all changes in the feature branch PR and posts findings as GitHub review comments.

**What vit-pr-reviewer checks:**

- **Must-haves coverage** — Verifies that every `must_haves` truth and artifact from each plan's frontmatter is present in the actual code
- **Plan alignment** — Checks that the implementation matches the plan's stated objective and tasks
- **Correctness** — Flags bugs, logic errors, missing error handling, unhandled edge cases
- **Security** — Checks for authentication gaps, missing validation, exposed secrets
- **Code quality** — Notes significant style deviations or patterns that don't match the established codebase conventions

**Comment format:** The reviewer posts an overall summary comment and up to 5 inline diff comments on specific lines. The cap prevents comment floods on large PRs while still surfacing the most important issues.

**After review:** The PR is in `ready-for-review` state. You receive the review comments and decide whether to merge, request changes, or have VIT fix specific issues.

## STATE.md Mapping

The `GitHub Issue Mapping` table in `.planning/STATE.md` is the source of truth linking each phase to its GitHub artifacts:

```markdown
## GitHub Issue Mapping

| Phase | Feature Issue | Branch | PR | Assigned | Sub-issues |
|-------|---------------|--------|----|----------|------------|
| v1.1/01 | #47 | feature/v1.1-01-readme-rewrite | pr#53(ready) | — | #49, #50, #51, #52 |
| v1.1/02 | #48 | feature/v1.1-02-docs-site | pr#66 | — | #61, #62, #63, #64, #65 |
```

**How STATE.md stays in sync:**

| Event | STATE.md update |
|-------|-----------------|
| `/vit:new-milestone` creates feature issue | Phase row added with issue number and branch |
| `/vit:execute-phase` creates draft PR | PR column updated: `—` → `pr#N` |
| Phase verification passes | PR column updated: `pr#N` → `pr#N(ready)` |
| Plan assigned to team member | Assigned column updated |

**CI uses STATE.md** — `phase-ci.yml` reads STATE.md to find the feature issue number for posting comments. This is the single source of truth; CI does not query the GitHub API for issue discovery.

**Reading the mapping:** The `vit-executor` agent reads the mapping to find sub-issue numbers for `Refs` and `Closes` annotations in commit messages.
