# Phase 2: AI PR Reviewer - Research

**Researched:** 2026-03-18
**Domain:** GitHub REST API (PR reviews), gh CLI, Claude Code agent authoring, LLM review prompt design
**Confidence:** HIGH (API endpoints verified via official docs + community discussions), MEDIUM (inline comment specifics, rate limits), LOW (exact 422 causes)

## Summary

Phase 2 builds a `vit-pr-reviewer` agent and wires it into the `verify-work` workflow after the existing `promote_pr` step. The agent reads the PR diff, invokes Claude as LLM reviewer, and posts the results back to GitHub using two distinct mechanisms: a body-level severity-tiered summary comment via `gh pr review --comment`, and inline diff comments on specific changed lines via the REST endpoint `POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews` with `event: "COMMENT"`.

The critical technical facts are:
1. `gh pr review --comment` posts a body-only review comment without approving or requesting changes — this is exactly what PRR-04 requires (no 422 errors). It does NOT support inline comments.
2. Inline diff comments require a separate REST call via `gh api repos/.../pulls/N/reviews` with a `comments[]` array containing `path`, `line`, `side`, and `body` fields. The `line` value must reference a line that EXISTS in the diff (additions or context lines only — deleted lines are silently dropped or cause 422).
3. Getting the diff and HEAD commit SHA are prerequisites that must happen before posting inline comments.
4. The agent must cap inline comments to a small number (the blocker concern in STATE.md says "top N") due to API size/validation limits.

**Primary recommendation:** Use a two-step posting strategy: (1) `gh pr review --comment -b "..."` for the severity-tiered body summary, (2) `gh api .../reviews` with `event: "COMMENT"` for up to 5 inline comments on the highest-severity findings only.

## Standard Stack

This phase is a bash/markdown agent — no npm packages. The "stack" is the tool ecosystem already present in the project.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `gh pr review --comment` | gh 2.x | Post body-level review comment | Already used in codebase (Phase 1); `--comment` avoids approve/request-changes 422 |
| `gh api repos/OWNER/REPO/pulls/N/reviews` | gh 2.x REST | Post inline diff comments + review body | Only path to inline comments without extra dependencies |
| `gh pr view --json headRefOid` | gh 2.x | Get HEAD commit SHA for inline comment API | Required field for the reviews endpoint; cleanest gh CLI approach |
| `gh pr diff` | gh 2.x | Fetch PR diff for LLM input + line number validation | Already available; outputs standard unified diff format |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `Task()` subagent | Claude Code built-in | Spawn `vit-pr-reviewer` from verify-work | How vit-executor, vit-planner, etc. are spawned |
| `jq` | system | Parse `gh api` JSON responses | Available on all modern macOS/Linux |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `gh api` REST for inline comments | `gh pr comment` | `gh pr comment` does not support inline diff comments (confirmed from cli/cli issues) |
| `gh pr review --comment` for body | `gh api` POST reviews with body only | `gh pr review --comment` is simpler and produces the same result for body-only |
| Two-step (body + inline) | Single API call with both | Single call with both is valid but the body-only summary still works if inline fails |

**Installation:** No new packages required. All tools are `gh` CLI (already a Phase 1 dependency).

## Architecture Patterns

### Recommended File Locations
```
.claude/agents/vit-pr-reviewer.md    # New agent definition (Plan 02-01)
.claude/commands/vit/verify-work.md  # Add spawn_reviewer step (Plan 02-02)
.claude/vit/workflows/verify-work.md # Mirror spawn_reviewer step (Plan 02-02)
files/commands/vit/verify-work.md    # Identical copy (project convention)
files/vit/workflows/verify-work.md   # Identical copy (project convention)
```

