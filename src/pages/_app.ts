import type { App } from 'vue'

import piniaPersist from 'pinia-plugin-persistedstate'
import type { VueQueryPluginOptions } from '@tanstack/vue-query' 

export default (app: App) => {
  // Each island gets its own query client (safe for Astro + islands)
  const queryClient = new QueryClient()
  const options: VueQueryPluginOptions = { queryClient }
  // Installing multiple times is safe; Vue ignores duplicate plugins
  const pinia = createPinia()
  pinia.use(piniaPersist)          // 注册持久化插件
  app.use(pinia)
  app.use(VueQueryPlugin, options)
}
