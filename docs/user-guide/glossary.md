# Glossary

Definitions for VIT-specific terms. Each entry links to the relevant documentation
page for full context.

## A

### agent

A specialist Claude instance spawned by a VIT command to perform a specific role,
such as planning, executing, or verifying. Agents are orchestrated by commands — users
do not invoke agents directly.
See: [Core Concepts — Agents](core-concepts.md#agents)

### artifacts

The `artifacts` field inside `must_haves` in a plan's frontmatter, listing the files
a plan must produce — each with a `path` and a description of what that file `provides`.
Artifacts are checked by `vit-verifier` after execution to confirm all outputs exist.
See: [Core Concepts — Plans](core-concepts.md#plans)

### autonomous

A boolean flag in plan frontmatter (`autonomous: true`) indicating the plan can execute
without any human checkpoints. When `false`, the plan contains at least one `checkpoint`
task that will pause execution for human review.

## B

### balanced

A model profile setting (`model_profile: balanced`) that selects a middle-tier model
for execution, trading some output quality for lower cost and faster runtime.
`balanced` is the default profile for most phases.

### budget

A model profile setting (`model_profile: budget`) that selects the lowest-cost model
available. Appropriate for mechanical tasks such as renaming files or updating
configuration values where reasoning depth is not required.

## C

### checkpoint

A task type (`type="checkpoint"`) that pauses plan execution and waits for a human to
review, approve, or make a decision before work continues. Used for visual verification,
architectural decisions, and situations requiring human judgment.
See: [Core Concepts — Tasks](core-concepts.md#tasks)

## D

### depends_on

A plan frontmatter field listing the plan IDs that must complete before this plan can
start. `vit-executor` reads `depends_on` to enforce ordering within and across waves.
Plans with no dependencies can run immediately in Wave 1.

## F

### files_modified

A plan frontmatter field listing the file paths that the plan's tasks will create or
modify. Used by the plan checker to detect file conflicts between plans in the same
wave and by reviewers to scope a plan's impact.

## K

### key_links

The `key_links` field inside `must_haves`, defining required cross-references between
files. Each entry specifies a `from` file, a `to` file, a `via` description, and a
`pattern` regex that must match in the source file. Checked by `vit-verifier`.

## M

### milestone

A version-scoped unit of work (e.g., `v1.0`, `v1.1`) containing multiple phases
executed sequentially, with a goal statement and requirements that scope all work.
See: [Core Concepts — Milestones](core-concepts.md#milestones)

### model profile

A configuration setting that selects which Claude model tier is used for a given
operation. The three profiles are `quality` (highest capability), `balanced` (default),
and `budget` (lowest cost). Set in `.planning/config.json` as `model_profile`.

### must_haves

The verification spec in a plan's frontmatter, containing three fields: `truths`
(goal-backward assertions), `artifacts` (files that must exist), and `key_links`
(cross-references that must be present). Evaluated by `vit-verifier` after execution.
See: [Core Concepts — Plans](core-concepts.md#plans)

## P

### phase

A focused unit of work within a milestone, scoped to a specific area of the system.
Phases run sequentially within a milestone and produce output on a dedicated feature branch.
See: [Core Concepts — Phases](core-concepts.md#phases)

### plan

An executable prompt — a `PLAN.md` file with 2-3 tasks, frontmatter metadata, and a
`must_haves` spec — that a `vit-executor` agent runs to produce commits.
See: [Core Concepts — Plans](core-concepts.md#plans)

### PLAN.md

The file that IS the plan. Contains YAML frontmatter (phase, plan number, wave,
`depends_on`, `files_modified`, `must_haves`), an `<objective>`, a `<tasks>` block,
and a `<verification>` section. Created by `vit-planner`, consumed by `vit-executor`.

## Q

### quality

A model profile setting (`model_profile: quality`) that selects the highest-capability
model available. Appropriate for complex reasoning tasks such as architecture planning,
code review, and writing detailed specifications.

## S

### STATE.md

The central project state file at `.planning/STATE.md`, recording the current
milestone, phase, and plan position; accumulated decisions; active blockers; and
session continuity information for resuming work after a context reset.
See: [Core Concepts — State](core-concepts.md#state)

### SUMMARY.md

The completion record produced by `vit-executor` after a plan finishes, documenting
what was built, which commits were made, any deviations from the plan, and decisions
that should carry forward into `STATE.md`.

## T

### task

A single unit of work inside a plan, producing one atomic git commit. Tasks have a
`files` list, an `action`, a `verify` check, and a `done` condition — type is either
`auto` (Claude completes autonomously) or `checkpoint` (pauses for human).
See: [Core Concepts — Tasks](core-concepts.md#tasks)

### truths

The `truths` field inside `must_haves`, written in goal-backward form ("A user can do
X"). These are the assertions that must hold for the plan to be considered complete,
evaluated by `vit-verifier` after execution.

## W

### wave

A group of plans within a phase that execute in parallel. Wave 1 runs first; Wave 2
starts only after all Wave 1 plans complete. Assignments are set by `vit-planner`
based on `depends_on` relationships.
See: [Core Concepts — Waves](core-concepts.md#waves)

## Y

### yolo

A configuration mode (`mode: yolo` in `.planning/config.json`) that skips confirmation
prompts and checkpoint pauses during plan execution. Intended for fully trusted
automated runs where human review checkpoints are unnecessary.
