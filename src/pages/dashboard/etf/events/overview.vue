<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { RefreshCw } from 'lucide-vue-next'
import {
  getEtfEventsIndustryOverview,
  getEtfEventsOverview,
  getEtfEventsStockOverview
} from '@/api/etf.js'
import {
  etfEventSortOptions,
  etfEventTypeOptions,
  etfTypeOptions
} from '@/data/dashboardDataMapping.js'
import EtfEventsEtfOverviewSection from '@/components/dashboard/EtfEventsEtfOverviewSection.vue'
import EtfEventsIndustryOverviewSection from '@/components/dashboard/EtfEventsIndustryOverviewSection.vue'
import EtfEventsStockOverviewSection from '@/components/dashboard/EtfEventsStockOverviewSection.vue'
import EtfEventsViewSwitcher from '@/components/dashboard/EtfEventsViewSwitcher.vue'
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
const stockAmountCoverage = ref({})
const stockHasMore = ref(false)
const stockNextPage = ref(null)
const stockErrorMessage = ref('')
const selectedSort = ref('estimated_amount')
const selectedEtfType = ref('')
const stockOverviewSectionRef = ref(null)
const hasRequestedStockOverview = ref(false)
const pendingStockOverviewRequest = ref(false)
const industryLoadingData = ref(false)
const industryLoadingMore = ref(false)
const industryPage = ref(1)
const industryPageSize = ref(20)
const industryItems = ref([])
const industryTotalCount = ref(0)
const industryAmountCoverage = ref({})
const industryHasMore = ref(false)
const industryNextPage = ref(null)
const industryErrorMessage = ref('')
const industryOverviewSectionRef = ref(null)
const hasRequestedIndustryOverview = ref(false)
let lazyOverviewObserver = null

const typeOptions = etfEventTypeOptions
const sortOptions = etfEventSortOptions

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
  stockAmountCoverage.value = response?.amountCoverage || {}
  stockHasMore.value = Boolean(response?.hasMore)
  stockNextPage.value = response?.nextPage ?? null
  stockPage.value = Number(response?.page || stockPage.value)
  stockPageSize.value = Number(response?.pageSize || stockPageSize.value)
  stockLimitPerStock.value = Number(response?.limitPerStock || stockLimitPerStock.value)
}

const applyIndustryOverviewResponse = (response, { append = false } = {}) => {
  const nextItems = normalizeArray(response?.items)
  industryItems.value = append ? [...industryItems.value, ...nextItems] : nextItems
  industryTotalCount.value = Number(response?.totalCount || 0)
  industryAmountCoverage.value = response?.amountCoverage || {}
  industryHasMore.value = Boolean(response?.hasMore)
  industryNextPage.value = response?.nextPage ?? null
  industryPage.value = Number(response?.page || industryPage.value)
  industryPageSize.value = Number(response?.pageSize || industryPageSize.value)
}

const resetLazyOverviewBlocks = () => {
  hasRequestedIndustryOverview.value = false
  hasRequestedStockOverview.value = false
  pendingStockOverviewRequest.value = false
  industryItems.value = []
  industryTotalCount.value = 0
  industryAmountCoverage.value = {}
  industryHasMore.value = false
  industryNextPage.value = null
  industryErrorMessage.value = ''
  stockItems.value = []
  stockTotalCount.value = 0
  stockAmountCoverage.value = {}
  stockHasMore.value = false
  stockNextPage.value = null
  stockErrorMessage.value = ''
}

const isSectionNearViewport = (element) => {
  if (!element) return false
  const preloadDistance = 360
  const rect = element.getBoundingClientRect()
  return rect.top <= window.innerHeight + preloadDistance && rect.bottom >= -preloadDistance
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
    if (!append) stockAmountCoverage.value = {}
    stockHasMore.value = false
    stockNextPage.value = null
  } finally {
    stockLoadingData.value = false
    stockLoadingMore.value = false
  }
}

