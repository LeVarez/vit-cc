---
layout: home

hero:
  name: "VIT"
  text: "Phase-Based AI Development Framework"
  tagline: "Orchestrate complex projects with Claude Code — from planning through verification, with full GitHub integration."
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/
    - theme: alt
      text: View on GitHub
      link: https://github.com/LeVarez/vit-cc

features:
  - icon: "\U0001F4CB"
    title: Phase-Based Workflow
    details: Break complex projects into discrete, scoped phases. Each phase has a plan, tasks, verification criteria, and atomic commits — executed autonomously by Claude Code.

  - icon: "\U0001F916"
    title: AI Agents (16 specialists)
    details: Planning, execution, verification, and GitHub integration agents — each with a defined role, trigger, and output format. Invoked automatically or run independently.

  - icon: "\U0001F517"
    title: GitHub Integration
    details: Every step reflected in GitHub automatically — issues, PRs, CI results, and changelogs. The closed loop means zero manual GitHub operations from your terminal.

  - icon: "\U0001F9E0"
    title: Smart State Management
    details: STATE.md persists full project context across context resets. Resume exactly where you left off, hand off between team members, and track all decisions over time.

  - icon: "\u2705"
    title: Built-in Quality Gates
    details: Verification agents check phase success criteria before merge. CI posts results to the linked GitHub issue. Review feedback triggers targeted fix commits.

  - icon: "\U0001F527"
    title: Extensible
    details: Write custom agents, add hooks, and configure profiles for your team. VIT installs into your .claude/ directory and follows your conventions.
---
