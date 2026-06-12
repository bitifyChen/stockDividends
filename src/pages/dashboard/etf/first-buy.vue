<script setup>
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { RefreshCw, Search } from 'lucide-vue-next'
import { getEtfFirstBuyEvents, getEtfList } from '@/api/etf.js'
import TwoTable from '@/components/Two/TwoTable.vue'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import {
  formatShare,
  normalizeArray,
  normalizeObject,
  shareColumnLabel
} from '@/utils/etfDashboard.js'

const dashboardSettingStore = useDashboardSettingStore()

const loading = ref(false)
const loadingEtfOptions = ref(false)
const rows = ref([])
const etfOptions = ref([])
const errorMessage = ref('')
const page = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const date = ref('')
const stockCode = ref('')
const etfCode = ref('')

const columns = computed(() => [
  { label: '股票', slot: 'stock', minWidth: '180' },
  { label: 'ETF', slot: 'etf', minWidth: '180' },
  {
    label: shareColumnLabel(dashboardSettingStore.shareUnit, '建倉'),
    slot: 'event_shares',
    minWidth: '130'
  },
  {
    label: shareColumnLabel(dashboardSettingStore.shareUnit, '目前'),
    slot: 'current_shares',
    minWidth: '130'
  },
  {
    label: shareColumnLabel(dashboardSettingStore.shareUnit, '加碼速度') + '/日',
    slot: 'growth_rate',
    minWidth: '130'
  },
  { label: '狀態', slot: 'status', width: '120', align: 'center' },
  { label: '資料日期', prop: 'snapshot_date', width: '130' },
  { label: '詳情', slot: 'actions', width: '96', align: 'center' }
])

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const pageStart = computed(() =>
  totalCount.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1
)
const pageEnd = computed(() => Math.min(totalCount.value, page.value * pageSize.value))
const selectedDateLabel = computed(() =>
  date.value ? dayjs(date.value).format('YYYY/MM/DD') : '全部日期'
)
const selectedEtfLabel = computed(
  () => etfOptions.value.find((item) => item.etf_code === etfCode.value)?.etf_name || '全部 ETF'
)
const uniqueEtfCount = computed(
  () => new Set(rows.value.map((row) => row?.etf_code).filter(Boolean)).size
)
const totalBuyShares = computed(() =>
  rows.value.reduce((total, row) => total + Number(row?.buy_shares || 0), 0)
)
const totalCurrentShares = computed(() =>
  rows.value.reduce(
    (total, row) => total + Number(row?.is_currently_held === false ? 0 : row?.current_shares || 0),
    0
  )
)
const heldCount = computed(
  () => rows.value.filter((row) => row?.is_currently_held !== false).length
)
const soldOutCount = computed(
  () => rows.value.filter((row) => row?.is_currently_held === false).length
)
const growingCount = computed(
  () =>
    rows.value.filter(
      (row) => Number(row?.current_shares || 0) > Number(row?.event_shares ?? row?.buy_shares ?? 0)
    ).length
)

const detailRoute = (row) => ({
  name: 'Dashboard_Etf_Stocks_Detail',
  params: {
    stockCode: String(row?.stock_code || '')
  }
})

const toNumber = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const daysSinceBuy = (row) => {
  const snapshotDate = row?.snapshot_date ? dayjs(row.snapshot_date) : null
  if (!snapshotDate || !snapshotDate.isValid()) return 0
  return Math.max(dayjs().startOf('day').diff(snapshotDate.startOf('day'), 'day'), 1)
}

const growthRate = (row) => {
  const eventShares = toNumber(row?.event_shares ?? row?.buy_shares)
  const currentShares = row?.is_currently_held === false ? 0 : toNumber(row?.current_shares)
  const diffShares = currentShares - eventShares
  const days = daysSinceBuy(row)
  if (!days) return 0
  return diffShares / days
}

const growthState = (row) => {
  const currentShares = row?.is_currently_held === false ? 0 : toNumber(row?.current_shares)
  const eventShares = toNumber(row?.event_shares ?? row?.buy_shares)
  const days = daysSinceBuy(row)
  const diffShares = currentShares - eventShares

  if (row?.is_currently_held === false) {
    return { label: '已退出', className: 'status-exited', type: 'danger' }
  }

  if (diffShares > 0) {
    if (days <= 30) return { label: '快速加碼', className: 'status-growth', type: 'success' }
    if (days <= 90) return { label: '持續加碼', className: 'status-growth', type: 'success' }
    return { label: '長期加碼', className: 'status-growth', type: 'success' }
  }

  if (diffShares === 0) {
    return { label: '建倉持有', className: 'status-hold', type: 'info' }
  }

  if (currentShares > 0) {
    return { label: '減碼持有', className: 'status-trim', type: 'warning' }
  }

  return { label: '已退出', className: 'status-exited', type: 'danger' }
}

