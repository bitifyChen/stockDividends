<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { RefreshCw } from 'lucide-vue-next'
import { getEtfAvailableDates, getEtfEvents, getEtfHoldings, getEtfList } from '@/api/etf.js'
import TwoTable from '@/components/Two/TwoTable.vue'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { formatRatio, formatShare, normalizeArray, shareColumnLabel } from '@/utils/etfDashboard.js'

const dashboardSettingStore = useDashboardSettingStore()
const loadingList = ref(false)
const loadingDates = ref(false)
const loadingData = ref(false)
const switchingEtf = ref(false)
const etfOptions = ref([])
const selectedEtfCode = ref('')
const snapshotDate = ref('')
const resolvedSnapshotDate = ref('')
const availableDates = ref([])
const rows = ref([])
const errorMessage = ref('')

const columns = computed(() => [
  { label: '股票', slot: 'stock', minWidth: '180' },
  { label: '權重', prop: 'holding_ratio', formatter: (row) => formatRatio(row.holding_ratio) },
  { label: shareColumnLabel(dashboardSettingStore.shareUnit, '目前'), prop: 'current_shares', formatter: (row) => formatShare(row.current_shares, dashboardSettingStore.shareUnit) },
  { label: shareColumnLabel(dashboardSettingStore.shareUnit, '買入'), prop: 'delta_shares', slot: 'buy_shares' },
  { label: '事件', slot: 'event' },
  { label: '資料日期', prop: 'snapshot_date' }
])

const toNumber = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const availableDateSet = computed(() => new Set(availableDates.value))
const selectedEtf = computed(() => etfOptions.value.find((item) => item.etf_code === selectedEtfCode.value) || null)
const latestSnapshotDate = computed(() => rows.value.find((row) => row?.snapshot_date)?.snapshot_date || resolvedSnapshotDate.value || '-')
const totalShares = computed(() => rows.value.reduce((total, item) => total + toNumber(item.current_shares), 0))

const isDateDisabled = (date) => {
  if (!selectedEtfCode.value || !availableDates.value.length) return false
  return !availableDateSet.value.has(dayjs(date).format('YYYY-MM-DD'))
}

const resolveLatestSnapshotDate = async () => {
  if (snapshotDate.value) return snapshotDate.value
  const data = await getEtfHoldings({ etfCode: selectedEtfCode.value, date: null })
  return normalizeArray(data).find((row) => row?.snapshot_date)?.snapshot_date || ''
}

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
    return
  }
  loadingDates.value = true
  try {
    const data = await getEtfAvailableDates({ etfCode: selectedEtfCode.value })
    availableDates.value = Array.isArray(data?.availableDates) ? data.availableDates : normalizeArray(data)
  } catch (error) {
    availableDates.value = []
    errorMessage.value = error?.message || '讀取可用日期失敗'
  } finally {
    loadingDates.value = false
  }
}

const loadFirstBuyRows = async () => {
  if (!selectedEtfCode.value) {
    rows.value = []
    return
  }
  loadingData.value = true
  errorMessage.value = ''
  try {
    const eventDate = await resolveLatestSnapshotDate()
    resolvedSnapshotDate.value = eventDate
    const data = await getEtfEvents({ mode: 'etf', etfCode: selectedEtfCode.value, date: eventDate || null })
    rows.value = normalizeArray(data).filter((row) => row.is_first_buy)
  } catch (error) {
    errorMessage.value = error?.message || '讀取首次買入失敗'
    rows.value = []
  } finally {
    loadingData.value = false
  }
}

watch(selectedEtfCode, async () => {
  switchingEtf.value = true
  snapshotDate.value = ''
  await loadAvailableDates()
  await loadFirstBuyRows()
  switchingEtf.value = false
})

watch(snapshotDate, () => {
  if (switchingEtf.value) return
  loadFirstBuyRows()
})

onMounted(async () => {
  await loadEtfList()
})
</script>

