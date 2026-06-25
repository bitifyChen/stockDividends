<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CalendarDays, Layers3, WalletCards } from 'lucide-vue-next'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { useStockStore } from '@/stores/useStock.js'
import { formatShare, shareColumnLabel, toNumber } from '@/utils/etfDashboard.js'

const route = useRoute()
const router = useRouter()
const stockStore = useStockStore()
const dashboardSettingStore = useDashboardSettingStore()
const stockId = computed(() => String(route.params.stockId || ''))
const stock = computed(() => stockStore.stockList[stockId.value] || null)
const lots = computed(() => (Array.isArray(stock.value?.data) ? stock.value.data : []))
const dividendRows = computed(() =>
  stockStore.dividendList.filter((item) => item.stockId === stockId.value)
)
const loading = computed(() => stockStore.loading)

const totalShares = computed(() => toNumber(stock.value?.buyNum))
const totalCost = computed(() => toNumber(stock.value?.buyPrice))
const marketValue = computed(() => toNumber(stock.value?.price) * totalShares.value)
const avgCost = computed(() => (totalShares.value ? totalCost.value / totalShares.value : 0))
const unrealizedProfit = computed(() => marketValue.value - totalCost.value)
const totalDividend = computed(() =>
  dividendRows.value.reduce(
    (total, item) => total + toNumber(item.earn) * toNumber(item.stockNum),
    0
  )
)
const totalReturn = computed(() => unrealizedProfit.value + totalDividend.value)

const metrics = computed(() => [
  {
    label: shareColumnLabel(dashboardSettingStore.shareUnit, '目前持有'),
    value: formatShare(totalShares.value, dashboardSettingStore.shareUnit),
    icon: Layers3
  },
  {
    label: '平均成本',
    value: `$ ${avgCost.value.toFixed(2)}`,
    icon: WalletCards
  },
  {
    label: '目前市值',
    value: formatCurrency(marketValue.value),
    icon: WalletCards
  },
  {
    label: '累計股利',
    value: formatCurrency(totalDividend.value),
    icon: CalendarDays
  }
])

const formatCurrency = (value) => `$ ${Math.round(toNumber(value)).toLocaleString()}`
const formatSignedCurrency = (value) =>
  `${toNumber(value) >= 0 ? '+' : '-'}${formatCurrency(Math.abs(toNumber(value)))}`
const lotStatus = (lot) => (lot.sellDate ? '已賣出' : '持有中')
const lotProfit = (lot) => {
  const exitPrice = lot.sellDate ? toNumber(lot.sellPrice) : toNumber(stock.value?.price)
  if (!exitPrice) return 0
  return (exitPrice - toNumber(lot.buyPrice)) * toNumber(lot.buyNum)
}

onMounted(() => {
  stockStore.getData()
})
</script>

