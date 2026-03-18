# Model Profiles

Model profiles control which Claude model each VIT agent uses. This allows balancing quality vs token spend.

## Profile Definitions

| Agent | `quality` | `balanced` | `budget` |
|-------|-----------|------------|----------|
| vit-planner | opus | opus | sonnet |
| vit-roadmapper | opus | sonnet | sonnet |
| vit-executor | opus | sonnet | sonnet |
| vit-phase-researcher | opus | sonnet | haiku |
| vit-project-researcher | opus | sonnet | haiku |
| vit-research-synthesizer | sonnet | sonnet | haiku |
| vit-debugger | opus | sonnet | sonnet |
| vit-codebase-mapper | sonnet | haiku | haiku |
| vit-verifier | sonnet | sonnet | haiku |
| vit-plan-checker | sonnet | sonnet | haiku |
| vit-integration-checker | sonnet | sonnet | haiku |

## Profile Philosophy

**quality** - Maximum reasoning power
- Opus for all decision-making agents
- Sonnet for read-only verification
- Use when: quota available, critical architecture work

**balanced** (default) - Smart allocation
- Opus only for planning (where architecture decisions happen)
- Sonnet for execution and research (follows explicit instructions)
- Sonnet for verification (needs reasoning, not just pattern matching)
- Use when: normal development, good balance of quality and cost

**budget** - Minimal Opus usage
- Sonnet for anything that writes code
- Haiku for research and verification
- Use when: conserving quota, high-volume work, less critical phases

## Resolution Logic

Orchestrators resolve model before spawning:

```
1. Read .planning/config.json
2. Get model_profile (default: "balanced")
3. Look up agent in table above
4. Pass model parameter to Task call
```

## Switching Profiles

Runtime: `/vit:set-profile <profile>`

Per-project default: Set in `.planning/config.json`:
```json
{
  "model_profile": "balanced"
}
```

## Design Rationale

**Why Opus for vit-planner?**
Planning involves architecture decisions, goal decomposition, and task design. This is where model quality has the highest impact.

**Why Sonnet for vit-executor?**
Executors follow explicit PLAN.md instructions. The plan already contains the reasoning; execution is implementation.

**Why Sonnet (not Haiku) for verifiers in balanced?**
Verification requires goal-backward reasoning - checking if code *delivers* what the phase promised, not just pattern matching. Sonnet handles this well; Haiku may miss subtle gaps.

**Why Haiku for vit-codebase-mapper?**
Read-only exploration and pattern extraction. No reasoning required, just structured output from file contents.
