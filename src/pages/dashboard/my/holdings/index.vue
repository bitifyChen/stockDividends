<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  BarChart3,
  CircleDollarSign,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload
} from 'lucide-vue-next'
import DashboardStockTradeDrawer from '@/components/dashboard/DashboardStockTradeDrawer.vue'
import DashboardPortfolioImportDialog from '@/components/dashboard/DashboardPortfolioImportDialog.vue'
import stockName from '@/data/stockName.json'
import { deleteStock } from '@/firebase/stock.js'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { useStockStore } from '@/stores/useStock.js'
import {
  formatFractionalShare,
  formatShare,
  shareColumnLabel,
  toNumber
} from '@/utils/etfDashboard.js'

const router = useRouter()
const stockStore = useStockStore()
const dashboardSettingStore = useDashboardSettingStore()
const loading = computed(() => stockStore.loading)
const searchQuery = ref('')
const selectedBrokerId = ref('all')
const tradeDrawerRef = ref(null)
const importDialogRef = ref(null)

const getStockMethod = (force = false) => stockStore.getData(force)

const allHoldingRows = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()

  return Object.keys(stockStore.stockList)
    .map((id) => {
      const item = stockStore.stockList[id]
      const shares = toNumber(item.buyNum)
      const totalCost = toNumber(item.buyPrice)
      const currentPrice = toNumber(item.price)
      const marketValue = toNumber(item.realHoldingMarketValue) || currentPrice * shares
      const stockRightsMarketValue = toNumber(item.stockRightsMarketValue)
      const estimatedStockShares = toNumber(item.stockDividendRights?.estimatedStockShares)
      const unknownCostShares = toNumber(item.unknownCostShares)
      const knownCostShares = Math.max(0, shares - unknownCostShares)
      const totalReferenceMarketValue = marketValue + stockRightsMarketValue
      const profit = unknownCostShares > 0 ? null : currentPrice ? marketValue - totalCost : 0
      const totalReferenceProfit = profit === null ? null : profit + stockRightsMarketValue
      const profitRate =
        totalReferenceProfit === null || totalCost <= 0
          ? null
          : (totalReferenceProfit / totalCost) * 100
      const lots = Array.isArray(item.data) ? item.data : []

      return {
        id,
        name: item.name,
        shares,
        avgCost: knownCostShares > 0 ? totalCost / knownCostShares : 0,
        totalCost,
        unknownCostShares,
        knownCostShares,
        costCoverageStatus: unknownCostShares > 0 ? 'incomplete' : 'complete',
        currentPrice,
        marketValue,
        estimatedStockShares,
        stockRightsMarketValue,
        totalReferenceMarketValue,
        profit,
        totalReferenceProfit,
        profitRate,
        lots,
        openLots: lots.filter((lot) => !lot.sellDate).length,
        closedLots: lots.filter((lot) => lot.sellDate).length
      }
    })
    .filter(
      (item) => !keyword || item.name?.toLowerCase().includes(keyword) || item.id.includes(keyword)
    )
})

const brokerOptions = computed(() => {
  const names = new Map()
  const sources = Array.isArray(stockStore.orgImportSources) ? stockStore.orgImportSources : []
  sources.forEach((source) => {
    const brokerName = String(source.brokerName || '').trim()
    if (brokerName) names.set(brokerName, brokerName)
  })

  return [
    { value: 'all', label: '全部' },
    ...Array.from(names, ([value, label]) => ({ value, label }))
  ]
})

const brokerHoldingRows = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  const holdingsByStock = new Map()

  const holdings = Array.isArray(stockStore.orgImportHoldings) ? stockStore.orgImportHoldings : []
  holdings
    .filter((snapshot) => snapshot.brokerName === selectedBrokerId.value)
    .forEach((snapshot) => {
      const stockId = String(snapshot.stockId || '')
      if (!stockId) return

      const current = holdingsByStock.get(stockId) || {
        id: stockId,
        shares: 0,
        sourceAsOfDate: null
      }
      current.shares += toNumber(snapshot.observedShares)
      if (
        !current.sourceAsOfDate ||
        String(snapshot.sourceAsOfDate || '') > current.sourceAsOfDate
      ) {
        current.sourceAsOfDate = snapshot.sourceAsOfDate || null
      }
      holdingsByStock.set(stockId, current)
    })

  return Array.from(holdingsByStock.values())
    .filter((item) => item.shares > 0)
    .map((item) => {
      const currentPrice = toNumber(stockStore.orgPriceData[item.id])
      const marketValue = currentPrice * item.shares

      return {
        ...item,
        name: stockName[item.id] || '-',
        avgCost: null,
        totalCost: null,
        unknownCostShares: item.shares,
        knownCostShares: 0,
        costCoverageStatus: 'unknown',
        isBrokerSnapshot: true,
        currentPrice,
        marketValue,
        estimatedStockShares: 0,
        stockRightsMarketValue: 0,
        totalReferenceMarketValue: marketValue,
        totalReferenceProfit: null,
        profit: null,
        profitRate: null,
        lots: [],
        openLots: 0,
        closedLots: 0
      }
    })
    .filter(
      (item) => !keyword || item.name?.toLowerCase().includes(keyword) || item.id.includes(keyword)
    )
})

