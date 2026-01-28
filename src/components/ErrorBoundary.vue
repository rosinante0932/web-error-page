<script setup lang="ts">
import { onErrorCaptured, onMounted } from 'vue';
import { initClientLoggersOnce } from "@/utils/client-error-init";


initClientLoggersOnce();

onMounted(() => {
    console.log('Vue 组件已挂载');
    console.log("[boot] mounted");
    initClientLoggersOnce();
});

onErrorCaptured((err, instance, info) => {
    console.error('Vue 错误:', err);

    // 上报错误
    if (typeof window !== 'undefined') {

    }

    return false;
});
</script>

<template>
    <slot />
</template>