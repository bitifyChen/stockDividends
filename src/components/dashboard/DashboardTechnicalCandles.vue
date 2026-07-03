<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { CandlestickSeries, ColorType, CrosshairMode, createChart } from 'lightweight-charts'
import { getEtfStockCandles } from '@/api/etf.js'
import { chartIntervalOptions, chartRangeOptions } from '@/data/dashboardDataMapping.js'
import {
  createDashboardCacheKey,
  useDashboardDataCacheStore
} from '@/stores/useDashboardDataCache.js'
import { formatNumber, normalizeArray, normalizeObject } from '@/utils/etfDashboard.js'

const props = defineProps({
  stockCode: {
    type: [String, Number],
    default: ''
  },
  title: {
    type: String,
    default: '技術分析'
  },
  description: {
    type: String,
    default: ''
  },
  emptyText: {
    type: String,
    default: '目前沒有可顯示的 K 線資料'
  },
  errorText: {
    type: String,
    default: '讀取 K 線失敗'
  },
  panelClass: {
    type: [String, Array, Object],
    default: ''
  },
  rangeOptions: {
    type: Array,
    default: () => chartRangeOptions
  },
  intervalOptions: {
    type: Array,
    default: () => chartIntervalOptions
  },
  cacheName: {
    type: String,
    default: 'ohlcCandles'
  }
})

const range = defineModel('range', { type: String, default: '6m' })
const interval = defineModel('interval', { type: String, default: 'daily' })

const emit = defineEmits(['loaded', 'error', 'loading-change'])

const dashboardDataCacheStore = useDashboardDataCacheStore()

const loading = ref(false)
const series = ref({})
const errorMessage = ref('')
const chartCanvas = ref(null)
const activeCandle = ref(null)

let chartInstance = null
let chartSeries = null
let crosshairMoveHandler = null

const resolvedStockCode = computed(() => String(props.stockCode || '').trim())

const firstDefined = (...values) =>
  values.find((value) => value !== null && value !== undefined && value !== '')

const toFiniteNumber = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

const normalizeCandlePoint = (item) => {
  const rawDate = firstDefined(
    item.snapshot_date,
    item.date,
    item.trade_date,
    item.datetime,
    item.time,
    item.x
  )
  if (rawDate === null || rawDate === undefined || rawDate === '') return null

  const xValue =
    typeof rawDate === 'number'
      ? rawDate
      : Number.isFinite(Number(rawDate))
        ? Number(rawDate)
        : dayjs(rawDate).valueOf()

  if (!Number.isFinite(xValue)) return null

  const openValue = toFiniteNumber(firstDefined(item.open, item.o, item.open_price, item.openPrice))
  const highValue = toFiniteNumber(firstDefined(item.high, item.h, item.high_price, item.highPrice))
  const lowValue = toFiniteNumber(firstDefined(item.low, item.l, item.low_price, item.lowPrice))
  const closeValue = toFiniteNumber(
    firstDefined(item.close, item.c, item.close_price, item.closePrice)
  )

  if ([openValue, highValue, lowValue, closeValue].some((value) => value === null)) return null

  return {
    time: dayjs(xValue).format('YYYY-MM-DD'),
    open: openValue,
    high: highValue,
    low: lowValue,
    close: closeValue
  }
}

const candleItems = computed(() =>
  normalizeArray(
    series.value.candles || series.value.items || series.value.series || series.value.data
  )
)

const chartData = computed(() =>
  candleItems.value
    .map((item) => normalizeCandlePoint(item))
    .filter(Boolean)
    .sort((left, right) => dayjs(left.time).valueOf() - dayjs(right.time).valueOf())
)
const latestCandle = computed(() => chartData.value.at(-1) || null)
const displayedCandle = computed(() => activeCandle.value || latestCandle.value)
const displayedDelta = computed(() => {
  const candle = displayedCandle.value
  if (!candle) return null
  const delta = candle.close - candle.open
  const ratio = candle.open ? (delta / candle.open) * 100 : 0

  return {
    value: delta,
    ratio,
    className: delta > 0 ? 'is-rise' : delta < 0 ? 'is-fall' : 'is-neutral',
    text: `${delta > 0 ? '+' : ''}${formatNumber(delta)} (${delta > 0 ? '+' : ''}${formatNumber(ratio)}%)`
  }
})

const candleLabelItems = computed(() => [
  { label: '開', value: displayedCandle.value ? formatNumber(displayedCandle.value.open) : '-' },
  { label: '高', value: displayedCandle.value ? formatNumber(displayedCandle.value.high) : '-' },
  { label: '低', value: displayedCandle.value ? formatNumber(displayedCandle.value.low) : '-' },
  { label: '收', value: displayedCandle.value ? formatNumber(displayedCandle.value.close) : '-' }
])