### Pattern 1: Agent Frontmatter Structure
**What:** Every agent in `.claude/agents/` has YAML frontmatter with `name`, `description`, `tools`, `color`.
**When to use:** Always — this is the Claude Code agent contract.
**Example:**
```yaml
---
name: vit-pr-reviewer
description: Reviews promoted PRs and posts severity-tiered findings as inline diff comments. Spawned by verify-work after PR promotion.
tools: Bash, Read
color: purple
---
```

### Pattern 2: Spawning Agents from Orchestrators
**What:** Orchestrators use `Task()` calls to spawn subagents. The verify-work workflow already does this for vit-planner and vit-plan-checker.
**When to use:** When verify-work needs to invoke the reviewer after the `promote_pr` step.
**Example (from verify-work.md lines 422-450 pattern):**
```
Task(
  prompt="""
<context>
PR Number: {PR_NUM}
Repo: {REPO}
...
</context>
""",
  subagent_type="vit-pr-reviewer",
  model="{reviewer_model}",
  description="AI review of PR #{PR_NUM}"
)
```

### Pattern 3: Two-Step GitHub Posting
**What:** Step 1 posts the body summary; Step 2 posts inline comments. Both use `event: "COMMENT"` to avoid approve/request-changes.
**When to use:** Always — this is the only approach that satisfies PRR-02 and PRR-03 simultaneously.

**Step 1 — Body summary:**
```bash
# Source: gh CLI manual (cli.github.com/manual/gh_pr_review)
gh pr review $PR_NUM \
  --comment \
  --body "## AI Review — Phase N

### block-merge
- [finding 1]

### should-fix
- [finding 2]

### nit
- [finding 3]" \
  2>/dev/null || true
```

**Step 2 — Inline comments (up to 5 highest-severity findings):**
```bash
# Get HEAD commit SHA
HEAD_SHA=$(gh pr view $PR_NUM --json headRefOid --jq '.headRefOid' 2>/dev/null)

# Get repo slug
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null)

# Build comments JSON array (path/line/side/body per finding)
# line must be a line number that appears as + or context (space) in the diff
# side: "RIGHT" for additions, "LEFT" for deletions (avoid LEFT — prone to 422)
COMMENTS_JSON='[{"path":"src/foo.ts","line":42,"side":"RIGHT","body":"[block-merge] Unhandled rejection here"}]'

# Post review with inline comments
gh api "repos/$REPO/pulls/$PR_NUM/reviews" \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -f commit_id="$HEAD_SHA" \
  -f event="COMMENT" \
  -f body="" \
  --input - <<EOF
{
  "commit_id": "$HEAD_SHA",
  "event": "COMMENT",
  "body": "",
  "comments": $COMMENTS_JSON
}
EOF
```
Source: Official GitHub REST API docs (docs.github.com/en/rest/pulls/reviews), verified via dev.to article on PR Reviews API

### Pattern 4: Diff Parsing for Valid Line Numbers
**What:** Inline comments REQUIRE line numbers that exist in the diff. Deleted lines (prefixed `-` in diff) are silently dropped or cause 422. Only additions (`+`) and context lines (` `) are valid.
**When to use:** Before building the `comments` array, parse the diff to identify valid line numbers.

```bash
# Get the PR diff
DIFF=$(gh pr diff $PR_NUM 2>/dev/null)

# Parse diff: extract file paths and addition line numbers
# Unified diff format: "+++ b/path/to/file" marks file, @@ -a,b +c,d @@ marks hunk
# Lines prefixed with "+" are additions (valid targets), " " are context (valid)
# Lines prefixed with "-" are deletions (invalid for RIGHT-side comments)

# Simple extraction of file+line info for LLM consumption:
# Feed raw diff to LLM and ask it to produce findings WITH valid file paths and line numbers
```

The LLM reviewer should be given the diff and instructed: "For inline comments, only reference lines that begin with `+` (new additions) in the diff. Do not reference deleted lines."

