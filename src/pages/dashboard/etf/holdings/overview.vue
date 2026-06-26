<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { getEtfHoldingsOverview } from '@/api/etf.js'
import EtfHoldingsOverviewCard from '@/components/dashboard/EtfHoldingsOverviewCard.vue'
import EtfHoldingsViewSwitcher from '@/components/dashboard/EtfHoldingsViewSwitcher.vue'
import EtfOverviewCardSkeleton from '@/components/dashboard/EtfOverviewCardSkeleton.vue'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { normalizeArray } from '@/utils/etfDashboard.js'

const dashboardSettingStore = useDashboardSettingStore()
const loadingData = ref(false)
const loadingMore = ref(false)
const syncingDate = ref(false)
const selectedDate = ref('')
const availableDates = ref([])
const page = ref(1)
const pageSize = ref(12)
const limitPerEtf = ref(10)
const groups = ref([])
const coverage = ref({})
const hasMore = ref(false)
const nextPage = ref(null)
const errorMessage = ref('')

const availableDateSet = computed(() => new Set(availableDates.value))
const isDateDisabled = (date) => {
  if (!availableDates.value.length) return dayjs(date).isAfter(dayjs(), 'day')
  return !availableDateSet.value.has(dayjs(date).format('YYYY-MM-DD'))
}

const loadHoldings = async ({ append = false } = {}) => {
  if (append) {
    loadingMore.value = true
  } else {
    loadingData.value = true
    errorMessage.value = ''
    page.value = 1
    groups.value = []
  }

  try {
    const response = await getEtfHoldingsOverview({
      date: selectedDate.value || null,
      page: page.value,
      pageSize: pageSize.value,
      limitPerEtf: limitPerEtf.value
    })

    const nextGroups = normalizeArray(response?.items)
    groups.value = append ? [...groups.value, ...nextGroups] : nextGroups
    syncingDate.value = true
    selectedDate.value = response?.date || selectedDate.value
    availableDates.value = normalizeArray(response?.availableDates)
    await nextTick()
    syncingDate.value = false
    coverage.value = response?.coverage || {}
    hasMore.value = Boolean(response?.hasMore)
    nextPage.value = response?.nextPage ?? null
    page.value = Number(response?.page || page.value)
    pageSize.value = Number(response?.pageSize || pageSize.value)
    limitPerEtf.value = Number(response?.limitPerEtf || limitPerEtf.value)
  } catch (error) {
    errorMessage.value = error?.message || '載入 ETF 前十大持股失敗'
    if (!append) groups.value = []
    hasMore.value = false
    nextPage.value = null
  } finally {
    loadingData.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return
  page.value = Number(nextPage.value || page.value + 1)
  await loadHoldings({ append: true })
}

const normalizedGroups = computed(() =>
  groups.value.map((group) => {
    const holdings = normalizeArray(group.holdings).map((holding, index) => ({
      ...holding,
      holding_rank: holding.source_rank || index + 1
    }))

    return {
      ...group,
      holdings,
      holdingCount: holdings.length,
      topHolding: holdings[0] || null
    }
  })
)

const totalEtfCount = computed(() => groups.value.length)
const skeletonCards = computed(() => Array.from({ length: Math.min(pageSize.value, 8) }))
const totalHoldingCount = computed(() =>
  groups.value.reduce((total, group) => total + normalizeArray(group.holdings).length, 0)
)
const updatedEtfCount = computed(
  () => groups.value.filter((group) => group.status === 'updated').length
)
const notUpdatedEtfCount = computed(
  () => groups.value.filter((group) => group.status === 'not_updated').length
)
const notStartedEtfCount = computed(
  () => groups.value.filter((group) => group.status === 'not_started').length
)
const failedEtfCount = computed(
  () => groups.value.filter((group) => group.status === 'fetch_failed').length
)

watch([selectedDate], () => {
  if (syncingDate.value) return
  loadHoldings()
})

onMounted(() => {
  loadHoldings()
})
</script>

<template>
  <div class="etf-console">
    <EtfHoldingsViewSwitcher active-mode="overview" />

    <section class="console-bar">
      <div>
        <div class="breadcrumb">ETF / 目前持股</div>
        <h1>目前持股</h1>
      </div>

      <label class="date-picker-control">
        <span>資料日期</span>
        <el-date-picker
          v-model="selectedDate"
          class="dashboard-date-picker"
          type="date"
          value-format="YYYY-MM-DD"
          placement="bottom-end"
          placeholder="最新可用日期"
          :clearable="false"
          popper-class="dashboard-date-popper"
          :disabled-date="isDateDisabled"
        />
      </label>
    </section>

    <section class="console-panel">
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>
      <div class="card-grid">
        <template v-if="loadingData && !normalizedGroups.length">
          <EtfOverviewCardSkeleton
            v-for="(_, index) in skeletonCards"
            :key="`holding-skeleton-${index}`"
            :rows="6"
          />
        </template>

        <EtfHoldingsOverviewCard
          v-for="group in normalizedGroups"
          :key="`${group.etf_code}-${group.display_date}`"
          :group="group"
          :selected-date="selectedDate"
          :share-unit="dashboardSettingStore.shareUnit"
        />
      </div>

      <div v-if="!normalizedGroups.length && !loadingData" class="empty-state">
        目前沒有可顯示的前十大持股資料
      </div>

      <div class="footer-actions" v-if="hasMore">
        <button class="load-more-button" type="button" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? '載入中' : '載入更多' }}
        </button>
      </div>
    </section>
  </div>
</template>

<route>
{
  name: "Dashboard_Etf_Holdings_Overview",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
