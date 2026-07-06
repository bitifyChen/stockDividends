<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-moment'
import dayjs from 'dayjs'
import { RefreshCw } from 'lucide-vue-next'
import { getEtfObservedStockDetail, getEtfObservedStockSeries } from '@/api/etf.js'
import TwoSparkline from '@/components/Two/TwoSparkline.vue'
import TwoTable from '@/components/Two/TwoTable.vue'
import DashboardTechnicalCandles from '@/components/dashboard/DashboardTechnicalCandles.vue'
import { holdingSeriesRangeOptions } from '@/data/dashboardDataMapping.js'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import {
  formatNumber,
  formatRatio,
  formatShare,
  normalizeArray,
  normalizeObject,
  shareColumnLabel,
  shareUnitLabel,
  toShareUnitValue
} from '@/utils/etfDashboard.js'
import { getStockName } from '@/utils/stock.js'

const route = useRoute()
const dashboardSettingStore = useDashboardSettingStore()
const rangeOptions = holdingSeriesRangeOptions
const chartColors = ['#10bfae', '#d75455', '#5aa9e6', '#f5b84b', '#b784f7', '#f97316', '#22c55e']

const loadingSummary = ref(false)
const loadingSeries = ref(false)
const loadingTechnical = ref(false)
const summary = ref({})
const series = ref({})
const selectedRange = ref('6m')
const technicalRange = ref('6m')
const technicalInterval = ref('daily')
const errorMessage = ref('')
const chartCanvas = ref(null)
const technicalChartRef = ref(null)
const activeEtfCodes = ref(new Set())
let chartInstance = null

const stockCode = computed(() => String(route.params.stockCode || ''))
const stockSummary = computed(() => normalizeObject(summary.value.summary))
const holdersRows = computed(() => normalizeArray(summary.value.holders))
const seriesHolders = computed(() => normalizeArray(series.value.holders))
const stockName = computed(() => getStockName(summary.value.stock || stockSummary.value.stock, ''))

const etfFilterOptions = computed(() => {
  const options = new Map()

  holdersRows.value.forEach((holder) => {
    const current = normalizeObject(holder.current)
    const code = holder.etf_code || current.etf_code
    if (!code) return
    options.set(code, {
      etf_code: code,
      etf_name: holder.etf_name || current.etf_name || ''
    })
  })

  seriesHolders.value.forEach((holder) => {
    const code = holder.etf_code
    if (!code || options.has(code)) return
    options.set(code, {
      etf_code: code,
      etf_name: holder.etf_name || ''
    })
  })

  return [...options.values()]
})

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
      stock: holder.stock || current.stock || holderSummary.stock,
      holding_shares: holderSummary.current_shares ?? current.holding_shares,
      holding_ratio: holderSummary.holding_ratio ?? current.holding_ratio,
      delta_shares: holderSummary.delta_shares,
      event_type: holderSummary.event_type,
      first_seen_date: holderSummary.first_seen_date,
      latest_snapshot_date: holderSummary.latest_snapshot_date ?? current.snapshot_date
    }
  })
)

const filteredMergedRows = computed(() =>
  mergedRows.value.filter((row) => activeEtfCodes.value.has(row.etf_code))
)

const totalCurrentShares = computed(
  () =>
    stockSummary.value.total_current_shares ??
    mergedRows.value.reduce((total, row) => total + Number(row.holding_shares || 0), 0)
)

const latestSnapshotDate = computed(
  () => summary.value.latest_snapshot_date || stockSummary.value.last_seen_date || '-'
)

const chartDatasets = computed(() =>
  seriesHolders.value
    .filter((holder) => activeEtfCodes.value.has(holder.etf_code))
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
  {
    label: shareColumnLabel(dashboardSettingStore.shareUnit, '持有'),
    prop: 'holding_shares',
    formatter: (row) => formatShare(row.holding_shares, dashboardSettingStore.shareUnit),
    minWidth: '140'
  },
  {
    label: '權重',
    prop: 'holding_ratio',
    formatter: (row) => formatRatio(row.holding_ratio),
    minWidth: '100'
  },
  {
    label: shareColumnLabel(dashboardSettingStore.shareUnit, '') + '變化',
    slot: 'delta',
    minWidth: '120'
  },
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
              label: (context) =>
                `${context.dataset.label}: ${formatNumber(context.parsed.y)} ${shareUnitLabel(dashboardSettingStore.shareUnit)}`
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'month',
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
  chartInstance.options.scales.x.time.unit = 'month'
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
  resetActiveEtfs()
}

