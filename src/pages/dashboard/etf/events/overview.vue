<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { RefreshCw } from 'lucide-vue-next'
import { getEtfEventsOverview, getEtfEventsStockOverview } from '@/api/etf.js'
import {
  etfEventStockSortOptions,
  etfEventTypeOptions,
  etfTypeOptions
} from '@/data/dashboardDataMapping.js'
import EtfEventsOverviewCard from '@/components/dashboard/EtfEventsOverviewCard.vue'
import EtfEventsStockOverviewCard from '@/components/dashboard/EtfEventsStockOverviewCard.vue'
import EtfEventsViewSwitcher from '@/components/dashboard/EtfEventsViewSwitcher.vue'
import EtfOverviewCardSkeleton from '@/components/dashboard/EtfOverviewCardSkeleton.vue'
import {
  createDashboardCacheKey,
  useDashboardDataCacheStore
} from '@/stores/useDashboardDataCache.js'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { normalizeArray } from '@/utils/etfDashboard.js'

const dashboardSettingStore = useDashboardSettingStore()
const dashboardDataCacheStore = useDashboardDataCacheStore()
const loadingData = ref(false)
const loadingMore = ref(false)
const syncingDate = ref(false)
const selectedDate = ref('')
const selectedType = ref('all')
const page = ref(1)
const pageSize = ref(20)
const limitPerEtf = ref(100)
const items = ref([])
const availableDates = ref([])
const coverage = ref({})
const totalCount = ref(0)
const hasMore = ref(false)
const nextPage = ref(null)
const errorMessage = ref('')
const stockLoadingData = ref(false)
const stockLoadingMore = ref(false)
const stockPage = ref(1)
const stockPageSize = ref(12)
const stockLimitPerStock = ref(50)
const stockItems = ref([])
const stockTotalCount = ref(0)
const stockHasMore = ref(false)
const stockNextPage = ref(null)
const stockErrorMessage = ref('')
const selectedSort = ref('net_shares_abs')
const selectedEtfType = ref('')

const typeOptions = etfEventTypeOptions
const sortOptions = etfEventStockSortOptions

const availableDateSet = computed(() => new Set(availableDates.value))
const isDateDisabled = (date) => {
  if (!availableDates.value.length) return dayjs(date).isAfter(dayjs(), 'day')
  return !availableDateSet.value.has(dayjs(date).format('YYYY-MM-DD'))
}

const applyEventsResponse = async (response, { append = false } = {}) => {
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
}

const applyStockOverviewResponse = (response, { append = false } = {}) => {
  const nextItems = normalizeArray(response?.items)
  stockItems.value = append ? [...stockItems.value, ...nextItems] : nextItems
  stockTotalCount.value = Number(response?.totalCount || 0)
  stockHasMore.value = Boolean(response?.hasMore)
  stockNextPage.value = response?.nextPage ?? null
  stockPage.value = Number(response?.page || stockPage.value)
  stockPageSize.value = Number(response?.pageSize || stockPageSize.value)
  stockLimitPerStock.value = Number(response?.limitPerStock || stockLimitPerStock.value)
}

