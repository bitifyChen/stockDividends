<script setup>
import Chart from 'chart.js/auto'
import 'chartjs-adapter-moment'
import { add, subtract, multiply, round } from '@/composables/useMath.js'
import { useStockStore } from '@/stores/useStock.js'
import { useBaseStore } from '@/stores/useBase.js'
import { useRoute } from 'vue-router'
import { e } from 'mathjs'
const route = useRoute()
const piniaStock = useStockStore()
const piniaBase = useBaseStore()
const stockChartHook = ref(null)
const dividendChartHook = ref(null)
//本頁ID
const stockId = route.params.id
const stockName = computed(() => currentStock.value.name)
//總資料
const currentStock = computed(() => piniaStock?.stockList[stockId])
//張數變化
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
//歷年股利
const dividendDataList = computed(() => {
  return piniaStock?.dividendList
    .filter((e) => e.stockId === stockId)
    .sort((a, b) => new Date(a.tradingDate) - new Date(b.tradingDate))
    .map((e) => ({ x: e.tradingDate, y: round(multiply(e?.stockNum ?? 0, e?.earn ?? 0)) }))
})

onMounted(() => {
  const ctx = stockChartHook.value
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
            unit: 'day'
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

  const ctx2 = dividendChartHook.value
  new Chart(ctx2, {
    type: 'line',
    data: {
      datasets: [
        {
          data: dividendDataList.value
        }
      ]
    },
    options: {
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day'
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
  <teleport to="#header-slot" v-if="piniaBase?.menuOnMount && !piniaBase?.menuIsOpen">
    <div class="w-full font-black justify-between items-center flex text-[48px] text-[white]">
      <div class="w-[26px] h-[26px]"></div>
      <div class="text-[24px] text-center">{{ stockId }}</div>
      <div class="w-[26px] h-[26px]"></div>
    </div>
  </teleport>
  <canvas ref="stockChartHook"></canvas>
  <canvas ref="dividendChartHook"></canvas>
</template>


<style scoped>
</style>


<route>
    {
      name: "StockDetailPage",
      meta: {
        requiresAuth: true
      }
    }
    </route>
    