const reloadPage = async ({ force = false } = {}) => {
  await Promise.all([reload(), technicalChartRef.value?.reload({ force }) || Promise.resolve()])
  resetActiveEtfs()
}

const resetActiveEtfs = () => {
  activeEtfCodes.value = new Set(etfFilterOptions.value.map((item) => item.etf_code))
}

const isEtfActive = (etfCode) => activeEtfCodes.value.has(etfCode)

const toggleEtf = (etfCode) => {
  const next = new Set(activeEtfCodes.value)

  if (next.has(etfCode)) {
    next.delete(etfCode)
  } else {
    next.add(etfCode)
  }

  activeEtfCodes.value = next
}

const seriesPoints = (row) =>
  normalizeArray(row.series).map((item) =>
    toShareUnitValue(item.current_shares, dashboardSettingStore.shareUnit)
  )

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
    <section class="detail-header">
      <div class="detail-hero">
        <div class="stock-identity">
          <span class="identity-kicker">個股觀測</span>
          <h1>
            <span>{{ stockCode }}</span>
            {{ stockName || '個股' }}
          </h1>
          <div class="etf-relation">
            <span>{{ activeEtfCodes.size }} / {{ etfFilterOptions.length }}</span>
            <strong>持有 ETF 顯示中</strong>
          </div>
        </div>

        <div class="header-actions">
          <button
            class="refresh-button"
            type="button"
            :disabled="loadingSummary || loadingSeries || loadingTechnical"
            @click="reloadPage({ force: true })"
          >
            <RefreshCw :size="16" />
          </button>
        </div>
      </div>

      <div class="metric-strip">
        <div class="metric-box primary-metric">
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
      </div>
    </section>

    <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

    <DashboardTechnicalCandles
      ref="technicalChartRef"
      v-model:range="technicalRange"
      v-model:interval="technicalInterval"
      :stock-code="stockCode"
      title="技術分析"
      :description="`${stockCode || '-'} 價格 K 線`"
      empty-text="目前沒有可繪製的 K 線資料"
      error-text="讀取個股 K 線失敗"
      @loading-change="loadingTechnical = $event"
    />

    <section class="console-panel">
      <div class="panel-heading">
        <div>
          <h2>區間持股曲線</h2>
          <span
            >這個時間區間內，各 ETF 對此股票的持股{{
              shareUnitLabel(dashboardSettingStore.shareUnit)
            }}數變化</span
          >
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

      <div v-if="etfFilterOptions.length" class="etf-toggle-panel">
        <div class="filter-heading">
          <span>持有 ETF</span>
          <strong>{{ activeEtfCodes.size }} / {{ etfFilterOptions.length }}</strong>
        </div>
        <div class="etf-toggle-list">
          <button
            v-for="item in etfFilterOptions"
            :key="item.etf_code"
            type="button"
            :class="{ active: isEtfActive(item.etf_code) }"
            @click="toggleEtf(item.etf_code)"
          >
            {{ item.etf_code }} {{ item.etf_name }}
          </button>
        </div>
      </div>

      <div class="chart-shell" v-loading="loadingSeries">
        <canvas v-show="chartDatasets.length" ref="chartCanvas"></canvas>
        <div v-if="!chartDatasets.length && !loadingSeries" class="chart-empty">
          目前沒有可繪製的曲線資料
        </div>
      </div>
    </section>

    <section class="console-panel">
      <div class="panel-heading">
        <div>
          <h2>ETF 持有明細</h2>
          <span>{{ filteredMergedRows.length }} / {{ mergedRows.length }} 檔 ETF 顯示中</span>
        </div>
      </div>

      <TwoTable
        :data="filteredMergedRows"
        :columns="columns"
        :loading="loadingSummary || loadingSeries"
      >
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
          <RouterLink v-if="canOpenHoldingDetail(row)" class="detail-link" :to="detailRoute(row)"
            >詳情</RouterLink
          >
          <span v-else class="detail-disabled">-</span>
        </template>
        <template #empty>{{
          loadingSummary || loadingSeries ? '資料讀取中' : '目前沒有 ETF 持有資料'
        }}</template>
      </TwoTable>
    </section>
  </div>
