<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-moment'
import { RefreshCw } from 'lucide-vue-next'
import { getEtfStockDetail, getEtfStockSeries } from '@/api/etf.js'
import TwoTable from '@/components/Two/TwoTable.vue'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { formatNumber, formatRatio, formatShare, getSeriesItems, normalizeObject, shareColumnLabel, shareUnitLabel, toShareUnitValue } from '@/utils/etfDashboard.js'

const route = useRoute()
const dashboardSettingStore = useDashboardSettingStore()
const rangeOptions = ['1w', '1m', '6m', '1y', 'max']

const loadingSummary = ref(false)
const loadingSeries = ref(false)
const summary = ref({})
const series = ref({})
const selectedRange = ref('1m')
const errorMessage = ref('')
const chartCanvas = ref(null)
let chartInstance = null

const etfCode = computed(() => String(route.params.etfCode || ''))
const stockCode = computed(() => String(route.params.stockCode || ''))
const current = computed(() => normalizeObject(summary.value.current))
const detailSummary = computed(() => normalizeObject(summary.value.summary))
const seriesItems = computed(() => getSeriesItems(series.value))

const chartDataset = computed(() => {
  const points = seriesItems.value
    .filter((item) => item.snapshot_date && Number.isFinite(Number(item.current_shares)))
    .map((item) => ({
      x: item.snapshot_date,
      y: toShareUnitValue(item.current_shares, dashboardSettingStore.shareUnit)
    }))

  return {
    label: `${current.value.etf_name || summary.value.etf_name || etfCode.value} / ${current.value.stock_name || summary.value.stock_name || stockCode.value}`,
    data: points,
    borderColor: '#10bfae',
    backgroundColor: '#10bfae',
    borderWidth: 2,
    pointRadius: points.length > 12 ? 0 : 3,
    pointHoverRadius: 5,
    tension: 0.25
  }
})

const columns = computed(() => [
  { label: '日期', prop: 'snapshot_date', width: '130' },
  { label: shareColumnLabel(dashboardSettingStore.shareUnit, '持有'), prop: 'current_shares', formatter: (row) => formatShare(row.current_shares, dashboardSettingStore.shareUnit), minWidth: '140' },
  { label: '權重', prop: 'holding_ratio', formatter: (row) => formatRatio(row.holding_ratio), minWidth: '100' },
  { label: `${shareColumnLabel(dashboardSettingStore.shareUnit)}變化`, prop: 'delta_shares', formatter: (row) => formatShare(row.delta_shares, dashboardSettingStore.shareUnit), minWidth: '120' }
])