<template>
  <div class="holding-detail-page" v-loading="loading">
    <section class="detail-header">
      <div class="detail-hero">
        <button
          class="back-button"
          type="button"
          @click="router.push({ name: 'Dashboard_My_Holdings' })"
        >
          <ArrowLeft :size="16" />
          返回持股管理
        </button>

        <div class="stock-title">
          <span>MY HOLDING</span>
          <h1>{{ stockId }} {{ stock?.name || '-' }}</h1>
          <p>整合目前批次、賣出紀錄與歷史股利，作為前台個股詳情的 dashboard 版本。</p>
        </div>

        <div class="return-card">
          <span>總損益</span>
          <strong :class="totalReturn >= 0 ? 'value-up' : 'value-down'">
            {{ formatSignedCurrency(totalReturn) }}
          </strong>
          <small>未實現 {{ formatSignedCurrency(unrealizedProfit) }}</small>
        </div>
      </div>

      <div class="metric-strip">
        <article v-for="item in metrics" :key="item.label" class="metric-box">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </article>
      </div>
    </section>

    <section class="console-panel">
      <div class="panel-heading">
        <div>
          <span>LOTS</span>
          <h2>交易批次</h2>
        </div>
        <strong>{{ lots.length }} 筆</strong>
      </div>

      <el-table :data="lots" class="dashboard-table">
        <el-table-column label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="row.sellDate ? 'info' : 'success'" round effect="plain">
              {{ lotStatus(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="買進日期" prop="buyDate" width="130" />
        <el-table-column label="買進價" align="right" width="120">
          <template #default="{ row }">{{ toNumber(row.buyPrice).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column
          :label="shareColumnLabel(dashboardSettingStore.shareUnit, '買進')"
          align="right"
          width="130"
        >
          <template #default="{ row }">
            {{ formatShare(row.buyNum, dashboardSettingStore.shareUnit) }}
          </template>
        </el-table-column>
        <el-table-column label="賣出日期" width="130">
          <template #default="{ row }">{{ row.sellDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="賣出價" align="right" width="120">
          <template #default="{ row }">
            {{ row.sellPrice ? toNumber(row.sellPrice).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="批次損益" align="right" min-width="140">
          <template #default="{ row }">
            <strong :class="lotProfit(row) >= 0 ? 'value-up' : 'value-down'">
              {{ formatSignedCurrency(lotProfit(row)) }}
            </strong>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="console-panel">
      <div class="panel-heading">
        <div>
          <span>DIVIDENDS</span>
          <h2>股利紀錄</h2>
        </div>
        <strong>{{ dividendRows.length }} 筆</strong>
      </div>

      <el-table :data="dividendRows" class="dashboard-table">
        <el-table-column label="發放日" prop="payDate" width="130" />
        <el-table-column label="除息日" prop="tradingDate" width="130" />
        <el-table-column
          :label="shareColumnLabel(dashboardSettingStore.shareUnit, '持有')"
          align="right"
          width="130"
        >
          <template #default="{ row }">
            {{ formatShare(row.stockNum, dashboardSettingStore.shareUnit) }}
          </template>
        </el-table-column>
        <el-table-column label="每股股利" align="right" width="130">
          <template #default="{ row }">$ {{ toNumber(row.earn).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="股利收入" align="right" min-width="140">
          <template #default="{ row }">
            <strong class="value-up">
              {{ formatCurrency(toNumber(row.earn) * toNumber(row.stockNum)) }}
            </strong>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">目前沒有股利紀錄</div>
        </template>
      </el-table>
    </section>
  </div>
</template>

<style scoped lang="scss">
.holding-detail-page {
  display: grid;
  gap: 18px;
}

.detail-header,
.console-panel {
  border: 1px solid var(--main-border-color);
  border-radius: 18px;
  background: var(--dashboard-section-bg);
  box-shadow: var(--dashboard-section-shadow);
  backdrop-filter: blur(18px) saturate(145%);
  -webkit-backdrop-filter: blur(18px) saturate(145%);
}

.detail-header {
  display: grid;
  gap: 18px;
  padding: 20px;
}

.detail-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: start;
}

.back-button {
  grid-column: 1 / -1;
  width: fit-content;
}

.back-button,
.return-card,
.metric-box {
  border: 1px solid var(--dashboard-control-border);
  border-radius: 14px;
  background: var(--dashboard-glass-bg);
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  color: var(--dashboard-text-secondary);
  font-size: 12px;
  font-weight: 900;
}

.stock-title span,
.panel-heading span,
.metric-box span,
.return-card span,
.return-card small {
  color: var(--dashboard-text-muted);
  font-size: 12px;
  font-weight: 900;
}

.stock-title h1 {
  margin: 6px 0 0;
  color: var(--dashboard-text-primary);
  font-size: clamp(28px, 4vw, 48px);
  line-height: 1;
}

.stock-title p {
  max-width: 64ch;
  margin: 10px 0 0;
  color: var(--dashboard-text-muted);
  font-size: 13px;
  line-height: 1.7;
}

.return-card {
  display: grid;
  min-width: 220px;
  gap: 6px;
  padding: 16px;
}

.return-card strong {
  font-size: 24px;
  font-weight: 900;
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-box {
  padding: 14px;
}

.metric-box strong {
  display: block;
  margin-top: 8px;
  color: var(--dashboard-text-primary);
  font-size: 17px;
}

.console-panel {
  overflow-x: auto;
  padding: 16px;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-heading h2 {
  margin: 4px 0 0;
  color: var(--dashboard-text-primary);
  font-size: 16px;
}

.panel-heading strong {
  color: var(--dashboard-text-secondary);
  font-size: 13px;
}

.dashboard-table {
  min-width: 760px;
}

.empty-state {
  padding: 36px;
  color: var(--dashboard-text-muted);
  text-align: center;
}

.value-up {
  color: var(--stock-rise-color) !important;
}

.value-down {
  color: var(--stock-fall-color) !important;
}

@media (max-width: 900px) {
  .detail-hero,
  .metric-strip {
    grid-template-columns: 1fr;
  }

  .return-card {
    min-width: 0;
  }
}
</style>

<route>
{
  name: "Dashboard_My_Holding_Detail",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