const formatSignedShare = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const numberValue = toNumber(value)
  return `${numberValue > 0 ? '+' : ''}${formatShare(numberValue, dashboardSettingStore.shareUnit)}`
}

const formatGrowthPerDay = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const numberValue = toNumber(value)
  const converted = dashboardSettingStore.shareUnit === 'lot' ? numberValue / 1000 : numberValue
  const formatted = converted.toLocaleString(undefined, {
    minimumFractionDigits: converted % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })
  return `${converted > 0 ? '+' : ''}${formatted}`
}

const loadEtfOptions = async () => {
  loadingEtfOptions.value = true
  try {
    const payload = await getEtfList()
    etfOptions.value = normalizeArray(payload)
  } catch (error) {
    etfOptions.value = []
  } finally {
    loadingEtfOptions.value = false
  }
}

const loadRows = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const payload = normalizeObject(
      await getEtfFirstBuyEvents({
        page: page.value,
        pageSize: pageSize.value,
        date: date.value || null,
        stockCode: stockCode.value || null,
        etfCode: etfCode.value || null
      })
    )

    rows.value = normalizeArray(payload.items || payload.data || payload)
    totalCount.value = Number(payload.totalCount || payload.total_count || rows.value.length || 0)
    page.value = Number(payload.page || page.value || 1)
    pageSize.value = Number(payload.pageSize || payload.page_size || pageSize.value)
  } catch (error) {
    errorMessage.value = error?.message || '無法讀取首次買入資料'
    rows.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

const reload = () => {
  loadRows()
}

const submitSearch = () => {
  page.value = 1
  loadRows()
}

const resetFilters = () => {
  date.value = ''
  stockCode.value = ''
  etfCode.value = ''
  page.value = 1
  loadRows()
}

const prevPage = () => {
  if (page.value <= 1 || loading.value) return
  page.value -= 1
  loadRows()
}

const nextPage = () => {
  if (page.value >= totalPages.value || loading.value) return
  page.value += 1
  loadRows()
}

onMounted(async () => {
  await loadEtfOptions()
  await loadRows()
})
</script>

<template>
  <div class="first-buy-page">
    <section class="console-bar">
      <div>
        <div class="breadcrumb">ETF / 首次買入</div>
        <h1>首次買入</h1>
        <p class="subtitle">顯示所有ETF 的首次建倉事件，並直接對照目前持股狀態與加碼速度。</p>
      </div>

      <div class="console-tools">
        <label class="field">
          <span>ETF</span>
          <el-select
            v-model="etfCode"
            class="dashboard-select"
            filterable
            clearable
            :loading="loadingEtfOptions"
            placeholder="全部 ETF"
            @change="submitSearch"
          >
            <el-option label="全部 ETF" value="" />
            <el-option
              v-for="item in etfOptions"
              :key="item.etf_code"
              :label="`${item.etf_code} ${item.etf_name}`"
              :value="item.etf_code"
            />
          </el-select>
        </label>

        <label class="field">
          <span>股票代號</span>
          <input
            v-model.trim="stockCode"
            class="text-input"
            type="text"
            inputmode="numeric"
            placeholder="例如 2330"
            @keydown.enter.prevent="submitSearch"
          />
        </label>

        <label class="date-picker-control">
          <span>資料日期</span>
          <el-date-picker
            v-model="date"
            class="dashboard-date-picker"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="全部日期"
            clearable
            popper-class="dashboard-date-popper"
            @change="submitSearch"
          />
        </label>

        <button class="action-button" type="button" @click="submitSearch">
          <Search :size="16" />
          搜尋
        </button>
        <button class="ghost-button" type="button" @click="resetFilters">重設</button>
        <button class="refresh-button" type="button" :disabled="loading" @click="reload">
          <RefreshCw :size="16" />
        </button>
      </div>
    </section>

    <section class="console-panel">
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <div class="summary-line">
        <div>
          <strong>{{ selectedDateLabel }}</strong>
          <span>{{ selectedEtfLabel }} 的首次買入總覽</span>
        </div>
        <div>
          <span>目前頁面</span>
          <strong>{{ pageStart }} - {{ pageEnd }} / {{ totalCount }}</strong>
        </div>
      </div>

      <div class="metric-strip">
        <div class="metric-box">
          <span>事件筆數</span>
          <strong>{{ totalCount }}</strong>
        </div>
        <div class="metric-box">
          <span>涵蓋 ETF</span>
          <strong>{{ uniqueEtfCount }}</strong>
        </div>
        <div class="metric-box">
          <span>建倉總量</span>
          <strong>{{ formatShare(totalBuyShares, dashboardSettingStore.shareUnit) }}</strong>
        </div>
        <div class="metric-box">
          <span>目前持有量</span>
          <strong>{{ formatShare(totalCurrentShares, dashboardSettingStore.shareUnit) }}</strong>
        </div>
        <div class="metric-box">
          <span>持有中 / 退出</span>
          <strong>{{ heldCount }} / {{ soldOutCount }}</strong>
        </div>
      </div>

      <TwoTable :data="rows" :columns="columns" :loading="loading">
        <template #stock="{ row }">
          <div class="stock-cell">
            <strong>{{ row.stock_name || '-' }}</strong>
            <span>{{ row.stock_code || '-' }}</span>
          </div>
        </template>

        <template #etf="{ row }">
          <div class="etf-cell">
            <strong>{{ row.etf_name || '-' }}</strong>
            <span>{{ row.etf_code || '-' }}</span>
          </div>
        </template>

        <template #event_shares="{ row }">
          <span class="value-neutral">{{
            formatShare(row.event_shares ?? row.buy_shares, dashboardSettingStore.shareUnit)
          }}</span>
        </template>

        <template #current_shares="{ row }">
          <span :class="row.is_currently_held === false ? 'value-down' : ''">
            {{
              row.is_currently_held === false
                ? '0'
                : formatShare(row.current_shares, dashboardSettingStore.shareUnit)
            }}
          </span>
        </template>

        <template #growth_rate="{ row }">
          <span
            :class="
              growthRate(row) > 0
                ? 'value-up'
                : growthRate(row) < 0
                  ? 'value-down'
                  : 'value-neutral'
            "
          >
            {{ formatGrowthPerDay(growthRate(row)) }}
          </span>
        </template>

        <template #status="{ row }">
          <el-tag round effect="dark" :class="`status-tag ${growthState(row).className}`">
            {{ growthState(row).label }}
          </el-tag>
        </template>

        <template #snapshot_date="{ row }">
          <span>{{ row.snapshot_date ? dayjs(row.snapshot_date).format('YYYY/MM/DD') : '-' }}</span>
        </template>

        <template #actions="{ row }">
          <router-link v-if="row.stock_code" class="detail-link" :to="detailRoute(row)"
            >詳情</router-link
          >
          <span v-else class="detail-disabled">-</span>
        </template>

        <template #empty>{{ loading ? '資料載入中' : '目前沒有首次買入資料' }}</template>
      </TwoTable>

      <div class="pagination-bar">
        <span>第 {{ page }} / {{ totalPages }} 頁</span>
        <div>
          <button type="button" :disabled="page <= 1 || loading" @click="prevPage">上一頁</button>
          <button type="button" :disabled="page >= totalPages || loading" @click="nextPage">
            下一頁
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.first-buy-page {
  display: grid;
  gap: 16px;
  max-width: 100%;
  min-width: 0;
  color: #cbd5e1;
}

.console-bar,
.console-panel {
  max-width: 100%;
  min-width: 0;
  border: 1px solid #2f3339;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(18, 22, 28, 0.96), rgba(13, 16, 20, 0.96)), #1b1d21;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
}

.console-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
}

