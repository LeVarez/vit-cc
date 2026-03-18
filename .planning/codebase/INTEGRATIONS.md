# External Integrations

**Analysis Date:** 2026-03-18

## APIs & External Services

**GitHub:**
- GitHub API (via gh CLI) - Posts CI results to issues
  - SDK/Client: `gh` command-line tool
  - Auth: `GITHUB_TOKEN` environment variable (in GitHub Actions secrets)
  - Usage: `files/github/workflows/phase-ci.yml` posts test results and failures to linked issues
  - Endpoint: GitHub GraphQL API (indirect, via gh CLI wrapper)

**npm Registry:**
- npm public package registry
  - Client: `npm view` command
  - Usage: `files/hooks/vit-check-update.cjs` queries latest version of `vit-claude`

## Data Storage

**Databases:**
- Not detected - VIT is a framework, not a data application

**File Storage:**
- Local filesystem only - Codebase metadata stored in project's `.planning/` directory
- Installation copies templates to `.claude/` directory in target project

**Caching:**
- Local filesystem cache: `~/.claude/cache/vit-update-check.json`
  - Stores: `{ update_available: bool, installed: string, latest: string, checked: timestamp }`
  - Updated by: `files/hooks/vit-check-update.cjs`
  - Read by: `files/hooks/vit-statusline.js`

## Authentication & Identity

**Auth Provider:**
- None built-in - VIT is a framework
- Target projects use GitHub OAuth (implicit through GITHUB_TOKEN)

**GitHub Token Handling:**
- Required for: Posting CI results to issues in phase-ci.yml
- Sourced from: GitHub Actions secrets (automatically injected as `${{ secrets.GITHUB_TOKEN }}`)
- Scopes needed: `contents: read`, `issues: write` (declared in phase-ci.yml permissions)

## Monitoring & Observability

**Error Tracking:**
- Not detected - No external error service integration

**Logs:**
- GitHub Actions workflow logs (phase-ci.yml)
  - Test output: `tests/phases/results.txt` (piped to gh issue comment)
  - JSON results: `tests/phases/results.json` (parsed for counts)
- Console output from Node.js CLI (src/install.js, bin/vit-cc.js)

## CI/CD & Deployment

**Hosting:**
- GitHub Actions - phase-ci.yml runs on ubuntu-latest
- npm registry - Distributes vit-claude package

**CI Pipeline:**
- **Trigger:** Push to feature/*, milestone/*, quick/* branches
- **Steps:**
  1. Checkout code
  2. Setup Node.js 22 with npm cache
  3. `npm ci` - Install dependencies
  4. `npm run check` - Type checking (continue-on-error)
  5. Run Vitest: `npx vitest run tests/phases/ --reporter=json --reporter=verbose`
  6. Parse test results from JSON
  7. Extract phase/milestone from branch name
  8. Lookup issue number from `.planning/STATE.md`
  9. Post result comment to GitHub issue using `gh issue comment`
  10. Exit with code 1 if tests failed (job fails)

**Deployment Path:**
- Target projects: Install via `npx vit-claude`
- Framework files copied from `files/` to `.claude/` in target project
- Hooks registered in `.claude/settings.json`

## Environment Configuration

**Required env vars:**
- `GITHUB_TOKEN` - For GitHub CI integration (posts comments to issues)
  - Required in GitHub Actions secrets (GitHub provides automatically)
  - Not required for local development
  - Scopes: contents:read, issues:write

**Optional env vars in target projects:**
- None enforced by VIT framework
- Target project may define its own (e.g., NODE_ENV)

## Webhooks & Callbacks

**Incoming:**
- None - VIT is pull-based (CI workflow polls STATE.md and issues)

**Outgoing:**
- GitHub issue comments posted via gh CLI

---

*Integrations analysis: 2026-03-18*
