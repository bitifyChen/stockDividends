<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { RefreshCw } from 'lucide-vue-next'
import { getEtfAvailableDates, getEtfEvents, getEtfHoldings, getEtfList } from '@/api/etf.js'
import TwoTable from '@/components/Two/TwoTable.vue'
import EtfEventsViewSwitcher from '@/components/dashboard/EtfEventsViewSwitcher.vue'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { formatShare, normalizeArray, shareColumnLabel } from '@/utils/etfDashboard.js'

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
  {
    label: shareColumnLabel(dashboardSettingStore.shareUnit, '前次'),
    prop: 'previous_shares',
    formatter: (row) => formatShare(row.previous_shares, dashboardSettingStore.shareUnit)
  },
  {
    label: shareColumnLabel(dashboardSettingStore.shareUnit, '目前'),
    prop: 'current_shares',
    formatter: (row) => formatShare(row.current_shares, dashboardSettingStore.shareUnit)
  },
  { label: `${shareColumnLabel(dashboardSettingStore.shareUnit)}變化`, slot: 'delta' },
  { label: '事件', slot: 'event' },
  { label: '資料日期', prop: 'snapshot_date' },
  { label: '操作', slot: 'actions', width: '96', align: 'center' }
])

const toNumber = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const availableDateSet = computed(() => new Set(availableDates.value))
const selectedEtf = computed(
  () => etfOptions.value.find((item) => item.etf_code === selectedEtfCode.value) || null
)
const latestSnapshotDate = computed(
  () =>
    rows.value.find((row) => row?.snapshot_date)?.snapshot_date || resolvedSnapshotDate.value || '-'
)
const increasedCount = computed(
  () => rows.value.filter((row) => row.is_buy_increase || row.is_first_buy).length
)
const decreasedCount = computed(
  () => rows.value.filter((row) => row.is_sell_decrease || row.is_sell_out).length
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

const isDateDisabled = (date) => {
  if (!selectedEtfCode.value || !availableDates.value.length) return false
  return !availableDateSet.value.has(dayjs(date).format('YYYY-MM-DD'))
}

const hasMovement = (row) =>
  row.is_first_buy ||
  row.is_buy_increase ||
  row.is_sell_decrease ||
  row.is_sell_out ||
  toNumber(row.delta_shares) !== 0

const formatSignedShare = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const numberValue = toNumber(value)
  return `${numberValue > 0 ? '+' : ''}${formatShare(numberValue, dashboardSettingStore.shareUnit)}`
}

const eventLabel = (row) => {
  if (row.is_first_buy) return '首次買入'
  if (row.is_buy_increase) return '加碼'
  if (row.is_sell_out) return '全數賣出'
  if (row.is_sell_decrease) return '減碼'
  return '持有'
}

const eventClass = (row) => {
  if (row.is_first_buy || row.is_buy_increase) return 'value-up'
  if (row.is_sell_decrease || row.is_sell_out) return 'value-down'
  return ''
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
    availableDates.value = Array.isArray(data?.availableDates)
      ? data.availableDates
      : normalizeArray(data)
  } catch (error) {
    availableDates.value = []
    errorMessage.value = error?.message || '讀取可用日期失敗'
  } finally {
    loadingDates.value = false
  }
}

const loadEvents = async () => {
  if (!selectedEtfCode.value) {
    rows.value = []
    return
  }
  loadingData.value = true
  errorMessage.value = ''
  try {
    const eventDate = await resolveLatestSnapshotDate()
    resolvedSnapshotDate.value = eventDate
    const data = await getEtfEvents({
      mode: 'etf',
      etfCode: selectedEtfCode.value,
      date: eventDate || null
    })
    rows.value = normalizeArray(data).filter(hasMovement)
  } catch (error) {
    errorMessage.value = error?.message || '讀取每日進出失敗'
    rows.value = []
  } finally {
    loadingData.value = false
  }
}

watch(selectedEtfCode, async () => {
  switchingEtf.value = true
  snapshotDate.value = ''
  await loadAvailableDates()
  await loadEvents()
  switchingEtf.value = false
})

watch(snapshotDate, () => {
  if (switchingEtf.value) return
  loadEvents()
})

onMounted(async () => {
  await loadEtfList()
})
</script>

<template>
  <div class="etf-console">
    <EtfEventsViewSwitcher active-mode="list" />

    <section class="console-bar">
      <div>
        <div class="breadcrumb">ETF / 每日進出</div>
        <h1>每日進出</h1>
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
        <button class="refresh-button" type="button" :disabled="loadingData" @click="loadEvents">
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
          <span>異動股票</span>
          <strong>{{ rows.length }}</strong>
        </div>
        <div class="metric-box">
          <span>買入 / 加碼</span>
          <strong>{{ increasedCount }}</strong>
        </div>
        <div class="metric-box">
          <span>減碼 / 賣出</span>
          <strong>{{ decreasedCount }}</strong>
        </div>
      </div>
      <TwoTable :data="rows" :columns="columns" :loading="loadingData || loadingDates">
        <template #stock="{ row }">
          <div class="stock-cell">
            <strong>{{ row.stock_name || '-' }}</strong>
            <span>{{ row.stock_code || '-' }}</span>
          </div>
        </template>
        <template #delta="{ row }">
          <span :class="eventClass(row)">{{ formatSignedShare(row.delta_shares) }}</span>
        </template>
        <template #event="{ row }">
          <span :class="eventClass(row)">{{ eventLabel(row) }}</span>
        </template>
        <template #actions="{ row }">
          <router-link v-if="canOpenDetail(row)" class="detail-link" :to="detailRoute(row)"
            >詳情</router-link
          >
          <span v-else class="detail-disabled">-</span>
        </template>
        <template #empty>{{ loadingData ? '資料讀取中' : '目前沒有異動股票' }}</template>
      </TwoTable>
    </section>
  </div>
</template>

<route>
{
  name: "Dashboard_Etf_Events",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
