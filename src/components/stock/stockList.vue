<script setup>
import { add } from '@/composables/math.js'
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
//已領股利
const earnDividend = computed(
  () => stockHoldList.value?.reduce((a, b) => add(a, b.earnDividend), 0) ?? 0
)
//未實現價差
const earnPrice = computed(() => stockHoldList.value?.reduce((a, b) => add(a, b.earnPrice), 0) ?? 0)
//合計
const earnTotal = computed(() => add(earnDividend.value, earnPrice.value))
</script>

<template>
  <div class="mx-[-16px] mt-[-12px]">
    <div class="bg-[var(--main-sub-color)] px-[16px] py-[10px] font-black text-[18px] text-right">
      <div class="text-[white] flex justify-between items-center">
        <span class="text-[14px]">現價/收盤價</span> {{ stockPrice }}
      </div>
    </div>
    <div
      class="px-[16px] py-[10px] text-[color:var(--text-main-color)] text-[14px] font-black border-b-4 border-[var(--main-sub-color)]"
    >
      <div class="flex justify-between items-center"><span>已領股利</span> {{ earnDividend }}</div>
      <div class="flex justify-between items-center">
        <span>未實現價差</span>
        <span>{{ earnPrice }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span>合計</span>
        <span
          :class="{
            'text-[var(--main-fall-color)]': earnTotal < 0,
            'text-[var(--main-rise-color)]': earnTotal > 0
          }"
        >
          {{ earnTotal }}</span
        >
      </div>
    </div>
    <div class="divide-y divide-[var(--main-sub-color)] px-[16px]">
      <van-swipe-cell v-for="item in stockHoldList" :key="item.id">
        <stockListCard :item="item" :stockPrice="stockPrice" />
      </van-swipe-cell>
    </div>
  </div>
</template>

<style scoped></style>