</template>

<style scoped>
.detail-page {
  display: grid;
  gap: 16px;
  max-width: 100%;
  min-width: 0;
  color: #cbd5e1;
}

.detail-header,
.console-panel,
.metric-box {
  max-width: 100%;
  min-width: 0;
  border: 1px solid rgb(148 163 184 / 0.14);
  border-radius: 6px;
  background: linear-gradient(135deg, rgb(255 255 255 / 0.052), rgb(255 255 255 / 0.014)),
    rgb(7 10 15 / 0.45);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
}

.detail-header {
  position: relative;
  display: grid;
  gap: 18px;
  overflow: hidden;
  border-color: rgb(64 76 90 / 0.82);
  border-radius: 18px;
  background: radial-gradient(circle at 11% 0%, rgb(16 191 174 / 0.26), transparent 34%),
    radial-gradient(circle at 86% 20%, rgb(88 166 255 / 0.18), transparent 30%),
    linear-gradient(135deg, #151a20 0%, #101215 58%, #17191d 100%);
  padding: 24px;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.06),
    0 18px 60px rgb(0 0 0 / 0.24);
}

.detail-header::before {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
      90deg,
      rgb(255 255 255 / 0.08),
      transparent 28%,
      rgb(16 191 174 / 0.08)
    ),
    repeating-linear-gradient(
      90deg,
      rgb(255 255 255 / 0.035) 0,
      rgb(255 255 255 / 0.035) 1px,
      transparent 1px,
      transparent 88px
    );
  content: '';
  opacity: 0.42;
  pointer-events: none;
}

.detail-header::after {
  position: absolute;
  right: 26px;
  bottom: -52px;
  width: 210px;
  height: 210px;
  border: 1px solid rgb(16 191 174 / 0.18);
  border-radius: 999px;
  background: radial-gradient(circle, rgb(16 191 174 / 0.14), transparent 62%);
  content: '';
  pointer-events: none;
}

.detail-hero,
.metric-strip {
  position: relative;
  z-index: 1;
}

