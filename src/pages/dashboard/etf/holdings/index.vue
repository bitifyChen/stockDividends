<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { RefreshCw } from 'lucide-vue-next'
import { getEtfAvailableDates, getEtfHoldings, getEtfList } from '@/api/etf.js'
import TwoSparkline from '@/components/Two/TwoSparkline.vue'
import TwoTable from '@/components/Two/TwoTable.vue'
import DashboardTechnicalCandles from '@/components/dashboard/DashboardTechnicalCandles.vue'
import EtfHoldingsViewSwitcher from '@/components/dashboard/EtfHoldingsViewSwitcher.vue'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import {
  formatNumber,
  formatRatio,
  formatShare,
  normalizeArray,
  normalizeObject,
  shareColumnLabel,
  toShareUnitValue
} from '@/utils/etfDashboard.js'

const TREND_DAYS = 30
const dashboardSettingStore = useDashboardSettingStore()

const loadingList = ref(false)
const loadingDates = ref(false)
const loadingData = ref(false)
const loadingTechnical = ref(false)
const switchingEtf = ref(false)
const etfOptions = ref([])
const selectedEtfCode = ref('')
const snapshotDate = ref('')
const availableDates = ref([])
const availableRange = ref({ firstSeenDate: '', lastSnapshotDate: '' })
const rows = ref([])
const technicalRange = ref('6m')
const technicalInterval = ref('daily')
const errorMessage = ref('')
const technicalChartRef = ref(null)

const columns = computed(() => [
  { label: '排名', prop: 'source_rank', width: '70', align: 'center' },
  { label: '股票', slot: 'stock', minWidth: '180' },
  {
    label: shareColumnLabel(dashboardSettingStore.shareUnit, '持有'),
    prop: 'holding_shares',
    formatter: (row) => formatShare(row.holding_shares, dashboardSettingStore.shareUnit),
    minWidth: '140'
  },
  { label: '30日走勢', slot: 'trend', minWidth: '140' },
  {
    label: '權重',
    prop: 'holding_ratio',
    formatter: (row) => formatRatio(row.holding_ratio),
    minWidth: '100'
  },
  { label: '資料日期', prop: 'snapshot_date', width: '120' },
  { label: '操作', slot: 'actions', width: '96', align: 'center' }
])

const availableDateSet = computed(() => new Set(availableDates.value))

const isDateDisabled = (date) => {
  if (!selectedEtfCode.value || !availableDates.value.length) return false
  const target = dayjs(date).format('YYYY-MM-DD')
  return !availableDateSet.value.has(target)
}

const toNumber = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const trendItems = (row) =>
  normalizeArray(row?.trend)
    .filter((item) => item?.snapshot_date || item?.date)
    .sort(
      (a, b) =>
        dayjs(a.snapshot_date || a.date).valueOf() - dayjs(b.snapshot_date || b.date).valueOf()
    )

const trendPoints = (row) =>
  trendItems(row).map((item) =>
    toShareUnitValue(item.holding_shares, dashboardSettingStore.shareUnit)
  )
const rowEtfCode = (row) => row.etf_code || selectedEtfCode.value
const canOpenDetail = (row) => Boolean(rowEtfCode(row) && row.stock_code)

const detailRoute = (row) => ({
  name: 'Dashboard_Etf_Holdings_Detail',
  params: {
    etfCode: String(rowEtfCode(row)),
    stockCode: String(row.stock_code)
  }
})

const loadEtfList = async () => {
  loadingList.value = true
  errorMessage.value = ''

  try {
    const data = await getEtfList()
    etfOptions.value = normalizeArray(data)
    selectedEtfCode.value = selectedEtfCode.value || etfOptions.value[0]?.etf_code || ''
  } catch (error) {
    errorMessage.value = error?.message || '讀取 ETF 清單失敗'
    etfOptions.value = []
  } finally {
    loadingList.value = false
  }
}

const loadAvailableDates = async () => {
  if (!selectedEtfCode.value) {
    availableDates.value = []
    availableRange.value = { firstSeenDate: '', lastSnapshotDate: '' }
    return
  }

  loadingDates.value = true

  try {
    const data = await getEtfAvailableDates({ etfCode: selectedEtfCode.value })
    availableDates.value = normalizeArray(data)
    availableRange.value = {
      firstSeenDate: data?.firstSeenDate || '',
      lastSnapshotDate: data?.lastSnapshotDate || ''
    }
    if (snapshotDate.value && !availableDateSet.value.has(snapshotDate.value)) {
      snapshotDate.value = ''
    }
  } catch (error) {
    availableDates.value = []
    availableRange.value = { firstSeenDate: '', lastSnapshotDate: '' }
    errorMessage.value = error?.message || '讀取可用日期失敗'
  } finally {
    loadingDates.value = false
  }
}

