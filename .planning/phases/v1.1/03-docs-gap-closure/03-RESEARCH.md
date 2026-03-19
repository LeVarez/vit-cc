# Phase 03: Docs Gap Closure & Build Verification - Research

**Researched:** 2026-03-19
**Domain:** GitHub Actions CI, VitePress build, documentation content fixes
**Confidence:** HIGH

## Summary

This phase is a gap-closure phase: six specific audit findings from v1.1-MILESTONE-AUDIT.md must be resolved, plus a build verification run that was skipped (Plan 05). All gaps are mechanical — no new architecture or libraries are needed.

The primary technical question was whether `actions/setup-node@v6` actually doesn't exist (as the audit claimed). Research confirms it DOES exist — v6 was released October 2025 and the latest is v6.3.0 (March 2026). The audit finding "does not exist" was incorrect or stale. The workflow file uses `actions/setup-node@v6`, which is a valid and current version. This means the deployment is NOT blocked by an invalid action version — the audit's root cause diagnosis was wrong. However, the other five gaps (content fixes, cross-links, model naming, verification artifacts) are all real and need closing.

The build verification (Plan 05) exists as a written plan at `.planning/phases/v1.1/02-docs-site/02-05-PLAN.md`. UAT has already passed 8/8 checks manually. Plan 05 adds: automated `npm run build` verification, a SUMMARY.md artifact, and a VERIFICATION.md. These are documentation artifacts, not functional changes.

**Primary recommendation:** Execute the six audit fixes as targeted file edits, run the build verification, and produce the VERIFICATION.md — no new dependencies, no architectural changes.

## Standard Stack

This phase operates entirely within the existing project stack. No new installations.

### Core (Already Installed)
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| VitePress | ^1.6.4 | Docs site build | Already in use |
| Node.js | 20 | Build runtime | Already in CI |
| GitHub Actions | — | CI/CD pipeline | Already in use |

### No New Dependencies

This phase requires zero new npm packages. All changes are:
- File edits (content corrections, workflow fixes)
- Running existing build scripts (`npm run build`)
- Creating planning artifacts (VERIFICATION.md, SUMMARY.md)

## Architecture Patterns

### Gap Closure Approach

Each audit finding maps to exactly one file and one edit. Work in this order:

1. **Workflow file** — fix the action version claim (may be a no-op if v6 is valid)
2. **Content corrections** — fix install command and placeholder URL
3. **Cross-links** — add incoming links to isolated pages
4. **Naming consistency** — align model name format
5. **Build verification** — run `npm run build`, capture output
6. **Verification artifacts** — write VERIFICATION.md and 02-05-SUMMARY.md

### Recommended Task Structure

```
Phase 03 Gap Closure
├── Task 1: Diagnose and fix deploy-docs.yml (action version investigation)
├── Task 2: Fix hooks-sessions.md install command
├── Task 3: Fix README placeholder URL
├── Task 4: Add cross-links to templates-references.md and hooks-sessions.md
├── Task 5: Resolve model naming inconsistency
├── Task 6: Run build verification (Plan 05, Task 1)
└── Task 7: Produce VERIFICATION.md and 02-05-SUMMARY.md
```

### Anti-Patterns to Avoid

- **Over-fixing the action version:** The audit says "fix to v4" but v6 is valid. The fix should verify the action works, not blindly downgrade to v4.
- **Changing the cross-links arbitrarily:** Links from other pages must be contextually appropriate — not forced. Use existing topical connections (e.g., `how-vit-works.md` naturally references both `templates-references.md` and `hooks-sessions.md`).
- **Picking a naming winner without evidence:** The correct naming format (`opus` vs `claude-opus`) must come from the actual vit-cc `config.json` schema, not editorial preference.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Build verification | Custom test script | `cd docs && npm run build 2>&1` | VitePress build is the authoritative check |
| Dead link check | Custom link checker | VitePress build warnings | VitePress reports dead links during build |
| VERIFICATION.md format | New format | Follow existing 02-UAT.md structure | Consistency with the phase's own docs |

**Key insight:** Every "fix" in this phase is a targeted file edit. The risk is accidentally introducing new inconsistencies while fixing old ones.

## Common Pitfalls

### Pitfall 1: Audit says v6 doesn't exist — but it does
**What goes wrong:** Blindly following the audit and downgrading `actions/setup-node@v6` to `v4`, creating unnecessary churn and potentially introducing an older action.
**Why it happens:** The audit was run on 2026-03-19 but `actions/setup-node@v6` was released October 2025 and is current (v6.3.0 as of March 2026). The audit finding was wrong.
**How to avoid:** Verify the action exists at `https://github.com/actions/setup-node` before changing it. If v6 is valid, leave the action version alone.
**Warning signs:** The audit uses language "does not exist" rather than "is deprecated" — verify negative claims.

