<template>
    <!-- 用 ref 包住整块，下方用它判断是否点击在外部 -->
    <div ref="root" class="relative">
        <!-- 桌面版 -->
        <div class="flex items-center gap-2 sm:hidden xs:hidden lg:block">
            <div @click="onToggle" class="cursor-pointer select-none">
                <span class="pr-2 text-[12px] b-r-1 b-[#7281A2] align-text-bottom">
                    <img class="inline align-sub" :src="ballUrl" :alt="getLangMeta(lang).label" />
                </span>
                <span class="pl-2 relative">
                    <span class="text-[#1f2937]">{{ getLangMeta(lang).lang }}</span>
                    <ul @click.stop :class="[
                        'min-w-30 absolute translate-x-1/2 top-8 right-[50%] bg-[#F2F9FF] overflow-hidden rounded-[11px]',
                        'shadow-[0_16px_24px_rgba(43,142,203,0.08)] border border-[#2B8ECB]/20 z-100',
                        turnOnOrOff ? 'block' : 'hidden'
                    ]" role="menu" :aria-hidden="!turnOnOrOff">
                        <li @click="changeLang(item.href)" v-for="(item, index) in props.links"
                            :key="item.code || index" :class="`px-4 rounded hover:bg-white ${index === 0 ? 'pb-2 pt-4' : index === props.links.length - 1 ? 'pb-4 pt-2' : 'py-2'
                                }`" role="menuitem">
                            <span class="no-underline decoration-none">
                                {{ item.label }}
                            </span>
                        </li>
                    </ul>
                </span>
            </div>
            <img src="/assets/header/hover.svg" alt="" class="opacity-0" />
        </div>

        <!-- 移动端 -->
        <div
            class="lg:hidden sm:block xs:block rounded-[30px] p-[1px] bg-white relative shadow-[0_8px_12px_0_rgba(43,142,203,0.08)]">
            <button class="h-[30px] px-[13px] rounded-[29px] bg-white/40 backdrop-blur-[16px]
               inline-flex items-center gap-[6px] text-[#2B8ECB] text-[14px] leading-none
               transition-300 active:scale-98 select-none" @click="onToggle" :aria-expanded="turnOnOrOff"
                aria-haspopup="menu">
                <span>{{ getLangMeta(lang).lang }}</span>
                <svg class="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>

            <ul @click.stop :class="[
                'mt-2 min-w-30 absolute translate-x-1/2 top-8 right-[50%] bg-[#F2F9FF] overflow-hidden rounded-[11px]',
                'shadow-[0_16px_24px_rgba(43,142,203,0.08)] border border-[#2B8ECB]/20 z-100',
                turnOnOrOff ? 'block' : 'hidden'
            ]" role="menu" :aria-hidden="!turnOnOrOff">
                <li v-for="(item, index) in props.links" :key="item.code || index" :class="`px-4 rounded hover:bg-white ${index === 0 ? 'pb-2 pt-4' : index === props.links.length - 1 ? 'pb-4 pt-2' : 'py-2'
                    }`" role="menuitem">
                    <span class="no-underline decoration-none" @click="changeLang(item.href)">
                        {{ item.label }}
                    </span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getLangMeta } from '@/configs/i18n.config'
import ballUrl from '@/assets/svg/ball.svg?url'

const props = defineProps(['links', 'lang'])

const turnOnOrOff = ref(false)
const root = ref<HTMLElement | null>(null)

const onToggle = () => (turnOnOrOff.value = !turnOnOrOff.value)
const close = () => (turnOnOrOff.value = false)

// 点击页面其它地方关闭
const onDocClick = (e: MouseEvent) => {
    const el = root.value
    if (!el) return
    if (!el.contains(e.target as Node)) {
        close()
    }
}
// Esc 关闭（更友好）
const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close()
}

const changeLang = (url: string) => {
    // 获取当前页面的查询参数
    const currentParams = new URLSearchParams(window.location.search)

    // 解析目标 URL
    const targetUrl = new URL(url, window.location.origin)

    // 将当前的查询参数添加到目标 URL
    currentParams.forEach((value, key) => {
        targetUrl.searchParams.set(key, value)
    })

    window.open(targetUrl.toString(), '_self')
}

onMounted(() => {
    document.addEventListener('click', onDocClick, true) // 使用 capture，体验更稳
    document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
    document.removeEventListener('click', onDocClick, true)
    document.removeEventListener('keydown', onKeydown)
})
</script>
