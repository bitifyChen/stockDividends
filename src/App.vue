<script setup>
import { registerSW } from 'virtual:pwa-register'
const updateSW = registerSW({
  onNeedRefresh() {
    const userConfirmed = confirm('有新版本可用，是否重新載入？')
    if (userConfirmed) {
      updateSW(true) // 用戶選擇更新時，立即強制更新
    }
  },
  onOfflineReady() {
    console.log('PWA 已準備好離線使用')
  }
})
</script>
<template>
  <el-scrollbar height="100dvh"> <router-view class="base-wrap" /></el-scrollbar>
</template>

<style scoped>
.base-wrap {
  position: relative;
  z-index: 1;
}
</style>
