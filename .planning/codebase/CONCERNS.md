# Codebase Concerns

**Analysis Date:** 2026-03-18

## Tech Debt

**Minimal core, large agent/workflow library:**
- Issue: The actual installation code is only 189 lines total (`bin/vit-cc.js`, `src/install.js`), but the distributed agent/workflow/command files total ~1.1MB with 187 markdown files. This creates a maintenance burden where changes to agent logic or workflows require careful coordination across many files.
- Files: `bin/vit-cc.js` (53 lines), `src/install.js` (136 lines) vs. `files/agents/`, `files/commands/vit/`, `files/vit/workflows/`
- Impact: Updates to VIT framework behavior require changes across multiple agent definitions and workflow templates. A single conceptual change may affect 5+ markdown files, increasing risk of inconsistency.
- Fix approach: Consider centralizing common patterns and constraints into shared reference templates (`files/vit/references/`) that agents reference, rather than embedding same guidance in each agent definition.

**Directory structure ambiguity during installation:**
- Issue: The install process copies files to `.claude/agents/`, `.claude/commands/vit/`, `.claude/hooks/`, and `.claude/vit/` without validating that the destination directory exists before attempting writes in some paths. The `mergeSettings()` function creates `.claude/` directory but other copy operations assume directory hierarchy exists.
- Files: `src/install.js` lines 107-110 (copyDir called without pre-creation validation)
- Impact: If `.claude/` directory is partially deleted or in an unexpected state, installation may silently fail or create incomplete directory trees, leaving the project in a broken state.
- Fix approach: Add pre-flight validation that checks all destination directories are writable and creates missing parent directories before any copy operations begin.

**No validation of copied file integrity:**
- Issue: The `copyDir()` function in `src/install.js` uses `fs.copyFileSync()` without verifying that files were copied successfully or that critical files exist post-installation.
- Files: `src/install.js` lines 10-21 (copyDir function)
- Impact: Corrupted installation (missing or truncated files) would only be discovered when users try to use slash commands or agents, not during the install process itself.
- Fix approach: Add checksum validation or file count verification after each copy step. Report any missing expected files before reporting success.

## Known Issues

**JSON parsing without version validation:**
- Issue: `bin/vit-cc.js` line 7 reads and parses `package.json` to get VERSION but doesn't validate that the parsed object has a `version` field. If `package.json` is malformed or missing the version key, VERSION will be `undefined`.
- Files: `bin/vit-cc.js` lines 7-8
- Impact: The startup banner would display `v undefined` instead of a version number, confusing users about which version is installed.
- Workaround: None - users would see incorrect version display
- Fix approach: Add explicit validation: `if (!pkgJson.version) throw new Error('package.json missing version field');`

**Settings merge doesn't validate hook structure:**
- Issue: The `mergeSettings()` function assumes `settings.hooks.SessionStart` is an array and pushes objects to it, but doesn't validate the structure of existing hook objects. If a previous hook registration created a malformed structure, the merge could produce invalid JSON or duplicate hooks.
- Files: `src/install.js` lines 37-78, specifically lines 55-66
- Impact: Repeated installations could create duplicate vit-check-update hooks in settings.json, causing hooks to run multiple times or creating unparseable hook configuration.
- Fix approach: Before pushing new hooks, validate that no identical hook already exists and that all hook objects have required `type` and command/script fields.

**Malformed settings.json silently recovers to empty config:**
- Issue: Line 42-47 catches JSON.parse errors and initializes settings to empty object, losing any existing (malformed) configuration. This is safer than crashing, but means if `.claude/settings.json` is corrupted, all previous hook configuration is discarded without warning.
- Files: `src/install.js` lines 42-47
- Impact: User might run vit-cc installer to fix something, accidentally restore a corrupted settings.json, and lose all their custom hook configuration.
- Workaround: Keep backups of `.claude/settings.json`
- Fix approach: When catching JSON parse errors, back up the corrupted file and log a warning: `console.warn('settings.json was malformed - backed up to settings.json.bak')`.

## Security Considerations

**No input validation on directory paths:**
- Issue: The install function accepts `projectRoot` from `process.cwd()` without validation. If somehow invoked with a malicious or system path, `copyDir()` could write to unexpected locations.
- Files: `bin/vit-cc.js` line 12, `src/install.js` line 10-21
- Impact: Unlikely in normal use (user controls cwd), but could be a vector if vit-cc is invoked programmatically with untrusted input.
- Current mitigation: Users invoke from their project directory explicitly; installation only happens in cwd
- Recommendations: Add explicit validation that projectRoot is a git repository (`git rev-parse --git-dir`) before proceeding with installation.

