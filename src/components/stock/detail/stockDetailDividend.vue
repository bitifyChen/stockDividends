<script setup>
import { useStockStore } from '@/stores/useStock.js'
import { computed } from 'vue'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-moment'
import { multiply, round } from '@/composables/useMath.js'
const piniaStock = useStockStore()
const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})
const stockId = computed(() => props.data.id)
const dividendChartHook = ref(null)
const dividendDataList = computed(() => {
  return piniaStock?.dividendList
    .filter((e) => e.stockId === stockId.value)
    .sort((a, b) => new Date(a.tradingDate) - new Date(b.tradingDate))
    .map((e) => ({ x: e.tradingDate, y: round(multiply(e?.stockNum ?? 0, e?.earn ?? 0)) }))
})

onMounted(() => {
  const ctx = dividendChartHook.value
  new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          data: dividendDataList.value,
          tension: 0.4
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
    <div>歷年股利</div>
    <canvas ref="dividendChartHook"></canvas>
  </div>
</template>


<style scoped>
</style>