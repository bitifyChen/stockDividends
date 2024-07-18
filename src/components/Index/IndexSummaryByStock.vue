<script setup>
import Chart from 'chart.js/auto'
import { ref, computed, onMounted } from 'vue'
import { add, multiply, round } from '@/composables/useMath.js'
import dayjs from 'dayjs'
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})
const chartHook = ref(null)
const stockData = computed(() => {
  const _data = {}
  props.data.forEach((item) => {
    if (_data[item.stockId]) {
      _data[item.stockId].yearTotal = add(_data[item.stockId].yearTotal, item.total)
    } else {
      _data[item.stockId] = {
        stockName: item.stockName,
        stockId: item.stockId,
        yearTotal: item.total
      }
    }
  })

  const sortedData = Object.keys(_data)
    .map((e) => _data[e])
    .sort((a, b) => b.yearTotal - a.yearTotal)

  const topFour = sortedData.slice(0, 4)
  const remainingTotal = sortedData.slice(4).reduce((acc, item) => add(acc, item.yearTotal), 0)

  if (remainingTotal > 0) {
    topFour.push({
      stockName: '其他',
      stockId: 'others',
      yearTotal: remainingTotal
    })
  }

  return topFour
})
onMounted(() => {
  const ctx = chartHook.value
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: stockData.value.map((item) => item.stockName),
      datasets: [
        {
          data: stockData.value.map((item) => item.yearTotal),
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
</script>

<template>
  <div>
    <div>前五名股票是</div>
    <canvas ref="chartHook"></canvas>
  </div>
</template>

<style scoped></style>