const holdingRows = computed(() =>
  selectedBrokerId.value === 'all' ? allHoldingRows.value : brokerHoldingRows.value
)

const brokerLatestDate = computed(() =>
  brokerHoldingRows.value
    .map((item) => item.sourceAsOfDate)
    .filter(Boolean)
    .sort()
    .at(-1)
)

const selectedBroker = computed(() =>
  brokerOptions.value.find((option) => option.value === selectedBrokerId.value)
)

watch(
  brokerOptions,
  (options) => {
    if (!options.some((option) => option.value === selectedBrokerId.value)) {
      selectedBrokerId.value = 'all'
    }
  },
  { immediate: true }
)

const portfolioSummary = computed(() =>
  holdingRows.value.reduce(
    (summary, item) => {
      summary.totalCost += item.totalCost
      summary.marketValue += item.marketValue
      summary.stockRightsMarketValue += item.stockRightsMarketValue
      summary.totalReferenceMarketValue += item.totalReferenceMarketValue
      summary.profit += item.profit
      summary.shares += item.shares
      summary.unknownCostShares += item.unknownCostShares
      return summary
    },
    {
      totalCost: 0,
      marketValue: 0,
      stockRightsMarketValue: 0,
      totalReferenceMarketValue: 0,
      profit: 0,
      shares: 0,
      unknownCostShares: 0
    }
  )
)

const formatCurrency = (value) => `$ ${Math.round(toNumber(value)).toLocaleString()}`
const formatPercent = (value) => `${Math.abs(toNumber(value)).toFixed(2)}%`
const formatSignedCurrency = (value) =>
  value === null || value === undefined
    ? '-'
    : `${toNumber(value) >= 0 ? '+' : '-'}${formatCurrency(Math.abs(toNumber(value)))}`
const lotStatus = (lot) => (lot.sellDate ? '已賣出' : '持有中')
const lotProfit = (lot, stockPrice) => {
  const exitPrice = lot.sellDate ? toNumber(lot.sellPrice) : toNumber(stockPrice)
  if (!exitPrice) return 0
  return (exitPrice - toNumber(lot.buyPrice)) * toNumber(lot.buyNum)
}

const openBuyDrawer = (stockId = '') => {
  tradeDrawerRef.value?.open({ type: 'buy', stockId })
}

const openImportDialog = () => {
  importDialogRef.value?.open()
}

const openEditDrawer = (item) => {
  tradeDrawerRef.value?.open({ type: 'edit', item })
}

const openSellDrawer = (item) => {
  tradeDrawerRef.value?.open({ type: 'sell', item })
}

const openDetail = (stockId) => {
  router.push({ name: 'Dashboard_My_Holding_Detail', params: { stockId } })
}

