<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { getIndustryChain, getIndustryChains, getIndustryChainStocks } from '@/api/industryChain.js'
import IndustryChainFlowMap from '@/components/dashboard/IndustryChainFlowMap.vue'
import IndustryChainStockList from '@/components/dashboard/IndustryChainStockList.vue'
import {
  createDashboardCacheKey,
  useDashboardDataCacheStore
} from '@/stores/useDashboardDataCache.js'
import {
  flattenIndustryChainTree,
  hasIndustryChainStocks,
  normalizeIndustryChainNode,
  normalizeIndustryChainTree
} from '@/utils/industryChain.js'
import { normalizeArray } from '@/utils/etfDashboard.js'

const dashboardDataCacheStore = useDashboardDataCacheStore()
const loadingTree = ref(false)
const loadingRootDetail = ref(false)
const loadingStocks = ref(false)
const loadingMore = ref(false)
const rootCode = ref('')
const selectedCode = ref('')
const selectedNodeDetail = ref(null)
const rootNodeDetail = ref(null)
const rootFlow = ref(null)
const scope = ref('all')
const market = ref('')
const includeChildren = ref(true)
const page = ref(1)
const pageSize = ref(50)
const totalCount = ref(0)
const hasMore = ref(false)
const nextPage = ref(null)
const treeItems = ref([])
const stockItems = ref([])
const errorMessage = ref('')
const stockErrorMessage = ref('')

const marketOptions = [
  { label: '全部市場', value: '' },
  { label: '上市', value: 'listed' },
  { label: '上櫃', value: 'otc' },
  { label: '興櫃', value: 'emerging' }
]

const flattenedNodes = computed(() => flattenIndustryChainTree(treeItems.value))
const rootOptions = computed(() => flattenedNodes.value.filter((node) => !node.parent_code))
const selectedNodeFromTree = computed(
  () => flattenedNodes.value.find((node) => String(node.code) === selectedCode.value) || null
)
const selectedNode = computed(() => selectedNodeDetail.value || selectedNodeFromTree.value)
const selectedNodeCount = computed(() =>
  Number(selectedNode.value?.stock_count || totalCount.value || 0)
)

const applyTreeResponse = (response) => {
  treeItems.value = normalizeIndustryChainTree(response)
  if (!rootCode.value) {
    const firstRoot = rootOptions.value.find(hasIndustryChainStocks)
    rootCode.value = firstRoot?.code || ''
  }
  if (!selectedCode.value) {
    selectedCode.value = rootCode.value
  }
}

const findNodeByCode = (code) =>
  flattenedNodes.value.find((node) => String(node.code) === String(code))

const findRootCode = (code) => {
  const node = findNodeByCode(code)
  if (!node) return rootCode.value || code
  if (!node.parent_code) return node.code

  let current = node
  while (current?.parent_code) {
    current = findNodeByCode(current.parent_code)
  }

  return current?.code || rootCode.value || code
}

const applyStocksResponse = (response, { append = false } = {}) => {
  const nextItems = normalizeArray(response?.items)
  stockItems.value = append ? [...stockItems.value, ...nextItems] : nextItems
  totalCount.value = Number(response?.totalCount || 0)
  hasMore.value = Boolean(response?.hasMore)
  nextPage.value = response?.nextPage ?? null
  page.value = Number(response?.page || page.value)
  pageSize.value = Number(response?.pageSize || pageSize.value)
}

const loadTree = async ({ force = false } = {}) => {
  const requestParams = {
    scope: scope.value,
    includeCounts: true
  }
  const cacheKey = createDashboardCacheKey('industryChains', requestParams)
  const cached = force ? null : dashboardDataCacheStore.getFresh(cacheKey)

  if (cached) {
    errorMessage.value = ''
    applyTreeResponse(cached)
    return
  }

  loadingTree.value = true
  errorMessage.value = ''

  try {
    const response = await dashboardDataCacheStore.remember(
      cacheKey,
      () => getIndustryChains(requestParams),
      { force }
    )
    applyTreeResponse(response)
  } catch (error) {
    errorMessage.value = error?.message || '產業鏈資料讀取失敗'
    treeItems.value = []
  } finally {
    loadingTree.value = false
  }
}

const loadSelectedNodeDetail = async ({ force = false } = {}) => {
  if (!selectedCode.value) {
    selectedNodeDetail.value = null
    return
  }

  const requestParams = {
    code: selectedCode.value,
    includeCounts: true
  }
  const cacheKey = createDashboardCacheKey('industryChainDetail', requestParams)
  const cached = force ? null : dashboardDataCacheStore.getFresh(cacheKey)

  if (cached) {
    selectedNodeDetail.value = normalizeIndustryChainNode(cached)
    return
  }

  try {
    const response = await dashboardDataCacheStore.remember(
      cacheKey,
      () => getIndustryChain(requestParams),
      { force }
    )
    selectedNodeDetail.value = normalizeIndustryChainNode(response)
  } catch {
    selectedNodeDetail.value = selectedNodeFromTree.value
  }
}