const clearCrosshairMoveHandler = () => {
  if (chartInstance && crosshairMoveHandler) {
    chartInstance.unsubscribeCrosshairMove(crosshairMoveHandler)
  }

  crosshairMoveHandler = null
}

const removeChart = () => {
  clearCrosshairMoveHandler()

  if (chartInstance) {
    chartInstance.remove()
    chartInstance = null
  }

  chartSeries = null
}

const renderChart = async () => {
  await nextTick()

  const container = chartCanvas.value
  if (!container) return

  const data = chartData.value
  if (!data.length) {
    removeChart()
    return
  }

  const isDaily = interval.value === 'daily'
  const resolvedBarSpacing = data.length < 30 ? 12 : range.value === '6m' ? 7 : 6
  const chartOptions = {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: '#cbd5e1',
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    },
    grid: {
      vertLines: { color: 'rgba(148, 163, 184, 0.12)' },
      horzLines: { color: 'rgba(148, 163, 184, 0.12)' }
    },
    rightPriceScale: {
      borderVisible: false,
      scaleMargins: {
        top: 0.15,
        bottom: 0.1
      }
    },
    timeScale: {
      borderVisible: false,
      timeVisible: !isDaily,
      secondsVisible: false,
      barSpacing: resolvedBarSpacing,
      fixLeftEdge: true,
      fixRightEdge: true,
      rightOffset: 0
    },
    localization: {
      priceFormatter: (value) => formatNumber(value)
    },
    crosshair: {
      mode: CrosshairMode.Magnet,
      vertLine: {
        color: 'rgba(148, 163, 184, 0.58)',
        width: 1,
        style: 2,
        labelVisible: true
      },
      horzLine: {
        color: 'rgba(148, 163, 184, 0.48)',
        width: 1,
        style: 2,
        labelVisible: true
      }
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false
    },
    handleScale: {
      axisPressedMouseMove: true,
      mouseWheel: true,
      pinch: true
    }
  }

  if (!chartInstance) {
    chartInstance = createChart(container, chartOptions)
    chartSeries = chartInstance.addSeries(CandlestickSeries, {
      upColor: '#d75455',
      downColor: '#24936e',
      borderVisible: true,
      borderUpColor: '#e16b6c',
      borderDownColor: '#2fb583',
      wickUpColor: '#d75455',
      wickDownColor: '#24936e',
      lastValueVisible: true,
      priceLineVisible: true
    })
  } else {
    chartInstance.applyOptions(chartOptions)
  }

  chartSeries?.setData(data)
  clearCrosshairMoveHandler()
  crosshairMoveHandler = (param) => {
    if (!param?.time || !chartSeries) {
      activeCandle.value = null
      return
    }

    const seriesData = param.seriesData?.get(chartSeries)
    activeCandle.value = seriesData || data.find((item) => item.time === param.time) || null
  }
  chartInstance.subscribeCrosshairMove(crosshairMoveHandler)
  chartInstance.timeScale().fitContent()
}

const setLoading = (value) => {
  loading.value = value
  emit('loading-change', value)
}

const loadCandles = async ({ force = false } = {}) => {
  if (!resolvedStockCode.value) {
    series.value = {}
    errorMessage.value = ''
    return
  }

  const cacheKey = createDashboardCacheKey(props.cacheName, {
    stockCode: resolvedStockCode.value,
    range: range.value,
    interval: interval.value
  })
  const cached = force ? null : dashboardDataCacheStore.getFresh(cacheKey)

  if (cached) {
    series.value = Array.isArray(cached) ? { data: cached } : normalizeObject(cached)
    errorMessage.value = ''
    emit('loaded', series.value)
    return
  }

  setLoading(true)
  errorMessage.value = ''

  try {
    const response = await dashboardDataCacheStore.remember(
      cacheKey,
      () =>
        getEtfStockCandles({
          stockCode: resolvedStockCode.value,
          range: range.value,
          interval: interval.value
        }),
      { force }
    )

    series.value = Array.isArray(response) ? { data: response } : normalizeObject(response)
    emit('loaded', series.value)
  } catch (error) {
    errorMessage.value = error?.message || props.errorText
    series.value = {}
    emit('error', error)
  } finally {
    setLoading(false)
  }
}

watch(
  [resolvedStockCode, range, interval],
  () => {
    loadCandles()
  },
  { immediate: true }
)

watch(chartData, () => {
  renderChart()
})

onBeforeUnmount(() => {
  removeChart()
})

defineExpose({
  reload: loadCandles,
  loading
})
</script>

