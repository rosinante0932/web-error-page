import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'system'

export const useUiStore = defineStore('ui', {
  state: () => ({
    theme: 'system' as ThemeMode,     // 🆕 默认跟随系统
    sidebarOpen: false,
    token: '' // 建议敏感信息不要持久化
  }),
  actions: {
    setTheme(mode: ThemeMode) {
      this.theme = mode
    },
    // 可选：循环切换
    cycleTheme() {
      const order: ThemeMode[] = ['light', 'dark', 'system']
      const idx = order.indexOf(this.theme)
      this.theme = order[(idx + 1) % order.length]
    }
  },
  // pinia-plugin-persistedstate 写法（已安装）
  persist: {
    key: 'ui',
    pick: ['theme', 'sidebarOpen']
  }
})
