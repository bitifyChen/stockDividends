<script setup>
import { multiply, round } from '@/composables/useMath.js'
import dayjs from 'dayjs'
const props = defineProps({
  data: {
    type: Object,
    default: () => {}
  }
})
const stockId = computed(() => props?.data?.stockId ?? '-')
const stockName = computed(() => props?.data?.stockName ?? '-')
const stockNum = computed(() => props?.data?.stockNum ?? '-')
const stockEarn = computed(() => props?.data?.earn ?? '-')
const tradingDate = computed(() =>
  props?.data?.tradingDate ? dayjs(props?.data?.tradingDate).format('YYYY-MM-DD') : '-'
)
const payDate = computed(() =>
  props?.data?.payDate ? dayjs(props?.data?.payDate).format('YYYY-MM-DD') : '-'
)

const totalEarn = computed(() =>
  round(multiply(props?.data?.stockNum ?? 0, props?.data?.earn ?? 0))
)
//簡易模式
const easyMode = ref(true)
</script>

<template>
  <div
    class="px-[10px] border border-[var(--main-gray-color)] divide-y divide-[var(--main-gray-color)]"
    @click="easyMode = !easyMode"
  >
    <div class="font-black text-[16px] py-[10px]">
      <div class="text-[var(--main-primary-color)]">{{ stockId }} {{ stockName }}</div>
      <div>
        <span class="text-[var(--main-primary-color)]">{{ payDate }}</span>
        將收到股利
        <span class="text-[var(--main-primary-color)]">{{
          Number(totalEarn).toLocaleString()
        }}</span
        >元。
      </div>
    </div>
    <div v-show="!easyMode">
      <div class="text-[14px] py-[10px]">
        <div class="flex justify-between">
          <span>除息日期</span>
          <span class="text-[var(--main-primary-color)]">{{ tradingDate }}</span>
        </div>
      </div>
    </div>
    <div v-show="!easyMode">
      <div class="text-[14px] py-[10px]">
        <div class="flex justify-between">
          <span>參加庫存</span>
          <span class="text-[var(--main-primary-color)]">{{ stockNum.toLocaleString() }} 股</span>
        </div>
        <div class="">
          每股股票股利
          <span class="text-[var(--main-primary-color)]">{{ stockEarn }}</span
          >，約可收到
          <span class="text-[var(--main-primary-color)]">{{
            Number(totalEarn).toLocaleString()
          }}</span
          >元
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
