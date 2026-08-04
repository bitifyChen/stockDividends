<script setup>
import Chart from 'chart.js/auto'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { add } from '@/composables/useMath.js'
import { getDividendAnnualTotals } from '@/utils/stockDividend.js'
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})
const chartHook = ref(null)
const stockData = computed(() => getDividendAnnualTotals(props.data))
const chartData = computed(() => {
  const topFour = stockData.value.slice(0, 4)
  const remainingTotal = stockData.value.slice(4).reduce((acc, item) => add(acc, item.yearTotal), 0)

  if (remainingTotal > 0) {
    topFour.push({
      stockName: '其他',
      stockId: 'others',
      yearTotal: remainingTotal
    })
  }

  return topFour
})
const chartInstance = ref(null)
const formatCurrency = (value) => Math.round(Number(value) || 0).toLocaleString()
onMounted(() => {
  const ctx = chartHook.value
  if (!ctx || !chartData.value.length) return
  chartInstance.value = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartData.value.map((item) => item.stockName),
      datasets: [
        {
          data: chartData.value.map((item) => item.yearTotal),
          borderWidth: 1,
          backgroundColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)'
          ]
        }
      ]
    }
  })
})
onBeforeUnmount(() => chartInstance.value?.destroy())
</script>

<template>
  <div class="space-y-[12px]">
    <div class="font-black text-[var(--text-main-color)]">個股年度股利合計</div>
    <div v-if="stockData.length" class="space-y-[8px]">
      <div
        v-for="item in stockData"
        :key="item.stockId"
        class="flex items-center justify-between gap-[12px] rounded-lg border border-[var(--main-gray-color)] px-[10px] py-[8px]"
      >
        <div class="min-w-0">
          <div class="truncate font-black text-[var(--main-primary-color)]">
            {{ item.stockId }} {{ item.stockName }}
          </div>
          <div class="text-[12px] text-[var(--text-secondary-color)]">現金股利</div>
        </div>
        <div class="shrink-0 text-right font-black text-[var(--main-primary-color)]">
          {{ formatCurrency(item.yearTotal) }} 元
        </div>
      </div>
    </div>
    <div v-else class="text-[var(--text-secondary-color)]">本年度沒有個股股利資料</div>
    <div v-if="chartData.length" class="border-t border-[var(--main-gray-color)] pt-[12px]">
      <div class="mb-[8px] text-[12px] text-[var(--text-secondary-color)]">年度分布</div>
      <canvas ref="chartHook"></canvas>
    </div>
  </div>
</template>

<style scoped></style>
