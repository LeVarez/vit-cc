import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
  title: 'VIT',
  description: 'Phase-based AI development workflow framework for Claude Code',
  base: '/vit-cc/',
  appearance: 'dark',
  lastUpdated: true,
  themeConfig: {
    siteTitle: 'VIT',
    search: {
      provider: 'local'
    },
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Commands', link: '/commands/' },
      { text: 'Agents', link: '/agents/' },
      { text: 'Architecture', link: '/architecture/' },
      { text: 'Contributing', link: '/contributing/' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/' }
          ]
        }
      ],
      '/commands/': [
        {
          text: 'Commands',
          items: [
            { text: 'Overview', link: '/commands/' }
          ]
        }
      ],
      '/agents/': [
        {
          text: 'Agents',
          items: [
            { text: 'Overview', link: '/agents/' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/' }
          ]
        }
      ],
      '/contributing/': [
        {
          text: 'Contributing',
          items: [
            { text: 'Overview', link: '/contributing/' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/LeVarez/vit-cc' }
    ]
  },
  mermaid: {} // plugin defaults handle dark/light theme switching
})