<template>
  <section class="console-panel technical-candle-panel" :class="panelClass">
    <div class="panel-heading panel-heading-stack">
      <div>
        <h2>{{ title }}</h2>
        <span>{{ description }}</span>
      </div>
      <div class="control-stack">
        <div class="range-tabs">
          <button
            v-for="item in rangeOptions"
            :key="item"
            type="button"
            :class="{ active: item === range }"
            @click="range = item"
          >
            {{ item }}
          </button>
        </div>
        <div class="interval-tabs">
          <button
            v-for="item in intervalOptions"
            :key="item.value"
            type="button"
            :class="{ active: item.value === interval }"
            @click="interval = item.value"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="chart-shell" v-loading="loading">
      <div v-if="displayedCandle" class="ohlc-legend">
        <div>
          <span>日期</span>
          <strong>{{ displayedCandle.time }}</strong>
        </div>
        <div v-for="item in candleLabelItems" :key="item.label">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
        <div v-if="displayedDelta" :class="['delta-value', displayedDelta.className]">
          <span>漲跌</span>
          <strong>{{ displayedDelta.text }}</strong>
        </div>
      </div>
      <div v-show="chartData.length" ref="chartCanvas" class="lw-chart"></div>
      <div v-if="!chartData.length && !loading" class="chart-empty">{{ emptyText }}</div>
    </div>

    <div v-if="errorMessage" class="chart-hint">{{ errorMessage }}</div>
  </section>
</template>

<style scoped>
.technical-candle-panel {
  display: grid;
  gap: 14px;
}

.control-stack {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.range-tabs,
.interval-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.range-tabs button,
.interval-tabs button {
  min-height: 30px;
  border: 1px solid #30343a;
  border-radius: 4px;
  padding: 0 10px;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 900;
}

.range-tabs button.active,
.interval-tabs button.active {
  border-color: #10bfae;
  color: #10bfae;
}

.chart-shell {
  position: relative;
  display: flex;
  max-width: 100%;
  min-width: 0;
  min-height: 340px;
  overflow: hidden;
  border: 1px solid #2f3339;
  border-radius: 4px;
  background: radial-gradient(circle at 12% 12%, rgb(16 191 174 / 0.08), transparent 34%),
    rgb(32 35 40 / 0.76);
  padding: 18px;
}

.ohlc-legend {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;
  display: flex;
  max-width: calc(100% - 28px);
  align-items: center;
  gap: 10px;
  overflow-x: auto;
  border: 1px solid rgb(148 163 184 / 0.16);
  border-radius: 999px;
  background: rgb(8 11 16 / 0.72);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.08),
    0 14px 36px rgb(0 0 0 / 0.22);
  padding: 8px 10px;
  color: #dbeafe;
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
}

.ohlc-legend div {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: baseline;
  gap: 4px;
}

.ohlc-legend span {
  color: #7c858f;
  font-size: 11px;
  font-weight: 900;
}

.ohlc-legend strong {
  color: #f8fbff;
  font-size: 12px;
  font-weight: 900;
}

.ohlc-legend .is-rise strong {
  color: var(--stock-rise-color, #d75455);
}

.ohlc-legend .is-fall strong {
  color: var(--stock-fall-color, #24936e);
}

.ohlc-legend .is-neutral strong {
  color: var(--stock-neutral-color, #94a3b8);
}

.lw-chart {
  flex: 1;
  width: 100%;
  min-height: 300px;
}

.chart-empty {
  display: flex;
  width: 100%;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  color: #7c858f;
  font-size: 13px;
  font-weight: 800;
}

.chart-hint {
  color: #7c858f;
  font-size: 12px;
  font-weight: 800;
}

:global(.dashboard-theme-light) .range-tabs button,
:global(.dashboard-theme-light) .interval-tabs button {
  border-color: rgb(15 23 42 / 0.14);
  color: #64748b;
}

:global(.dashboard-theme-light) .range-tabs button.active,
:global(.dashboard-theme-light) .interval-tabs button.active {
  border-color: #0891b2;
  color: #0891b2;
}

:global(.dashboard-theme-light) .chart-shell {
  border-color: rgb(15 23 42 / 0.1);
  background: radial-gradient(circle at 12% 12%, rgb(8 145 178 / 0.08), transparent 34%),
    rgb(255 255 255 / 0.82);
}

:global(.dashboard-theme-light) .ohlc-legend {
  border-color: rgb(15 23 42 / 0.12);
  background: rgb(255 255 255 / 0.78);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.74),
    0 14px 36px rgb(15 23 42 / 0.1);
}

:global(.dashboard-theme-light) .ohlc-legend span {
  color: #64748b;
}

:global(.dashboard-theme-light) .ohlc-legend strong {
  color: #0f172a;
}

@media (max-width: 768px) {
  .control-stack {
    width: 100%;
    justify-items: start;
  }

  .range-tabs button,
  .interval-tabs button {
    flex: 1 1 auto;
  }

  .chart-shell {
    min-height: 280px;
    padding: 12px;
  }

  .ohlc-legend {
    position: relative;
    top: auto;
    left: auto;
    max-width: 100%;
    margin-bottom: 10px;
    border-radius: 14px;
  }

  .lw-chart {
    min-height: 250px;
  }
}
</style>
