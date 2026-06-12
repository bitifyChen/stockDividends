<script setup>
import { computed } from 'vue'

const props = defineProps({
  points: {
    type: Array,
    default: () => []
  },
  width: {
    type: Number,
    default: 96
  },
  height: {
    type: Number,
    default: 28
  }
})

const values = computed(() =>
  (props.points || [])
    .map((item) => Number(Array.isArray(item) ? item[1] : item))
    .filter((value) => Number.isFinite(value))
)

const normalizedPoints = computed(() => {
  if (!values.value.length) return []

  const min = Math.min(...values.value)
  const max = Math.max(...values.value)
  const range = max - min || 1
  const verticalPadding = 4
  const drawableHeight = props.height - verticalPadding * 2
  const step = values.value.length > 1 ? props.width / (values.value.length - 1) : 0

  return values.value.map((value, index) => {
    const x = values.value.length > 1 ? index * step : props.width / 2
    const y = props.height - verticalPadding - ((value - min) / range) * drawableHeight
    return { x, y }
  })
})

const pathData = computed(() => {
  if (!normalizedPoints.value.length) return ''
  return normalizedPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
})

const strokeClass = computed(() => {
  if (values.value.length < 2) return 'sparkline-neutral'
  const delta = values.value[values.value.length - 1] - values.value[0]
  if (delta > 0) return 'sparkline-up'
  if (delta < 0) return 'sparkline-down'
  return 'sparkline-neutral'
})
</script>

<template>
  <div class="sparkline-shell" :class="strokeClass">
    <svg
      v-if="pathData"
      :viewBox="`0 0 ${width} ${height}`"
      :width="width"
      :height="height"
      preserveAspectRatio="none"
    >
      <path :d="pathData" class="sparkline-line" />
    </svg>
    <span v-else class="sparkline-empty">-</span>
  </div>
</template>

<style scoped>
.sparkline-shell {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 96px;
  filter: drop-shadow(0 0 8px rgb(34 211 238 / 0.14));
}

.sparkline-shell svg {
  display: block;
  overflow: visible;
}

.sparkline-line {
  fill: none;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sparkline-up .sparkline-line {
  stroke: var(--stock-rise-color);
}

.sparkline-down .sparkline-line {
  stroke: var(--stock-fall-color);
}

.sparkline-neutral .sparkline-line {
  stroke: var(--stock-neutral-color);
}

.sparkline-empty {
  color: var(--stock-neutral-color);
  font-size: 12px;
}
</style>
