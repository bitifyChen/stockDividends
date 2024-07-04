<script setup></script>
<template>
  <div id="bgWrap"></div>
  <router-view class="base-wrap" />
</template>

<style scoped>
#bgWrap {
  position: fixed;
  width: 100%;
  height: 100%;
  background-image: url('@/assets/image/base/texture.png');
  -webkit-transition: background-color 2s ease-in;
}
.base-wrap {
  position: relative;
  z-index: 1;
}
</style>
