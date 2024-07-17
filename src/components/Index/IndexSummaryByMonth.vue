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
  const _data = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0
  }
  props.data.forEach((item) => {
    _data[item.month] = add(_data[item.month], item.total)
  })
  return Object.keys(_data).map((e) => _data[e])
})
onMounted(() => {
  const ctx = chartHook.value
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: '# of Votes',
          backgroundColor: '#3e56d5',
          data: stockData.value,
          borderWidth: 1
        }
      ]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
})
</script>

<template>
  <div>月成長比較</div>
  <canvas ref="chartHook"></canvas>
</template>

<style scoped></style>
