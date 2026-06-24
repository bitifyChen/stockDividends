<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { RefreshCw } from 'lucide-vue-next'
import { getEtfEventsOverview } from '@/api/etf.js'
import EtfEventsOverviewCard from '@/components/dashboard/EtfEventsOverviewCard.vue'
import EtfEventsViewSwitcher from '@/components/dashboard/EtfEventsViewSwitcher.vue'
import EtfOverviewCardSkeleton from '@/components/dashboard/EtfOverviewCardSkeleton.vue'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { normalizeArray } from '@/utils/etfDashboard.js'

const dashboardSettingStore = useDashboardSettingStore()
const loadingData = ref(false)
const loadingMore = ref(false)
const syncingDate = ref(false)
const selectedDate = ref('')
const selectedType = ref('all')
const page = ref(1)
const pageSize = ref(12)
const limitPerEtf = ref(100)
const items = ref([])
const availableDates = ref([])
const coverage = ref({})
const totalCount = ref(0)
const hasMore = ref(false)
const nextPage = ref(null)
const errorMessage = ref('')

const typeOptions = [
  { label: '全部', value: 'all' },
  { label: '首買', value: 'first_buy' },
  { label: '加碼', value: 'buy_increase' },
  { label: '首賣', value: 'first_sell' },
  { label: '減碼', value: 'sell_decrease' },
  { label: '出清', value: 'sell_out' }
]

const availableDateSet = computed(() => new Set(availableDates.value))
const isDateDisabled = (date) => {
  if (!availableDates.value.length) return dayjs(date).isAfter(dayjs(), 'day')
  return !availableDateSet.value.has(dayjs(date).format('YYYY-MM-DD'))
}

const loadEvents = async ({ append = false } = {}) => {
  if (append) {
    loadingMore.value = true
  } else {
    loadingData.value = true
    errorMessage.value = ''
    page.value = 1
    items.value = []
  }

  try {
    const response = await getEtfEventsOverview({
      date: selectedDate.value || null,
      type: selectedType.value,
      page: page.value,
      pageSize: pageSize.value,
      limitPerEtf: limitPerEtf.value
    })

    const nextItems = normalizeArray(response?.items)
    items.value = append ? [...items.value, ...nextItems] : nextItems
    syncingDate.value = true
    selectedDate.value = response?.date || selectedDate.value
    availableDates.value = normalizeArray(response?.availableDates)
    await nextTick()
    syncingDate.value = false
    coverage.value = response?.coverage || {}
    totalCount.value = Number(response?.totalCount || 0)
    hasMore.value = Boolean(response?.hasMore)
    nextPage.value = response?.nextPage ?? null
    page.value = Number(response?.page || page.value)
    pageSize.value = Number(response?.pageSize || pageSize.value)
    limitPerEtf.value = Number(response?.limitPerEtf || limitPerEtf.value)
  } catch (error) {
    errorMessage.value = error?.message || '載入 ETF 當日進出失敗'
    if (!append) items.value = []
    hasMore.value = false
    nextPage.value = null
  } finally {
    loadingData.value = false
    loadingMore.value = false
  }
}

const reload = async () => {
  await loadEvents()
}

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return
  page.value = Number(nextPage.value || page.value + 1)
  await loadEvents({ append: true })
}

const groupedCards = computed(() =>
  items.value.map((item) => ({
    ...item,
    events: normalizeArray(item.events),
    eventCount: Number(item.eventCount || 0)
  }))
)

const displayedEventCount = computed(() =>
  groupedCards.value.reduce((total, card) => total + card.events.length, 0)
)
const skeletonCards = computed(() => Array.from({ length: Math.min(pageSize.value, 8) }))
const updatedEtfCount = computed(() => Number(coverage.value.updated_etf_count || 0))
const trackedEtfCount = computed(() => Number(coverage.value.tracked_etf_count || 0))
const notUpdatedEtfCount = computed(() => Number(coverage.value.not_updated_etf_count || 0))
const notStartedEtfCount = computed(() => Number(coverage.value.not_started_etf_count || 0))
const failedEtfCount = computed(() => Number(coverage.value.fetch_failed_etf_count || 0))

watch([selectedDate, selectedType], () => {
  if (syncingDate.value) return
  loadEvents()
})

onMounted(() => {
  loadEvents()
})
</script>

