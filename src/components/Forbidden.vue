<template>
    <!-- 用 ref 包住整块，下方用它判断是否点击在外部 -->
    <img :class="`inline align-sub ${props.class}`" :src="forbiddenUrl" alt="403 Forbidden image" />
</template>

<script setup lang="ts">
import forbiddenUrl from '@/assets/img/403.png?url'
const props = defineProps(['class'])

</script>
