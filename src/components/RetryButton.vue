<template>
  <!-- 内层：按钮主体 + 实线蓝色描边（inset 1px） -->
  <a :href="link">
    <button :class="class">
      {{ title }}
    </button>
  </a>
</template>

<script setup>
import { defineProps } from "vue";
const props = defineProps(["title", "class"]);

const link = ref("");

onMounted(() => {
  const href = window.location.href;

  console.log(href, "href");

  const tag = "?site=";

  const tagIndex = href.indexOf(tag);

  console.log(tagIndex, "tagIndex");

  if (tagIndex === -1) {
    return;
  }

  let getLink = href.substring(tagIndex + tag.length, href.length);

  const newLinkOrigin = new URL(getLink);

  console.log(newLinkOrigin, "newLinkOrigin");

  let newLink = "";
  if (newLinkOrigin.hash) {
    newLink = `${newLinkOrigin.origin}${newLinkOrigin.hash}`;
  } else if (newLinkOrigin.search) {
    newLink = `${newLinkOrigin.origin}${newLinkOrigin.search}`;
  } else {
    newLink = `${newLinkOrigin.origin}`;
  }

  console.log(newLink, "newLink");

  link.value = newLink;
});
</script>
