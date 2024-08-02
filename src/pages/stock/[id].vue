<script setup>
import Chart from 'chart.js/auto'
import 'chartjs-adapter-moment'
import { add, multiply, round } from '@/composables/useMath.js'
import { useStockStore } from '@/stores/useStock.js'
import { useBaseStore } from '@/stores/useBase.js'
import { useRoute } from 'vue-router'
const route = useRoute()
const piniaStock = useStockStore()
const piniaBase = useBaseStore()
const chartHook = ref(null)
//本頁ID
const stockId = route.params.id
const stockName = computed(() => currentStock.value.name)
//總資料
const currentStock = computed(() => piniaStock?.stockList[stockId])
//張數成長
const holdingDataList = computed(() => {
  let total = 0
  return [
    ...currentStock?.value?.data
      .sort((a, b) => new Date(a.buyDate) - new Date(b.buyDate))
      .map((e) => {
        total = add(total, e.buyNum)
        return { x: e.buyDate, y: total }
      }),
    { x: new Date().toISOString().split('T')[0], y: total }
  ]
})
//歷年股利
const dividendDataList = computed(() => {
  return piniaStock?.dividendList
    .filter((e) => e.stockId === stockId)
    .sort((a, b) => new Date(a.tradingDate) - new Date(b.tradingDate))
    .map((e) => ({ x: e.tradingDate, y: round(multiply(e?.stockNum ?? 0, e?.earn ?? 0)) }))
})

onMounted(() => {
  const ctx = chartHook.value
  new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          data: holdingDataList.value
        },
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
  <canvas ref="chartHook"></canvas>
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
    