const loadIndustryOverview = async ({
  append = false,
  date = selectedDate.value,
  force = false
} = {}) => {
  const requestParams = {
    date: date || null,
    type: selectedType.value,
    etfType: selectedEtfType.value || null,
    sort: selectedSort.value,
    page: append ? industryPage.value : 1,
    pageSize: industryPageSize.value,
    topN: 3
  }
  const cacheKey = createDashboardCacheKey('etfEventsIndustryOverview', requestParams)
  const cached = force ? null : dashboardDataCacheStore.getFresh(cacheKey)

  if (cached) {
    industryErrorMessage.value = ''
    if (!append) industryPage.value = 1
    applyIndustryOverviewResponse(cached, { append })
    return
  }

  if (append) {
    industryLoadingMore.value = true
  } else {
    industryLoadingData.value = true
    industryErrorMessage.value = ''
    industryPage.value = 1
    industryItems.value = []
  }

  try {
    const response = await dashboardDataCacheStore.remember(
      cacheKey,
      () => getEtfEventsIndustryOverview(requestParams),
      { force }
    )

    applyIndustryOverviewResponse(response, { append })
  } catch (error) {
    industryErrorMessage.value = error?.message || '載入產業總覽失敗'
    if (!append) industryItems.value = []
    if (!append) industryAmountCoverage.value = {}
    industryHasMore.value = false
    industryNextPage.value = null
  } finally {
    industryLoadingData.value = false
    industryLoadingMore.value = false
    if (pendingStockOverviewRequest.value && isSectionNearViewport(stockOverviewSectionRef.value)) {
      pendingStockOverviewRequest.value = false
      requestStockOverview()
    }
  }
}

const requestIndustryOverview = ({ force = false } = {}) => {
  if (industryLoadingData.value || (!force && hasRequestedIndustryOverview.value)) return
  hasRequestedIndustryOverview.value = true
  loadIndustryOverview({ force })
}

const requestStockOverview = ({ force = false } = {}) => {
  if (!hasRequestedIndustryOverview.value || industryLoadingData.value) {
    pendingStockOverviewRequest.value = true
    requestIndustryOverview({ force })
    return
  }

  if (stockLoadingData.value || (!force && hasRequestedStockOverview.value)) return
  hasRequestedStockOverview.value = true
  loadStockOverview({ force })
}

const requestLazyOverviewBlocks = () => {
  if (isSectionNearViewport(industryOverviewSectionRef.value)) requestIndustryOverview()
  if (isSectionNearViewport(stockOverviewSectionRef.value)) requestStockOverview()
}

const loadOverview = async ({ force = false } = {}) => {
  await loadEvents({ force })
  await nextTick()
  requestLazyOverviewBlocks()
}

