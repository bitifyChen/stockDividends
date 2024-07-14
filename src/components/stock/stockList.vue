<script setup>
import { getPrice } from '@/api/price.js'
import { computed } from 'vue'
const props = defineProps({
  data: {
    type: Object,
    default: () => {}
  },
  stockId: {
    type: String,
    required: true
  }
})
//持股
const stockHoldList = computed(() => props?.data?.data)
//現價
const stockPrice = computed(() => props?.data?.price ?? '未更新')
</script>

<template>
  <div class="mx-[-16px] mt-[-12px]">
    <div
      class="bg-[var(--main-sub-color)] px-[16px] py-[10px] text-[white] font-black text-[18px] text-right flex justify-between items-center"
    >
      <span class="text-[14px]">現價/收盤價</span>
      {{ stockPrice }}
    </div>
    <div class="divide-y divide-[var(--main-sub-color)] px-[16px]">
      <van-swipe-cell v-for="item in stockHoldList" :key="item.id">
        <stockListCard :item="item" :stockPrice="stockPrice" />
      </van-swipe-cell>
    </div>
  </div>
</template>

<style scoped></style>
