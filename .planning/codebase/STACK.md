# Technology Stack

**Analysis Date:** 2026-03-18

## Languages

**Primary:**
- JavaScript - Runtime code in bin/ and src/, executed by Node.js
- CommonJS (*.js, *.cjs) - Used throughout for CLI tooling and hooks

**Secondary:**
- Markdown - Agent and command definitions live in files/agents/ and files/commands/vit/

## Runtime

**Environment:**
- Node.js 22.x (specified as v22 in phase-ci.yml)
- Node 18+ minimum (declared in package.json engines)

**Package Manager:**
- npm 10.9.4
- No lockfile (package-lock.json not detected) - dependencies installed from package.json

## Frameworks

**Core:**
- VIT Framework - Internal framework distributed via npm package
  - 13 specialist agents (Markdown-based system prompts) in `files/agents/`
  - 29 slash commands in `files/commands/vit/`
  - Session hooks for Claude Code integration in `files/hooks/`

**CLI/Execution:**
- Node.js built-in modules only (fs, path, readline, child_process, os)
- No external frameworks - pure Node.js stdlib

**Testing:**
- Vitest - Specified in phase-ci.yml test runner commands
- JSON reporter output to `tests/phases/results.json`
- Verbose reporter output to `tests/phases/results.txt`

**Build/Dev:**
- npm pkg - Package normalization (used in recent commit)
- GitHub Actions - phase-ci.yml CI workflow

## Key Dependencies

**Critical:**
- None in package.json - This is a framework distribution package with zero runtime dependencies
- Distributes templates/agents/commands that target Claude Code, not external NPM packages

**Infrastructure:**
- GitHub CLI (gh command) - Used by phase-ci.yml for posting comments to issues
- npm registry - Used by vit-check-update.cjs to query latest published version

## Configuration

**Environment:**
- Configured via `.claude/settings.json` - Hook registration for SessionStart
- Hook commands referenced:
  - `node .claude/hooks/vit-check-update.cjs` - Checks for VIT updates
  - `node .claude/hooks/vit-statusline.js` - Claude Code statusline display

**Build:**
- No build step required - Pure JavaScript source
- Installation via `npx vit-claude` runs `src/install.js`
- Copies framework files from `files/` to project's `.claude/` directory

**Publish:**
- Distributed as npm package `vit-claude`
- Files list in package.json: bin/, src/, files/, README.md, LICENSE
- .npmignore excludes: .gitignore, .npmignore

## Platform Requirements

**Development:**
- Node.js 18+
- npm 8+ (implied by usage)
- Bash-compatible shell (for CI workflow)
- Git repository (for branch detection and operations)

**Production:**
- Deployment target: Claude Code (proprietary AI IDE)
- GitHub Actions runner (ubuntu-latest) for phase-ci.yml CI
- GitHub repository with token secrets support

**Post-Install Requirements:**
- Target project needs `.claude/` directory structure (created by install)
- GitHub token optional (GITHUB_TOKEN secret for CI integration)
- Vitest for test execution in target projects (installed in target, not in VIT)

---

*Stack analysis: 2026-03-18*