const renderChart = async () => {
  await nextTick()
  if (!chartCanvas.value) return

  if (!chartDataset.value.data.length) {
    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }
    return
  }

  if (!chartInstance) {
    chartInstance = new Chart(chartCanvas.value, {
      type: 'line',
      data: {
        datasets: [chartDataset.value]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${formatNumber(context.parsed.y)} ${shareUnitLabel(dashboardSettingStore.shareUnit)}`
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: selectedRange.value === '1w' || selectedRange.value === '1m' ? 'day' : 'month',
              tooltipFormat: 'YYYY-MM-DD'
            },
            ticks: {
              color: '#8b949e',
              maxRotation: 0
            },
            grid: {
              color: '#2f3339'
            }
          },
          y: {
            ticks: {
              color: '#8b949e',
              callback: (value) => formatNumber(value)
            },
            grid: {
              color: '#2f3339'
            }
          }
        }
      }
    })
    return
  }

  chartInstance.data.datasets = [chartDataset.value]
  chartInstance.options.scales.x.time.unit = selectedRange.value === '1w' || selectedRange.value === '1m' ? 'day' : 'month'
  chartInstance.update()
}

const loadSummary = async () => {
  if (!etfCode.value || !stockCode.value) return
  loadingSummary.value = true
  errorMessage.value = ''

  try {
    summary.value = normalizeObject(await getEtfStockDetail({ etfCode: etfCode.value, stockCode: stockCode.value }))
  } catch (error) {
    errorMessage.value = error?.message || '讀取持股詳情失敗'
    summary.value = {}
  } finally {
    loadingSummary.value = false
  }
}

const loadSeries = async () => {
  if (!etfCode.value || !stockCode.value) return
  loadingSeries.value = true

  try {
    series.value = normalizeObject(
      await getEtfStockSeries({
        etfCode: etfCode.value,
        stockCode: stockCode.value,
        range: selectedRange.value
      })
    )
  } catch (error) {
    errorMessage.value = error?.message || '讀取持股曲線失敗'
    series.value = {}
  } finally {
    loadingSeries.value = false
  }
}

const reload = async () => {
  await Promise.all([loadSummary(), loadSeries()])
}

watch(selectedRange, () => {
  loadSeries()
})

watch([etfCode, stockCode], () => {
  reload()
})

watch(chartDataset, () => {
  renderChart()
})

onMounted(() => {
  reload()
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<template>
  <div class="detail-page">
    <section class="console-bar">
      <div>
        <div class="breadcrumb">主動 ETF / 目前持股 / 個股詳情</div>
        <h1>{{ current.stock_name || summary.stock_name || stockCode }} <span>{{ stockCode }}</span></h1>
      </div>
      <button class="refresh-button" type="button" :disabled="loadingSummary || loadingSeries" @click="reload">
        <RefreshCw :size="16" />
      </button>
    </section>

    <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

    <section class="metric-strip">
      <div class="metric-box">
        <span>ETF</span>
        <strong>{{ current.etf_name || summary.etf_name || etfCode }}</strong>
      </div>
      <div class="metric-box">
        <span>目前持有{{ shareUnitLabel(dashboardSettingStore.shareUnit) }}數</span>
        <strong>{{ formatShare(detailSummary.current_shares ?? current.holding_shares, dashboardSettingStore.shareUnit) }}</strong>
      </div>
      <div class="metric-box">
        <span>目前權重</span>
        <strong>{{ formatRatio(detailSummary.holding_ratio ?? current.holding_ratio) }}</strong>
      </div>
      <div class="metric-box">
        <span>最新日期</span>
        <strong>{{ detailSummary.latest_snapshot_date || current.snapshot_date || '-' }}</strong>
      </div>
    </section>

    <section class="console-panel">
      <div class="panel-heading">
        <div>
          <h2>持股走勢</h2>
          <span>此 ETF 在選定區間內對該股票的持股{{ shareUnitLabel(dashboardSettingStore.shareUnit) }}數變化</span>
        </div>
        <div class="range-tabs">
          <button
            v-for="item in rangeOptions"
            :key="item"
            type="button"
            :class="{ active: item === selectedRange }"
            @click="selectedRange = item"
          >
            {{ item }}
          </button>
        </div>
      </div>
      <div class="chart-shell" v-loading="loadingSeries">
        <canvas v-show="chartDataset.data.length" ref="chartCanvas"></canvas>
        <div v-if="!chartDataset.data.length && !loadingSeries" class="chart-empty">目前沒有可繪製的曲線資料</div>
      </div>
    </section>

    <section class="console-panel">
      <div class="panel-heading">
        <h2>持股紀錄</h2>
      </div>
      <TwoTable :data="seriesItems" :columns="columns" :loading="loadingSeries">
        <template #empty>{{ loadingSeries ? '資料讀取中' : '目前沒有持股紀錄' }}</template>
      </TwoTable>
    </section>
  </div>
</template>

<style scoped>
.detail-page {
  display: grid;
  gap: 16px;
  color: #cbd5e1;
}

.console-bar,
.console-panel,
.metric-box {
  border: 1px solid #2f3339;
  border-radius: 6px;
  background: #1b1d21;
}

.console-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.breadcrumb,
.metric-box span,
.panel-heading span {
  color: #7c858f;
  font-size: 12px;
  font-weight: 900;
}

h1,
h2 {
  margin: 4px 0 0;
  color: #f7fafc;
  font-weight: 900;
}

h1 {
  font-size: 22px;
}

h1 span {
  color: #7c858f;
  font-size: 14px;
}

h2 {
  font-size: 16px;
}

.refresh-button {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid #30343a;
  border-radius: 6px;
  background: #111317;
  color: #d4d8dd;
}

.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metric-box {
  padding: 12px;
}

.metric-box strong {
  display: block;
  margin-top: 7px;
  color: #f7fafc;
  font-size: 15px;
  font-weight: 900;
}

.console-panel {
  padding: 16px;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.range-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.range-tabs button {
  min-height: 30px;
  border: 1px solid #30343a;
  border-radius: 4px;
  padding: 0 10px;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 900;
}

.range-tabs button.active {
  border-color: #10bfae;
  color: #10bfae;
}

.chart-shell {
  position: relative;
  min-height: 340px;
  border: 1px solid #2f3339;
  border-radius: 4px;
  background: #202328;
  padding: 18px;
}

.chart-shell canvas {
  width: 100% !important;
  height: 300px !important;
}

.chart-empty {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  color: #7c858f;
  font-size: 13px;
  font-weight: 800;
}

.error-banner {
  padding: 10px 12px;
  border: 1px solid #7f1d1d;
  border-radius: 4px;
  background: #2a1717;
  color: #fecaca;
  font-size: 13px;
  font-weight: 800;
}

@media (max-width: 900px) {
  .console-bar,
  .panel-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .metric-strip {
    grid-template-columns: 1fr;
  }

  .chart-shell {
    min-height: 280px;
    padding: 12px;
  }

  .chart-shell canvas {
    height: 240px !important;
  }
}
</style>

<route>
{
  name: "Dashboard_Etf_Holdings_Detail",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
