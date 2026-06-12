<script setup>
import { computed, onMounted } from 'vue'
import { ArrowDownRight, ArrowUpRight, Calendar, Coins, LayoutGrid, Wallet } from 'lucide-vue-next'
import { add, multiply, round, subtract } from '@/composables/useMath.js'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { useStockStore } from '@/stores/useStock.js'
import { formatShare, shareUnitLabel } from '@/utils/etfDashboard.js'

const dashboardSettingStore = useDashboardSettingStore()
const stockStore = useStockStore()

const loading = computed(() => stockStore.loading)
const stockList = computed(() => stockStore.stockList)
const dividendList = computed(() => stockStore.dividendList)
const totalCost = computed(() => stockStore.totalCost)

const holdingRows = computed(() =>
  Object.entries(stockList.value).map(([id, stock]) => {
    const marketValue = stock.price && stock.buyNum ? multiply(stock.price, stock.buyNum) : 0
    const profit = subtract(marketValue, stock.buyPrice || 0)
    const profitRate =
      stock.buyPrice > 0 ? round(multiply(subtract(marketValue / stock.buyPrice, 1), 100), 2) : 0

    return {
      id,
      name: stock.name,
      shares: stock.buyNum || 0,
      marketValue,
      profit,
      profitRate
    }
  })
)

const totalMarketValue = computed(() =>
  holdingRows.value.reduce((total, stock) => add(total, stock.marketValue), 0)
)
const unrealizedProfit = computed(() => subtract(totalMarketValue.value, totalCost.value))
const profitRate = computed(() => {
  if (totalCost.value === 0) return 0
  return round(multiply(subtract(totalMarketValue.value / totalCost.value, 1), 100), 2)
})

const currentYear = new Date().getFullYear()
const ytdDividend = computed(() =>
  dividendList.value
    .filter((item) => item.year === currentYear)
    .reduce((total, item) => add(total, multiply(item.earn, item.stockNum)), 0)
)

const recentDividends = computed(() => dividendList.value.slice(0, 6))
const topHoldings = computed(() =>
  [...holdingRows.value].sort((a, b) => b.marketValue - a.marketValue).slice(0, 6)
)
const holdingSharePercent = (row) => {
  if (!totalMarketValue.value) return '0.0'
  return ((row.marketValue / totalMarketValue.value) * 100).toFixed(1)
}

const stats = computed(() => [
  {
    label: '持股市值',
    value: `$ ${totalMarketValue.value.toLocaleString()}`,
    note: `成本 $ ${totalCost.value.toLocaleString()}`,
    icon: Wallet
  },
  {
    label: '未實現損益',
    value: `${unrealizedProfit.value >= 0 ? '+' : ''}$ ${unrealizedProfit.value.toLocaleString()}`,
    note: `${profitRate.value >= 0 ? '+' : ''}${profitRate.value}%`,
    tone: unrealizedProfit.value >= 0 ? 'up' : 'down',
    icon: unrealizedProfit.value >= 0 ? ArrowUpRight : ArrowDownRight
  },
  {
    label: `${currentYear} 年股利`,
    value: `$ ${ytdDividend.value.toLocaleString()}`,
    note: `${recentDividends.value.length} 筆紀錄`,
    icon: Coins
  },
  {
    label: '持股檔數',
    value: `${holdingRows.value.length}`,
    note: `${shareUnitLabel(dashboardSettingStore.shareUnit)}目前顯示中`,
    icon: LayoutGrid
  }
])

onMounted(() => {
  stockStore.getData()
})
</script>

