# Stack Research

**Domain:** GitHub PR lifecycle automation + Claude Code agentic tooling (Markdown system prompts)
**Researched:** 2026-03-18
**Confidence:** HIGH for gh CLI commands; MEDIUM for JSDoc update approach; HIGH for CHANGELOG tooling

---

## Scope

This research covers three new capability domains being added to vit-cc:

1. Programmatic GitHub PR management (create draft, promote to ready, post reviews)
2. JSDoc/docstring extraction and targeted updates
3. CHANGELOG generation from git history or structured phase summaries

The existing stack (Node.js CLI, `gh` CLI, GitHub Actions, Markdown agent definitions) is already
validated and is NOT re-evaluated here.

---

## Recommended Stack

### 1. GitHub PR Management

All PR operations are already handled by the `gh` CLI (v2.88.1 as of March 2026). No additional
library is needed. The full command set for the new features:

| Operation | Command | Notes |
|-----------|---------|-------|
| Create draft PR | `gh pr create --draft --title "..." --body "..."` | Returns PR URL on success |
| Create PR with reviewer | `gh pr create --reviewer <login>` | Can combine with `--draft` |
| Promote draft to ready | `gh pr ready [<number>]` | Omit number to use current branch |
| Convert ready back to draft | `gh pr ready --undo [<number>]` | Requires GitHub plan that supports drafts |
| Post review (approve) | `gh pr review <number> --approve --body "..."` | |
| Post review (request changes) | `gh pr review <number> --request-changes --body "..."` | |
| Post review (comment only) | `gh pr review <number> --comment --body "..."` | |
| Read body from file | `gh pr review <number> --comment --body-file <file>` | Use for multi-line reviews |
| Edit title/body/labels | `gh pr edit <number> --title "..." --body "..."` | Does NOT change draft status |
| View PR as JSON | `gh pr view <number> --json title,body,state,isDraft` | For status checks |

**Inline review comments (per-line):** `gh pr review` does not support inline diff comments
natively. For posting inline comments, use `gh api` against the REST endpoint directly:

```bash
gh api repos/{owner}/{repo}/pulls/{pull_number}/reviews \
  --method POST \
  --field body="Review summary" \
  --field event="REQUEST_CHANGES" \
  --field "comments[][path]=src/foo.js" \
  --field "comments[][line]=12" \
  --field "comments[][body]=This needs attention"
```

REST endpoint: `POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews`

Body parameters:
- `body` (string) — overall review body
- `event` (string) — `APPROVE` | `REQUEST_CHANGES` | `COMMENT`
- `commit_id` (string, optional) — defaults to latest commit
- `comments` (array) — inline comments, each with `path`, `line`, `body`

**Confidence:** HIGH — verified from official gh CLI manual pages and GitHub REST API docs.

**Source:** https://cli.github.com/manual/gh_pr_create, https://cli.github.com/manual/gh_pr_ready,
https://cli.github.com/manual/gh_pr_review, https://docs.github.com/en/rest/pulls/reviews

---

### 2. CHANGELOG Generation

**Recommendation: git-cliff v2.12.0 (npm package)**

git-cliff is a Rust-based binary distributed as an npm package. It generates changelogs from git
history following the Conventional Commits specification, with optional Keep a Changelog output
format.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| git-cliff | 2.12.0 | CHANGELOG generation from git log | Fastest in class; native Conventional Commits support; Keep a Changelog output; programmatic Node.js API; active maintenance (last release: Feb 2026) |
| Conventional Commits | 1.0.0 (spec) | Commit message format convention | Industry standard; drives git-cliff parsing; already used by similar tools in this ecosystem |

**Installation:**

```bash
npm install git-cliff --save-dev
```

