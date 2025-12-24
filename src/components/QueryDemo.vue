<template>
  <div class="p-4 rounded-xl border shadow-sm">
    <p class="font-bold mb-2">TanStack Query Demo</p>
    <p class="mb-3 text-sm opacity-70">Fetching a placeholder todo item with automatic caching & revalidation.</p>
    <button class="px-3 py-1 rounded bg-black text-white mb-3" @click="refetch()">Refetch</button>
    <div v-if="isLoading">Loading...</div>
    <div v-else-if="error">Error: {{ (error as any)?.message }}</div>
    <pre v-else class="text-xs bg-gray-50 p-3 rounded overflow-auto">{{ data }}</pre>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['todo', 1],
  queryFn: async () => {
    const res = await fetch('https://jsonplaceholder.typicode.com/todos/1')
    if (!res.ok) throw new Error('Network error')
    return res.json()
  }
})
</script>