const loadRootNodeDetail = async ({ force = false } = {}) => {
  if (!rootCode.value) {
    rootNodeDetail.value = null
    rootFlow.value = null
    return
  }

  const requestParams = {
    code: rootCode.value,
    includeCounts: true
  }
  const cacheKey = createDashboardCacheKey('industryChainRootDetail', requestParams)
  const cached = force ? null : dashboardDataCacheStore.getFresh(cacheKey)

  if (cached) {
    rootNodeDetail.value = normalizeIndustryChainNode(cached)
    rootFlow.value = cached?.flow || null
    return
  }

  loadingRootDetail.value = true

  try {
    const response = await dashboardDataCacheStore.remember(
      cacheKey,
      () => getIndustryChain(requestParams),
      { force }
    )
    rootNodeDetail.value = normalizeIndustryChainNode(response)
    rootFlow.value = response?.flow || null
  } catch {
    rootNodeDetail.value = findNodeByCode(rootCode.value)
    rootFlow.value = null
  } finally {
    loadingRootDetail.value = false
  }
}

const loadStocks = async ({ append = false, force = false } = {}) => {
  if (!selectedCode.value) {
    stockItems.value = []
    totalCount.value = 0
    hasMore.value = false
    nextPage.value = null
    return
  }

  const requestParams = {
    code: selectedCode.value,
    includeChildren: includeChildren.value,
    market: market.value || null,
    page: append ? page.value : 1,
    pageSize: pageSize.value
  }
  const cacheKey = createDashboardCacheKey('industryChainStocks', requestParams)
  const cached = force ? null : dashboardDataCacheStore.getFresh(cacheKey)

  if (cached) {
    stockErrorMessage.value = ''
    if (!append) page.value = 1
    applyStocksResponse(cached, { append })
    return
  }

  if (append) {
    loadingMore.value = true
  } else {
    loadingStocks.value = true
    stockErrorMessage.value = ''
    page.value = 1
    stockItems.value = []
  }

  try {
    const response = await dashboardDataCacheStore.remember(
      cacheKey,
      () => getIndustryChainStocks(requestParams),
      { force }
    )
    applyStocksResponse(response, { append })
  } catch (error) {
    stockErrorMessage.value = error?.message || '產業鏈股票讀取失敗'
    if (!append) stockItems.value = []
    hasMore.value = false
    nextPage.value = null
  } finally {
    loadingStocks.value = false
    loadingMore.value = false
  }
}

const reload = async () => {
  await loadTree({ force: true })
  await loadRootNodeDetail({ force: true })
  await loadSelectedNodeDetail({ force: true })
  await loadStocks({ force: true })
}

const loadMoreStocks = async () => {
  if (!hasMore.value || loadingMore.value) return
  page.value = Number(nextPage.value || page.value + 1)
  await loadStocks({ append: true })
}

watch(scope, async () => {
  rootCode.value = ''
  selectedCode.value = ''
  selectedNodeDetail.value = null
  rootNodeDetail.value = null
  rootFlow.value = null
  stockItems.value = []
  await loadTree({ force: true })
})

watch(rootCode, async () => {
  if (rootCode.value && findRootCode(selectedCode.value) !== rootCode.value) {
    selectedCode.value = rootCode.value
  }
  await loadRootNodeDetail()
})

watch(selectedCode, () => {
  const nextRootCode = findRootCode(selectedCode.value)
  if (nextRootCode && nextRootCode !== rootCode.value) {
    rootCode.value = nextRootCode
  }
})

watch([selectedCode, includeChildren, market], async () => {
  await loadSelectedNodeDetail()
  await loadStocks()
})

onMounted(async () => {
  await loadTree()
})
</script>