### Anti-Patterns to Avoid
- **Using `gh pr review --approve` or `--request-changes`:** Causes HTTP 422 errors when the token is the PR creator or lacks certain permissions. The success criteria explicitly prohibit this.
- **Posting inline comments on deleted lines (LEFT side):** GitHub silently drops or returns 422 for comments on non-existent positions. Use `side: "RIGHT"` only for additions.
- **Posting more than ~10 inline comments in one API call:** Known to cause 422 "Review comments is invalid" in some cases. Cap at 5 to be safe (matches the blocker concern in STATE.md).
- **Trusting STATE.md PR number blindly:** Follow the established Phase 1 pattern — query `gh pr list --head` to confirm the PR exists before the reviewer runs.
- **Making the reviewer blocking:** Like PR promotion, reviewer failure must log one line and not abort verify-work.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Inline diff comment posting | Custom HTTP client / curl | `gh api` REST endpoint | gh CLI handles auth, base URL, retries |
| Body review comment | Custom REST call | `gh pr review --comment` | One-liner, already established in project |
| Diff fetching | git diff + remote tracking | `gh pr diff $PR_NUM` | Gets the exact PR diff GitHub uses for review UI |
| HEAD SHA lookup | git log + remote comparison | `gh pr view --json headRefOid` | Always returns the PR's current HEAD, not local git HEAD |
| Agent spawning mechanism | Custom subprocess | `Task()` with `subagent_type` | Matches all existing orchestrators in the project |

**Key insight:** The project already has all required tools wired (`gh`, `Task()`). This phase is pure prompt engineering + wiring, not infrastructure work.

## Common Pitfalls

### Pitfall 1: HTTP 422 on inline comment API call
**What goes wrong:** `gh api repos/.../pulls/N/reviews` returns 422 with "Review comments is invalid"
**Why it happens:** The `line` field references a deleted line (diff `-` prefix), or the line number is outside the diff entirely, or the `commit_id` is stale (not the current HEAD)
**How to avoid:**
- Always fetch fresh `headRefOid` immediately before the API call
- Instruct the LLM to only reference lines prefixed with `+` in the diff
- Cap at 5 inline comments to avoid size-related 422s
- Wrap the `gh api` call in `|| true` so 422 doesn't abort verify-work
**Warning signs:** `422 Unprocessable Entity` in the gh output

### Pitfall 2: Reviewer attempts to approve or request changes
**What goes wrong:** `gh pr review --approve` or `--request-changes` returns 422 because the GITHUB_TOKEN is the PR author, or secondary rate limits block it
**Why it happens:** Confusion between review event types (`APPROVE`, `REQUEST_CHANGES` vs `COMMENT`)
**How to avoid:** Strictly use `gh pr review --comment` for the body summary, and `event: "COMMENT"` in the REST call. Never use APPROVE or REQUEST_CHANGES.
**Warning signs:** The success criteria (PRR-03, success criterion 4) explicitly test this

### Pitfall 3: LLM generates line numbers not in the diff
**What goes wrong:** The reviewer produces findings with plausible-sounding line numbers that don't exist in the actual diff
**Why it happens:** LLMs invent line numbers when not given the actual diff, or when given the wrong diff format
**How to avoid:** Always feed the actual `gh pr diff` output to the reviewer, and instruct it to copy exact file paths and line numbers from the diff. The reviewer prompt must include the raw diff, not a summary.
**Warning signs:** Inline comments silently disappear from the PR (GitHub dropped them)

### Pitfall 4: Reviewer runs on wrong routes (B, C, D)
**What goes wrong:** The reviewer runs even when tests failed, or on the last phase
**Why it happens:** The spawn call is placed outside the Route A gate
**How to avoid:** The `spawn_reviewer` step in verify-work must be nested inside the Route A gate — same gate as `promote_pr`. If `PR_PROMOTED=false`, the reviewer must not spawn.
**Warning signs:** UAT test: reviewer comment appears on a PR that is still a draft

