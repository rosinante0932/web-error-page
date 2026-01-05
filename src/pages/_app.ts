import type { App } from 'vue'

import piniaPersist from 'pinia-plugin-persistedstate'

export default (app: App) => {
  const pinia = createPinia()
  pinia.use(piniaPersist)          // 注册持久化插件
  app.use(pinia)
}