<template>
  <div class="industry-chain-page etf-console">
    <section class="console-bar industry-chain-hero">
      <div>
        <div class="breadcrumb">資料地圖 / TPEx 產業鏈</div>
        <h1>台股產業鏈地圖</h1>
        <p>探索台灣上市櫃公司的上游、中游、下游供應鏈關係，並從節點切入可觀測股票。</p>
      </div>

      <div class="console-tools">
        <label class="field">
          <span>市場</span>
          <el-select v-model="market" class="dashboard-select">
            <el-option
              v-for="item in marketOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </label>

        <label class="toggle-field">
          <span>包含子節點</span>
          <el-switch v-model="includeChildren" />
        </label>

        <button
          class="refresh-button"
          type="button"
          :disabled="loadingTree || loadingStocks"
          @click="reload"
        >
          <RefreshCw :size="16" />
        </button>
      </div>
    </section>

    <div v-if="errorMessage" class="console-message danger">{{ errorMessage }}</div>

    <section class="industry-picker-panel">
      <div class="industry-picker-copy">
        <span>主產業選擇</span>
        <h2>{{ rootNodeDetail?.name || '選擇產業鏈' }}</h2>
        <p>這裡是本頁最主要的切換入口，選擇後會同步更新河流圖與下方股票清單。</p>
      </div>

      <div class="industry-picker-control">
        <label class="field">
          <span>產業類型</span>
          <el-select
            v-model="rootCode"
            class="dashboard-select industry-root-select"
            :disabled="loadingTree"
            filterable
            placeholder="搜尋或選擇產業"
          >
            <el-option
              v-for="item in rootOptions"
              :key="item.code"
              :label="`${item.name} ${item.code}`"
              :value="item.code"
            />
          </el-select>
        </label>
      </div>
    </section>

    <section class="chain-summary-grid">
      <article class="summary-total">
        <span>總成分股</span>
        <strong>{{
          Number(rootNodeDetail?.stock_count || selectedNodeCount || 0).toLocaleString()
        }}</strong>
      </article>
      <article class="summary-upstream">
        <span>上游</span>
        <strong>{{ rootFlow?.upstream?.length || 0 }}</strong>
      </article>
      <article class="summary-midstream">
        <span>中游</span>
        <strong>{{ rootFlow?.midstream?.length || 0 }}</strong>
      </article>
      <article class="summary-downstream">
        <span>下游</span>
        <strong>{{ rootFlow?.downstream?.length || 0 }}</strong>
      </article>
    </section>

    <IndustryChainFlowMap
      :nodes="treeItems"
      :flow="rootFlow"
      :stocks="stockItems"
      :selected-code="selectedCode"
      :loading="loadingTree || loadingRootDetail"
      @select="selectedCode = String($event.code || '')"
    />

    <div v-if="stockErrorMessage" class="console-message danger">{{ stockErrorMessage }}</div>

    <IndustryChainStockList
      :items="stockItems"
      :loading="loadingStocks"
      :loading-more="loadingMore"
      :has-more="hasMore"
      :total-count="totalCount"
      :selected-node="selectedNode"
      @load-more="loadMoreStocks"
    />
  </div>
</template>

<style scoped>
.industry-chain-page {
  display: grid;
  gap: 18px;
}

.industry-chain-hero {
  background: radial-gradient(circle at 12% 0%, rgb(34 211 238 / 0.13), transparent 28%),
    radial-gradient(circle at 84% 12%, rgb(236 72 153 / 0.08), transparent 30%),
    var(--dashboard-section-bg);
}

.industry-root-select {
  width: min(520px, 100%);
}

.industry-root-select :deep(.el-select__wrapper) {
  min-height: 52px;
  border-radius: 16px;
  padding: 0 16px;
  font-size: 15px;
}

.industry-root-select :deep(.el-select__placeholder),
.industry-root-select :deep(.el-select__selected-item) {
  font-weight: 950;
}

.toggle-field {
  display: grid;
  gap: 8px;
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 12px;
  font-weight: 900;
}

.chain-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.industry-picker-panel {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(280px, 1.1fr);
  gap: 18px;
  align-items: center;
  border: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
  border-radius: 24px;
  background: radial-gradient(circle at 8% 0%, rgb(34 211 238 / 0.12), transparent 32%),
    var(--dashboard-section-bg);
  box-shadow: var(--dashboard-section-shadow);
  padding: clamp(16px, 2vw, 22px);
}

.industry-picker-copy {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.industry-picker-copy span {
  color: var(--dashboard-accent, #67e8f9);
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.08em;
}

.industry-picker-copy h2 {
  margin: 0;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: clamp(22px, 2.4vw, 34px);
  font-weight: 950;
  letter-spacing: -0.04em;
}

.industry-picker-copy p {
  max-width: 560px;
  margin: 0;
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.7;
}

.industry-picker-control {
  display: grid;
  justify-items: end;
  min-width: 0;
}

.chain-summary-grid article {
  display: grid;
  gap: 7px;
  border: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
  border-radius: 18px;
  background: var(--dashboard-section-bg);
  box-shadow: var(--dashboard-section-shadow);
  padding: 16px;
}

.chain-summary-grid span {
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 12px;
  font-weight: 900;
}

.chain-summary-grid strong {
  color: var(--dashboard-text-primary, #f8fbff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: clamp(22px, 3vw, 34px);
  font-weight: 950;
  letter-spacing: -0.04em;
}

.summary-upstream strong {
  color: #60a5fa;
}

.summary-midstream strong {
  color: #f59e0b;
}

.summary-downstream strong {
  color: #fb7185;
}

.console-message {
  border: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
  border-radius: 16px;
  background: var(--dashboard-section-bg);
  padding: 14px 16px;
  color: var(--dashboard-text-secondary, #cbd5e1);
  font-size: 13px;
  font-weight: 900;
}

.console-message.danger {
  border-color: color-mix(in srgb, var(--stock-fall-color) 36%, transparent);
  color: var(--stock-fall-color);
}

@media (max-width: 1100px) {
  .chain-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .industry-picker-panel {
    grid-template-columns: 1fr;
  }

  .industry-picker-control {
    justify-items: stretch;
  }
}

@media (max-width: 760px) {
  .chain-summary-grid {
    grid-template-columns: 1fr;
  }

  .industry-chain-hero :deep(.console-tools) {
    grid-template-columns: 1fr;
  }
}
</style>

<route>
{
  name: "Dashboard_Industry_Chain",
  path: "/dashboard/industry/chain",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
