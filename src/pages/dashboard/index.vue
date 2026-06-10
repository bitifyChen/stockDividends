<script setup>
import { computed, onMounted } from 'vue'
import { useStockStore } from '@/stores/useStock.js'
import { add, multiply, round, subtract } from '@/composables/useMath.js'
import { Activity, ArrowDownRight, ArrowUpRight, Calendar, Coins, Wallet } from 'lucide-vue-next'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { formatRatio, formatShare, normalizeArray, shareColumnLabel } from '@/utils/etfDashboard.js'

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
    const profitRate = stock.buyPrice > 0 ? round(multiply(subtract(marketValue / stock.buyPrice, 1), 100), 2) : 0

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
const topHoldings = computed(() => [...holdingRows.value].sort((a, b) => b.marketValue - a.marketValue).slice(0, 8))

const stats = computed(() => [
  {
    label: '總市值',
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
    label: `${currentYear} 股利`,
    value: `$ ${ytdDividend.value.toLocaleString()}`,
    note: `${recentDividends.value.length} 筆近期紀錄`,
    icon: Coins
  },
  {
    label: '持股檔數',
    value: `${holdingRows.value.length}`,
    note: 'Firebase 個人資料',
    icon: Activity
  }
])

onMounted(() => {
  stockStore.getData()
})
</script>

<template>
  <div class="terminal-page" v-loading="loading">
    <section class="terminal-titlebar">
      <div>
        <div class="terminal-kicker">Portfolio</div>
        <h1>投資組合總覽</h1>
      </div>
      <div class="terminal-date">
        <Calendar :size="15" />
        <span>{{ currentYear }} 年度</span>
      </div>
    </section>

    <section class="market-strip">
      <article v-for="item in stats" :key="item.label" class="ticker-card">
        <div class="ticker-head">
          <span>{{ item.label }}</span>
          <component :is="item.icon" :size="16" />
        </div>
        <strong :class="item.tone === 'down' ? 'value-down' : item.tone === 'up' ? 'value-up' : ''">
          {{ item.value }}
        </strong>
        <small>{{ item.note }}</small>
      </article>
    </section>

    <section class="terminal-grid">
      <div class="terminal-panel wide">
        <div class="panel-head">
          <h2>主要持股</h2>
          <router-link :to="{ name: 'Dashboard_My_Holdings' }">查看全部</router-link>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>股票</th>
                <th>{{shareColumnLabel(dashboardSettingStore.shareUnit, '目前')}}</th>
                <th>市值</th>
                <th>損益</th>
                <th>報酬率</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in topHoldings" :key="row.id">
                <td>
                  <strong>{{ row.name || '-' }}</strong>
                  <span>{{ row.id }}</span>
                </td>
                <td>{{ formatShare(row.shares, dashboardSettingStore.shareUnit) }}</td>
                <td>$ {{ row.marketValue.toLocaleString() }}</td>
                <td :class="row.profit >= 0 ? 'value-up' : 'value-down'">
                  {{ row.profit >= 0 ? '+' : '' }}{{ row.profit.toLocaleString() }}
                </td>
                <td :class="row.profitRate >= 0 ? 'value-up' : 'value-down'">
                  {{ row.profitRate >= 0 ? '+' : '' }}{{ row.profitRate }}%
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="!topHoldings.length" class="terminal-empty">目前尚無持股資料。</div>
        </div>
      </div>

      <div class="terminal-panel">
        <div class="panel-head">
          <h2>最近股利</h2>
          <router-link :to="{ name: 'Dashboard_My_Dividend' }">查看全部</router-link>
        </div>
        <div class="activity-list">
          <div v-for="item in recentDividends" :key="item.payDate + item.stockId" class="activity-row">
            <div>
              <strong>{{ item.stockName }}</strong>
              <span>{{ item.stockId }} / {{ item.payDate }}</span>
            </div>
            <em>+$ {{ (item.earn * item.stockNum).toLocaleString() }}</em>
          </div>
          <div v-if="!recentDividends.length" class="terminal-empty compact">目前尚無股利紀錄。</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.terminal-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.terminal-titlebar,
.terminal-panel,
.ticker-card {
  border: 1px solid #2f3339;
  border-radius: 6px;
  background: #1b1d21;
}

.terminal-titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.terminal-kicker {
  color: #7c858f;
  font-size: 12px;
  font-weight: 900;
}

h1,
h2 {
  margin: 0;
  color: #f7fafc;
  letter-spacing: 0;
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

.terminal-date {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 800;
}

.market-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.ticker-card {
  padding: 14px;
}

.ticker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 900;
}

.ticker-card strong {
  display: block;
  margin-top: 10px;
  color: #f7fafc;
  font-size: 20px;
  font-weight: 900;
}

.ticker-card small {
  display: block;
  margin-top: 4px;
  color: #7c858f;
  font-size: 12px;
}

.terminal-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.8fr);
  gap: 16px;
}

.terminal-panel {
  min-width: 0;
  overflow: hidden;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 16px;
  border-bottom: 1px solid #2f3339;
}

.panel-head a {
  color: #9ff7ef;
  font-size: 12px;
  font-weight: 900;
}

.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  color: #d4d8dd;
  font-size: 13px;
}

th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid #2f3339;
  text-align: left;
  white-space: nowrap;
}

th {
  background: #202328;
  color: #aab4c0;
  font-size: 12px;
  font-weight: 900;
}

td:first-child {
  display: grid;
  gap: 3px;
}

td:first-child span,
.activity-row span {
  color: #7c858f;
  font-size: 12px;
}

.value-up {
  color: var(--stock-rise-color) !important;
}

.value-down {
  color: var(--stock-fall-color) !important;
}

.activity-list {
  display: grid;
}

.activity-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid #2f3339;
}

.activity-row strong {
  display: block;
  color: #f7fafc;
  font-size: 13px;
}

.activity-row em {
  color: var(--stock-rise-color);
  font-size: 13px;
  font-style: normal;
  font-weight: 900;
  white-space: nowrap;
}

.terminal-empty {
  padding: 42px 16px;
  color: #7c858f;
  text-align: center;
  font-size: 13px;
}

.terminal-empty.compact {
  padding: 24px 16px;
}

@media (max-width: 1180px) {
  .market-strip,
  .terminal-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 760px) {
  .market-strip,
  .terminal-grid {
    grid-template-columns: 1fr;
  }

  .terminal-titlebar {
    align-items: stretch;
    flex-direction: column;
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
