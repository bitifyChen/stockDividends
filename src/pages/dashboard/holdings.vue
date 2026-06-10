<script setup>
import { computed, onMounted, ref } from 'vue'
import { Search, TrendingDown, TrendingUp } from 'lucide-vue-next'
import { multiply, round, subtract } from '@/composables/useMath.js'
import { useStockStore } from '@/stores/useStock.js'

const stockStore = useStockStore()
const loading = computed(() => stockStore.loading)
const searchQuery = ref('')

const holdings = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()

  return Object.keys(stockStore.stockList)
    .map((id) => {
      const item = stockStore.stockList[id]
      const marketValue = item.price ? multiply(item.price, item.buyNum) : 0
      const profit = item.price ? subtract(marketValue, item.buyPrice) : 0
      const profitRate = item.buyPrice > 0 ? round(multiply(subtract(marketValue / item.buyPrice, 1), 100), 2) : 0

      return {
        id,
        name: item.name,
        shares: item.buyNum,
        avgCost: item.buyNum > 0 ? round(item.buyPrice / item.buyNum, 2) : 0,
        totalCost: item.buyPrice,
        currentPrice: item.price,
        marketValue,
        profit,
        profitRate
      }
    })
    .filter((item) => !keyword || item.name?.toLowerCase().includes(keyword) || item.id.includes(keyword))
})

onMounted(() => {
  stockStore.getData()
})
</script>

<template>
  <div class="terminal-page">
    <section class="terminal-titlebar">
      <div>
        <div class="terminal-kicker">ACCOUNT</div>
        <h1>持股管理</h1>
      </div>
      <label class="terminal-search">
        <Search :size="16" />
        <input v-model="searchQuery" type="search" placeholder="搜尋股票代號或名稱" />
      </label>
    </section>

    <section class="terminal-panel" v-loading="loading">
      <div class="panel-head">
        <h2>個人持股清單</h2>
        <span>{{ holdings.length }} 檔</span>
      </div>

      <el-table :data="holdings" style="width: 100%" class="terminal-el-table">
        <el-table-column label="股票" min-width="180">
          <template #default="{ row }">
            <div class="stock-cell">
              <strong>{{ row.name }}</strong>
              <span>{{ row.id }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="持有股數" prop="shares" align="right" width="110" />
        <el-table-column label="平均成本" align="right" width="120">
          <template #default="{ row }">$ {{ row.avgCost.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="現價" align="right" width="120">
          <template #default="{ row }">$ {{ row.currentPrice?.toLocaleString() ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="市值" align="right" min-width="140">
          <template #default="{ row }">$ {{ row.marketValue.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="損益 / 報酬率" align="right" min-width="150" sortable prop="profit">
          <template #default="{ row }">
            <div class="profit-cell">
              <strong :class="row.profit >= 0 ? 'value-up' : 'value-down'">
                {{ row.profit >= 0 ? '+' : '' }}{{ row.profit.toLocaleString() }}
              </strong>
              <span :class="row.profitRate >= 0 ? 'value-up' : 'value-down'">
                <TrendingUp v-if="row.profitRate >= 0" :size="12" />
                <TrendingDown v-else :size="12" />
                {{ Math.abs(row.profitRate) }}%
              </span>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="terminal-empty">目前尚無持股紀錄。</div>
        </template>
      </el-table>
    </section>
  </div>
</template>

<style scoped lang="scss">
.terminal-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.terminal-titlebar,
.terminal-panel {
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

.terminal-search {
  display: flex;
  width: min(320px, 100%);
  height: 38px;
  align-items: center;
  gap: 9px;
  border: 1px solid #30343a;
  border-radius: 6px;
  background: #111317;
  padding: 0 12px;
  color: #7c858f;
}

.terminal-search input {
  min-width: 0;
  width: 100%;
  border: 0;
  background: transparent;
  color: #d4d8dd;
  font-size: 13px;
  outline: none;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  border-bottom: 1px solid #2f3339;
}

.panel-head span {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 900;
}

.stock-cell,
.profit-cell {
  display: grid;
  gap: 3px;
}

.stock-cell strong {
  color: #f7fafc;
}

.stock-cell span {
  color: #7c858f;
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

.value-up {
  color: var(--stock-rise-color) !important;
}

.value-down {
  color: var(--stock-fall-color) !important;
}

.terminal-empty {
  padding: 42px 16px;
  color: #7c858f;
  text-align: center;
  font-size: 13px;
}

:deep(.terminal-el-table) {
  .el-table__header th {
    font-size: 12px;
    font-weight: 900;
  }
}

@media (max-width: 760px) {
  .terminal-titlebar {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

<route>
{
  name: "DashboardMyHoldingsPage",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
