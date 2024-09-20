<script setup>
import { computed } from 'vue'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-moment'
import dayjs from 'dayjs'
import { add, subtract, multiply, round } from '@/composables/useMath.js'
const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})
const currentStock = computed(() => props.data)
const inStockStart = computed(() =>
  currentStock?.value?.inStockStart
    ? dayjs(currentStock?.value?.inStockStart).format('YYYY/MM/DD ddd')
    : '-'
)
const inStockEnd = computed(() =>
  currentStock?.value?.inStockEnd
    ? dayjs(currentStock?.value?.inStockEnd).format('YYYY/MM/DD ddd')
    : '-'
)
//張數變化
const stockHoldChartHook = ref(null)
const holdingDataList = computed(() => {
  let total = 0
  // 合併購買和售出的數據
  const combinedData = [
    // 計算購買
    ...currentStock?.value?.data.map((e) => ({
      ...e,
      date: e.buyDate,
      isSell: false
    })),
    // 計算售出
    ...currentStock?.value?.data
      .filter((e) => e.sellDate && e.sellPrice)
      .map((e) => ({
        ...e,
        date: e.sellDate,
        isSell: true
      }))
  ]

  // 排序和累計
  const result = combinedData
    .sort((a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date)
      if (dateDiff === 0) {
        // 如果是同一天，購買應該在售出之前處理
        return a.isSell - b.isSell
      }
      return dateDiff
    })
    .reduce((acc, e) => {
      total = e.isSell ? subtract(total, e.buyNum) : add(total, e.buyNum)
      const date = e.date
      acc[date] = { x: date, y: total } // 覆蓋同一天的最後一筆結果
      return acc
    }, {})

  // 添加今天的數據
  result[new Date().toISOString().split('T')[0]] = {
    x: new Date().toISOString().split('T')[0],
    y: total
  }

  // 將結果轉換成陣列返回
  return Object.values(result)
})

onMounted(() => {
  const ctx = stockHoldChartHook.value
  new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          data: holdingDataList.value,
          stepped: true,
          fill: true
        }
      ]
    },
    options: {
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'year'
          },
          ticks: {
            source: 'data',
            autoSkip: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  })
})
</script>


<template>
  <div>
    <div>持有變化</div>
    <div class="text-[var(--text-secondary-color)] text-[14px] space-y-1">
      <div
        class="flex justify-between border-dashed border-b-2 border-[var(--text-secondary-color)s]"
      >
        初次買進日
        <span class="text-[var(--main-primary-color)] font-black">{{ inStockStart }}</span>
      </div>
      <div
        class="flex justify-between border-dashed border-b-2 border-[var(--text-secondary-color)s]"
      >
        最近買進日
        <span class="text-[var(--main-primary-color)] font-black">{{ inStockEnd }}</span>
      </div>
    </div>
    <canvas ref="stockHoldChartHook"></canvas>
  </div>
</template>


<style scoped>
</style>