# Documentation Pitfalls

**Domain:** Creating documentation for an agentic AI framework (vit-cc)
**Researched:** 2026-03-19
**Confidence:** HIGH (derived from codebase analysis, documentation research, and agentic framework ecosystem study)

---

## Critical Pitfalls

Mistakes that cause rewrites or fundamentally undermine documentation value.

---

### Pitfall 1: Treating the Two Audiences as One

**What goes wrong:** Documentation written for users (people running `/vit:execute-phase`) and developers (people writing custom agents) gets merged into a single document. Users hit walls of architectural explanation they don't need; developers can't find extension patterns buried in usage tutorials. Both groups bounce.

**Why it happens:** It feels more organized to have one place for everything. Writers default to a single README or wiki page to avoid duplication.

**Consequences:** Users can't find the command reference. Developers can't find the extension guide. Neither audience trusts the docs enough to use them as a primary reference. The documentation becomes supplementary at best.

**Prevention:** Enforce a hard structural split from the start. User-facing pages never explain why the architecture works; developer-facing pages never repeat command syntax. Create two entry points — a user guide index and a developer guide index — and cross-link only when necessary.

**Warning signs:**
- A single "getting started" page that explains both "run this command" and "here's how agents work internally"
- Command reference pages that include architectural rationale
- Architecture pages that include command usage examples
- Users asking "where are the commands?" after reading the docs

**Documentation phase:** Address in the getting started and command reference phase (earliest). This split must be established in the information architecture before any content is written.

---

### Pitfall 2: Documenting What It Is Instead of What It Does

**What goes wrong:** Documentation describes the framework's components (agents, commands, workflows, templates) as objects — what they are, what they contain — rather than what they accomplish for the user. The result is a catalog, not a guide.

**Why it happens:** It is far easier to describe the structure of a file than to articulate the outcome it produces for the user. Writers default to what they can see.

**Consequences:** Users read the entire agent reference and still don't know when to run `/vit:plan-phase` vs. `/vit:execute-phase`. Developers read architecture docs and can't figure out where to put their custom agent file. The documentation answers "what exists?" but not "what do I do?"

**Prevention:** For every document, lead with the user outcome. "vit-planner creates a PLAN.md" becomes "use plan-phase to get Claude to produce a step-by-step execution plan for your phase." Every command reference entry starts with the job the user is trying to accomplish, not the mechanism.

**Warning signs:**
- Agent reference pages that open with "vit-planner is a specialist agent that..."
- Command pages whose first sentence is "This command reads STATE.md and..."
- Absence of examples showing what the output looks like after running a command
- No section explaining when to use a command vs. when not to

**Documentation phase:** Address in command reference and agent reference phases. Reviewers should explicitly ask: "does this tell the user what they'll accomplish?"

---

### Pitfall 3: Assuming Readers Already Understand AI Agents

**What goes wrong:** Documentation assumes readers know what an "agent" is in the Claude Code sense — that agents are spawned automatically by commands, that the user doesn't invoke them directly, that they run in a subagent context with isolated state. This assumption is wrong for most users of vit-cc.

**Why it happens:** The writers are deeply familiar with the framework and find the agent model obvious. They write for an imagined reader who already understands Claude Code's Task tool and agent spawning model.

**Consequences:** Users try to invoke agents directly as if they were commands (e.g., typing the agent name in Claude Code). Users don't understand why verify-work "does all that automatically." Developers don't understand what a system prompt change actually changes. Fundamental confusion persists even after reading all the docs.

**Prevention:** Explicitly explain the agent model once, early, in a dedicated conceptual page. Define: what an agent is in vit-cc, how commands spawn them, that users never invoke agents directly, and what "subagent context" means practically. Then reference this page from every agent reference entry.

**Warning signs:**
- Agent reference pages that don't explain how the agent gets invoked
- No conceptual overview page in the user guide
- Community questions like "how do I run vit-planner?"
- Agent reference entries that look identical in structure to command reference entries

**Documentation phase:** Address in the conceptual overview section, before agent reference. This is prerequisite content.

---

### Pitfall 4: Writing the Reference Before Writing the Guide

