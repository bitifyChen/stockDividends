<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-moment'
import { ArrowUpRight, RefreshCw } from 'lucide-vue-next'
import { getEtfStockDetail, getEtfStockSeries } from '@/api/etf.js'
import TwoTable from '@/components/Two/TwoTable.vue'
import { holdingSeriesRangeOptions } from '@/data/dashboardDataMapping.js'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import {
  formatNumber,
  formatRatio,
  formatShare,
  getSeriesItems,
  normalizeObject,
  shareColumnLabel,
  shareUnitLabel,
  toShareUnitValue
} from '@/utils/etfDashboard.js'

const route = useRoute()
const dashboardSettingStore = useDashboardSettingStore()
const rangeOptions = holdingSeriesRangeOptions

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
const etfName = computed(() => current.value.etf_name || summary.value.etf_name || '')
const stockName = computed(() => current.value.stock_name || summary.value.stock_name || '')
const stockDetailRoute = computed(() => ({
  name: 'Dashboard_Etf_Stocks_Detail',
  params: {
    stockCode: stockCode.value
  }
}))

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
  {
    label: shareColumnLabel(dashboardSettingStore.shareUnit, '持有'),
    prop: 'current_shares',
    formatter: (row) => formatShare(row.current_shares, dashboardSettingStore.shareUnit),
    minWidth: '140'
  },
  {
    label: '權重',
    prop: 'holding_ratio',
    formatter: (row) => formatRatio(row.holding_ratio),
    minWidth: '100'
  },
  {
    label: `${shareColumnLabel(dashboardSettingStore.shareUnit)}變化`,
    prop: 'delta_shares',
    formatter: (row) => formatShare(row.delta_shares, dashboardSettingStore.shareUnit),
    minWidth: '120'
  }
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
              label: (context) =>
                `${context.dataset.label}: ${formatNumber(context.parsed.y)} ${shareUnitLabel(dashboardSettingStore.shareUnit)}`
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
  chartInstance.options.scales.x.time.unit =
    selectedRange.value === '1w' || selectedRange.value === '1m' ? 'day' : 'month'
  chartInstance.update()
}

const loadSummary = async () => {
  if (!etfCode.value || !stockCode.value) return
  loadingSummary.value = true
  errorMessage.value = ''

  try {
    summary.value = normalizeObject(
      await getEtfStockDetail({ etfCode: etfCode.value, stockCode: stockCode.value })
    )
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
    <section class="detail-header">
      <div class="detail-hero">
        <div class="stock-identity">
          <span class="identity-kicker">ETF 持股詳情</span>
          <h1>
            <span>{{ stockCode }}</span>
            {{ stockName || '個股' }}
          </h1>
          <div class="etf-relation">
            <span>{{ etfCode }}</span>
            <strong>{{ etfName || '主動 ETF' }}</strong>
          </div>
        </div>

        <div class="header-actions">
          <router-link class="stock-link-button" :to="stockDetailRoute">
            檢視個股
            <ArrowUpRight :size="16" />
          </router-link>
          <button
            class="refresh-button"
            type="button"
            :disabled="loadingSummary || loadingSeries"
            @click="reload"
          >
            <RefreshCw :size="16" />
          </button>
        </div>
      </div>

      <div class="metric-strip">
        <div class="metric-box primary-metric">
          <span>目前持有{{ shareUnitLabel(dashboardSettingStore.shareUnit) }}數</span>
          <strong>{{
            formatShare(
              detailSummary.current_shares ?? current.holding_shares,
              dashboardSettingStore.shareUnit
            )
          }}</strong>
        </div>
        <div class="metric-box">
          <span>目前權重</span>
          <strong>{{ formatRatio(detailSummary.holding_ratio ?? current.holding_ratio) }}</strong>
        </div>
        <div class="metric-box">
          <span>最新日期</span>
          <strong>{{ detailSummary.latest_snapshot_date || current.snapshot_date || '-' }}</strong>
        </div>
      </div>
    </section>

    <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

    <section class="console-panel">
      <div class="panel-heading">
        <div>
          <h2>持股走勢</h2>
          <span
            >此 ETF 在選定區間內對該股票的持股{{
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
      <div class="chart-shell" v-loading="loadingSeries">
        <canvas v-show="chartDataset.data.length" ref="chartCanvas"></canvas>
        <div v-if="!chartDataset.data.length && !loadingSeries" class="chart-empty">
          目前沒有可繪製的曲線資料
        </div>
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

.refresh-button,
.stock-link-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #30343a;
  border-radius: 999px;
  background: #111317;
  color: #d4d8dd;
  font-size: 13px;
  font-weight: 900;
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    background 0.2s ease;
}

.stock-link-button {
  min-height: 38px;
  padding: 0 14px;
  border-color: rgb(16 191 174 / 0.42);
  background: rgb(16 191 174 / 0.12);
  color: #a7fff4;
}

.refresh-button {
  width: 38px;
  height: 38px;
  padding: 0;
}

.refresh-button:hover,
.stock-link-button:hover {
  border-color: #10bfae;
  color: #10bfae;
  transform: translateY(-1px);
}

.refresh-button:active,
.stock-link-button:active {
  transform: translateY(0);
}

.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  max-width: 100%;
  min-width: 0;
  min-height: 340px;
  overflow: hidden;
  border: 1px solid #2f3339;
  border-radius: 4px;
  background: #202328;
  padding: 18px;
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

  .detail-header {
    padding: 18px;
  }

  .detail-hero,
  .header-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .stock-link-button,
  .refresh-button {
    width: 100%;
  }

  .refresh-button {
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

  .range-tabs button {
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