<template>
  <div class="etf-console">
    <EtfEventsViewSwitcher active-mode="overview" />

    <section class="console-bar">
      <div>
        <div class="breadcrumb">ETF / 當日進出</div>
        <h1>當日進出</h1>
        <p>
          以單一日期檢視全市場主動 ETF 的進出變化，結果以卡片摘要顯示，明細可再進入原本的詳情頁。
        </p>
      </div>

      <div class="console-tools">
        <label class="field">
          <span>類型</span>
          <select v-model="selectedType">
            <option v-for="item in typeOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </label>

        <label class="date-picker-control">
          <span>資料日</span>
          <el-date-picker
            v-model="selectedDate"
            class="dashboard-date-picker"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="最新可用日期"
            :clearable="false"
            popper-class="dashboard-date-popper"
            :disabled-date="isDateDisabled"
          />
        </label>

        <button class="refresh-button" type="button" :disabled="loadingData" @click="reload">
          <RefreshCw :size="16" />
        </button>
      </div>
    </section>

    <section class="console-panel">
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <div class="summary-line">
        <div>
          <strong>{{ selectedDate || '讀取中' }}</strong>
          <span>全 ETF 當日進出總覽</span>
        </div>
        <div>
          <span>ETF / 異動</span>
          <strong>{{ totalCount }} / {{ displayedEventCount }}</strong>
        </div>
      </div>

      <div class="metric-strip">
        <div class="metric-box">
          <span>已更新 ETF</span>
          <strong>{{ updatedEtfCount }}</strong>
        </div>
        <div class="metric-box">
          <span>追蹤 ETF</span>
          <strong>{{ trackedEtfCount }}</strong>
        </div>
        <div class="metric-box">
          <span>未更新 / 未開始 / 失敗</span>
          <strong
            >{{ notUpdatedEtfCount }} / {{ notStartedEtfCount }} / {{ failedEtfCount }}</strong
          >
        </div>
      </div>

      <div class="card-grid">
        <template v-if="loadingData && !groupedCards.length">
          <EtfOverviewCardSkeleton
            v-for="(_, index) in skeletonCards"
            :key="`event-skeleton-${index}`"
            :rows="6"
          />
        </template>

        <EtfEventsOverviewCard
          v-for="card in groupedCards"
          :key="`${card.etf_code}-${card.display_date}`"
          :group="card"
          :selected-date="selectedDate"
          :selected-type="selectedType"
          :share-unit="dashboardSettingStore.shareUnit"
        />
      </div>

      <div v-if="!groupedCards.length && !loadingData" class="empty-state">
        目前沒有符合條件的進出資料
      </div>

      <div class="footer-actions" v-if="hasMore">
        <button class="load-more-button" type="button" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? '載入中' : '載入更多' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.etf-console {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #cbd5e1;
}

.console-bar,
.console-panel {
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

.breadcrumb {
  color: #7c858f;
  font-size: 12px;
  font-weight: 900;
}

h1 {
  margin: 4px 0 0;
  color: #f7fafc;
  font-size: 22px;
  font-weight: 900;
}

.console-bar p {
  max-width: 68ch;
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.7;
}

.console-tools {
  display: flex;
  align-items: end;
  gap: 10px;
}

.field,
.date-picker-control {
  display: grid;
  gap: 6px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 900;
}

.field select,
.date-picker-control :deep(.el-date-editor) {
  height: 36px;
  min-width: 170px;
}

.refresh-button,
.load-more-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #30343a;
  border-radius: 6px;
  background: #111317;
  color: #d4d8dd;
}

.refresh-button {
  width: 36px;
  height: 36px;
  padding: 0;
}

.refresh-button:disabled,
.load-more-button:disabled {
  opacity: 0.5;
}

.load-more-button {
  min-height: 30px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 900;
  text-decoration: none;
}

.load-more-button:hover {
  border-color: #10bfae;
  color: #10bfae;
}

.console-panel {
  padding: 16px;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.metric-box {
  border: 1px solid #2f3339;
  border-radius: 4px;
  background: #181b1f;
  padding: 12px;
}

.metric-box span {
  display: block;
  color: #7c8794;
  font-size: 12px;
  font-weight: 900;
}

.metric-box strong {
  display: block;
  margin-top: 7px;
  color: #f7fafc;
  font-size: 15px;
  font-weight: 900;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 180px;
  border: 1px dashed #4b5563;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 800;
}

.footer-actions {
  display: flex;
  justify-content: center;
  margin-top: 14px;
}

.error-banner {
  margin-bottom: 12px;
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
  .summary-line,
  .console-tools {
    align-items: stretch;
    flex-direction: column;
  }

  .field select,
  .refresh-button,
  .date-picker-control :deep(.el-date-editor) {
    width: 100%;
  }

  .console-panel {
    padding: 12px;
  }

  .metric-strip {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1500px) {
  .card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1180px) {
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<route>
{
  name: "Dashboard_Etf_Events_Overview",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
