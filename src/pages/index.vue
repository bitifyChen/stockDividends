<script setup>
import { computed } from 'vue'
import { useUserInfoStore } from '@/stores/useUserInfo.js'
import { useStockStore } from '@/stores/useStock.js'
const piniaUserInfo = useUserInfoStore()
const piniaStock = useStockStore()
const name = computed(() => piniaUserInfo?.userInfo?.name)
piniaStock.getData()
//股利清單
const dividendDataList = computed(() => piniaStock?.dividendList)
</script>

<template>
  <div class="p-[10px] pt-[40px] h-full flex flex-col">
    <div>
      <p class="text-[20px] text-[var(--text-secondary-color)] tracking-wide">Hello,</p>
      <p class="font-black text-[28px] text-[var(--text-main-color)] tracking-wider">{{ name }}</p>
    </div>
    <div class="w-full">
      <dividendList :data="dividendDataList" />
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