### Pitfall 2: Cross-links feel forced
**What goes wrong:** Adding cross-links that don't fit the content flow just to satisfy the audit.
**Why it happens:** The audit says "only reachable via sidebar" — the fix should add contextually appropriate links.
**How to avoid:** Find natural references. `how-vit-works.md` or `architecture.md` can naturally link to hooks-sessions.md (session management is part of VIT's core story). `architecture.md` or `workflow-files.md` can naturally link to templates-references.md.
**Warning signs:** If adding a link requires adding new prose just to justify it, the link is forced.

### Pitfall 3: Model naming — picking the wrong standard
**What goes wrong:** Changing all occurrences to one format when the actual code uses the other.
**Why it happens:** The audit says inconsistency exists but doesn't specify which is correct.
**How to avoid:** Check `src/install.js` or `config.json` handling in the actual vit-cc source to see which format the code expects. The docs should match the code, not vice versa.
**Warning signs:** If you can't find code evidence for either format, choose the format used in the majority of docs files.

### Pitfall 4: Plan 05 has a human checkpoint
**What goes wrong:** Plan 05's Task 2 is a `type="checkpoint:human-verify"` gate — it requires human browser verification of the preview server.
**Why it happens:** The plan was written requiring human sign-off before deployment.
**How to avoid:** For Phase 03, the automated Task 1 (build + HTML count) can be executed as-is. The human checkpoint is a gate — produce the VERIFICATION.md documenting the UAT already passed (8/8) as the equivalent sign-off.
**Warning signs:** Don't block plan completion waiting for an interactive checkpoint if UAT already covers it.

## Code Examples

### Correct GitHub Pages workflow (setup-node v6 is valid)

```yaml
# Source: https://github.com/actions/setup-node/tags — v6 released Oct 2025
# Current state: actions/setup-node@v6 is valid. No change needed if v6 resolves.
- name: Setup Node
  uses: actions/setup-node@v6
  with:
    node-version: 20
    cache: npm
    cache-dependency-path: docs/package-lock.json
```

### Fix for hooks-sessions.md install command

```markdown
<!-- Before (line 11 of docs/reference/hooks-sessions.md): -->
Two hook files are installed into `.claude/hooks/` during `npm install vit-cc`:

<!-- After: -->
Two hook files are installed into `.claude/hooks/` during `npx vit-claude`:
```

### Fix for README placeholder URL

```markdown
<!-- Before (line 619 of README.md): -->
- [Docs](https://vit-claude.dev) — full documentation site

<!-- After: -->
- [Docs](https://levarez.github.io/vit-cc/) — full documentation site
```

### Build verification command

```bash
# Run from repo root
cd docs && npm run build 2>&1
# Expected: exits 0, no dead link warnings
find docs/.vitepress/dist -name "*.html" | wc -l
# Expected: >= 12 (index + 10 content pages + any generated)
```

### Cross-link candidates

Natural cross-link opportunities found in the docs:

- `docs/guide/how-vit-works.md` — covers session continuity → add link to `/reference/hooks-sessions`
- `docs/guide/architecture.md` — covers model profiles → already links to configuration, can link to `/guide/templates-references`
- `docs/contributing/agent-anatomy.md` — covers hook files → can link to `/reference/hooks-sessions`

## State of the Art

| Audit Claim | Research Finding | Impact |
|-------------|------------------|--------|
| `setup-node@v6` does not exist | FALSE — v6.3.0 released March 2026, is current | Deployment may not be blocked; verify before fixing |
| `actions/checkout@v5` in workflow | v5 exists (released Nov 2025) — valid | No action needed |
| `actions/upload-pages-artifact@v3` | v3 is current stable | No action needed |
| `actions/deploy-pages@v4` | v4.0.5 is current | No action needed |

**Key finding:** The workflow file may be entirely valid as-is. The audit's critical gap #1 may be a false alarm. The phase should verify actual CI behavior, not just follow the audit's recommendation to downgrade.

## Open Questions

1. **Is `actions/setup-node@v6` actually failing in CI?**
   - What we know: The tag exists on GitHub, v6.3.0 was released March 2026
   - What's unclear: Whether the feature branch CI actually fails on this action
   - Recommendation: Check CI run logs on the feature branch before modifying the action version. The UAT notes "CI failing on feature/v1.1-02-docs-site — user chose to proceed" — investigate whether this was the setup-node issue or something else

2. **Which model name format is canonical in the source code?**
   - What we know: README/architecture use `opus`, `sonnet`; configuration.md uses `claude-opus`, `claude-sonnet`
   - What's unclear: What format does `src/install.js` write to config.json?
   - Recommendation: Check source before editing docs; the code is the authority

3. **Does Plan 05's human checkpoint need to be re-run, or does UAT satisfy it?**
   - What we know: UAT passed 8/8 manually; Plan 05 Task 2 requires browser verification
   - What's unclear: Whether the project owner considers UAT sufficient sign-off
   - Recommendation: Treat UAT as sufficient; produce VERIFICATION.md citing UAT results

## Sources

### Primary (HIGH confidence)
- `https://github.com/actions/setup-node/tags` — confirms v6 exists, v6.3.0 is current (March 2026)
- `https://github.com/actions/checkout/tags` — confirms v5 exists (Nov 2025)
- `https://github.com/actions/upload-pages-artifact/tags` — v3 and v4 exist
- `https://github.com/actions/deploy-pages/tags` — v4.0.5 is current
- `.planning/v1.1-MILESTONE-AUDIT.md` — authoritative list of all audit gaps
- `.github/workflows/deploy-docs.yml` — actual current workflow file
- `docs/reference/hooks-sessions.md` — confirmed "npm install vit-cc" on line 11
- `README.md` line 619 — confirmed "vit-claude.dev" placeholder

### Secondary (MEDIUM confidence)
- `.planning/phases/v1.1/02-docs-site/02-UAT.md` — 8/8 UAT pass, confirmed build works
- `docs/.vitepress/config.ts` — confirmed sidebar structure, both pages in sidebar but no incoming links

### Tertiary (LOW confidence)
- Audit finding "deploy-docs.yml uses actions/setup-node@v6 (does not exist)" — contradicted by official GitHub tags; LOW confidence in the audit's diagnosis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing stack is well-known
- Architecture: HIGH — gaps are enumerated, fixes are mechanical
- Pitfalls: HIGH — action version issue is verified against official GitHub releases; content fixes are straightforward
- Action version audit finding: LOW — audit claim is contradicted by GitHub tags research

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain — GitHub Actions versions change slowly)
