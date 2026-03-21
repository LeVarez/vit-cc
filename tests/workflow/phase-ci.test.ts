/**
 * Tests for the shell logic in .github/workflows/phase-ci.yml
 *
 * Extracts the three core logic areas (branch parsing, issue lookup,
 * comment body generation) as TypeScript functions and validates them
 * against all branch patterns and output templates.
 */
import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// 1. Branch parsing — mirrors the "Find linked GitHub issue" step
// ---------------------------------------------------------------------------

interface ParsedBranch {
  milestone: string
  phase: string
  stateKey: string
}

function parseBranch(branch: string): ParsedBranch | null {
  // Extract milestone: strip feature/ prefix, then match vX.Y.Z at start
  const withoutPrefix = branch.replace(/^feature\//, '')
  const milestoneMatch = withoutPrefix.match(/^(v\d+\.\d+\.\d+)/)
  const milestone = milestoneMatch ? milestoneMatch[1] : ''

  let phase: string
  if (milestone) {
    // feature/v1.6.0-01-api-foundation → strip "v1.6.0-" then grab leading digits
    const afterMilestone = withoutPrefix.slice(milestone.length + 1) // +1 for the dash
    const phaseMatch = afterMilestone.match(/^(\d+)/)
    phase = phaseMatch ? phaseMatch[1] : ''
  } else {
    // feature/43-api-foundation → grab leading digits after prefix strip
    const phaseMatch = withoutPrefix.match(/^(\d+)/)
    phase = phaseMatch ? phaseMatch[1] : ''
  }

  if (!phase) return null

  const stateKey = milestone ? `${milestone}/${phase}` : phase
  return { milestone, phase, stateKey }
}

describe('parseBranch', () => {
  it('parses milestone-scoped branch', () => {
    const result = parseBranch('feature/v1.6.0-01-api-foundation')
    expect(result).toEqual({
      milestone: 'v1.6.0',
      phase: '01',
      stateKey: 'v1.6.0/01',
    })
  })

  it('parses bare numeric branch', () => {
    const result = parseBranch('feature/43-api-foundation')
    expect(result).toEqual({
      milestone: '',
      phase: '43',
      stateKey: '43',
    })
  })

  it('parses another milestone-scoped branch', () => {
    const result = parseBranch('feature/v1.1.0-01-readme-rewrite')
    expect(result).toEqual({
      milestone: 'v1.1.0',
      phase: '01',
      stateKey: 'v1.1.0/01',
    })
  })

  it('parses multi-digit phase number', () => {
    const result = parseBranch('feature/v2.0.0-12-final-cleanup')
    expect(result).toEqual({
      milestone: 'v2.0.0',
      phase: '12',
      stateKey: 'v2.0.0/12',
    })
  })

  it('returns null for milestone branch (no phase)', () => {
    expect(parseBranch('milestone/v1.1.0')).toBeNull()
  })

  it('returns null for quick branch (no phase)', () => {
    expect(parseBranch('quick/fix-typo')).toBeNull()
  })

  it('returns null for feature branch with no number', () => {
    expect(parseBranch('feature/no-number-here')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// 2. Issue lookup — mirrors the grep against STATE.md
// ---------------------------------------------------------------------------

function findIssue(stateKey: string, stateContent: string): string {
  // grep "| ${STATE_KEY} " then extract #NNN
  const lines = stateContent.split('\n')
  for (const line of lines) {
    if (line.includes(`| ${stateKey} `)) {
      const issueMatch = line.match(/#(\d+)/)
      return issueMatch ? issueMatch[1] : ''
    }
  }
  return ''
}

const STATE_FIXTURE = `## GitHub Issue Mapping

| Phase | Feature Issue | Branch | PR | Assigned | Sub-issues | Plan Branches |
|-------|---------------|--------|----|----------|------------|---------------|
| v1.1.0/01 | #47 | feature/v1.1.0-01-readme-rewrite | pr#53(ready) | — | #49, #50, #51, #52 | feature/v1.1.0-01-01 |
| v1.1.0/02 | #48 | feature/v1.1.0-02-docs-site | pr#66 | — | #61, #62, #63 | feature/v1.1.0-02-01 |
| v1.1.0/03 | #67 | feature/v1.1.0-03-docs-gap-closure | pr#70(ready) | — | #68, #69 | feature/v1.1.0-03-01 |`

describe('findIssue', () => {
  it('finds issue #47 for v1.1.0/01', () => {
    expect(findIssue('v1.1.0/01', STATE_FIXTURE)).toBe('47')
  })

  it('finds issue #48 for v1.1.0/02', () => {
    expect(findIssue('v1.1.0/02', STATE_FIXTURE)).toBe('48')
  })

  it('finds issue #67 for v1.1.0/03', () => {
    expect(findIssue('v1.1.0/03', STATE_FIXTURE)).toBe('67')
  })

  it('returns empty string for nonexistent key', () => {
    expect(findIssue('v9.9.0/99', STATE_FIXTURE)).toBe('')
  })

  it('returns empty string for empty STATE.md', () => {
    expect(findIssue('v1.1.0/01', '')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// 3. Comment body generation — mirrors the "Post results to GitHub issue" step
// ---------------------------------------------------------------------------

interface CommentParams {
  phase: string
  milestone: string
  branch: string
  shortSha: string
  runUrl: string
  hasTests: boolean
  total?: string
  passed?: string
  failed?: string
  failures?: string
}

function buildComment(params: CommentParams): string {
  const {
    phase,
    milestone,
    branch,
    shortSha,
    runUrl,
    hasTests,
    total = '',
    passed = '',
    failed = '',
    failures = '  See run logs for details',
  } = params

  const phaseDisplay = milestone ? `${milestone}/${phase}` : phase

  if (!hasTests) {
    return `## 🔄 CI — Phase ${phaseDisplay} @ \`${shortSha}\`

**Branch:** \`${branch}\`
**Status:** No phase tests yet — waiting for test generation

Tests are created by \`vit-test-writer\` after phase execution completes.

[View run](${runUrl})`
  }

  if (failed === '0' || !failed) {
    return `## ✅ CI Passed — Phase ${phaseDisplay} @ \`${shortSha}\`

**Branch:** \`${branch}\`
**Tests:** ${passed}/${total} passed

All unit tests green. Ready for human review.

Run \`/vit:verify-work ${phase}\` to complete manual UAT.

[View run](${runUrl})`
  }

  return `## ❌ CI Failed — Phase ${phaseDisplay} @ \`${shortSha}\`

**Branch:** \`${branch}\`
**Tests:** ${passed}/${total} passed — **${failed} failing**

### Failing tests
\`\`\`
${failures}
\`\`\`

Fix failures before running \`/vit:verify-work ${phase}\`.

[View run](${runUrl})`
}

const BASE_PARAMS: CommentParams = {
  phase: '01',
  milestone: 'v1.6.0',
  branch: 'feature/v1.6.0-01-api-foundation',
  shortSha: 'abc1234',
  runUrl: 'https://github.com/org/repo/actions/runs/123',
  hasTests: true,
  total: '10',
  passed: '10',
  failed: '0',
}

describe('buildComment', () => {
  it('produces no-tests body', () => {
    const body = buildComment({ ...BASE_PARAMS, hasTests: false })
    expect(body).toContain('🔄 CI — Phase v1.6.0/01')
    expect(body).toContain('waiting for test generation')
    expect(body).toContain('`abc1234`')
    expect(body).not.toContain('CI Passed')
    expect(body).not.toContain('CI Failed')
  })

  it('produces pass body with test counts', () => {
    const body = buildComment(BASE_PARAMS)
    expect(body).toContain('✅ CI Passed — Phase v1.6.0/01')
    expect(body).toContain('10/10 passed')
    expect(body).toContain('Ready for human review')
    expect(body).toContain('/vit:verify-work 01')
  })

  it('produces fail body with failure count', () => {
    const body = buildComment({
      ...BASE_PARAMS,
      passed: '7',
      failed: '3',
      failures: '  FAIL src/foo.test.ts > should work',
    })
    expect(body).toContain('❌ CI Failed — Phase v1.6.0/01')
    expect(body).toContain('7/10 passed — **3 failing**')
    expect(body).toContain('FAIL src/foo.test.ts')
    expect(body).toContain('Fix failures before running')
  })

  it('shows bare phase number when no milestone', () => {
    const body = buildComment({
      ...BASE_PARAMS,
      milestone: '',
      phase: '43',
      branch: 'feature/43-api-foundation',
    })
    expect(body).toContain('CI Passed — Phase 43 @')
    expect(body).not.toMatch(/Phase \d+\/\d+/)
  })

  it('includes run URL in all templates', () => {
    const url = 'https://github.com/org/repo/actions/runs/999'

    const noTests = buildComment({ ...BASE_PARAMS, hasTests: false, runUrl: url })
    const pass = buildComment({ ...BASE_PARAMS, runUrl: url })
    const fail = buildComment({ ...BASE_PARAMS, failed: '2', runUrl: url })

    expect(noTests).toContain(`[View run](${url})`)
    expect(pass).toContain(`[View run](${url})`)
    expect(fail).toContain(`[View run](${url})`)
  })

  it('treats empty failed as pass', () => {
    const body = buildComment({ ...BASE_PARAMS, failed: '' })
    expect(body).toContain('CI Passed')
  })
})