### Pitfall 5: verify-work aborts if reviewer fails
**What goes wrong:** A reviewer crash or GitHub API error kills the verify-work session
**Why it happens:** `Task()` call without error handling
**How to avoid:** Wrap the Task call in graceful error handling — if reviewer fails, log one line and continue. Follow the same non-blocking pattern as `promote_pr`.
**Warning signs:** verify-work exits early; no completion summary printed

## Code Examples

Verified patterns from official sources:

### Get PR HEAD commit SHA
```bash
# Source: gh CLI (verified via WebSearch from GitHub community discussions)
HEAD_SHA=$(gh pr view $PR_NUM --json headRefOid --jq '.headRefOid' 2>/dev/null)
```

### Get repo slug
```bash
# Source: gh CLI
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null)
```

### Fetch PR diff for LLM input
```bash
# Source: cli.github.com/manual/gh_pr_diff
DIFF=$(gh pr diff $PR_NUM 2>/dev/null)
```

### Post body-only review comment (no approve/request-changes)
```bash
# Source: cli.github.com/manual/gh_pr_review
# --comment posts COMMENT event (not APPROVE or REQUEST_CHANGES)
gh pr review $PR_NUM --comment --body "$REVIEW_BODY" 2>/dev/null || true
```

### Post inline diff comments via REST API
```bash
# Source: GitHub REST API docs (docs.github.com/en/rest/pulls/reviews)
# event: "COMMENT" is the correct value for non-approving reviews
# comments[].line must be a line number visible in the diff (+/context lines only)
# comments[].side: "RIGHT" for new-file lines (additions)
gh api "repos/$REPO/pulls/$PR_NUM/reviews" \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  --input - <<EOF
{
  "commit_id": "$HEAD_SHA",
  "event": "COMMENT",
  "body": "",
  "comments": [
    {
      "path": "src/example.ts",
      "line": 42,
      "side": "RIGHT",
      "body": "[block-merge] Unhandled promise rejection"
    }
  ]
}
EOF
```

### Severity-tiered review body format
```markdown
## AI Review — Phase N: Phase Name

> Auto-generated by `vit-pr-reviewer`. Does not approve or block merge.

### block-merge
Issues that should be resolved before merging:
- **src/foo.ts:42** — Unhandled promise rejection: `fetchUser()` can throw but the caller has no try/catch

### should-fix
Issues worth fixing in this PR (non-blocking):
- **src/bar.ts:17** — Duplicate check: this condition is already enforced in the middleware

### nit
Minor suggestions:
- **src/baz.ts:88** — Prefer early return over nested condition

---
_Inline comments posted on specific diff lines above._
```