.detail-hero {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.stock-identity {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.identity-kicker {
  width: fit-content;
  border: 1px solid rgb(16 191 174 / 0.28);
  border-radius: 999px;
  background: rgb(16 191 174 / 0.09);
  padding: 6px 10px;
  color: #8fe9df;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.stock-identity h1 {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  max-width: min(760px, 100%);
  overflow-wrap: anywhere;
}

.stock-identity h1 span {
  color: #10bfae;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: clamp(18px, 2vw, 26px);
}

.etf-relation {
  display: flex;
  width: fit-content;
  max-width: 100%;
  min-width: 0;
  align-items: center;
  gap: 10px;
  border: 1px solid rgb(148 163 184 / 0.2);
  border-radius: 999px;
  background: rgb(8 11 14 / 0.44);
  padding: 8px 12px;
  color: #aab6c5;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
}

.etf-relation span {
  color: #e2e8f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 900;
}

.etf-relation strong {
  overflow: hidden;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
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
  font-size: clamp(28px, 4vw, 54px);
  line-height: 0.95;
  letter-spacing: -0.02em;
}

h2 {
  font-size: 16px;
}

.refresh-button {
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid #30343a;
  border-radius: 999px;
  background: #111317;
  color: #d4d8dd;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    background 0.2s ease;
}

.refresh-button:hover {
  border-color: #10bfae;
  color: #10bfae;
  transform: translateY(-1px);
}

.refresh-button:active {
  transform: translateY(0);
}

.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-box {
  min-height: 40px;
  border-color: rgb(148 163 184 / 0.16);
  border-radius: 14px;
  background: linear-gradient(135deg, rgb(255 255 255 / 0.055), rgb(255 255 255 / 0.015)),
    rgb(10 13 17 / 0.42);
  padding: 6px 14px;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
}

.metric-box.primary-metric {
  border-color: rgb(16 191 174 / 0.34);
  background: radial-gradient(circle at 20% 0%, rgb(16 191 174 / 0.16), transparent 50%),
    linear-gradient(135deg, rgb(16 191 174 / 0.09), rgb(255 255 255 / 0.015));
}

.metric-box strong {
  display: block;
  margin-top: 4px;
  color: #f7fafc;
  font-size: clamp(12px, 2vw, 18px);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.console-panel {
  position: relative;
  overflow: hidden;
  padding: 16px;
  border-color: rgb(148 163 184 / 0.14);
  border-radius: 18px;
  background: radial-gradient(circle at 0% 0%, rgb(34 211 238 / 0.075), transparent 34%),
    linear-gradient(135deg, rgb(255 255 255 / 0.058), rgb(255 255 255 / 0.018)), rgb(8 11 16 / 0.58);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.07),
    0 22px 70px rgb(0 0 0 / 0.18);
  backdrop-filter: blur(18px) saturate(145%);
  -webkit-backdrop-filter: blur(18px) saturate(145%);
}

.console-panel::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, rgb(255 255 255 / 0.045), transparent 28%),
    radial-gradient(circle at 100% 0%, rgb(16 191 174 / 0.06), transparent 32%);
  content: '';
  pointer-events: none;
}

.console-panel > * {
  position: relative;
  z-index: 1;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-heading-stack {
  align-items: flex-start;
}

.control-stack {
  display: grid;
  justify-items: end;
  gap: 8px;
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

.interval-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.interval-tabs button {
  min-height: 30px;
  border: 1px solid #30343a;
  border-radius: 4px;
  padding: 0 10px;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 900;
}

.interval-tabs button.active {
  border-color: #10bfae;
  color: #10bfae;
}

.etf-toggle-panel {
  display: grid;
  gap: 10px;
  margin-bottom: 14px;
  border: 1px solid #2f3339;
  border-radius: 4px;
  background: #181b1f;
  padding: 12px;
}

.filter-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #7c858f;
  font-size: 12px;
  font-weight: 900;
}

.filter-heading strong {
  color: #f7fafc;
}

.etf-toggle-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.etf-toggle-list button {
  min-height: 30px;
  border: 1px solid #30343a;
  border-radius: 4px;
  padding: 0 10px;
  color: #7c858f;
  background: #111317;
  font-size: 12px;
  font-weight: 900;
}

.etf-toggle-list button.active {
  border-color: #10bfae;
  color: #10bfae;
  background: rgb(16 191 174 / 0.08);
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
  background: #202328;
  padding: 18px;
}

.lw-chart {
  flex: 1;
  width: 100%;
  min-height: 300px;
}

.chart-shell canvas {
  display: block;
  max-width: 100% !important;
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

.chart-hint {
  margin-top: 10px;
  color: #7c858f;
  font-size: 12px;
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
  .panel-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .panel-heading-stack,
  .control-stack {
    justify-items: stretch;
  }

  .detail-header {
    padding: 18px;
  }

  .detail-hero,
  .header-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .refresh-button {
    width: 100%;
    min-height: 38px;
  }

  .etf-relation {
    width: 100%;
    min-width: 0;
  }

  .etf-relation strong {
    min-width: 0;
  }

  .console-panel {
    padding: 12px;
  }

  .range-tabs button,
  .etf-toggle-list button {
    flex: 1 1 100%;
    max-width: 100%;
  }

  .interval-tabs button {
    flex: 1 1 100%;
    max-width: 100%;
  }

  .metric-strip {
    grid-template-columns: 1fr;
  }

  .chart-shell {
    min-height: 280px;
    padding: 12px;
  }

  .lw-chart {
    min-height: 240px;
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