.breadcrumb {
  color: #7c858f;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 6px 0 0;
  color: #f7fafc;
  font-size: 28px;
  font-weight: 900;
}

.subtitle {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.7;
}

.console-tools {
  --filter-control-height: 38px;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  max-width: 100%;
  min-width: 0;
}

.console-tools > * {
  min-width: 0;
}

.field,
.date-picker-control {
  display: grid;
  align-content: end;
  gap: 6px;
  max-width: 100%;
  min-width: 0;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 900;
}

.field :deep(.el-select),
.date-picker-control :deep(.el-date-editor) {
  width: 170px;
  min-width: 170px;
}

.field :deep(.dashboard-select) {
  display: block;
  max-width: 100%;
  height: var(--filter-control-height);
}

.date-picker-control :deep(.el-date-editor) {
  width: 220px;
  min-width: 220px;
}

.field :deep(.el-select .el-input),
.date-picker-control :deep(.el-input) {
  height: var(--filter-control-height);
}

.field :deep(.el-select__wrapper),
.field :deep(.el-select .el-input__wrapper),
.date-picker-control :deep(.el-input__wrapper) {
  box-sizing: border-box;
  height: var(--filter-control-height);
  min-height: var(--filter-control-height);
  border-radius: 10px;
  background: #111317;
  box-shadow: 0 0 0 1px #30343a inset;
}

.field :deep(.el-select__selection),
.field :deep(.el-select__placeholder) {
  min-height: var(--filter-control-height);
  line-height: var(--filter-control-height);
}

