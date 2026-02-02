<script setup lang="ts">
import { onErrorCaptured } from 'vue';
import { initClientLoggersOnce } from "@/utils/client-error-init";

initClientLoggersOnce();

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