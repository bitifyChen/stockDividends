<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-moment'
import { RefreshCw } from 'lucide-vue-next'
import { getEtfObservedStockDetail, getEtfObservedStockSeries } from '@/api/etf.js'
import TwoSparkline from '@/components/Two/TwoSparkline.vue'
import TwoTable from '@/components/Two/TwoTable.vue'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { formatNumber, formatRatio, formatShare, normalizeArray, normalizeObject, shareColumnLabel, shareUnitLabel, toShareUnitValue } from '@/utils/etfDashboard.js'

const route = useRoute()
const dashboardSettingStore = useDashboardSettingStore()
const rangeOptions = ['1w', '1m', '6m', '1y', 'max']
const chartColors = ['#10bfae', '#d75455', '#5aa9e6', '#f5b84b', '#b784f7', '#f97316', '#22c55e']

const loadingSummary = ref(false)
const loadingSeries = ref(false)
const summary = ref({})
const series = ref({})
const selectedRange = ref('1m')
const errorMessage = ref('')
const chartCanvas = ref(null)
let chartInstance = null

const stockCode = computed(() => String(route.params.stockCode || ''))
const stockSummary = computed(() => normalizeObject(summary.value.summary))
const holdersRows = computed(() => normalizeArray(summary.value.holders))
const seriesHolders = computed(() => normalizeArray(series.value.holders))

const mergedRows = computed(() =>
  holdersRows.value.map((holder) => {
    const current = normalizeObject(holder.current)
    const holderSummary = normalizeObject(holder.summary)
    const holderSeries = seriesHolders.value.find((item) => item.etf_code === holder.etf_code)

    return {
      ...holder,
      current,
      summary: holderSummary,
      series: normalizeArray(holderSeries?.series),
      etf_code: holder.etf_code || current.etf_code,
      etf_name: holder.etf_name || current.etf_name,
      stock_code: holder.stock_code || current.stock_code,
      stock_name: holder.stock_name || current.stock_name,
      holding_shares: holderSummary.current_shares ?? current.holding_shares,
      holding_ratio: holderSummary.holding_ratio ?? current.holding_ratio,
      delta_shares: holderSummary.delta_shares,
      event_type: holderSummary.event_type,
      first_seen_date: holderSummary.first_seen_date,
      latest_snapshot_date: holderSummary.latest_snapshot_date ?? current.snapshot_date
    }
  })
)

const totalCurrentShares = computed(() =>
  stockSummary.value.total_current_shares ?? mergedRows.value.reduce((total, row) => total + Number(row.holding_shares || 0), 0)
)

const latestSnapshotDate = computed(() => summary.value.latest_snapshot_date || stockSummary.value.last_seen_date || '-')

const chartDatasets = computed(() =>
  seriesHolders.value
    .map((holder, index) => {
      const points = normalizeArray(holder.series)
        .filter((item) => item.snapshot_date && Number.isFinite(Number(item.current_shares)))
        .map((item) => ({
          x: item.snapshot_date,
          y: toShareUnitValue(item.current_shares, dashboardSettingStore.shareUnit)
        }))

      return {
        label: `${holder.etf_name || holder.etf_code || 'ETF'} ${holder.etf_code || ''}`.trim(),
        data: points,
        borderColor: chartColors[index % chartColors.length],
        backgroundColor: chartColors[index % chartColors.length],
        borderWidth: 2,
        pointRadius: points.length > 12 ? 0 : 3,
        pointHoverRadius: 5,
        tension: 0.25
      }
    })
    .filter((dataset) => dataset.data.length)
)

const columns = computed(() => [
  { label: 'ETF', slot: 'etf', minWidth: '180' },
  { label: shareColumnLabel(dashboardSettingStore.shareUnit, '持有'), prop: 'holding_shares', formatter: (row) => formatShare(row.holding_shares, dashboardSettingStore.shareUnit), minWidth: '140' },
  { label: '權重', prop: 'holding_ratio', formatter: (row) => formatRatio(row.holding_ratio), minWidth: '100' },
  { label: shareColumnLabel(dashboardSettingStore.shareUnit, '' ) + '變化', slot: 'delta', minWidth: '120' },
  { label: '走勢', slot: 'sparkline', minWidth: '150' },
  { label: '資料日期', prop: 'latest_snapshot_date', minWidth: '120' },
  { label: '操作', slot: 'actions', width: '96', align: 'right' }
])