**What goes wrong:** Documentation phases produce a complete command reference and agent reference, but no "getting started" guide and no task-oriented how-to pages. Users get a thorough encyclopedia with no map.

**Why it happens:** Reference documentation is mechanical to produce — enumerate the commands, describe the flags, done. Tutorial and how-to content requires understanding user goals and requires more writing judgment. Teams write the easy thing first.

**Consequences:** Users with zero context about vit-cc have no starting point. They read the command reference in order, reach `/vit:execute-phase`, and have no idea what a phase is, what STATE.md is, or why the commands are run in a specific sequence. Reference documentation without a guide produces knowledgeable experts but leaves beginners stranded.

**Prevention:** Write the getting started guide and core workflow walkthrough before the reference docs. The guide defines the mental model that makes the reference comprehensible. Reference docs are only useful to users who already understand the core loop.

**Warning signs:**
- Documentation phase plan that starts with "command reference" and has "getting started" later
- Reference pages that require unexplained jargon ("phase," "plan," "wave," "route")
- No document that walks through `/vit:new-project` → `/vit:plan-phase` → `/vit:execute-phase` → `/vit:verify-work` end-to-end

**Documentation phase:** Getting started and core workflow should be Phase 1 of any documentation roadmap. Reference phases follow.

---

### Pitfall 5: Documenting Every File, Missing the Mental Model

**What goes wrong:** Every agent gets a page, every command gets a page, every template gets described. But no page explains the conceptual model: phase-based execution, why phases produce atomic commits, what the `.planning/` directory is for, what "state persists across context resets" means in practice.

**Why it happens:** It is easier to count and document artifacts than to articulate the model. Writers produce complete coverage without coverage of the most important thing.

**Consequences:** Developers who want to extend vit-cc with a custom agent don't know what role their agent should play in the orchestration model. Users don't understand why they should use `/vit:pause-work` instead of just stopping. The framework feels like a bag of tools instead of a coherent system.

**Prevention:** Before writing any reference documentation, write the mental model pages: what is a phase, what is a plan, how does state work, what does "atomic commit" mean in this context, how do agents relate to commands. These concepts appear in every other page and must be defined centrally.

**Warning signs:**
- No "concepts" or "how it works" section in the developer guide
- Terms like "wave," "checkpoint," "route A/B/C," "phase goal" used without a definition page
- Developer guide that jumps straight to "creating a custom agent" without explaining the agent/orchestrator relationship

**Documentation phase:** Address in Phase 1 (conceptual overview). Must precede all reference documentation.

---

## Moderate Pitfalls

Mistakes that create debt or user confusion but don't require full rewrites.

---

### Pitfall 6: Example Commands That Don't Run

**What goes wrong:** Command reference pages include example invocations that use placeholder values (e.g., `/vit:plan-phase N`, `/vit:execute-phase <phase_number>`) without explaining what to substitute, or that require context (an initialized project, a specific phase state) without saying so.

**Why it happens:** Writers copy command signatures from the code and add examples that look like documentation without verifying they're reproducible.

**Consequences:** New users copy the first example they see, run it, and get an error. They conclude the docs are broken. Trust is damaged immediately, before the user ever successfully runs a command.

**Prevention:** Every example in the documentation must be runnable in the stated context. Use realistic values, not placeholders. When a command requires prior setup (an initialized project), state this explicitly in a "Prerequisites" or "Before you start" line.

**Warning signs:**
- Examples with angle bracket placeholders that aren't explained
- Phase number examples that use abstract "N" without showing what a real phase number looks like
- No "What you'll see" section showing the output after running the command

**Documentation phase:** Address during command reference writing. Reviewers should attempt to run every example.

---

### Pitfall 7: Treating Agent Markdown as Self-Documenting

**What goes wrong:** The agent files in `files/agents/` are detailed markdown documents that describe the agent's role, tools, and behavior. The documentation team decides to expose these directly (or summarize them mechanically) as the agent reference, without translating them into user-facing language.

**Why it happens:** The agent files are well-written and comprehensive. It feels redundant to rewrite them. The team assumes users will understand system prompt language.