const reload = async () => {
  await loadEvents({ force: true })
  if (hasRequestedIndustryOverview.value) loadIndustryOverview({ force: true })
  if (hasRequestedStockOverview.value) loadStockOverview({ force: true })
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

const loadMoreIndustries = async () => {
  if (!industryHasMore.value || industryLoadingMore.value) return
  industryPage.value = Number(industryNextPage.value || industryPage.value + 1)
  await loadIndustryOverview({ append: true })
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
const industrySkeletonCards = computed(() =>
  Array.from({ length: Math.min(industryPageSize.value, 8) })
)
const shouldShowStockLoading = computed(
  () =>
    (loadingData.value || stockLoadingData.value || pendingStockOverviewRequest.value) &&
    !stockItems.value.length
)
const shouldShowIndustryLoading = computed(
  () => (loadingData.value || industryLoadingData.value) && !industryItems.value.length
)
const updatedEtfCount = computed(() => Number(coverage.value.updated_etf_count || 0))
const trackedEtfCount = computed(() => Number(coverage.value.tracked_etf_count || 0))
const notUpdatedEtfCount = computed(() => Number(coverage.value.not_updated_etf_count || 0))
const notStartedEtfCount = computed(() => Number(coverage.value.not_started_etf_count || 0))
const failedEtfCount = computed(() => Number(coverage.value.fetch_failed_etf_count || 0))
const selectedEtfTypeLabel = computed(
  () => etfTypeOptions.find((option) => option.value === selectedEtfType.value)?.label || '全部 ETF'
)
const selectedIndustrySortLabel = computed(
  () => sortOptions.find((option) => option.value === selectedSort.value)?.label || '估算交易額'
)
const industryDetailQuery = computed(() => ({
  date: selectedDate.value || undefined,
  type: selectedType.value || 'all',
  etfType: selectedEtfType.value || undefined,
  sort: selectedSort.value || 'estimated_amount'
}))

watch([selectedDate, selectedType], () => {
  if (syncingDate.value) return
  resetLazyOverviewBlocks()
  loadOverview()
})

watch([selectedSort, selectedEtfType], () => {
  if (hasRequestedStockOverview.value) loadStockOverview()
  if (hasRequestedIndustryOverview.value) loadIndustryOverview()
})

onMounted(async () => {
  await loadOverview()

  lazyOverviewObserver = new IntersectionObserver(
    () => {
      requestLazyOverviewBlocks()
    },
    {
      rootMargin: '360px 0px 360px 0px',
      threshold: 0
    }
  )

  if (industryOverviewSectionRef.value) {
    lazyOverviewObserver.observe(industryOverviewSectionRef.value)
  }
  if (stockOverviewSectionRef.value) {
    lazyOverviewObserver.observe(stockOverviewSectionRef.value)
  }
})

onBeforeUnmount(() => {
  lazyOverviewObserver?.disconnect()
  lazyOverviewObserver = null
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

    <EtfEventsEtfOverviewSection
      :error-message="errorMessage"
      :selected-date="selectedDate"
      :total-count="totalCount"
      :displayed-event-count="displayedEventCount"
      :updated-etf-count="updatedEtfCount"
      :tracked-etf-count="trackedEtfCount"
      :not-updated-etf-count="notUpdatedEtfCount"
      :not-started-etf-count="notStartedEtfCount"
      :failed-etf-count="failedEtfCount"
      :loading-data="loadingData"
      :loading-more="loadingMore"
      :grouped-cards="groupedCards"
      :skeleton-cards="skeletonCards"
      :has-more="hasMore"
      :selected-type="selectedType"
      :share-unit="dashboardSettingStore.shareUnit"
      @load-more="loadMore"
    >
      <template #after>
        <div ref="industryOverviewSectionRef">
          <EtfEventsIndustryOverviewSection
            v-model:selected-sort="selectedSort"
            :sort-options="sortOptions"
            :error-message="industryErrorMessage"
            :selected-date="selectedDate"
            :total-count="industryTotalCount"
            :selected-etf-type-label="selectedEtfTypeLabel"
            :selected-sort-label="selectedIndustrySortLabel"
            :amount-coverage="industryAmountCoverage"
            :detail-query="industryDetailQuery"
            :loading-data="industryLoadingData"
            :loading-more="industryLoadingMore"
            :items="industryItems"
            :skeleton-cards="industrySkeletonCards"
            :has-more="industryHasMore"
            :share-unit="dashboardSettingStore.shareUnit"
            :show-loading="shouldShowIndustryLoading"
            @load-more="loadMoreIndustries"
          />
        </div>

        <div ref="stockOverviewSectionRef">
          <EtfEventsStockOverviewSection
            v-model:selected-sort="selectedSort"
            v-model:selected-etf-type="selectedEtfType"
            :sort-options="sortOptions"
            :etf-type-options="etfTypeOptions"
            :error-message="stockErrorMessage"
            :selected-date="selectedDate"
            :total-count="stockTotalCount"
            :selected-etf-type-label="selectedEtfTypeLabel"
            :amount-coverage="stockAmountCoverage"
            :loading-more="stockLoadingMore"
            :items="stockItems"
            :skeleton-cards="stockSkeletonCards"
            :has-more="stockHasMore"
            :share-unit="dashboardSettingStore.shareUnit"
            :show-loading="shouldShowStockLoading"
            @load-more="loadMoreStocks"
          />
        </div>
      </template>
    </EtfEventsEtfOverviewSection>
  </div>
</template>

<route>
{
  name: "Dashboard_Etf_Events_Overview",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