const renderChart = async () => {
  await nextTick()
  if (!chartCanvas.value) return

  const datasets = chartDatasets.value
  if (!datasets.length) {
    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }
    return
  }

  if (!chartInstance) {
    chartInstance = new Chart(chartCanvas.value, {
      type: 'line',
      data: { datasets },
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

  chartInstance.data.datasets = datasets
  chartInstance.options.scales.x.time.unit = selectedRange.value === '1w' || selectedRange.value === '1m' ? 'day' : 'month'
  chartInstance.update()
}

const loadSummary = async () => {
  if (!stockCode.value) return
  loadingSummary.value = true
  errorMessage.value = ''

  try {
    summary.value = normalizeObject(await getEtfObservedStockDetail({ stockCode: stockCode.value }))
  } catch (error) {
    errorMessage.value = error?.message || '讀取個股觀測摘要失敗'
    summary.value = {}
  } finally {
    loadingSummary.value = false
  }
}

const loadSeries = async () => {
  if (!stockCode.value) return
  loadingSeries.value = true

  try {
    series.value = normalizeObject(
      await getEtfObservedStockSeries({
        stockCode: stockCode.value,
        range: selectedRange.value
      })
    )
  } catch (error) {
    errorMessage.value = error?.message || '讀取個股觀測曲線失敗'
    series.value = {}
  } finally {
    loadingSeries.value = false
  }
}

const reload = async () => {
  await Promise.all([loadSummary(), loadSeries()])
}

const seriesPoints = (row) => normalizeArray(row.series).map((item) => toShareUnitValue(item.current_shares, dashboardSettingStore.shareUnit))

const formatDelta = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return String(value)
  return `${numberValue > 0 ? '+' : ''}${formatShare(numberValue, dashboardSettingStore.shareUnit)}`
}

const deltaClass = (value) => {
  const numberValue = Number(value)
  if (numberValue > 0) return 'stock-rise'
  if (numberValue < 0) return 'stock-fall'
  return 'stock-neutral'
}

const canOpenHoldingDetail = (row) => Boolean(row.etf_code && stockCode.value)

const detailRoute = (row) => ({
  name: 'Dashboard_Etf_Holdings_Detail',
  params: {
    etfCode: String(row.etf_code),
    stockCode: stockCode.value
  }
})

watch(selectedRange, () => {
  loadSeries()
})

watch(stockCode, () => {
  reload()
})

watch(chartDatasets, () => {
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
        <div class="breadcrumb">主動 ETF / 個股觀測 / 詳情</div>
        <h1>
          {{ summary.stock_name || stockCode }}
          <span>{{ stockCode }}</span>
        </h1>
      </div>
      <button class="refresh-button" type="button" :disabled="loadingSummary || loadingSeries" @click="reload">
        <RefreshCw :size="16" />
      </button>
    </section>

    <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

    <section class="metric-strip">
      <div class="metric-box">
        <span>持有 ETF 數</span>
        <strong>{{ formatNumber(stockSummary.holder_count || mergedRows.length) }}</strong>
      </div>
      <div class="metric-box">
        <span>總持有{{ shareUnitLabel(dashboardSettingStore.shareUnit) }}數</span>
        <strong>{{ formatShare(totalCurrentShares, dashboardSettingStore.shareUnit) }}</strong>
      </div>
      <div class="metric-box">
        <span>首次出現</span>
        <strong>{{ stockSummary.first_seen_date || '-' }}</strong>
      </div>
      <div class="metric-box">
        <span>最新日期</span>
        <strong>{{ latestSnapshotDate }}</strong>
      </div>
    </section>

    <section class="console-panel">
      <div class="panel-heading">
        <div>
          <h2>區間持股曲線</h2>
          <span>這個時間區間內，各 ETF 對此股票的持股{{ shareUnitLabel(dashboardSettingStore.shareUnit) }}數變化</span>
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
        <canvas v-show="chartDatasets.length" ref="chartCanvas"></canvas>
        <div v-if="!chartDatasets.length && !loadingSeries" class="chart-empty">目前沒有可繪製的曲線資料</div>
      </div>
    </section>

    <section class="console-panel">
      <div class="panel-heading">
        <div>
          <h2>主動 ETF 持有明細</h2>
          <span>{{ mergedRows.length }} 檔 ETF 持有此股票</span>
        </div>
      </div>

      <TwoTable :data="mergedRows" :columns="columns" :loading="loadingSummary || loadingSeries">
        <template #etf="{ row }">
          <div class="etf-cell">
            <strong>{{ row.etf_name || '-' }}</strong>
            <span>{{ row.etf_code || '-' }}</span>
          </div>
        </template>
        <template #delta="{ row }">
          <span :class="deltaClass(row.delta_shares)">{{ formatDelta(row.delta_shares) }}</span>
        </template>
        <template #sparkline="{ row }">
          <div class="sparkline-cell">
            <TwoSparkline :points="seriesPoints(row)" :width="108" :height="32" />
            <span>{{ normalizeArray(row.series).length }}d</span>
          </div>
        </template>
        <template #actions="{ row }">
          <RouterLink v-if="canOpenHoldingDetail(row)" class="detail-link" :to="detailRoute(row)">詳情</RouterLink>
          <span v-else class="detail-disabled">-</span>
        </template>
        <template #empty>{{ loadingSummary || loadingSeries ? '資料讀取中' : '目前沒有 ETF 持有資料' }}</template>
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

.etf-cell {
  display: grid;
  gap: 2px;
}

.etf-cell strong {
  color: #f7fafc;
}

.etf-cell span,
.sparkline-cell span {
  color: #7c858f;
  font-size: 12px;
}

.sparkline-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.stock-neutral,
.detail-disabled {
  color: var(--stock-neutral-color);
}

.detail-link {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid #30343a;
  border-radius: 4px;
  padding: 0 10px;
  color: #d4d8dd;
  font-size: 12px;
  font-weight: 900;
  text-decoration: none;
}

.detail-link:hover {
  border-color: #10bfae;
  color: #10bfae;
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
  name: "Dashboard_Etf_Stocks_Detail",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
