import { defineConfig, presetUno, presetAttributify, presetIcons, transformerVariantGroup, transformerDirectives } from 'unocss'

export default defineConfig({
  shortcuts: {
    // 基础按钮
    'btn-base':
      'inline-flex items-center justify-center leading-none font-600 ' +
      'h-[56px] rounded-[40px] text-white transition-all duration-300',
    // 这个设计稿的主按钮
    'btn-primary':
      'btn-base px-4 min-w-40 ' +
      'bg-gradient-to-r from-[#3FEAE4] to-[#5383FF] ' +
      'shadow-[0_4px_16px_0_rgba(82,142,253,0.35)] ' +
      'hover:shadow-[0_8px_20px_0_rgba(82,142,253,0.45)] ' +
      'active:translate-y-0.5',
     'btn-info': `btn-base px-4 min-w-40 inline-flex items-center justify-center
      h-[56px] bg-white text-[#1F2D3D] font-600 leading-none
      border-2 border-transparent
      transition-all duration-300
      active:translate-y-0.5`
  },
  theme: {
    fontFamily: {
      // 覆盖 font-sans
      sans: '"PingFang SC","HarmonyOS Sans SC","Noto Sans SC","Microsoft YaHei","Hiragino Sans GB","Helvetica Neue",Arial,sans-serif',
    },
    // 自定义断点（默认与 Tailwind 相同）
    breakpoints: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons()
  ],
  transformers: [
    transformerVariantGroup(),
    transformerDirectives()
  ],
  safelist: 'container prose mx-auto text-center grid grid-cols-1 md:grid-cols-2 gap-4'.split(' ')
})