<template>
  <div class="etf-console">
    <section class="console-bar">
      <div>
        <div class="breadcrumb">主動 ETF / 首次買入</div>
        <h1>首次買入</h1>
      </div>
      <div class="console-tools">
        <label class="field">
          <span>ETF</span>
          <select v-model="selectedEtfCode" :disabled="loadingList || !etfOptions.length">
            <option v-for="item in etfOptions" :key="item.etf_code" :value="item.etf_code">
              {{ item.etf_code }} {{ item.etf_name }}
            </option>
          </select>
        </label>
        <label class="date-picker-control">
          <span>日期</span>
          <el-date-picker v-model="snapshotDate" class="dashboard-date-picker" type="date" value-format="YYYY-MM-DD" placeholder="最新日期" clearable popper-class="dashboard-date-popper" :disabled-date="isDateDisabled" />
        </label>
        <button class="refresh-button" type="button" :disabled="loadingData" @click="loadFirstBuyRows">
          <RefreshCw :size="16" />
        </button>
      </div>
    </section>

    <section class="console-panel">
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>
      <div class="summary-line">
        <div>
          <strong>{{ selectedEtf?.etf_name || '-' }}</strong>
          <span>{{ selectedEtf?.source_company || selectedEtf?.source_provider || '-' }}</span>
        </div>
        <div>
          <span>事件日期</span>
          <strong>{{ latestSnapshotDate }}</strong>
        </div>
      </div>
      <div class="metric-strip">
        <div class="metric-box">
          <span>首次買入筆數</span>
          <strong>{{ rows.length }}</strong>
        </div>
        <div class="metric-box">
          <span>合計買入{{ dashboardSettingStore.shareUnit === 'lot' ? '張' : '股' }}數</span>
          <strong>{{ formatShare(totalShares, dashboardSettingStore.shareUnit) }}</strong>
        </div>
        <div class="metric-box">
          <span>資料類型</span>
          <strong>主動 ETF</strong>
        </div>
      </div>

      <TwoTable :data="rows" :columns="columns" :loading="loadingData || loadingDates">
        <template #stock="{ row }">
          <div class="stock-cell">
            <strong>{{ row.stock_name || '-' }}</strong>
            <span>{{ row.stock_code || '-' }}</span>
          </div>
        </template>
        <template #buy_shares="{ row }">
          <span class="value-up">{{ formatShare(row.delta_shares, dashboardSettingStore.shareUnit) }}</span>
        </template>
        <template #event>
          <span class="value-up">首次買入</span>
        </template>
        <template #empty>{{ loadingData ? '資料讀取中' : '目前沒有首次買入資料' }}</template>
      </TwoTable>
    </section>
  </div>
</template>

<style scoped>
.etf-console { display: flex; flex-direction: column; gap: 16px; color: #cbd5e1; }
.console-bar, .console-panel { border: 1px solid #2f3339; border-radius: 6px; background: #1b1d21; }
.console-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; }
.breadcrumb { color: #7c858f; font-size: 12px; font-weight: 900; }
h1 { margin: 4px 0 0; color: #f7fafc; font-size: 22px; font-weight: 900; }
.console-tools { display: flex; align-items: end; gap: 10px; }
.field, .date-picker-control { display: grid; gap: 6px; color: #94a3b8; font-size: 12px; font-weight: 900; }
.field select, .date-picker-control :deep(.el-date-editor) { height: 36px; min-width: 170px; }
.refresh-button { display: inline-flex; width: 36px; height: 36px; align-items: center; justify-content: center; border: 1px solid #30343a; border-radius: 6px; background: #111317; color: #d4d8dd; }
.refresh-button:disabled { opacity: 0.5; }
.console-panel { padding: 16px; }
.summary-line { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; color: #94a3b8; font-size: 13px; }
.summary-line > div { display: flex; align-items: center; gap: 10px; }
.summary-line strong { color: #e2e8f0; }
.metric-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
.metric-box { border: 1px solid #2f3339; border-radius: 4px; background: #181b1f; padding: 12px; }
.metric-box span { display: block; color: #7c8794; font-size: 12px; font-weight: 900; }
.metric-box strong { display: block; margin-top: 7px; color: #f7fafc; font-size: 15px; font-weight: 900; }
.stock-cell { display: grid; gap: 2px; }
.stock-cell strong { color: #f7fafc; }
.stock-cell span { color: #7c858f; font-size: 12px; }
.value-up { color: var(--stock-rise-color); font-weight: 900; }
.error-banner { margin-bottom: 12px; padding: 10px 12px; border: 1px solid #7f1d1d; border-radius: 4px; background: #2a1717; color: #fecaca; font-size: 13px; font-weight: 800; }
@media (max-width: 900px) {
  .console-bar, .summary-line, .console-tools { align-items: stretch; flex-direction: column; }
  .field select, .refresh-button, .date-picker-control :deep(.el-date-editor) { width: 100%; }
  .metric-strip { grid-template-columns: 1fr; }
}
</style>

<route>
{
  name: "Dashboard_Etf_FirstBuy",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