const deleteLot = async (item) => {
  await ElMessageBox.confirm('刪除後無法復原，確認刪除此筆交易？', '刪除交易', {
    confirmButtonText: '刪除',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await deleteStock(item.id)
  ElMessage.success('已刪除交易紀錄')
  getStockMethod(true)
}

onMounted(() => {
  getStockMethod()
})
</script>

<template>
  <div class="my-page">
    <section class="terminal-titlebar">
      <div>
        <div class="terminal-kicker">MY PORTFOLIO</div>
        <h1>持股管理</h1>
        <p>集中管理買進、加碼、賣出與批次紀錄，並保留前台原本的交易流程。</p>
      </div>

      <div class="titlebar-actions">
        <label class="terminal-search">
          <Search :size="16" />
          <input v-model="searchQuery" type="search" placeholder="搜尋股票代號或名稱" />
        </label>
        <button class="action-button" type="button" @click="openBuyDrawer()">
          <Plus :size="16" />
          新增買進
        </button>
        <button
          class="action-button secondary-action"
          type="button"
          :disabled="loading"
          @click="openImportDialog"
        >
          <Upload :size="16" />
          自動匯入
        </button>
        <button class="icon-button" type="button" :disabled="loading" @click="getStockMethod(true)">
          <RefreshCw :size="16" />
        </button>
      </div>
    </section>

    <section class="market-strip">
      <article class="ticker-card">
        <span>總持有{{ shareColumnLabel(dashboardSettingStore.shareUnit) }}</span>
        <strong>{{ formatShare(portfolioSummary.shares, dashboardSettingStore.shareUnit) }}</strong>
      </article>
      <article class="ticker-card">
        <span>投入成本</span>
        <strong>{{
          selectedBrokerId === 'all' ? formatCurrency(portfolioSummary.totalCost) : '未提供'
        }}</strong>
      </article>
      <article class="ticker-card">
        <span>真實持股市值</span>
        <strong>{{ formatCurrency(portfolioSummary.marketValue) }}</strong>
      </article>
      <article class="ticker-card">
        <span>股票權益參考市值</span>
        <strong>{{
          selectedBrokerId === 'all'
            ? formatCurrency(portfolioSummary.stockRightsMarketValue)
            : '未計算'
        }}</strong>
      </article>
      <article class="ticker-card">
        <span>總參考市值</span>
        <strong>{{ formatCurrency(portfolioSummary.totalReferenceMarketValue) }}</strong>
      </article>
    </section>

    <section class="terminal-panel" v-loading="loading">
      <div class="panel-head">
        <div>
          <h2>目前持股</h2>
          <span v-if="selectedBrokerId === 'all'">
            {{ holdingRows.length }} 檔股票 · 股票權益不計入可賣股數
          </span>
          <span v-else>
            {{ selectedBroker?.label || '券商' }} · {{ holdingRows.length }} 檔股票 · 資料日
            {{ brokerLatestDate || '未知' }}
          </span>
        </div>
        <el-select
          v-model="selectedBrokerId"
          class="broker-select"
          aria-label="持股來源"
          placeholder="選擇持股來源"
        >
          <el-option
            v-for="option in brokerOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>

      <el-table :data="holdingRows" style="width: 100%" class="terminal-el-table" row-key="id">
        <el-table-column v-if="selectedBrokerId === 'all'" type="expand">
          <template #default="{ row }">
            <div class="lot-panel">
              <div class="lot-panel-head">
                <strong>{{ row.id }} {{ row.name }}</strong>
                <button class="mini-action" type="button" @click="openBuyDrawer(row.id)">
                  <Plus :size="14" />
                  加碼
                </button>
              </div>

              <el-table :data="row.lots" class="lot-table" size="small">
                <el-table-column label="狀態" width="92">
                  <template #default="{ row: lot }">
                    <el-tag :type="lot.sellDate ? 'info' : 'success'" round effect="plain">
                      {{ lotStatus(lot) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="買進日期" prop="buyDate" width="120" />
                <el-table-column label="買進價" align="right" width="110">
                  <template #default="{ row: lot }">
                    {{ toNumber(lot.buyPrice).toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column
                  :label="shareColumnLabel(dashboardSettingStore.shareUnit, '買進')"
                  align="right"
                  width="130"
                >
                  <template #default="{ row: lot }">
                    {{ formatShare(lot.buyNum, dashboardSettingStore.shareUnit) }}
                  </template>
                </el-table-column>
                <el-table-column label="賣出資訊" min-width="160">
                  <template #default="{ row: lot }">
                    <span v-if="lot.sellDate">
                      {{ lot.sellDate }} / {{ toNumber(lot.sellPrice).toLocaleString() }}
                    </span>
                    <span v-else class="muted-text">尚未賣出</span>
                  </template>
                </el-table-column>
                <el-table-column label="損益" align="right" width="130">
                  <template #default="{ row: lot }">
                    <strong
                      :class="lotProfit(lot, row.currentPrice) >= 0 ? 'value-up' : 'value-down'"
                    >
                      {{ formatSignedCurrency(lotProfit(lot, row.currentPrice)) }}
                    </strong>
                  </template>
                </el-table-column>
                <el-table-column label="操作" align="right" width="230">
                  <template #default="{ row: lot }">
                    <div class="row-actions">
                      <button class="table-action" type="button" @click="openEditDrawer(lot)">
                        <Pencil :size="14" />
                        編輯
                      </button>
                      <button
                        v-if="!lot.sellDate"
                        class="table-action"
                        type="button"
                        @click="openSellDrawer(lot)"
                      >
                        <CircleDollarSign :size="14" />
                        賣出
                      </button>
                      <button class="table-action danger" type="button" @click="deleteLot(lot)">
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="股票" min-width="180">
          <template #default="{ row }">
            <div class="stock-cell">
              <strong>{{ row.name }}</strong>
              <span>{{ row.id }}</span>
              <el-tag
                v-if="row.unknownCostShares > 0"
                type="warning"
                size="small"
                round
                effect="plain"
              >
                成本待補 {{ formatShare(row.unknownCostShares, dashboardSettingStore.shareUnit) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="shareColumnLabel(dashboardSettingStore.shareUnit, '持有')"
          align="right"
          width="120"
        >
          <template #default="{ row }">
            {{ formatShare(row.shares, dashboardSettingStore.shareUnit) }}
          </template>
        </el-table-column>
        <el-table-column label="平均成本" align="right" width="120">
          <template #default="{ row }">
            <span v-if="row.isBrokerSnapshot" class="muted-text">未提供</span>
            <span v-else>$ {{ row.avgCost.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="現價" align="right" width="120">
          <template #default="{ row }">$ {{ row.currentPrice?.toLocaleString() || '-' }}</template>
        </el-table-column>
        <el-table-column label="真實持股市值" align="right" min-width="140">
          <template #default="{ row }">{{ formatCurrency(row.marketValue) }}</template>
        </el-table-column>
        <el-table-column label="預估獲配" align="right" min-width="130">
          <template #default="{ row }">
            <span v-if="row.estimatedStockShares > 0">
              {{ formatFractionalShare(row.estimatedStockShares, dashboardSettingStore.shareUnit) }}
              {{ dashboardSettingStore.shareUnit === 'lot' ? '張' : '股' }}
            </span>
            <span v-else class="muted-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="股票權益" align="right" min-width="140">
          <template #default="{ row }">
            {{ row.stockRightsMarketValue > 0 ? formatCurrency(row.stockRightsMarketValue) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="總參考市值" align="right" min-width="150">
          <template #default="{ row }">{{
            formatCurrency(row.totalReferenceMarketValue)
          }}</template>
        </el-table-column>
        <el-table-column
          label="總參考損益 / 報酬率"
          align="right"
          min-width="180"
          sortable
          prop="totalReferenceProfit"
        >
          <template #default="{ row }">
            <div class="profit-cell">
              <template v-if="row.costCoverageStatus === 'complete'">
                <strong :class="row.totalReferenceProfit >= 0 ? 'value-up' : 'value-down'">
                  {{ formatSignedCurrency(row.totalReferenceProfit) }}
                </strong>
                <span :class="row.profitRate >= 0 ? 'value-up' : 'value-down'">
                  <TrendingUp v-if="row.profitRate >= 0" :size="12" />
                  <TrendingDown v-else :size="12" />
                  {{ formatPercent(row.profitRate) }}
                </span>
              </template>
              <el-tag v-else type="warning" size="small" round effect="plain">
                {{ row.isBrokerSnapshot ? '成本未知' : '成本待補' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="批次" align="center" width="110">
          <template #default="{ row }">
            <span v-if="row.isBrokerSnapshot" class="muted-text">來源快照</span>
            <span v-else class="muted-text"
              >{{ row.openLots }} 持有 / {{ row.closedLots }} 已賣</span
            >
          </template>
        </el-table-column>
        <el-table-column label="操作" align="right" width="180">
          <template #default="{ row }">
            <div class="row-actions">
              <button class="table-action" type="button" @click="openDetail(row.id)">
                <BarChart3 :size="14" />
                詳情
              </button>
              <button class="table-action" type="button" @click="openBuyDrawer(row.id)">
                <Plus :size="14" />
                加碼
              </button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="terminal-empty">
            {{ selectedBrokerId === 'all' ? '目前沒有持股資料' : '此券商目前沒有可用持股快照' }}
          </div>
        </template>
      </el-table>
    </section>

    <DashboardStockTradeDrawer ref="tradeDrawerRef" @finish="getStockMethod(true)" />
    <DashboardPortfolioImportDialog ref="importDialogRef" @finish="getStockMethod(true)" />
  </div>
</template>

<style scoped lang="scss">
.my-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.terminal-titlebar,
.terminal-panel,
.ticker-card {
  border: 1px solid var(--main-border-color);
  border-radius: 18px;
  background: var(--dashboard-section-bg);
  box-shadow: var(--dashboard-section-shadow);
  backdrop-filter: blur(18px) saturate(145%);
  -webkit-backdrop-filter: blur(18px) saturate(145%);
}

.terminal-titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.terminal-kicker {
  color: var(--dashboard-text-muted, #7c858f);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

h1,
h2 {
  margin: 0;
  color: var(--dashboard-text-primary, #f7fafc);
}

h1 {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 900;
}

h2 {
  font-size: 16px;
  font-weight: 900;
}

.terminal-titlebar p {
  margin: 8px 0 0;
  color: var(--dashboard-text-muted, #94a3b8);
  font-size: 13px;
}

.titlebar-actions {
  display: flex;
  min-width: 0;
  flex: 0 1 auto;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
}

.terminal-titlebar > :first-child {
  min-width: 0;
}

.terminal-search {
  display: flex;
  width: min(320px, 100%);
  height: 38px;
  align-items: center;
  gap: 9px;
  border: 1px solid var(--dashboard-control-border, #30343a);
  border-radius: 10px;
  background: var(--dashboard-control-bg, #111317);
  padding: 0 12px;
  color: var(--dashboard-text-muted, #7c858f);
}

.terminal-search input {
  min-width: 0;
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--dashboard-text-primary, #d4d8dd);
  font-size: 13px;
  outline: none;
}

.action-button,
.icon-button,
.mini-action,
.table-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--dashboard-control-border, #30343a);
  border-radius: 10px;
  background: var(--dashboard-control-bg, #111317);
  color: var(--dashboard-text-secondary, #d4d8dd);
  font-size: 12px;
  font-weight: 900;
}

.action-button {
  height: 38px;
  padding: 0 12px;
  flex: 0 0 auto;
  white-space: nowrap;
}

.icon-button {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  white-space: nowrap;
}

.icon-button:disabled {
  opacity: 0.5;
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.market-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.ticker-card {
  padding: 14px;
}

.ticker-card span {
  color: var(--dashboard-text-muted, #94a3b8);
  font-size: 12px;
  font-weight: 900;
}

.ticker-card strong {
  display: block;
  margin-top: 8px;
  color: var(--dashboard-text-primary, #f7fafc);
  font-size: 18px;
  font-weight: 900;
}

.panel-head,
.lot-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-head {
  padding: 15px 16px;
  border-bottom: 1px solid var(--main-border-color);
}

.broker-select {
  width: 180px;
  flex: 0 0 auto;
}

.panel-head span,
.muted-text {
  color: var(--dashboard-text-muted, #94a3b8);
  font-size: 12px;
  font-weight: 800;
}

.stock-cell,
.profit-cell {
  display: grid;
  gap: 3px;
}

.stock-cell strong {
  color: var(--dashboard-text-primary, #f7fafc);
}

.stock-cell span {
  color: var(--dashboard-text-muted, #7c858f);
  font-size: 12px;
}

.profit-cell {
  justify-items: end;
}

.profit-cell span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 900;
}

.row-actions {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.table-action,
.mini-action {
  min-height: 28px;
  padding: 0 8px;
}

.table-action.danger {
  border-color: rgb(248 113 113 / 0.24);
  color: #fca5a5;
}

.lot-panel {
  display: grid;
  gap: 12px;
  padding: 14px 16px;
  background: rgb(34 211 238 / 0.035);
}

.lot-panel-head strong {
  color: var(--dashboard-text-primary, #f7fafc);
}

.terminal-empty {
  padding: 42px 16px;
  color: var(--dashboard-text-muted, #7c858f);
  text-align: center;
  font-size: 13px;
}

.terminal-panel {
  max-width: 100%;
  overflow-x: auto;
}

:deep(.terminal-el-table) {
  min-width: 1460px;

  .el-table__header th {
    font-size: 12px;
    font-weight: 900;
  }
}

:deep(.lot-table) {
  min-width: 820px;
}

.value-up {
  color: var(--stock-rise-color) !important;
}

.value-down {
  color: var(--stock-fall-color) !important;
}

@media (max-width: 1280px) {
  .market-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .terminal-titlebar,
  .titlebar-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .terminal-search,
  .action-button,
  .icon-button {
    width: 100%;
  }

  .panel-head {
    align-items: stretch;
    flex-direction: column;
  }

  .broker-select {
    width: 100%;
  }

  .market-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .market-strip {
    grid-template-columns: 1fr;
  }
}
</style>

<route>
{
  name: "Dashboard_My_Holdings",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