**GitHub token exposed in workflow:**
- Issue: `files/github/workflows/phase-ci.yml` line 89 uses `secrets.GITHUB_TOKEN` to post CI results to GitHub issues. While GitHub Actions automatically scopes this token correctly, the workflow logs verbose test output which could theoretically expose sensitive test data.
- Files: `files/github/workflows/phase-ci.yml` lines 36-45 (verbose test output), line 89 (token usage)
- Impact: If tests include API keys, credentials, or PII in assertions or error messages, this would be logged in GitHub Actions and visible in workflow runs.
- Current mitigation: GitHub Actions logs are private to repo collaborators with read access
- Recommendations: Document that test output should never include secrets. Consider piping test output through a redaction filter before logging to Actions.

**Arbitrary hook command execution:**
- Issue: The `mergeSettings()` function creates hook entries that execute arbitrary shell commands (`node .claude/hooks/vit-check-update.cjs`). If `.claude/hooks/` directory is writable by untrusted users, they could modify these scripts and escalate to arbitrary code execution.
- Files: `src/install.js` line 56 (defines command to execute)
- Impact: On shared systems, another user could modify `.claude/hooks/vit-check-update.cjs` to run arbitrary code in the context of the hook runner.
- Current mitigation: `.claude/` is typically in user's private project directory with standard file permissions
- Recommendations: Document that `.claude/` directory should not be world-writable. Optionally validate hook file integrity before execution (but this is beyond scope of installer).

## Performance Bottlenecks

**All files copied synchronously during installation:**
- Issue: The `copyDir()` function uses `fs.copyFileSync()` to recursively copy ~1.1MB across 187 files sequentially.
- Files: `src/install.js` lines 10-21 (recursive copyDir) and lines 107-110 (sequential copying of each step)
- Impact: On slower filesystems or network drives, installation could take 5-10+ seconds. Large monorepos copying into existing `.claude/` directories may also slow down.
- Improvement path: For initial implementation, synchronous is acceptable. If installation becomes a bottleneck, could use Promise.all() to parallelize directory copies or use native fs.cp() (Node 16+).

**No caching of resolved paths:**
- Issue: The `copyDir()` function calls `path.join()` repeatedly in the recursive loop, and `fs.readdirSync()` reads directories synchronously without any optimization for large directories.
- Files: `src/install.js` lines 12-20
- Impact: Minimal in practice (agent files are small), but in projects with 1000+ files in .claude/, the synchronous directory reads could become noticeable.
- Improvement path: Not urgent, but could optimize with async iteration or batched reads if needed later.

## Fragile Areas

**Hook registration has no idempotency guarantee:**
- Files: `src/install.js` lines 54-66
- Why fragile: The check for duplicate hooks uses `block.hooks.some()` which assumes all hook blocks have a `hooks` property. If a user manually edited `.claude/settings.json` and created a hook block with a different structure (e.g., direct array instead of object with hooks property), the duplicate detection fails and creates another hook.
- Safe modification: When updating hook registration logic, iterate through ALL hook structures in real examples of `.claude/settings.json`, not just expected structure. Add defensive checks: `if (!block.hooks) continue;`
- Test coverage: No automated tests for install.js - all verification is manual. A test for duplicate hook prevention would prevent regressions.

**Settings.json JSON structure assumed but not validated:**
- Files: `src/install.js` lines 69-74 (statusLine assignment)
- Why fragile: The code assigns `settings.statusLine` assuming it's safe to add a new top-level key. If Claude Code's `.claude/settings.json` schema changes in a future version to require all keys to conform to a schema, this manual modification could break the file.
- Safe modification: Before modifying settings structure, check Claude Code's settings schema documentation. Consider writing only to recognized keys.
- Test coverage: No tests - manual verification only.

**copyDir silently succeeds even if source doesn't fully copy:**
- Files: `src/install.js` lines 10-21
- Why fragile: If `fs.copyFileSync()` throws an exception for a single file (permissions, disk full), the entire function throws and installation aborts. But if called from within the recursive loop, errors in sub-directories might be missed. The current code has no try-catch around the copyFileSync call.
- Safe modification: Wrap fs.copyFileSync in try-catch, log errors, and collect failed files. Report summary at end of installation.
- Test coverage: No tests for error conditions.

## Scaling Limits

**Workflow file assumes single STATE.md location:**
- Issue: The `phase-ci.yml` workflow looks up linked issues using `.planning/STATE.md` with a hardcoded path (line 80). If a project uses multiple STATE.md files (e.g., per-milestone) or stores them elsewhere, the workflow won't find issue links.
- Files: `files/github/workflows/phase-ci.yml` line 80
- Current capacity: Works for single-milestone projects with one STATE.md
- Limit: Multi-milestone projects or projects that reorganize planning structure will have CI results not posted to issues
- Scaling path: Make STATE.md path configurable via workflow input or allow multiple STATE.md locations.