**Consequences:** The agent reference reads like internal specification documents. Users see instructions written for Claude ("You are a specialist agent...") not for humans. Developers who want to customize an agent don't know which parts are safe to change.

**Prevention:** The agent reference in the documentation is a translation of the agent file, not a reproduction. It answers: what does this agent do for you, when is it invoked, what does its output look like, and (for developers) what aspects are customizable and how.

**Warning signs:**
- Agent reference pages that begin with "You are..."
- Pages that reproduce the agent's tool list without explaining what those tools are used for
- No indication of when the agent runs in the user's workflow

**Documentation phase:** Address during agent reference phase. Establish a template that explicitly separates user-facing explanation from developer-facing customization guidance.

---

### Pitfall 8: Architecture Diagrams That Describe Code Instead of Intent

**What goes wrong:** Architecture documentation focuses on which files exist and where they live (`files/agents/`, `files/commands/vit/`, `.planning/`) rather than explaining the design decisions and the reasoning behind the layering.

**Why it happens:** File structure is observable. Design intent requires interpretation and takes more writing effort.

**Consequences:** A developer reading the architecture docs can describe the folder structure perfectly but can't answer "where does my new agent go?" or "why is the executor separate from the orchestrator?" They still have to read the code to understand the system.

**Prevention:** Architecture documentation for vit-cc should explain the three-tier pattern (command orchestrators, specialist agents, persistent state) in terms of why the separation exists and what invariants each tier maintains. The folder structure is secondary to the conceptual model.

**Warning signs:**
- Architecture pages that are primarily file tree listings
- No explanation of why commands don't do work themselves
- No explanation of why `.planning/` is the state store instead of in-memory context
- Diagrams that map to code structure but not to user mental model

**Documentation phase:** Address in developer guide architecture section.

---

### Pitfall 9: Describing What Agents Can Do Instead of What They Actually Do

**What goes wrong:** Agent reference pages describe the agent's capabilities (tools it has access to, things it could do) rather than its actual behavior in the vit-cc workflow. The distinction matters: `vit-executor` has access to many tools, but what it actually does follows a specific protocol.

**Why it happens:** Capability enumeration is easier than behavioral description. Writers list what the agent has, not what it does.

**Consequences:** Developers who want to modify `vit-executor` behavior think they're free to change the output format. Users don't understand why the executor produces specific files. Critical behavioral invariants (atomic commits, checkpoint stops, SUMMARY.md creation) are invisible.

**Prevention:** Each agent's documentation must describe the behavioral contract: inputs it receives, actions it takes in sequence, outputs it produces, invariants it maintains, and what breaks if these are violated. Capability description (which tools) is secondary.

**Warning signs:**
- Agent pages that list tools but don't describe the execution sequence
- No section on what files/outputs the agent creates
- No section on what assumptions the next step in the workflow makes about the agent's output

**Documentation phase:** Address during agent reference phase. Define a standard template that enforces behavioral contract coverage.

---

### Pitfall 10: Extension Guide That Doesn't Address Common Customization Scenarios

**What goes wrong:** The developer guide explains the general pattern for creating a custom agent (put a file here, use this frontmatter) without addressing the actual scenarios developers want to customize: adding a new command, modifying an existing agent's behavior, adding a post-phase hook, changing the planning output format.

**Why it happens:** Writers explain the mechanism without grounding it in user goals. The guide answers "how does extension work technically?" but not "how do I do the specific thing I want to do?"

**Consequences:** Developers understand the pattern abstractly but can't apply it. They experiment, break things, and blame the documentation for being insufficient. The framework gets a reputation for being difficult to extend.

**Prevention:** Ground the extension guide in concrete scenarios. For vit-cc specifically, address: adding a new slash command, modifying an agent's system prompt, creating a new agent that fits into an existing workflow, adding a new post-phase hook. Each scenario should produce a working, tested result.

**Warning signs:**
- Extension guide that only explains the file format and location
- No end-to-end walkthrough of creating a custom component
- No explanation of how the new component integrates into the existing workflow
- No section on testing or verifying the custom component works

