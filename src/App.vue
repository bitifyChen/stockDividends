<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const isDashboard = computed(() => route.meta?.layout === 'dashboard')
</script>
<template>
  <el-scrollbar height="100dvh" :class="{ dark: isDashboard }">
    <router-view class="base-wrap" />
  </el-scrollbar>
</template>

<style scoped>
.base-wrap {
  position: relative;
  z-index: 1;
}
</style>
