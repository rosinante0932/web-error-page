import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import sitemap from '@astrojs/sitemap'
import UnoCSS from 'unocss/astro'
import node from '@astrojs/node'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath } from 'node:url'
import { site_config } from './config/site.config.mjs'

const APP_ENV = process.env.APP_ENV || 'dev'

console.log(APP_ENV, '当前环境')

const SITE_URL = process.env.SITE_URL || 'https://example.com'

console.log(site_config(APP_ENV), '当前环境变量')
const SRC = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  env: {
    schema: {
      ...site_config(APP_ENV)
    }
  },
  site: SITE_URL,
  output: 'server',
  server: { port: 4321, host: true },
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    vue({ appEntrypoint: '/src/pages/_app.ts' }),
    UnoCSS({
      injectReset: true, //dark: 'class' 
    }),
    sitemap({
      i18n: {
        defaultLocale: 'zh',
        locales: { zh: 'zh-CN', en: 'en', th: 'th', km: 'km', ko: 'ko', vi: 'vi' }
      }
    })
  ],
  i18n: {
    locales: ['zh', 'en', 'th', 'km', 'ko', 'vi'],
    defaultLocale: 'zh',
    routing: {
      strategy: 'pathname',        // ✅ 改为 pathname
      prefixDefaultLocale: true    // ✅ /zh/... 也有前缀，与你的目录结构一致
    }
  },
  vite: {
    resolve: {
      alias: {
        '@': SRC,
        '~': SRC
      }
    },
    plugins: [
      AutoImport({
        // 这里既可以导入函数，也可以导入“type 类型”
        imports: [
          // 例：如果你也想自动引入 vue 的 ref、computed 等
          'vue',
          'pinia',
          {
            '@tanstack/vue-query': [
              'useQuery',
              'useMutation',
              'useQueryClient',
              'QueryClient',
              'VueQueryPlugin',
            ],
          },
        ],
        dts: 'src/auto-imports.d.ts',         // 生成声明文件，给 TS 用
        eslintrc: { enabled: true },          // 可选：生成 ESLint 配置，避免 “未定义” 报错
      }),
    ],
  }
})