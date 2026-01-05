<template>
  <div class="rounded-2xl bg-white p-4 shadow-sm">
    <div class="text-lg font-semibold">Client-only Vue Counter</div>
    <div class="mt-2 flex items-center gap-2">
      <button class="rounded-lg bg-slate-900 px-3 py-1 text-white" @click="count--">-</button>
      <span class="min-w-10 text-center tabular-nums">{{ count }}</span>
      <button class="rounded-lg bg-slate-900 px-3 py-1 text-white" @click="count++">+</button>
    </div>
    <p class="mt-3 text-sm text-slate-500">
      这个组件只在浏览器渲染，SEO 由 Astro 页面负责。
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>
