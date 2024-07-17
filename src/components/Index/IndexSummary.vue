<script setup>
import { ref, computed } from 'vue'
import { add, multiply, round } from '@/composables/useMath.js'
import dayjs from 'dayjs'
import { useUserInfoStore } from '@/stores/useUserInfo.js'
const piniaUser = useUserInfoStore()
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})
//使用者名稱
const userName = computed(() => piniaUser?.userName ?? '陌生人')
//卡片顯示模式
const easyMode = ref(true)
//整理資料
const thisYearData = computed(() => {
  return (
    props?.data
      ?.filter((item) => item?.year === new Date().getFullYear())
      .map((e) => ({ ...e, total: round(multiply(e?.stockNum ?? 0, e?.earn ?? 0)) })) ?? []
  )
})
//今年起訖
const thisYearRange = computed(() => {
  const dates = thisYearData.value.map((item) => new Date(item?.pay_date))
  return [dayjs(Math.min(...dates)).format('MM/DD'), dayjs(Math.max(...dates)).format('MM/DD')]
})

//來自幾支股票
const thisYearStockNum = computed(() => {
  const set = new Set()
  thisYearData.value.forEach((item) => {
    if (item?.stockId) set.add(item?.stockId)
  })
  return Array.from(set).length
})

//今年總金額
const thisYearTotal = computed(() => {
  return (
    thisYearData.value && thisYearData.value.reduce((total, item) => add(total, item?.total), 0)
  )
})
</script>

<template>
  <div class="card bg-[white] font-bold rounded-xl text-[var(--main-primary-color)] p-[10px]">
    <div class="flex justify-between">
      <div>{{ userName }}</div>
      <font-awesome-icon
        :icon="[
          'fas',
          easyMode ? 'up-right-and-down-left-from-center' : 'down-left-and-up-right-to-center'
        ]"
        class="text-[var(--main-primary-color)] text-[16px]"
        @click="easyMode = !easyMode"
      />
    </div>
    <div class="">
      <div class="text-[var(--text-main-color)]">今年已領取股息約</div>
      <div class="flex justify-end items-center">
        <span class="text-[var(--main-sub-color)] text-[24px] font-black"
          >$ {{ thisYearTotal }}</span
        >
      </div>
      <div class="text-[var(--text-secondary-color)]" v-if="easyMode">
        來自 {{ thisYearStockNum }} 支股票，計算期間為 {{ thisYearRange[0] }}~{{ thisYearRange[1] }}
      </div>
    </div>
    <IndexSummaryByStock v-if="!easyMode" :data="thisYearData" />
    <IndexSummaryByMonth v-if="!easyMode" :data="thisYearData" />
  </div>
</template>

<style scoped></style>