.field :deep(.el-select .el-input__inner),
.date-picker-control :deep(.el-input__inner) {
  height: var(--filter-control-height);
  line-height: var(--filter-control-height);
  color: #e2e8f0;
}

.text-input {
  box-sizing: border-box;
  height: var(--filter-control-height);
  min-width: 200px;
  border: 1px solid #30343a;
  border-radius: 10px;
  background: #111317;
  padding: 0 12px;
  color: #e2e8f0;
  line-height: var(--filter-control-height);
  outline: none;
}

.text-input:focus {
  border-color: #10bfae;
  box-shadow: 0 0 0 3px rgb(16 191 174 / 0.14);
}

.refresh-button,
.action-button,
.ghost-button,
.pagination-bar button,
.detail-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #30343a;
  border-radius: 6px;
  background: #111317;
  color: #d4d8dd;
  font-weight: 900;
}

.action-button,
.ghost-button {
  gap: 8px;
  box-sizing: border-box;
  height: var(--filter-control-height);
  padding: 0 14px;
}

.refresh-button {
  box-sizing: border-box;
  width: var(--filter-control-height);
  height: var(--filter-control-height);
}

.refresh-button:disabled,
.pagination-bar button:disabled {
  opacity: 0.5;
}

.console-panel {
  padding: 18px;
}

.summary-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  color: #94a3b8;
  font-size: 13px;
}

.summary-line > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-line strong {
  color: #e2e8f0;
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric-box {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  padding: 14px;
}

.metric-box span {
  display: block;
  color: #7c8794;
  font-size: 12px;
  font-weight: 900;
}

.metric-box strong {
  display: block;
  margin-top: 8px;
  color: #f7fafc;
  font-size: 16px;
  font-weight: 900;
}

.stock-cell,
.etf-cell {
  display: grid;
  gap: 2px;
}

.stock-cell strong,
.etf-cell strong {
  color: #f7fafc;
}

.stock-cell span,
.etf-cell span {
  color: #7c858f;
  font-size: 12px;
}

.value-up {
  color: var(--stock-rise-color);
  font-weight: 900;
}

.value-down {
  color: var(--stock-fall-color);
  font-weight: 900;
}

.value-neutral {
  color: var(--stock-neutral-color);
  font-weight: 900;
}

.detail-link {
  min-height: 30px;
  padding: 0 10px;
  font-size: 12px;
  text-decoration: none;
}

.detail-link:hover {
  border-color: #10bfae;
  color: #10bfae;
}

.detail-disabled {
  color: var(--stock-neutral-color);
}

.status-tag {
  border: 1px solid transparent;
  border-radius: 999px;
  letter-spacing: 0.02em;
  font-weight: 900;
}

.status-tag.status-growth {
  --el-tag-bg-color: rgb(16 191 174 / 0.12);
  --el-tag-border-color: rgb(16 191 174 / 0.34);
  --el-tag-text-color: #8df0e4;
}

.status-tag.status-hold {
  --el-tag-bg-color: rgb(59 130 246 / 0.12);
  --el-tag-border-color: rgb(59 130 246 / 0.32);
  --el-tag-text-color: #9dc6ff;
}

.status-tag.status-trim {
  --el-tag-bg-color: rgb(245 158 11 / 0.12);
  --el-tag-border-color: rgb(245 158 11 / 0.32);
  --el-tag-text-color: #ffd38a;
}

.status-tag.status-exited {
  --el-tag-bg-color: rgb(239 68 68 / 0.12);
  --el-tag-border-color: rgb(239 68 68 / 0.32);
  --el-tag-text-color: #ffb0b0;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  max-width: 100%;
  padding-top: 16px;
  color: #7c858f;
  font-size: 13px;
}

.pagination-bar div {
  display: flex;
  min-width: 0;
  gap: 8px;
}

.pagination-bar button {
  min-height: 34px;
  padding: 0 14px;
}

.error-banner {
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid #7f1d1d;
  border-radius: 10px;
  background: #2a1717;
  color: #fecaca;
  font-size: 13px;
  font-weight: 800;
}

@media (max-width: 1100px) {
  .metric-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .console-bar,
  .summary-line,
  .console-tools,
  .pagination-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .field :deep(.el-select),
  .field :deep(.dashboard-select),
  .field :deep(.el-select__wrapper),
  .field :deep(.el-select .el-input),
  .date-picker-control :deep(.el-date-editor),
  .date-picker-control :deep(.el-input),
  .date-picker-control :deep(.el-input__wrapper),
  .text-input {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .action-button,
  .ghost-button,
  .refresh-button,
  .pagination-bar button {
    width: 100%;
  }

  .pagination-bar div {
    width: 100%;
    flex-direction: column;
  }

  .console-panel {
    padding: 12px;
  }

  .metric-strip {
    grid-template-columns: 1fr;
  }
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