const loadEvents = async ({ append = false, force = false } = {}) => {
  const requestParams = {
    date: selectedDate.value || null,
    type: selectedType.value,
    page: append ? page.value : 1,
    pageSize: pageSize.value,
    limitPerEtf: limitPerEtf.value
  }
  const cacheKey = createDashboardCacheKey('etfEventsOverview', requestParams)
  const cached = force ? null : dashboardDataCacheStore.getFresh(cacheKey)

  if (cached) {
    errorMessage.value = ''
    if (!append) page.value = 1
    await applyEventsResponse(cached, { append })
    return
  }

  if (append) {
    loadingMore.value = true
  } else {
    loadingData.value = true
    errorMessage.value = ''
    page.value = 1
    items.value = []
  }

  try {
    const response = await dashboardDataCacheStore.remember(
      cacheKey,
      () => getEtfEventsOverview(requestParams),
      { force }
    )

    await applyEventsResponse(response, { append })
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

const loadStockOverview = async ({
  append = false,
  date = selectedDate.value,
  force = false
} = {}) => {
  const requestParams = {
    date: date || null,
    type: selectedType.value,
    etfType: selectedEtfType.value || null,
    sort: selectedSort.value,
    page: append ? stockPage.value : 1,
    pageSize: stockPageSize.value,
    limitPerStock: stockLimitPerStock.value
  }
  const cacheKey = createDashboardCacheKey('etfEventsStockOverview', requestParams)
  const cached = force ? null : dashboardDataCacheStore.getFresh(cacheKey)

  if (cached) {
    stockErrorMessage.value = ''
    if (!append) stockPage.value = 1
    applyStockOverviewResponse(cached, { append })
    return
  }

  if (append) {
    stockLoadingMore.value = true
  } else {
    stockLoadingData.value = true
    stockErrorMessage.value = ''
    stockPage.value = 1
    stockItems.value = []
  }

  try {
    const response = await dashboardDataCacheStore.remember(
      cacheKey,
      () => getEtfEventsStockOverview(requestParams),
      { force }
    )

    applyStockOverviewResponse(response, { append })
  } catch (error) {
    stockErrorMessage.value = error?.message || '載入個股彙總失敗'
    if (!append) stockItems.value = []
    stockHasMore.value = false
    stockNextPage.value = null
  } finally {
    stockLoadingData.value = false
    stockLoadingMore.value = false
  }
}

const loadOverview = async ({ force = false } = {}) => {
  await Promise.all([loadEvents({ force }), loadStockOverview({ force })])
}

const reload = async () => {
  await loadOverview({ force: true })
}

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return
  page.value = Number(nextPage.value || page.value + 1)
  await loadEvents({ append: true })
}

const loadMoreStocks = async () => {
  if (!stockHasMore.value || stockLoadingMore.value) return
  stockPage.value = Number(stockNextPage.value || stockPage.value + 1)
  await loadStockOverview({ append: true })
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
const stockSkeletonCards = computed(() => Array.from({ length: Math.min(stockPageSize.value, 8) }))
const updatedEtfCount = computed(() => Number(coverage.value.updated_etf_count || 0))
const trackedEtfCount = computed(() => Number(coverage.value.tracked_etf_count || 0))
const notUpdatedEtfCount = computed(() => Number(coverage.value.not_updated_etf_count || 0))
const notStartedEtfCount = computed(() => Number(coverage.value.not_started_etf_count || 0))
const failedEtfCount = computed(() => Number(coverage.value.fetch_failed_etf_count || 0))
const selectedEtfTypeLabel = computed(
  () => etfTypeOptions.find((option) => option.value === selectedEtfType.value)?.label || '全部 ETF'
)

watch([selectedDate, selectedType], () => {
  if (syncingDate.value) return
  loadOverview()
})

watch([selectedSort, selectedEtfType], () => {
  loadStockOverview()
})

onMounted(() => {
  loadOverview()
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
          <el-select v-model="selectedType" class="dashboard-select">
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </label>

        <label class="date-picker-control">
          <span>資料日期</span>
          <el-date-picker
            v-model="selectedDate"
            class="dashboard-date-picker"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="最新可用日期"
            :clearable="false"
            placement="bottom-end"
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
            variant="events"
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

      <section class="stock-overview-section" aria-labelledby="stock-overview-title">
        <div class="stock-overview-head">
          <div>
            <span>STOCK FLOW</span>
            <h2 id="stock-overview-title">個股總買賣行為</h2>
            <p>以股票為單位彙總同日所有主動 ETF 的買進、賣出與淨變動。</p>
          </div>

          <div class="stock-overview-tools">
            <label class="field compact">
              <span>ETF 類型</span>
              <el-select v-model="selectedEtfType" class="dashboard-select">
                <el-option
                  v-for="item in etfTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </label>

            <label class="field compact">
              <span>排序</span>
              <el-select v-model="selectedSort" class="dashboard-select">
                <el-option
                  v-for="item in sortOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </label>
          </div>
        </div>

        <div v-if="stockErrorMessage" class="error-banner">{{ stockErrorMessage }}</div>

        <div class="stock-summary-line">
          <span>{{ selectedDate || '最新資料日期' }}</span>
          <strong>{{ stockTotalCount }} 檔股票</strong>
          <span>{{ selectedEtfTypeLabel }}</span>
        </div>

        <div class="stock-card-grid">
          <template v-if="stockLoadingData && !stockItems.length">
            <EtfOverviewCardSkeleton
              v-for="(_, index) in stockSkeletonCards"
              :key="`stock-event-skeleton-${index}`"
              :rows="5"
            />
          </template>

          <EtfEventsStockOverviewCard
            v-for="stock in stockItems"
            :key="`${stock.stock_code}-${selectedDate}`"
            :stock="stock"
            :share-unit="dashboardSettingStore.shareUnit"
          />
        </div>

        <div v-if="!stockItems.length && !stockLoadingData" class="empty-state">
          目前沒有符合條件的個股彙總資料
        </div>

        <div class="footer-actions" v-if="stockHasMore">
          <button
            class="load-more-button"
            type="button"
            :disabled="stockLoadingMore"
            @click="loadMoreStocks"
          >
            {{ stockLoadingMore ? '載入中' : '載入更多個股' }}
          </button>
        </div>
      </section>
    </section>
  </div>
</template>

<style scoped>
.stock-overview-section {
  display: grid;
  gap: 14px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
}

.stock-overview-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.stock-overview-head span {
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.stock-overview-head h2 {
  margin: 4px 0 0;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 20px;
  font-weight: 900;
}

.stock-overview-head p {
  max-width: 58ch;
  margin: 7px 0 0;
  color: var(--dashboard-text-muted, #94a3b8);
  font-size: 13px;
  line-height: 1.7;
}

.stock-overview-tools {
  display: flex;
  align-items: end;
  gap: 10px;
}

.stock-summary-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  color: var(--dashboard-text-muted, #94a3b8);
  font-size: 12px;
  font-weight: 900;
}

.stock-summary-line strong {
  color: var(--dashboard-text-primary, #f8fbff);
}

.stock-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 1500px) {
  .stock-card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1180px) {
  .stock-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .stock-overview-head,
  .stock-overview-tools {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 680px) {
  .stock-card-grid {
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
