<script setup>
import { computed } from 'vue'
import { useUserInfoStore } from '@/stores/useUserInfo.js'
const piniaUserInfo = useUserInfoStore()
const name = computed(() => piniaUserInfo?.userInfo?.name)
</script>

<template>
  <div class="p-[10px] h-full flex items-center">
    <div class="text-[28px] font-black text-white">
      <p>Hi,{{ name }}</p>
      <p>Welcome Back</p>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>

<route>
{
  name: "IndexPage",
  meta: {
    requiresAuth: true
  }
}
</route>
