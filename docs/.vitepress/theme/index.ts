import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import AsciiLogo from './components/AsciiLogo.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-before': () => h(AsciiLogo)
    })
  }
}