<template>
  <div class="dashboard-home" v-loading="loading">
    <section class="metric-grid">
      <article v-for="item in stats" :key="item.label" class="metric-card">
        <div class="metric-head">
          <span>{{ item.label }}</span>
          <component :is="item.icon" :size="16" />
        </div>
        <strong :class="item.tone === 'down' ? 'value-down' : item.tone === 'up' ? 'value-up' : ''">
          {{ item.value }}
        </strong>
        <small>{{ item.note }}</small>
      </article>
    </section>

    <section class="content-grid">
      <div class="panel panel-large">
        <div class="panel-head">
          <div>
            <h2>持股概況</h2>
            <span>目前權重最高的標的</span>
          </div>
        </div>
        <div class="holding-list">
          <div v-for="row in topHoldings" :key="row.id" class="holding-row">
            <div>
              <strong>{{ row.name || '-' }}</strong>
              <span>{{ row.id }}</span>
            </div>
            <div class="holding-meta">
              <strong>{{ formatShare(row.shares, dashboardSettingStore.shareUnit) }}</strong>
              <small>{{ holdingSharePercent(row) }}%</small>
            </div>
          </div>
          <div v-if="!topHoldings.length" class="empty-state">目前沒有持股資料</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div>
            <h2>近期股利</h2>
            <span>最近六筆現金流入</span>
          </div>
        </div>
        <div class="activity-list">
          <div
            v-for="item in recentDividends"
            :key="item.payDate + item.stockId"
            class="activity-row"
          >
            <div>
              <strong>{{ item.stockName }}</strong>
              <span>{{ item.stockId }} / {{ item.payDate }}</span>
            </div>
            <em>+$ {{ (item.earn * item.stockNum).toLocaleString() }}</em>
          </div>
          <div v-if="!recentDividends.length" class="empty-state compact">目前沒有股利紀錄</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard-home {
  display: grid;
  gap: 18px;
}

.hero-card,
.metric-card,
.panel {
  border: 1px solid rgb(148 163 184 / 0.12);
  border-radius: 24px;
  background: linear-gradient(180deg, rgb(15 18 26 / 0.92), rgb(10 13 20 / 0.92));
  box-shadow:
    0 18px 48px rgb(0 0 0 / 0.18),
    inset 0 1px 0 rgb(255 255 255 / 0.03);
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.6fr);
  gap: 20px;
  padding: 28px;
}

.eyebrow {
  color: #22d3ee;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  color: #f8fbff;
  letter-spacing: -0.04em;
}

h1 {
  margin-top: 10px;
  font-size: clamp(2.4rem, 5vw, 4.6rem);
  line-height: 0.95;
}

.hero-copy p {
  max-width: 60ch;
  margin: 16px 0 0;
  color: #a4b0c0;
  font-size: 14px;
  line-height: 1.8;
}

.hero-badges {
  display: grid;
  gap: 12px;
  align-content: start;
}

.badge-card {
  display: grid;
  gap: 4px;
  padding: 16px;
  border: 1px solid rgb(148 163 184 / 0.12);
  border-radius: 20px;
  background: rgb(255 255 255 / 0.03);
}

.badge-card span,
.metric-card small,
.panel-head span,
.holding-row span,
.activity-row span,
.empty-state {
  color: #7d8a9d;
  font-size: 12px;
}

.badge-card strong {
  color: #f8fbff;
  font-size: 20px;
  font-weight: 900;
}

.badge-card.accent {
  border-color: rgb(34 211 238 / 0.22);
  box-shadow:
    0 0 0 1px rgb(34 211 238 / 0.05) inset,
    0 18px 40px rgb(34 211 238 / 0.08);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  padding: 18px;
}

.metric-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 900;
}

.metric-card strong {
  display: block;
  margin-top: 12px;
  color: #f8fbff;
  font-size: clamp(1.15rem, 2vw, 1.8rem);
  font-weight: 900;
}

.metric-card small {
  display: block;
  margin-top: 6px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
  gap: 16px;
}

.panel {
  padding: 18px;
}

.panel-large {
  min-width: 0;
}

.panel-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-head h2 {
  font-size: 18px;
}

.holding-list,
.activity-list {
  display: grid;
}

.holding-row,
.activity-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid rgb(148 163 184 / 0.1);
}

.holding-row:first-child,
.activity-row:first-child {
  border-top: 0;
  padding-top: 0;
}

.holding-row strong,
.activity-row strong {
  color: #f8fbff;
  font-size: 13px;
  font-weight: 800;
}

.holding-meta {
  display: grid;
  justify-items: end;
  gap: 3px;
}

.holding-meta strong,
.activity-row em {
  color: #22d3ee;
  font-size: 13px;
  font-style: normal;
  font-weight: 900;
}

.value-up {
  color: var(--stock-rise-color) !important;
}

.value-down {
  color: var(--stock-fall-color) !important;
}

.empty-state {
  padding: 34px 0 10px;
  text-align: center;
}

.empty-state.compact {
  padding-top: 14px;
}

@media (max-width: 1100px) {
  .hero-card,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .hero-card {
    padding: 20px;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .panel {
    padding: 16px;
  }

  .holding-row,
  .activity-row {
    flex-direction: column;
  }

  .holding-meta {
    justify-items: start;
  }
}
</style>

<route>
{
  name: "Dashboard_Home",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
