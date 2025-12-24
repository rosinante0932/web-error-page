<template>
    <div class="relative" :class="className">
        <img src="/assets/yhicon.png" alt="下载链接二维码" class="w-[40px] absolute left-[50%] top-[50%] translate-[-50%]"
            :style="{ width: `${iconSize}px` }">
        <QrcodeVue :value="finalUrl" :size="size" level="Q" />
    </div>
</template>

<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'
import { ref } from 'vue'
const props = defineProps(['size', 'url', 'className', 'iconSize'])

const finalUrl = ref(props.url);

onMounted(() => {
  // 只有浏览器才有 window/location
  const origin = window.location.origin;
  if (!/^https?:\/\//i.test(props.url)) {
    finalUrl.value = origin + props.url;
  }
});
</script>
