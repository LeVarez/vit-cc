# Requirements: vit-cc Documentation Site

**Defined:** 2026-03-18
**Core Value:** Developers can go from idea to shipped code through a structured, AI-orchestrated workflow that handles planning, execution, review, and documentation automatically.

## v1.1 Requirements

Requirements for documentation site milestone. Each maps to roadmap phases.

### Site Infrastructure

- [ ] **INFRA-01**: VitePress project initialized in `docs/` with own `package.json`
- [ ] **INFRA-02**: Theme configured with dark mode, syntax highlighting, local search
- [ ] **INFRA-03**: Mermaid plugin installed and rendering diagrams correctly
- [ ] **INFRA-04**: ASCII art logo displayed on landing page and site header
- [ ] **INFRA-05**: Multi-sidebar navigation organized by audience (guides, reference, advanced)
- [ ] **INFRA-06**: GitHub Pages deployment via GitHub Actions CI/CD
- [ ] **INFRA-07**: `vitepress build` runs in CI to catch dead links and SSR errors

### Getting Started

- [ ] **GUIDE-01**: Landing page with project overview, value proposition, and quick install
- [ ] **GUIDE-02**: Installation guide (prerequisites, setup steps)
- [ ] **GUIDE-03**: First project walkthrough (`/vit:new-project` end-to-end)
- [ ] **GUIDE-04**: Core concepts page (milestones, phases, plans, agents, state)
- [ ] **GUIDE-05**: Workflow overview with Mermaid diagram showing the full lifecycle

### Command Reference

- [ ] **CMD-01**: Command reference index page with categorized listing
- [ ] **CMD-02**: Each command page documents: description, usage, what to expect, GitHub effects
- [ ] **CMD-03**: Commands grouped by workflow stage (Project Setup, Phase Workflow, State Management, etc.)
- [ ] **CMD-04**: All 29 commands documented with consistent format

### Agent Reference

- [ ] **AGT-01**: Agent reference index page with categorized listing
- [ ] **AGT-02**: Each agent page documents: purpose, when spawned, tools available, inputs/outputs
- [ ] **AGT-03**: All 16 agents documented with consistent format
- [ ] **AGT-04**: Agent orchestration diagram (Mermaid) showing which commands spawn which agents

### Architecture

- [ ] **ARCH-01**: High-level architecture diagram (three-layer pipeline: commands → agents → state)
- [ ] **ARCH-02**: Data flow diagram (how .planning/ files flow between commands)
- [ ] **ARCH-03**: GitHub integration diagram (milestone → issues → branches → PRs → merge)
- [ ] **ARCH-04**: Agent spawning diagram (which orchestrators spawn which agents)

### Advanced / Contributors

- [ ] **ADV-01**: Creating custom agents guide (step-by-step with example)
- [ ] **ADV-02**: Internals reference: .planning/ directory structure and file formats
- [ ] **ADV-03**: Internals reference: STATE.md format and lifecycle
- [ ] **ADV-04**: Internals reference: config.json options
- [ ] **ADV-05**: Contributing guide (how to add commands, agents, modify workflows)

## Future Requirements

Deferred to later milestones.

### Internationalization

- **I18N-01**: Multi-language support for documentation content
- **I18N-02**: Language switcher in navigation

### Interactive

- **INTER-01**: Interactive command playground in browser
- **INTER-02**: Live agent workflow visualization

## Out of Scope

| Feature | Reason |
|---------|--------|
| Internationalization (i18n) | English only for v1.1; complexity not justified for initial launch |
| Interactive playground | Requires server infrastructure; docs are static site |
| API reference / TypeScript auto-docs | vit-cc is Markdown-based, no TypeScript API surface |
| Video tutorials | High production cost, defer to community |
| Algolia DocSearch | VitePress built-in local search sufficient for launch |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | — | Pending |
| INFRA-02 | — | Pending |
| INFRA-03 | — | Pending |
| INFRA-04 | — | Pending |
| INFRA-05 | — | Pending |
| INFRA-06 | — | Pending |
| INFRA-07 | — | Pending |
| GUIDE-01 | — | Pending |
| GUIDE-02 | — | Pending |
| GUIDE-03 | — | Pending |
| GUIDE-04 | — | Pending |
| GUIDE-05 | — | Pending |
| CMD-01 | — | Pending |
| CMD-02 | — | Pending |
| CMD-03 | — | Pending |
| CMD-04 | — | Pending |
| AGT-01 | — | Pending |
| AGT-02 | — | Pending |
| AGT-03 | — | Pending |
| AGT-04 | — | Pending |
| ARCH-01 | — | Pending |
| ARCH-02 | — | Pending |
| ARCH-03 | — | Pending |
| ARCH-04 | — | Pending |
| ADV-01 | — | Pending |
| ADV-02 | — | Pending |
| ADV-03 | — | Pending |
| ADV-04 | — | Pending |
| ADV-05 | — | Pending |

**Coverage:**
- v1.1 requirements: 29 total
- Mapped to phases: 0
- Unmapped: 29

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*