### How to inject reviewer spawn in verify-work (after promote_pr, Route A only)
```
# In verify-work.md, after the promote_pr step, inside the Route A gate:
if PR_PROMOTED=true:
  Task(
    prompt="...",
    subagent_type="vit-pr-reviewer",
    model="{reviewer_model}",
    description="AI review of PR #{PR_NUM}"
  ) || log "[reviewer failed — continuing]"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `position` parameter (diff offset from first `@@`) | `line` + `side` parameters | GitHub deprecated `position` in 2022+ | Use `line`/`side`; `position` still works but is being phased out |
| Single body comment only | Body summary + inline diff comments | Industry standard by 2024 | Reviewers see context without opening the diff |
| Manual PR review invocation | Auto-spawned after verify-work promotion | Phase 2 design decision | Zero friction; reviewer always runs before human sees PR |

**Deprecated/outdated:**
- `position` parameter: Still accepted but deprecated. Use `line` + `side` instead. The `position` value counts lines from the first `@@` hunk marker — much harder to compute correctly.

## Open Questions

1. **Exact 422 threshold for inline comment count**
   - What we know: The GitHub community discussion showed 422 when splitting into batches starting at 21+ comments. Individual batches of up to 20 succeeded.
   - What's unclear: Whether 422 at batch 2 was because of cumulative count, comment structure, or something else. Root cause is undocumented.
   - Recommendation: Cap at 5 inline comments (top-N findings by severity). This is conservative but safe and matches the blocker concern recorded in STATE.md.

2. **Model to use for the reviewer agent**
   - What we know: The project uses a `model_profile` system (quality/balanced/budget). The verify-work workflow already has a model lookup table for vit-planner (opus/opus/sonnet) and vit-plan-checker (sonnet/sonnet/haiku).
   - What's unclear: What model should vit-pr-reviewer use? The reviewer needs to read a diff and produce structured findings — this is substantive analysis.
   - Recommendation: Add vit-pr-reviewer to the model lookup table. Use sonnet/sonnet/haiku (same as plan-checker) as a baseline — the planner can adjust if quality is insufficient.

3. **Whether `body` field can be empty string in the inline-comments API call**
   - What we know: The body-level comment is handled separately by `gh pr review --comment`. The REST call is only for inline comments.
   - What's unclear: Whether `body: ""` is valid in the POST /reviews endpoint, or whether it requires a non-empty string.
   - Recommendation: Set `body: ""` for the REST call (inline-only). If this causes 422, fall back to including the same body summary in both calls. The plan should document this as a fallback.

4. **Token permissions for the review API**
   - What we know: `COMMENT` event works with standard gh CLI authentication. `REQUEST_CHANGES` and `APPROVE` can fail with 422 if the token is the PR author.
   - What's unclear: Whether the standard Claude Code / gh login token has the `pull_request: write` scope needed for the inline comments REST endpoint.
   - Recommendation: The agent should gracefully handle auth errors with a one-line log and continue, same as all other gh operations in this codebase.

## Sources

### Primary (HIGH confidence)
- `cli.github.com/manual/gh_pr_review` — Confirmed `--comment` flag behavior, that it does NOT approve or request changes
- `cli.github.com/manual/gh_pr_diff` — Confirmed output format is standard unified diff
- `docs.github.com/en/rest/pulls/reviews` (via WebSearch summary) — Confirmed endpoint `POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews`, request body structure (`commit_id`, `event`, `body`, `comments[]` with `path`/`line`/`side`/`body`)
- Phase 1 codebase (`.claude/commands/vit/verify-work.md`, `.claude/vit/workflows/verify-work.md`) — confirmed `promote_pr` step structure, Route A gate, agent spawning pattern via Task()

### Secondary (MEDIUM confidence)
- `dev.to/adamai/githubs-pr-reviews-api-why-i-ditched-comments-for-formal-reviews-31nn` — Confirmed: only additions and context lines are valid targets; `line` field (not `position`); `event: "COMMENT"` for neutral reviews
- `github.com/orgs/community/discussions/42272` — Confirmed 422 issues with large comment batches; root cause remains undocumented
- `code.claude.com/docs/en/code-review` — Confirmed severity model (Normal/Nit) and that Claude Code's own reviewer uses inline comments on specific diff lines without approving/blocking
- GitHub community WebSearch (2026) — Confirmed `gh pr view --json headRefOid --jq '.headRefOid'` for HEAD SHA

### Tertiary (LOW confidence)
- WebSearch for rate limits — Primary limit 5,000 req/hr authenticated; secondary limit 900 points/min. PR review API has no special separate limit documented. At 1-2 API calls per review, this is not a concern for this use case.

## Metadata

**Confidence breakdown:**
- Standard stack (tools): HIGH — All tools verified as existing and used in Phase 1
- API endpoint + body format: HIGH — Confirmed from official docs and verified article
- Valid line number constraints: HIGH — Confirmed from official docs and article
- Inline comment count limit: LOW — 422 root cause undocumented; cap-at-5 is conservative recommendation
- Model selection: LOW — No official guidance; using established project pattern

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (30 days — GitHub REST API is stable, gh CLI is stable)