const loadHoldings = async () => {
  if (!selectedEtfCode.value) {
    rows.value = []
    return
  }

  loadingData.value = true
  errorMessage.value = ''

  try {
    const data = await getEtfHoldings({
      etfCode: selectedEtfCode.value,
      date: snapshotDate.value || null,
      includeTrendDays: TREND_DAYS
    })
    rows.value = normalizeArray(data)
  } catch (error) {
    errorMessage.value = error?.message || '讀取 ETF 持股失敗'
    rows.value = []
  } finally {
    loadingData.value = false
  }
}

const reloadHoldingsPage = async () => {
  await Promise.all([
    loadHoldings(),
    technicalChartRef.value?.reload({ force: true }) || Promise.resolve()
  ])
}

const selectedEtf = computed(
  () => etfOptions.value.find((item) => item.etf_code === selectedEtfCode.value) || null
)
const latestSnapshotDate = computed(
  () => rows.value.find((row) => row?.snapshot_date)?.snapshot_date || '-'
)
const totalWeight = computed(() =>
  rows.value.reduce((total, item) => total + toNumber(item.holding_ratio), 0)
)
const sortedRows = computed(() =>
  [...rows.value].sort((a, b) => toNumber(a.source_rank) - toNumber(b.source_rank))
)

watch(selectedEtfCode, async () => {
  switchingEtf.value = true
  snapshotDate.value = ''
  await Promise.all([loadAvailableDates(), loadHoldings()])
  switchingEtf.value = false
})

watch(snapshotDate, async () => {
  if (switchingEtf.value) return
  await loadHoldings()
})

onMounted(async () => {
  await loadEtfList()
})
</script>

<template>
  <div class="etf-console">
    <EtfHoldingsViewSwitcher active-mode="list" />
    <section class="console-bar">
      <div>
        <div class="breadcrumb">ETF / 目前持股</div>
        <h1>目前持股</h1>
      </div>

      <div class="console-tools">
        <label class="field">
          <span>ETF</span>
          <el-select
            v-model="selectedEtfCode"
            class="dashboard-select"
            filterable
            :disabled="loadingList || !etfOptions.length"
            :loading="loadingList"
          >
            <el-option
              v-for="item in etfOptions"
              :key="item.etf_code"
              :label="`${item.etf_code} ${item.etf_name}`"
              :value="item.etf_code"
            />
          </el-select>
        </label>

        <label class="date-picker-control">
          <span>日期</span>
          <el-date-picker
            v-model="snapshotDate"
            class="dashboard-date-picker"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="最新日期"
            clearable
            popper-class="dashboard-date-popper"
            :disabled-date="isDateDisabled"
          />
        </label>

        <button
          class="refresh-button"
          type="button"
          :disabled="loadingData || loadingTechnical"
          @click="reloadHoldingsPage"
        >
          <RefreshCw :size="16" />
        </button>
      </div>
    </section>

    <DashboardTechnicalCandles
      ref="technicalChartRef"
      v-model:range="technicalRange"
      v-model:interval="technicalInterval"
      :stock-code="selectedEtfCode"
      title="ETF K 線"
      :description="`${selectedEtfCode || '-'} 價格走勢`"
      empty-text="目前沒有可繪製的 ETF K 線資料"
      error-text="讀取 ETF K 線失敗"
      panel-class="etf-candle-panel"
      @loading-change="loadingTechnical = $event"
    />

    <section class="console-panel">
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <div class="summary-line">
        <div>
          <strong>{{ selectedEtf?.etf_name || '-' }}</strong>
          <span>{{ selectedEtf?.source_company || selectedEtf?.source_provider || '-' }}</span>
        </div>
        <div>
          <span>最新日期</span>
          <strong>{{ latestSnapshotDate }}</strong>
        </div>
      </div>

      <div class="metric-strip">
        <div class="metric-box">
          <span>筆數</span>
          <strong>{{ rows.length }}</strong>
        </div>
        <div class="metric-box">
          <span>總權重</span>
          <strong>{{ formatRatio(totalWeight) }}</strong>
        </div>
        <div class="metric-box">
          <span>可用日期</span>
          <strong
            >{{ availableRange.firstSeenDate || '-' }} -
            {{ availableRange.lastSnapshotDate || '-' }}</strong
          >
        </div>
      </div>

      <TwoTable :data="sortedRows" :columns="columns" :loading="loadingData || loadingDates">
        <template #stock="{ row }">
          <div class="stock-cell">
            <strong>{{ row.stock_name || '-' }}</strong>
            <span>{{ row.stock_code || '-' }}</span>
          </div>
        </template>
        <template #trend="{ row }">
          <div class="trend-cell">
            <TwoSparkline :points="trendPoints(row)" :width="88" :height="28" />
            <span class="trend-caption">{{ trendItems(row).length || 0 }}d</span>
          </div>
        </template>
        <template #actions="{ row }">
          <router-link v-if="canOpenDetail(row)" class="detail-link" :to="detailRoute(row)"
            >詳情</router-link
          >
          <span v-else class="detail-disabled">-</span>
        </template>
        <template #empty>{{ loadingData ? '資料讀取中' : '目前沒有持股資料' }}</template>
      </TwoTable>
    </section>
  </div>
</template>

<route>
{
  name: "Dashboard_Etf_Holdings",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
