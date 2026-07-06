<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { RefreshCw } from 'lucide-vue-next'
import { getEtfEventsIndustryStocks } from '@/api/etf.js'
import {
  etfEventSortOptions,
  etfEventTypeOptions,
  etfTypeOptions
} from '@/data/dashboardDataMapping.js'
import EtfEventsStockOverviewCard from '@/components/dashboard/EtfEventsStockOverviewCard.vue'
import EtfOverviewCardSkeleton from '@/components/dashboard/EtfOverviewCardSkeleton.vue'
import {
  createDashboardCacheKey,
  useDashboardDataCacheStore
} from '@/stores/useDashboardDataCache.js'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { formatDecimalRatio, normalizeArray } from '@/utils/etfDashboard.js'
import { getIndustryName, normalizeIndustryCode } from '@/utils/industry.js'
import { getStockCode } from '@/utils/stock.js'

const route = useRoute()
const dashboardSettingStore = useDashboardSettingStore()
const dashboardDataCacheStore = useDashboardDataCacheStore()

const industryCode = computed(() => normalizeIndustryCode(route.params.industryCode))
const industryName = computed(() => getIndustryName(industryCode.value, '未分類產業'))
const selectedDate = ref(String(route.query.date || ''))
const selectedType = ref(String(route.query.type || 'all'))
const selectedEtfType = ref(String(route.query.etfType || ''))
const selectedSort = ref(String(route.query.sort || 'estimated_amount'))
const page = ref(1)
const pageSize = ref(50)
const limitPerStock = ref(50)
const items = ref([])
const totalCount = ref(0)
const amountCoverage = ref({})
const hasMore = ref(false)
const nextPage = ref(null)
const loadingData = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')

const skeletonCards = computed(() => Array.from({ length: 8 }))
const selectedEtfTypeLabel = computed(
  () => etfTypeOptions.find((option) => option.value === selectedEtfType.value)?.label || '全部 ETF'
)
const selectedSortLabel = computed(
  () =>
    etfEventSortOptions.find((option) => option.value === selectedSort.value)?.label || '估算交易額'
)
const coverageText = computed(() =>
  amountCoverage.value.coverageRate !== undefined
    ? formatDecimalRatio(amountCoverage.value.coverageRate)
    : '-'
)

const applyResponse = (response, { append = false } = {}) => {
  const nextItems = normalizeArray(response?.items)
  items.value = append ? [...items.value, ...nextItems] : nextItems
  selectedDate.value = response?.date || selectedDate.value
  totalCount.value = Number(response?.totalCount || 0)
  amountCoverage.value = response?.amountCoverage || {}
  hasMore.value = Boolean(response?.hasMore)
  nextPage.value = response?.nextPage ?? null
  page.value = Number(response?.page || page.value)
  pageSize.value = Number(response?.pageSize || pageSize.value)
  limitPerStock.value = Number(response?.limitPerStock || limitPerStock.value)
}

const loadData = async ({ append = false, force = false } = {}) => {
  if (!industryCode.value) return
  const requestParams = {
    industryCode: industryCode.value,
    date: selectedDate.value || null,
    type: selectedType.value,
    etfType: selectedEtfType.value || null,
    sort: selectedSort.value,
    page: append ? page.value : 1,
    pageSize: pageSize.value,
    limitPerStock: limitPerStock.value
  }
  const cacheKey = createDashboardCacheKey('etfEventsIndustryStocks', requestParams)
  const cached = force ? null : dashboardDataCacheStore.getFresh(cacheKey)

  if (cached) {
    errorMessage.value = ''
    if (!append) page.value = 1
    applyResponse(cached, { append })
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
      () => getEtfEventsIndustryStocks(requestParams),
      { force }
    )
    applyResponse(response, { append })
  } catch (error) {
    errorMessage.value = error?.message || '載入產業明細失敗'
    if (!append) items.value = []
    hasMore.value = false
    nextPage.value = null
  } finally {
    loadingData.value = false
    loadingMore.value = false
  }
}

const reload = () => loadData({ force: true })

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return
  page.value = Number(nextPage.value || page.value + 1)
  await loadData({ append: true })
}

watch([industryCode, selectedType, selectedEtfType, selectedSort], () => {
  loadData()
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="etf-console">
    <section class="console-bar detail-bar">
      <div>
        <div class="breadcrumb">ETF / 產業別進出總覽 / 明細</div>
        <h1>{{ industryName }}</h1>
        <p>顯示此產業在指定日期與條件下，所有 ETF 異動個股的買進、賣出與估算交易額。</p>
      </div>

      <div class="console-tools">
        <label class="field">
          <span>事件類型</span>
          <el-select v-model="selectedType" class="dashboard-select">
            <el-option
              v-for="item in etfEventTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </label>

        <label class="field">
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

        <label class="field">
          <span>排序</span>
          <el-select v-model="selectedSort" class="dashboard-select">
            <el-option
              v-for="item in etfEventSortOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
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
          <strong>{{ selectedDate || '最新資料日期' }}</strong>
          <span>{{ selectedEtfTypeLabel }} / {{ selectedSortLabel }}</span>
        </div>
        <div>
          <span>個股 / 估算覆蓋</span>
          <strong>{{ totalCount }} / {{ coverageText }}</strong>
        </div>
      </div>

      <div class="stock-card-grid">
        <template v-if="loadingData && !items.length">
          <EtfOverviewCardSkeleton
            v-for="(_, index) in skeletonCards"
            :key="`industry-stock-skeleton-${index}`"
            :rows="5"
          />
        </template>

        <EtfEventsStockOverviewCard
          v-for="stock in items"
          :key="`${getStockCode(stock.stock)}-${selectedDate}`"
          :stock="stock"
          :share-unit="dashboardSettingStore.shareUnit"
        />
      </div>

      <div v-if="!items.length && !loadingData" class="empty-state">
        目前沒有符合條件的產業個股資料
      </div>

      <div class="footer-actions" v-if="hasMore">
        <button class="load-more-button" type="button" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? '載入中' : '載入更多個股' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.detail-bar {
  align-items: end;
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

@media (max-width: 680px) {
  .stock-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<route>
{
  name: "Dashboard_Etf_Events_Industry_Detail",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
