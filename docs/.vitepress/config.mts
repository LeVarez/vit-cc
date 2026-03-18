import { defineConfig } from 'vitepress'
import {
  gettingStartedSidebar,
  conceptsSidebar,
  commandsSidebar,
  agentsSidebar,
  guidesSidebar,
  internalsSidebar,
  configSidebar
} from './sidebars'

export default defineConfig({
  title: 'VIT',
  description: 'Phase-based project execution framework for Claude Code',
  base: '/vit-cc/',
  cleanUrls: false,

  themeConfig: {
    nav: [
      { text: 'Get Started', link: '/getting-started/' },
      { text: 'Concepts', link: '/concepts/' },
      { text: 'Commands', link: '/commands/' },
      { text: 'Agents', link: '/agents/' },
      { text: 'Guides', link: '/guides/' },
      {
        text: 'GitHub',
        link: 'https://github.com/LeVarez/vit-cc'
      }
    ],

    sidebar: {
      '/getting-started/': gettingStartedSidebar,
      '/concepts/': conceptsSidebar,
      '/commands/': commandsSidebar,
      '/agents/': agentsSidebar,
      '/guides/': guidesSidebar,
      '/internals/': internalsSidebar,
      '/config/': configSidebar,
    },

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
          if (env.frontmatter?.title && !src.match(/^#\s/m))
            return md.render(`# ${env.frontmatter.title}`) + html
          return html
        }
      }
    }
  }
})
