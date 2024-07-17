<script setup>
import { useBaseStore } from '@/stores/useBase.js'
const piniaBase = useBaseStore()
</script>

<template>
  <teleport to="#header-slot" v-if="piniaBase?.menuOnMount && !piniaBase?.menuIsOpen">
    <div class="w-full font-black justify-between items-center flex text-[48px] text-[white]">
      <div class="w-[26px] h-[26px]"></div>
      <div class="text-[24px] text-center">設定</div>
      <div class="w-[26px] h-[26px]"></div>
    </div>
  </teleport>
  <div class="p-[20px]">
    <router-link :to="{ name: 'SettingProfilePage' }">
      <el-button type="primary">設定個人資料</el-button>
    </router-link>
  </div>
</template>

<style scoped lang="scss"></style>

<route>
{
  name: "SettingPage",
  meta: {
    requiresAuth: true
  }
}
</route>
