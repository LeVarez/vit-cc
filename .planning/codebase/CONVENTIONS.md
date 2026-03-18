# Coding Conventions

**Analysis Date:** 2026-03-18

## Naming Patterns

**Files:**
- Entry scripts: kebab-case with `.js` extension (e.g., `vit-cc.js`, `vit-statusline.js`)
- Markdown command/agent definitions: kebab-case with `.md` extension (e.g., `vit-executor.md`, `new-project.md`)
- Config files: kebab-case or camelCase JSON (e.g., `config.json`, `settings.json`)
- Utilities: descriptive camelCase (e.g., `mergeSettings()`, `copyDir()`)

**Functions:**
- camelCase throughout (e.g., `copyDir()`, `mergeSettings()`, `ask()`)
- Async functions follow same camelCase convention (e.g., `install()`)
- Function descriptions use verb + noun pattern (e.g., `copyDir`, `mergeSettings`)

**Variables:**
- camelCase for all variables and parameters (e.g., `projectRoot`, `dryRun`, `sessionStartHooks`)
- Constants declared with lowercase const (e.g., `const PKG_FILES = ...`)
- Boolean variables use verb patterns (e.g., `dryRun`, `alreadyRegistered`)
- Path variables use descriptive suffixes: `srcPath`, `destPath`, `settingsPath`

**Types:**
- JSON structures use camelCase keys
- Markdown frontmatter uses kebab-case for command metadata: `name`, `description`, `allowed-tools`, `depends_on`

## Code Style

**Formatting:**
- No auto-formatter configured (no Prettier, no ESLint config)
- Consistent indentation: 2 spaces throughout
- String quotes: single quotes preferred but mixed used
- Semicolons: required at statement ends
- Strict mode: `'use strict';` at top of all Node.js scripts

**Linting:**
- No linter configured — style enforced through careful manual review

## Import Organization

**Order:**
1. Node.js built-in modules (`fs`, `path`, `readline`, `os`, `child_process`)
2. Local modules (e.g., `require('../src/install.js')`)
3. Package metadata (e.g., reading `package.json`)

**Path Aliases:** Not used; all requires use relative paths

## Error Handling

**Patterns:**
- Try-catch blocks for JSON parsing with silent fallback (e.g., `catch { settings = {}; }`)
- Process errors exit explicitly: `process.exit(1)` with error message
- Promise `.catch()` with error logging and exit
- File/path existence checked before operations: `fs.existsSync()`
- Silent failures acceptable in non-critical paths (e.g., statusline hook)

## Logging

**Framework:** `console` object only (no logger library)

**Patterns:**
- `console.log()` for informational output
- `console.error()` for errors (used sparingly)
- ANSI color codes for terminal output (e.g., `\x1b[32m` green, `\x1b[33m` yellow)
- Box drawing for visual hierarchy (e.g., `╔══════╗` in bin/vit-cc.js)
- Indentation with spaces for visual alignment: `  ✓ message`, `    • sub-item`
- Context added through message prefixes: `[dry-run]` when in dry-run mode

## Comments

**When to Comment:**
- Block comments for file-level purpose
- Inline comments for non-obvious logic
- Comments explain "why" not "what"

## Function Design

**Size:** Small, focused functions (under 40 lines typical)

**Parameters:**
- Positional parameters for required inputs: `copyDir(src, dest)`
- Options object for optional: `install(projectRoot, { dryRun = false } = {})`

**Return Values:**
- Promises for async operations
- Arrays for collections (install() returns array of installed descriptions)

## Module Design

**Exports:** Named exports: `module.exports = { install };`
**Barrel Files:** Not used; point imports preferred

## Special Patterns

**Markdown-based Configuration:**
- Frontmatter YAML at top of command/agent files (between `---`)
- Contains metadata: `name`, `description`, `allowed-tools`, dependencies
- Allows declarative definition of command capabilities

**User Interaction:**
- `readline` interface for interactive prompts
- Promises used to handle async input cleanly
- Input trimmed and lowercased for comparison: `answer.trim().toLowerCase()`

---

*Convention analysis: 2026-03-18*
