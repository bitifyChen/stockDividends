<script setup>
import { multiply } from '@/composables/useMath.js'
import dayjs from 'dayjs'
const props = defineProps({
  data: {
    type: Object,
    default: () => {}
  }
})
const stockId = computed(() => props?.data?.stockId ?? '-')
const stockNum = computed(() => props?.data?.stockNum ?? '-')
const tradingDate = computed(() =>
  props?.data?.tradingDate ? dayjs(props?.data?.tradingDate).format('YYYY-MM-DD') : '-'
)
const pay_date = computed(() =>
  props?.data?.pay_date ? dayjs(props?.data?.pay_date).format('YYYY-MM-DD') : '-'
)

const totalEarn = computed(() => multiply(props?.data?.stockNum ?? 0, props?.data?.earn ?? 0))
</script>

<template>
  <div class="p-[4px] bg-[var(--main-bg-sub-color)] border border-[var(--main-sub-color)]">
    <div class="">
      <div class="font-black text-[16px] flex justify-between">
        <span class="text-[var(--text-main-color)]">{{ pay_date }}</span>
        <span class="text-[var(--main-rise-color)]">{{ totalEarn }}</span>
      </div>
      <div class="text-[var(--text-secondary-color)] text-[12px]">
        <div class="flex justify-between">
          <span>股息代碼</span>
          <span>{{ stockId }}</span>
        </div>
        <div class="flex justify-between">
          <span>除息日期</span>
          <span>{{ tradingDate }}</span>
        </div>
        <div class="flex justify-between">
          <span>參與股數</span>
          <span>{{ stockNum }}股</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