**Documentation phase:** Address in advanced/developer guide phase.

---

## Minor Pitfalls

Mistakes that cause friction but are straightforward to fix.

---

### Pitfall 11: Inconsistent Terminology Across Pages

**What goes wrong:** Different pages use different terms for the same concept. "Phase plan" and "PLAN.md" and "execution plan" refer to the same artifact. "Route A/B/C" isn't explained anywhere but appears in verify-work documentation. "Wave" is used without definition in execute-phase docs.

**Prevention:** Establish a glossary page early. Every term used across more than one page gets a canonical definition. Writers use the glossary term, not an improvised synonym.

**Warning signs:** Cross-referencing a term that leads to a different term on the next page.

**Documentation phase:** Establish glossary in Phase 1. Enforce during review.

---

### Pitfall 12: State-Dependent Commands Documented Without State Requirements

**What goes wrong:** Commands that require specific state to function (e.g., `/vit:execute-phase` requires an existing PLAN.md, `/vit:verify-work` requires a completed execution) are documented without specifying what state they need. Users run them out of order and get confusing errors.

**Prevention:** Every command reference page includes an explicit "Prerequisites" section listing what state must exist before the command can run.

**Warning signs:** Users reporting that commands "fail silently" or "don't do anything" — usually because prerequisites aren't met and the failure isn't obvious.

**Documentation phase:** Address during command reference phase.

---

### Pitfall 13: vit-cc-Specific Jargon Not Defined on First Use

**What goes wrong:** Terms specific to vit-cc — "milestone," "phase," "plan," "wave," "checkpoint," "route" — are used without definition. These terms overlap with general software development terminology but have specific meanings in vit-cc that differ from the general meaning.

**Prevention:** Define every vit-cc-specific term on its first use with a link to the glossary. The getting started guide should introduce terms in the order users encounter them.

**Warning signs:** Feedback like "I don't understand the difference between a milestone and a phase."

**Documentation phase:** Address in getting started guide and conceptual overview.

---

### Pitfall 14: Documenting Only the Happy Path

**What goes wrong:** Every workflow description shows the successful case. No documentation covers what happens when verification fails (Route B), when a phase is incomplete, when the context window fills mid-phase, or when `gh` is not available.

**Prevention:** For each core workflow, include a "What if it doesn't work?" section. Document the error states that users encounter in practice.

**Warning signs:** High volume of "what do I do when X fails?" questions in community channels despite comprehensive docs.

**Documentation phase:** Address in command reference and workflow guides. Add after the happy path is documented.

---

## Documentation Maintenance Pitfalls

Problems that emerge over time as the codebase evolves.

---

### Pitfall 15: Documentation Not Tied to Code Changes

**What goes wrong:** Agent behavior changes when the agent markdown file changes. Command behavior changes when the command markdown file changes. The documentation lives separately and is only updated when someone remembers. Within weeks, the docs and the code diverge.

**Why it especially matters for vit-cc:** vit-cc ships as markdown files. The "code" is the markdown. Docs and code are the same medium, making it easy to change the code and forget to update the docs.

**Prevention:** The existing `vit-doc-updater` agent already runs after each phase. For the documentation milestone itself, establish an explicit rule: no agent or command file change ships without a corresponding documentation update. The documentation milestone's verification criteria should include checking that command changes are reflected in the command reference.

**Warning signs:**
- Command reference that describes flags that no longer exist
- Agent reference that describes an output format that changed
- Getting started guide that references a command signature that was renamed

**Documentation phase:** Establish in Phase 1 as a maintenance protocol. Also addressed by the vit-doc-updater already in the framework.

---

### Pitfall 16: No Single Source of Truth for Command Signatures

**What goes wrong:** Command signatures (the `/vit:command-name` syntax and options) are described in the command markdown files, in the README, and in the documentation. When a command changes, one source gets updated and the others drift.

**Prevention:** The command markdown files in `files/commands/vit/` are the authoritative source. All other documentation derives from them. The documentation should clearly state this and provide tooling or a process to verify consistency.

**Warning signs:** Different command signatures appearing in README vs. command reference vs. getting started guide.

