import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'VIT',
  description: 'Phase-based project execution framework for Claude Code',
  base: '/vit-cc/',
  cleanUrls: false,
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: 'Get Started', link: '/guide/getting-started' },
      { text: 'Concepts', link: '/concepts/overview' },
      { text: 'Commands', link: '/commands/' },
      { text: 'Agents', link: '/agents/' },
      { text: 'Guides', link: '/guides/' },
      {
        text: 'GitHub',
        link: 'https://github.com/LeVarez/vit-cc'
      }
    ],

    sidebar: {},

    socialLinks: [
      { icon: 'github', link: 'https://github.com/LeVarez/vit-cc' }
    ],

    editLink: {
      pattern: 'https://github.com/LeVarez/vit-cc/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    search: {
      provider: 'local',
      options: {
        _render(src, env, md) {
          const html = md.render(src, env)
          if (env.frontmatter?.title)
            return md.render(`# ${env.frontmatter.title}`) + html
          return html
        }
      }
    }
  }
})
