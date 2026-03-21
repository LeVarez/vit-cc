# Pitfalls Research

**Domain:** GitHub PR lifecycle automation + AI-driven doc/changelog agents in Claude Code framework
**Researched:** 2026-03-18
**Confidence:** HIGH (derived from architecture analysis, features research, stack research, and direct codebase reading)

## Critical Pitfalls

### Pitfall 1: Duplicate PR creation on re-run

**What goes wrong:**
`gh pr create` exits with a non-zero code if a PR already exists for the branch. If `execute-phase` is re-run (common after partial failure), it errors instead of continuing cleanly.

**How to avoid:**
Guard with `gh pr list --head <branch> --json number -q '.[0].number'` before creating. If a PR exists, read its number. Only call `gh pr create` if result is empty.

**Warning signs:** Execute-phase output shows `gh: pull request already exists`.

**Phase to address:** Phase 1 (PR lifecycle)

---

### Pitfall 2: PR targeting `main` instead of `milestone/vX.Y.Z`

**What goes wrong:**
`gh pr create` defaults `--base` to the repo's default branch when not specified. Feature branches merge into `main` instead of their milestone branch.

**How to avoid:**
Always pass `--base milestone/v${MILESTONE_VERSION}` explicitly. Read `MILESTONE_VERSION` from STATE.md.

**Warning signs:** `gh pr view --json baseRefName` returns `main`.

**Phase to address:** Phase 1

---

### Pitfall 3: `gh pr ready` called before verification passes

**What goes wrong:**
PR promoted to ready-for-review while code still has gaps. `verify-work` has Routes A/B/C — promotion must only happen on Route A.

**How to avoid:**
Explicit route check: `if [[ "$ROUTE" == "A" ]]; then gh pr ready ...`. Routes B and C leave PR as draft.

**Phase to address:** Phase 1

---

### Pitfall 4: Worktree path confusion in `gh` commands

**What goes wrong:**
`gh` CLI resolves repo from current working directory. Commands run without `cd "$WORK_DIR" &&` prefix operate on the wrong repo in parallel milestone worktrees.

**How to avoid:**
Every `gh` command must be prefixed with `cd "$WORK_DIR" &&`. Follow the pattern in `vit-github-reviewer.md`.

**Phase to address:** Phase 1

---

### Pitfall 5: README overwrite destroys manual sections

**What goes wrong:**
`vit-doc-updater` regenerates the entire README instead of updating targeted sections. Badges, screenshots, and custom prose are silently overwritten.

**How to avoid:**
Doc updater must use section headings to identify which parts to update. Preserve all sections not matching changed components verbatim.

**Phase to address:** Phase 3 (doc updater)

---

### Pitfall 6: JSDoc write-back reformats entire file

**What goes wrong:**
Using `ts.createPrinter()` or naive string replacement to update JSDoc produces massive noisy diffs — entire files reformatted when only 2 comments changed.

**How to avoid:**
Use `recast` for write-back — it preserves original formatting for unchanged nodes.

**Phase to address:** Phase 3

---

### Pitfall 7: CHANGELOG entries incoherent across agents

**What goes wrong:**
`vit-doc-updater` (per-plan) and `vit-changelog-writer` (per-milestone) both write to CHANGELOG producing duplicate or contradictory entries.

**How to avoid:**
`vit-doc-updater` writes only to `[Unreleased]` section. `vit-changelog-writer` reads phase SUMMARY.md files and replaces `[Unreleased]` with a versioned entry. Only one agent writes final versioned entries.

**Phase to address:** Phase 3

---

### Pitfall 8: `gh pr review` self-review blocked by GitHub

**What goes wrong:**
`gh pr review --approve` or `--request-changes` on your own PR returns 422 — GitHub blocks self-review.

**How to avoid:**
`vit-pr-reviewer` must always use `--comment` flag only. Include severity summary; defer actual approval to a human.

**Phase to address:** Phase 2 (PR reviewer)

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `gh pr create` | Omit `--base` | Always pass `--base milestone/v${VERSION}` |
| `gh pr review` | Use `--approve` | Use `--comment` only — self-review blocked |
| `gh pr ready` | Run unconditionally | Guard with Route A check only |
| STATE.md PR column | Forget to update | Write PR number immediately after `gh pr create` |
| doc-updater | Full README rewrite | Section-scoped updates only |
| CHANGELOG | Two agents writing versioned entries | Only changelog-writer writes versioned; doc-updater uses `[Unreleased]` |

## "Looks Done But Isn't" Checklist

- [ ] **Draft PR:** PR exists — verify base is `milestone/vX.Y.Z` not `main`
- [ ] **PR promotion:** Ready-for-review — verify only triggers on Route A
- [ ] **PR reviewer:** Comment posted — verify `--comment` flag used, no 422 errors
- [ ] **Doc updater:** README updated — verify manual sections preserved in git diff
- [ ] **Changelog writer:** Entry added — verify `[Unreleased]` replaced with versioned entry
- [ ] **STATE.md:** PR number stored — verify accessible from verify-work
- [ ] **Graceful degradation:** All steps skip silently when `gh` unavailable

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase |
|---------|-----------------|
| Duplicate PR creation | Phase 1 |
| Wrong PR base branch | Phase 1 |
| Premature PR promotion | Phase 1 |
| Worktree `gh` confusion | Phase 1 |
| README overwrite | Phase 3 |
| JSDoc reformat | Phase 3 |
| CHANGELOG incoherence | Phase 3 |
| Self-review permission | Phase 2 |

---

### Pitfall 9: Draft PR created before any commits exist on head branch

**What goes wrong:**
`gh pr create` requires at least one commit on the head branch that is not on the base. Creating the PR at `execute-phase` startup (before Wave 1 executor commits) always fails with "Head sha can't be blank."

**How to avoid:**
Defer PR creation to **after Wave 1 completes** — not at execute-phase startup. The first wave always produces commits; create the PR immediately after Wave 1 finishes, before Wave 2 starts.

**Phase to address:** Phase 1

---

### Pitfall 10: Duplicate reviewer comments on re-verification

**What goes wrong:**
`verify-work` can run multiple times (gap closure cycles). If `gh pr ready` and reviewer spawn are gated only on Route A (not on current PR state), re-running verify-work on an already-promoted PR spawns a second reviewer and posts duplicate review comments.

**How to avoid:**
Check `gh pr view --json isDraft -q '.isDraft'` before calling `gh pr ready`. Only promote and spawn reviewer if PR is currently a draft. If already ready-for-review, skip both steps silently.

**Phase to address:** Phase 1 and Phase 2

---

### Pitfall 11: GitHub secondary rate limit on parallel-heavy phases

**What goes wrong:**
GitHub caps content-creating API requests at 80/minute. A phase with 6+ concurrent plans simultaneously creating PRs, posting issue comments, and checking off sub-issues can hit this limit, causing silent `gh` failures.

**How to avoid:**
Add `|| true` on all `gh` calls and log rate-limit errors without aborting. For phases with many parallel plans, batch GitHub writes after wave completion rather than inline per-plan.

**Phase to address:** Phase 1

---

*Pitfalls research for: GitHub PR lifecycle automation + AI doc/changelog agents in vit-cc*
*Researched: 2026-03-18*