Node.js requirements: >=18.19 | >=20.6 | >=21 (matches vit-cc's `engines.node: ">=18"` with a minor caveat — see Version Compatibility section).

**Programmatic API (for use inside agent scripts):**

```javascript
import { runGitCliff } from "git-cliff";

await runGitCliff({
  // typed Options object — same flags as CLI
  unreleased: true,
  tag: "1.2.0",
});
```

**CLI usage (for use in bash steps inside Markdown agents):**

```bash
# Generate full changelog
npx git-cliff -o CHANGELOG.md

# Generate only unreleased entries (for PR description injection)
npx git-cliff --unreleased --strip all

# Generate changelog for a specific tag range
npx git-cliff v1.0.0..HEAD
```

**Keep a Changelog output:** git-cliff supports Keep a Changelog 1.1.0 format sections (Added,
Changed, Deprecated, Removed, Fixed, Security) via `cliff.toml` template configuration.

**Why NOT conventional-changelog npm package:** The `conventional-changelog` npm ecosystem is
fragmented — it is split across many sub-packages (`conventional-changelog-core`,
`conventional-changelog-angular`, etc.), has a more complex programmatic API, and is slower than
git-cliff. git-cliff has cleaner configuration, better documentation, and is more actively
developed as of 2025-2026.

**Confidence:** HIGH — version verified from git-cliff.org docs (v2.12.0) and npm page; Node.js
requirements verified; programmatic API confirmed in docs.

**Source:** https://git-cliff.org/docs/installation/npm/, https://git-cliff.org/docs/

---

### 3. JSDoc/Docstring Extraction and Targeted Updates

This domain requires two distinct operations:

**A. Extraction (reading existing docs):** `jsdoc-api` v9.3.5

**B. Targeted updates (writing back to source):** `recast` + Babel parser

The operations are intentionally separate because no single library handles both well.

#### 3A. Extraction: jsdoc-api

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| jsdoc-api | 9.3.5 | Programmatic JSDoc extraction into structured JSON doclets | Wraps jsdoc's `explain()` API; returns structured array of doclets with name, description, params, returns, tags; caching support; actively maintained |

```javascript
import jsdocApi from "jsdoc-api";

const doclets = await jsdocApi.explain({
  files: ["src/**/*.js"],
  cache: true,
});
// Returns array of doclet objects: { name, description, params, returns, ... }
```

Use `jsdoc-api` when the agent needs to read existing JSDoc to produce summaries, detect missing
documentation, or feed structured info into a changelog or README updater.

**Confidence:** MEDIUM — version 9.3.5 confirmed from npm search results. API shape confirmed
from multiple sources but not directly verified via Context7.

#### 3B. Targeted Updates: recast + @babel/parser

When an agent needs to **write JSDoc comments back** into source files (add missing docs, update
@param descriptions, etc.), use `recast` with `@babel/parser`.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| recast | latest (^0.23.x) | AST-based code transform with format preservation | Reprints only modified nodes; preserves indentation, quotes, whitespace — critical for doc-only patches that must not cause diff noise |
| @babel/parser | latest (^7.x) | Parse JS/TS source to AST including leadingComments | Well-maintained; handles JSX, TypeScript, modern JS syntax |
| @babel/types | latest (^7.x) | Construct new AST comment nodes | Required when building new JSDoc blocks programmatically |

**Pattern:**

```javascript
import recast from "recast";
import * as babelParser from "@babel/parser";

const source = fs.readFileSync("src/foo.js", "utf8");
const ast = recast.parse(source, {
  parser: {
    parse: (src) =>
      babelParser.parse(src, {
        sourceType: "module",
        plugins: ["typescript"],
        attachComment: true,
      }),
  },
});

// Mutate leadingComments on target node
// ...

const { code } = recast.print(ast);
fs.writeFileSync("src/foo.js", code);
```

**Why NOT regex-based doc updates:** Regex-based JSDoc patching breaks on multi-line comments,
nested tags, and format variations. It creates high false-positive rates on any non-trivial
codebase. recast guarantees source fidelity for unchanged nodes.

**Why NOT TypeScript Compiler API for write-back:** The TS compiler API is excellent for
extraction and type inference but does not provide a format-preserving printer. Using
`ts.createPrinter()` reformats all code, not just the changed nodes, producing large diffs on
doc-only updates.

**Confidence:** MEDIUM — recast recommendation is well-established in the Node.js AST tooling
community (multiple sources converge); TS Compiler API limitation on printing is confirmed in
official TS discussions.

---

## Supporting Libraries Summary

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| git-cliff | 2.12.0 | CHANGELOG generation | Any milestone completion or PR description generation |
| jsdoc-api | 9.3.5 | JSDoc extraction to JSON | When agent reads existing docs (changelog writer, doc auditor) |
| recast | ^0.23.x | Format-preserving AST write-back | When agent patches JSDoc comments into source files |
| @babel/parser | ^7.x | Parse JS/TS source | Required by recast for full syntax coverage |
| @babel/types | ^7.x | Construct AST nodes | Required when building new doc comment nodes |

**Note on installation:** These are dev dependencies or agent-invoked tools. They do NOT go into
the vit-cc package itself. They go into the `devDependencies` of the **target project** where the
agents run. Agent Markdown prompts should check for presence and instruct installation if missing.

---

## Development Tools (GitHub Actions)

No new Actions dependencies needed. The existing `phase-ci.yml` workflow pattern already uses
`gh` CLI within Action runners. New workflows for PR automation should follow the same pattern:
use `gh` CLI commands directly, invoking `gh pr create`, `gh pr review`, and `gh api` as needed.

For git-cliff in CI:

```yaml
- name: Generate changelog
  run: npx git-cliff --unreleased --strip all
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| CHANGELOG generation | git-cliff | conventional-changelog | Fragmented npm ecosystem; more complex API; git-cliff is faster and better maintained as of 2026 |
| CHANGELOG generation | git-cliff | auto-changelog | Less customizable; no programmatic API; smaller community |
| CHANGELOG generation | git-cliff | semantic-release | Full release automation (opinionated about versioning/publishing); overkill for agents that only need CHANGELOG text |
| JSDoc extraction | jsdoc-api | TypeDoc | TypeDoc requires TypeScript; vit-cc targets JS-first projects; jsdoc-api works on plain JS |
| JSDoc write-back | recast + babel | Regex patching | Brittle; breaks on complex comments; not maintainable |
| JSDoc write-back | recast + babel | TS Compiler API | No format-preserving printer; rewrites entire file on print |
| Inline PR comments | gh api (REST) | gh-pr-review extension | Extension adds external dependency; `gh api` is built-in and sufficient for agent-posted reviews |
| PR draft management | gh pr ready | GitHub GraphQL API | `gh pr ready` is simpler and already available via the installed gh CLI |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `regex` for JSDoc write-back | Brittle on multi-line comments, nested tags, whitespace variants | recast + @babel/parser |
| `ts.createPrinter()` for doc updates | Reformats entire file, not just changed nodes | recast (format-preserving) |
| `conventional-changelog` npm package | Fragmented sub-package ecosystem, complex setup | git-cliff |
| `semantic-release` | Opinionated full release pipeline; assumes ownership of version bumping and npm publishing | git-cliff (CHANGELOG only) |
| `gh pr edit` for draft toggling | `gh pr edit` does NOT support changing draft status | `gh pr ready` / `gh pr ready --undo` |

---

## Stack Patterns by Variant

**If generating CHANGELOG for a PR description (not a file):**
- Use `npx git-cliff --unreleased --strip all`
- Capture stdout and pass as `--body` to `gh pr create`
- Because: `--strip all` removes header/footer, leaving only the entry list

**If generating full CHANGELOG.md for a release:**
- Use `npx git-cliff -o CHANGELOG.md`
- Commit the result on the release branch
- Because: writes directly to file with full format including version header

**If posting a structured AI-generated code review:**
- Use `gh pr review <number> --comment --body-file <tempfile>`
- Because: `--body-file` handles multi-line markdown bodies reliably without shell escaping issues

**If posting inline diff comments from an agent:**
- Use `gh api repos/{owner}/{repo}/pulls/{number}/reviews --method POST` with `--field` flags
- Because: `gh pr review` doesn't support inline comments; `gh api` gives direct REST access

**If the project uses JavaScript (not TypeScript):**
- Use jsdoc-api for extraction + recast + @babel/parser for updates
- TypeDoc is not needed

**If the project uses TypeScript:**
- Use jsdoc-api (works on TS files via jsdoc babel plugin) OR TypeDoc for extraction
- Still use recast for write-back (not TS compiler printer)

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| git-cliff@2.12.0 | Node.js >=18.19 | vit-cc requires Node >=18; note that 18.0–18.18 will fail — document this constraint clearly |
| jsdoc-api@9.3.5 | Node.js >=12 (via fast-glob v3) | No compatibility concerns for Node 18+ |
| recast@^0.23.x | @babel/parser@^7.x | Must use babel parser plugin, not default parser, for JSX/TS support |

---

## Installation

These go into the **target project** (not vit-cc itself). Agents should document this requirement.

```bash
# CHANGELOG generation (dev dependency in target project)
npm install -D git-cliff

# JSDoc extraction
npm install -D jsdoc-api

# JSDoc write-back (AST-based)
npm install -D recast @babel/parser @babel/types
```

For one-off use in agent bash steps without installing:

```bash
# CHANGELOG (no install needed)
npx git-cliff@latest --unreleased --strip all
```

---

## Sources

- https://cli.github.com/manual/gh_pr_create — `gh pr create` all flags (HIGH confidence)
- https://cli.github.com/manual/gh_pr_ready — `gh pr ready` flags including `--undo` (HIGH)
- https://cli.github.com/manual/gh_pr_review — `gh pr review` flags and review types (HIGH)
- https://cli.github.com/manual/gh_pr — complete `gh pr` subcommand list (HIGH)
- https://cli.github.com/manual/gh_pr_edit — `gh pr edit` flags, draft status absence confirmed (HIGH)
- https://docs.github.com/en/rest/pulls/reviews — REST API endpoint schema for PR reviews (HIGH)
- https://github.com/cli/cli/releases — gh CLI v2.88.1 confirmed as latest (March 2026) (HIGH)
- https://git-cliff.org/docs/installation/npm/ — git-cliff v2.12.0, npm install method, Node.js requirements, programmatic API (HIGH)
- https://www.npmjs.com/package/jsdoc-api — version 9.3.5, programmatic explain() API (MEDIUM — 403 on direct npm fetch, confirmed via search)
- https://www.npmjs.com/package/recast — format-preserving AST printer (MEDIUM — confirmed via multiple community sources)
- https://keepachangelog.com/en/1.1.0/ — Keep a Changelog 1.1.0 section format (HIGH)
- https://github.com/cli/cli/issues/12396 — confirms gh pr review does NOT support inline comments natively (MEDIUM)

---

*Stack research for: vit-cc GitHub PR lifecycle automation milestone*
*Researched: 2026-03-18*
