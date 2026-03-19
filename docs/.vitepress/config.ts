import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'VIT',
    description: 'Phase-based project execution framework for Claude Code',
    base: '/vit-cc/',

    themeConfig: {
      nav: [
        { text: 'Guide', link: '/guide/how-vit-works' },
        { text: 'Contributing', link: '/contributing/command-anatomy' },
        { text: 'Reference', link: '/reference/github-integration' },
      ],

      sidebar: [
        {
          text: 'Guide',
          items: [
            { text: 'How VIT Works', link: '/guide/how-vit-works' },
            { text: 'Architecture Deep Dive', link: '/guide/architecture' },
            { text: 'Workflow Files', link: '/guide/workflow-files' },
            { text: 'Templates and References', link: '/guide/templates-references' },
          ],
        },
        {
          text: 'Contributing',
          items: [
            { text: 'Command Anatomy', link: '/contributing/command-anatomy' },
            { text: 'Agent Anatomy', link: '/contributing/agent-anatomy' },
            { text: 'Testing', link: '/contributing/testing' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'GitHub Integration', link: '/reference/github-integration' },
            { text: 'Configuration', link: '/reference/configuration' },
            { text: 'Hooks and Sessions', link: '/reference/hooks-sessions' },
          ],
        },
      ],

      search: {
        provider: 'local',
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/LeVarez/vit-cc' },
      ],

      editLink: {
        pattern: 'https://github.com/LeVarez/vit-cc/edit/main/docs/:path',
        text: 'Edit this page on GitHub',
      },
    },
  })
)
