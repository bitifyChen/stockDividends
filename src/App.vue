<script setup></script>
<template>
  <el-scrollbar height="100dvh"> <router-view class="base-wrap" /></el-scrollbar>
</template>

<style scoped>
.base-wrap {
  position: relative;
  z-index: 1;
}
</style>
