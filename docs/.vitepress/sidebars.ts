import type { DefaultTheme } from 'vitepress'

export const gettingStartedSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Overview', link: '/getting-started/' },
      { text: 'Installation', link: '/getting-started/installation' },
      { text: 'First Project', link: '/getting-started/first-project' },
    ]
  }
]

export const conceptsSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Concepts',
    items: [
      { text: 'Overview', link: '/concepts/' },
      { text: 'Phases', link: '/concepts/phases' },
      { text: 'Milestones', link: '/concepts/milestones' },
      { text: 'Agents', link: '/concepts/agents' },
      { text: 'State', link: '/concepts/state' },
      { text: 'Workflow Loop', link: '/concepts/workflow-loop' },
    ]
  }
]

export const commandsSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Commands',
    items: [
      { text: 'All Commands', link: '/commands/' },
    ]
  },
  {
    text: 'Project Setup',
    items: [
      { text: 'new-project', link: '/commands/new-project' },
      { text: 'new-milestone', link: '/commands/new-milestone' },
      { text: 'map-codebase', link: '/commands/map-codebase' },
    ]
  },
  {
    text: 'Planning',
    items: [
      { text: 'discuss-phase', link: '/commands/discuss-phase' },
      { text: 'list-phase-assumptions', link: '/commands/list-phase-assumptions' },
      { text: 'research-phase', link: '/commands/research-phase' },
      { text: 'plan-phase', link: '/commands/plan-phase' },
    ]
  },
  {
    text: 'Execution',
    items: [
      { text: 'execute-phase', link: '/commands/execute-phase' },
      { text: 'quick', link: '/commands/quick' },
    ]
  },
  {
    text: 'Verification',
    items: [
      { text: 'verify-work', link: '/commands/verify-work' },
      { text: 'review-feedback', link: '/commands/review-feedback' },
      { text: 'audit-milestone', link: '/commands/audit-milestone' },
    ]
  },
  {
    text: 'Roadmap Management',
    items: [
      { text: 'add-phase', link: '/commands/add-phase' },
      { text: 'insert-phase', link: '/commands/insert-phase' },
      { text: 'remove-phase', link: '/commands/remove-phase' },
      { text: 'plan-milestone-gaps', link: '/commands/plan-milestone-gaps' },
      { text: 'complete-milestone', link: '/commands/complete-milestone' },
      { text: 'list-milestones', link: '/commands/list-milestones' },
    ]
  },
  {
    text: 'Team & State',
    items: [
      { text: 'progress', link: '/commands/progress' },
      { text: 'pause-work', link: '/commands/pause-work' },
      { text: 'resume-work', link: '/commands/resume-work' },
      { text: 'add-todo', link: '/commands/add-todo' },
      { text: 'check-todos', link: '/commands/check-todos' },
      { text: 'assign-phase', link: '/commands/assign-phase' },
      { text: 'team-status', link: '/commands/team-status' },
    ]
  },
  {
    text: 'Configuration',
    items: [
      { text: 'set-profile', link: '/commands/set-profile' },
      { text: 'settings', link: '/commands/settings' },
      { text: 'update', link: '/commands/update' },
      { text: 'help', link: '/commands/help' },
      { text: 'join-discord', link: '/commands/join-discord' },
      { text: 'debug', link: '/commands/debug' },
    ]
  }
]

export const agentsSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Agents',
    items: [
      { text: 'All Agents', link: '/agents/' },
    ]
  },
  {
    text: 'Planning Agents',
    items: [
      { text: 'vit-project-researcher', link: '/agents/vit-project-researcher' },
      { text: 'vit-research-synthesizer', link: '/agents/vit-research-synthesizer' },
      { text: 'vit-phase-researcher', link: '/agents/vit-phase-researcher' },
      { text: 'vit-planner', link: '/agents/vit-planner' },
      { text: 'vit-plan-checker', link: '/agents/vit-plan-checker' },
      { text: 'vit-roadmapper', link: '/agents/vit-roadmapper' },
      { text: 'vit-codebase-mapper', link: '/agents/vit-codebase-mapper' },
    ]
  },
  {
    text: 'Execution Agents',
    items: [
      { text: 'vit-executor', link: '/agents/vit-executor' },
      { text: 'vit-test-writer', link: '/agents/vit-test-writer' },
      { text: 'vit-integration-checker', link: '/agents/vit-integration-checker' },
    ]
  },
  {
    text: 'Verification Agents',
    items: [
      { text: 'vit-verifier', link: '/agents/vit-verifier' },
    ]
  },
  {
    text: 'GitHub Integration Agents',
    items: [
      { text: 'vit-pr-reviewer', link: '/agents/vit-pr-reviewer' },
      { text: 'vit-doc-updater', link: '/agents/vit-doc-updater' },
      { text: 'vit-changelog-writer', link: '/agents/vit-changelog-writer' },
      { text: 'vit-github-reviewer', link: '/agents/vit-github-reviewer' },
      { text: 'vit-debugger', link: '/agents/vit-debugger' },
    ]
  }
]

export const guidesSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Guides',
    items: [
      { text: 'Overview', link: '/guides/' },
      { text: 'Build a Project', link: '/guides/build-a-project' },
      { text: 'Add a Milestone', link: '/guides/add-a-milestone' },
      { text: 'Debug with VIT', link: '/guides/debug-with-vit' },
      { text: 'Custom Agents', link: '/guides/custom-agents' },
    ]
  }
]

export const internalsSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Internals',
    items: [
      { text: 'Overview', link: '/internals/' },
      { text: 'State Management', link: '/internals/state-management' },
      { text: 'GitHub Sync', link: '/internals/github-sync' },
      { text: 'Worktrees', link: '/internals/worktrees' },
      { text: 'Hooks', link: '/internals/hooks' },
    ]
  }
]

export const configSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Configuration',
    items: [
      { text: 'Overview', link: '/config/' },
      { text: 'Profiles', link: '/config/profiles' },
      { text: 'Settings', link: '/config/settings' },
      { text: 'Hooks', link: '/config/hooks' },
    ]
  }
]