**Documentation phase:** Address in information architecture phase. Establish the derivation chain early.

---

## Phase-Specific Warnings

| Documentation Phase | Likely Pitfall | Mitigation |
|---------------------|---------------|------------|
| Getting Started / Core Workflow | Writing reference before guide (Pitfall 4) | Enforce: getting started must exist and be reviewed before any reference work starts |
| Getting Started / Core Workflow | Assuming agent model is understood (Pitfall 3) | Include a conceptual overview section that defines the user-visible model |
| Command Reference | Examples that don't run (Pitfall 6) | Reviewer must attempt to run every example in a test project |
| Command Reference | State requirements missing (Pitfall 12) | Template must include "Prerequisites" section |
| Agent Reference | Reproducing system prompts instead of translating (Pitfall 7) | Template must require user-facing behavioral description, not capability list |
| Agent Reference | Describing capabilities instead of behavior (Pitfall 9) | Template must require: inputs, action sequence, outputs, invariants |
| Developer / Architecture Guide | File structure instead of intent (Pitfall 8) | Architecture doc must answer "why" questions, not just "what exists" |
| Developer / Extension Guide | Abstract extension guide without scenarios (Pitfall 10) | Guide must include at least one end-to-end custom agent walkthrough |
| All phases | Inconsistent terminology (Pitfall 11) | Glossary in Phase 1; enforce during review |
| All phases | Divergence over time (Pitfall 15) | Establish doc-update checklist as part of every future framework change |

---

## What Makes Framework Documentation Succeed

For reference: these are the positive patterns, derived from the pitfall analysis.

1. **Separate entry points for separate audiences.** User guide and developer guide are distinct structures with distinct entry points. Cross-references connect them but do not merge them.

2. **Mental model before mechanics.** Conceptual overview precedes all reference docs. Users understand the core loop (new-project → plan-phase → execute-phase → verify-work) before reading about individual commands.

3. **Outcome-first writing.** Every page starts with what the user accomplishes, not what the component is.

4. **Reproducible examples.** Every example either works as-is or states its exact prerequisites.

5. **Behavioral contracts for agents.** Agent reference describes inputs, action sequence, outputs, and invariants — not just capabilities.

6. **Extension guide grounded in real scenarios.** Developers can follow a walkthrough to add a custom agent and see it working.

7. **Glossary enforced early.** vit-cc-specific terms defined once, used consistently.

---

## Sources

- Direct codebase analysis: `/Users/aleix/Documents/Projects/ViT/vit-cc/.planning/codebase/ARCHITECTURE.md` — HIGH confidence
- Direct codebase analysis: `/Users/aleix/Documents/Projects/ViT/vit-cc/.planning/PROJECT.md` — HIGH confidence
- Direct codebase analysis: `/Users/aleix/Documents/Projects/ViT/vit-cc/README.md` — HIGH confidence
- [Breaking down common documentation mistakes — Mintlify](https://www.mintlify.com/blog/breaking-down-common-documentation-mistakes) — MEDIUM confidence
- [10 Common Developer Documentation Mistakes — Document360](https://document360.com/blog/developer-documentation-mistakes/) — MEDIUM confidence
- [Diátaxis Framework — documentation.ai](https://documentation.ai/blog/diataxis-framework) — MEDIUM confidence (Diátaxis is an established framework; specific article MEDIUM)
- [How to write a great AGENTS.md — GitHub Blog](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/) — MEDIUM confidence
- [Writing AI coding agent context files — Packmind](https://packmind.com/evaluate-context-ai-coding-agent/) — MEDIUM confidence
- [In Agentic AI, It's All About the Markdown — Visual Studio Magazine](https://visualstudiomagazine.com/articles/2026/02/24/in-agentic-ai-its-all-about-the-markdown.aspx) — MEDIUM confidence
- [13 Things People Hate about Your Open Source Docs — SmartBear](https://smartbear.com/blog/13-things-people-hate-about-your-open-source-docs/) — MEDIUM confidence

---

*Pitfalls research for: vit-cc v1.1 Documentation & Developer Guide milestone*
*Researched: 2026-03-19*
