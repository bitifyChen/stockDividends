<script setup>
import { computed, onMounted, ref } from 'vue'
import { Calendar, Coins, TrendingUp } from 'lucide-vue-next'
import { add, multiply } from '@/composables/useMath.js'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { useStockStore } from '@/stores/useStock.js'
import { formatShare, shareColumnLabel } from '@/utils/etfDashboard.js'

const stockStore = useStockStore()
const dashboardSettingStore = useDashboardSettingStore()
const loading = computed(() => stockStore.loading)
const selectedYear = ref(new Date().getFullYear())
const dividendList = computed(() => stockStore.dividendList)

const availableYears = computed(() => {
  const years = new Set(dividendList.value.map((item) => item.year))
  return Array.from(years).sort((a, b) => b - a)
})

const filteredDividends = computed(() =>
  dividendList.value.filter((item) => item.year === selectedYear.value)
)
const yearTotal = computed(() =>
  filteredDividends.value.reduce((total, item) => add(total, multiply(item.earn, item.stockNum)), 0)
)
const allTimeTotal = computed(() =>
  dividendList.value.reduce((total, item) => add(total, multiply(item.earn, item.stockNum)), 0)
)

const stats = computed(() => [
  {
    label: `${selectedYear.value} 年股利收入`,
    value: `$ ${yearTotal.value.toLocaleString()}`,
    icon: Coins
  },
  {
    label: '累計股利收入',
    value: `$ ${allTimeTotal.value.toLocaleString()}`,
    icon: TrendingUp
  },
  {
    label: `${selectedYear.value} 年紀錄筆數`,
    value: `${filteredDividends.value.length} 筆`,
    icon: Calendar
  }
])

onMounted(() => {
  stockStore.getData()
})
</script>

<template>
  <div class="terminal-page">
    <section class="terminal-titlebar">
      <div>
        <div class="terminal-kicker">ACCOUNT</div>
        <h1>股利紀錄</h1>
      </div>
      <label class="terminal-select">
        <span>年度</span>
        <select v-model="selectedYear">
          <option v-for="year in availableYears" :key="year" :value="year">{{ year }} 年</option>
        </select>
      </label>
    </section>

    <section class="market-strip">
      <article v-for="item in stats" :key="item.label" class="ticker-card">
        <div class="ticker-head">
          <span>{{ item.label }}</span>
          <component :is="item.icon" :size="16" />
        </div>
        <strong>{{ item.value }}</strong>
      </article>
    </section>

    <section class="terminal-panel" v-loading="loading">
      <div class="panel-head">
        <h2>年度股利明細</h2>
        <span>{{ filteredDividends.length }} 筆</span>
      </div>

      <el-table :data="filteredDividends" style="width: 100%" class="terminal-el-table">
        <el-table-column label="發放日期" prop="payDate" width="160">
          <template #default="{ row }">
            <span class="date-text">{{ row.payDate }}</span>
          </template>
        </el-table-column>
        <el-table-column label="股票" min-width="200">
          <template #default="{ row }">
            <div class="stock-cell">
              <strong>{{ row.stockName }}</strong>
              <span>{{ row.stockId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="shareColumnLabel(dashboardSettingStore.shareUnit, '持有')"
          align="right"
          width="120"
        >
          <template #default="{ row }">{{
            formatShare(row.stockNum, dashboardSettingStore.shareUnit)
          }}</template>
        </el-table-column>
        <el-table-column label="每股股利" align="right" width="150">
          <template #default="{ row }">$ {{ row.earn.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="現金股利" align="right" min-width="150">
          <template #default="{ row }">
            <strong class="value-up">$ {{ (row.earn * row.stockNum).toLocaleString() }}</strong>
          </template>
        </el-table-column>
        <template #empty>
          <div class="terminal-empty">目前沒有股利紀錄</div>
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
.terminal-select {
  display: grid;
  gap: 6px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 900;
}
.terminal-select select {
  height: 38px;
  min-width: 140px;
  border: 1px solid #30343a;
  border-radius: 6px;
  background: #111317;
  color: #d4d8dd;
  padding: 0 10px;
}
.market-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  font-size: 22px;
  font-weight: 900;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  border-bottom: 1px solid #2f3339;
}
.panel-head span,
.date-text {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 800;
}
.stock-cell {
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
.value-up {
  color: var(--stock-rise-color) !important;
}
.terminal-empty {
  padding: 42px 16px;
  color: #7c858f;
  text-align: center;
  font-size: 13px;
}

.terminal-panel {
  max-width: 100%;
  overflow-x: auto;
}

:deep(.terminal-el-table) {
  min-width: 760px;
}

@media (max-width: 900px) {
  .market-strip {
    grid-template-columns: 1fr;
  }
  .terminal-titlebar {
    align-items: stretch;
    flex-direction: column;
  }

  .terminal-select select {
    width: 100%;
  }

  .terminal-panel {
    border-radius: 12px;
  }
}
</style>

<route>
{
  name: "Dashboard_My_Dividend",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