**Agent files grow with each new command/workflow:**
- Issue: Every time a new slash command or workflow is added, it ships as a new markdown file in `files/commands/vit/` or `files/vit/workflows/`. At 29 commands and 187 total files, the initial install is already 1.1MB.
- Files: `files/commands/vit/` (29 commands), `files/vit/workflows/` (14 workflows), `files/agents/` (13 agents)
- Current capacity: ~1.1MB total, ~150-200ms install time on modern systems
- Limit: If VIT grows to 50+ commands, install time and package size become noticeable. Package managers may complain about large npm packages.
- Scaling path: Consider splitting VIT into core (essential agents/commands) and optional packages (specialized workflows). Or lazy-load agents from a registry instead of bundling all.

## Dependencies at Risk

**No dependencies declared:**
- Issue: `package.json` has no `dependencies` or `devDependencies` sections. The codebase only uses Node.js built-ins (fs, path, readline). This is excellent for stability but means there's zero control over any Node.js API changes.
- Impact: Extremely low dependency risk, but also means the code only works with Node.js features available since at least v18 (`engines: { "node": ">=18" }`).
- Mitigation: Good - no external package risks
- Monitoring: Monitor Node.js release notes for breaking changes in built-in modules (fs, path, readline). These are stable, but good to track.

**Node.js version constraint is soft:**
- Issue: `package.json` specifies `"engines": { "node": ">=18" }` but this is not enforced by the installer. npm/yarn will warn but won't block installation on Node 16.
- Impact: Users on Node 16 could install vit-claude and encounter runtime errors if using async/await patterns or newer fs APIs not backported.
- Current mitigation: Source code uses only Node 18+ safe patterns (async/await, fs.promises likely used in agent code)
- Recommendations: Add explicit version check in `bin/vit-cc.js`: `if (process.version.major < 18) { console.error('Requires Node 18+'); process.exit(1); }`

## Missing Critical Features

**No uninstall command:**
- Problem: There is no way to cleanly remove VIT from a project. Users must manually delete `.claude/agents/vit-*`, `.claude/commands/vit/`, `.claude/hooks/vit-*`, and manually revert `.claude/settings.json` changes.
- Blocks: Users who want to remove VIT or switch to a different framework face manual cleanup burden.
- Recommendation: Add `/vit:uninstall` command that reverses the installation (removes VIT files, reverts settings.json, leaves user config intact).

**No installation verification:**
- Problem: After installation completes, there's no way to verify that all 187 files were copied correctly and hooks are properly registered.
- Blocks: Users with corrupted installations won't know until they try to use a slash command.
- Recommendation: Add `npm run verify-vit` script that checks for expected files and hooks, reports any missing pieces.

**No upgrade path between versions:**
- Problem: When users run `vit-claude` again on an existing install, it overwrites files without asking about preserving local customizations. If users modified an agent or hook, their changes are lost on update.
- Blocks: Users cannot safely customize agents without risking losing changes on upgrade.
- Recommendation: On second install, compare file timestamps or hashes, warn about local modifications, or preserve `.bak` versions of modified files.

## Test Coverage Gaps

**Installation logic has zero automated test coverage:**
- What's not tested:
  - `copyDir()` behavior with nested directories
  - `mergeSettings()` with existing hooks
  - Duplicate hook prevention
  - Malformed settings.json recovery
  - File permission errors during copy
  - Partial copy failures
- Files: `bin/vit-cc.js`, `src/install.js`
- Risk: Regressions in core installation logic could break VIT for users without being caught by CI. This is especially risky for the install command itself - if it's broken, users can't even get started.
- Priority: High - the installer is the entry point to the entire framework

**Agent/workflow markdown files have no syntax validation:**
- What's not tested:
  - Agent frontmatter is valid YAML
  - All referenced tools are available
  - Cross-agent references (e.g., one agent calls another) are valid
  - Markdown links to templates/references resolve correctly
  - Shell commands in agents are syntactically valid
- Files: `files/agents/`, `files/commands/vit/`, `files/vit/workflows/`
- Risk: If an agent has a broken shell command or invalid YAML, users will only discover this when executing that agent. A simple linting pass would catch many of these issues pre-release.
- Priority: Medium - errors are discovered quickly but frustrating for users mid-session

**No integration test for full install → first command flow:**
- What's not tested: The happy path of `npx vit-claude` → answer prompts → settings registered → `/vit:help` works
- Risk: A change to install.js or settings merge could break the entire flow, and it wouldn't be caught until a user tries it
- Priority: Medium - a simple e2e test that verifies each installed agent is callable would prevent this

---

*Concerns audit: 2026-03-18*
