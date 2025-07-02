<script setup>
import UpdateNotification from '@/components/UpdateNotification.vue'
</script>
<template>
  <el-scrollbar height="100dvh"> <router-view class="base-wrap" /></el-scrollbar>
  <UpdateNotification />
</template>

<style scoped>
.base-wrap {
  position: relative;
  z-index: 1;
}
</style>
