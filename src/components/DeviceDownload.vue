<template>
    <img v-if="isIOSMobile()" src="/assets/download/m/02.png" class="mt-6" alt="" />
    <img v-if="isAndroidMobile()" src="/assets/download/m/03.png" class="mt-6" alt="" />
</template>

<script setup>
import { isIOSMobile, isAndroidMobile } from '@/utils/device'

</script>