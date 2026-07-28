<script setup>
import { computed, onMounted, ref } from 'vue'
import { Calendar, ChevronLeft, ChevronRight, Coins, RefreshCw, TrendingUp } from 'lucide-vue-next'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { useStockStore } from '@/stores/useStock.js'
import {
  formatFractionalShare,
  formatShare,
  shareColumnLabel,
  toNumber
} from '@/utils/etfDashboard.js'

const stockStore = useStockStore()
const dashboardSettingStore = useDashboardSettingStore()
const loading = computed(() => stockStore.loading)
const selectedYear = ref(new Date().getFullYear())
const dividendList = computed(() => stockStore.dividendList)

const availableYears = computed(() => {
  const years = new Set(dividendList.value.map((item) => item.year).filter(Boolean))
  const list = Array.from(years).sort((a, b) => b - a)
  return list.length ? list : [selectedYear.value]
})

const filteredDividends = computed(() =>
  dividendList.value.filter((item) => item.year === selectedYear.value)
)
const yearTotal = computed(() =>
  filteredDividends.value.reduce((total, item) => total + toNumber(item.cashIncome), 0)
)
const yearEstimatedStockShares = computed(() =>
  filteredDividends.value.reduce((total, item) => total + toNumber(item.estimatedStockShares), 0)
)
const yearStockRightsMarketValue = computed(() =>
  filteredDividends.value.reduce((total, item) => total + toNumber(item.stockRightsMarketValue), 0)
)
const yearTotalBenefitValue = computed(() => yearTotal.value + yearStockRightsMarketValue.value)
const hasStockDividend = computed(() =>
  filteredDividends.value.some((item) => toNumber(item.estimatedStockShares) > 0)
)
const stats = computed(() => [
  {
    label: `${selectedYear.value} 年股利收入`,
    value: formatCurrency(yearTotal.value),
    icon: Coins
  },
  {
    label: `${selectedYear.value} 年預估獲配`,
    value: `${formatFractionalShare(
      yearEstimatedStockShares.value,
      dashboardSettingStore.shareUnit
    )} ${dashboardSettingStore.shareUnit === 'lot' ? '張' : '股'}`,
    icon: TrendingUp
  },
  {
    label: '股票權益參考市值',
    value: formatCurrency(yearStockRightsMarketValue.value),
    icon: Calendar
  },
  {
    label: '現金加股票權益總價值',
    value: formatCurrency(yearTotalBenefitValue.value),
    icon: Calendar
  }
])

const formatCurrency = (value) => `$ ${Math.round(toNumber(value)).toLocaleString()}`
const setYear = (value) => {
  const nextYear = Number(value)
  if (!Number.isFinite(nextYear)) return
  selectedYear.value = nextYear
}
const reload = () => stockStore.getData(true)

onMounted(() => {
  stockStore.getData()
})
</script>

<template>
  <div class="my-page">
    <section class="terminal-titlebar">
      <div>
        <div class="terminal-kicker">MY DIVIDENDS</div>
        <h1>股利記錄</h1>
        <p>延續前台年度股利查詢，提供更完整的桌面版統計與明細。</p>
      </div>

      <div class="titlebar-actions">
        <button class="icon-button" type="button" @click="setYear(selectedYear - 1)">
          <ChevronLeft :size="16" />
        </button>
        <label class="terminal-select">
          <span>年度</span>
          <select v-model.number="selectedYear">
            <option v-for="year in availableYears" :key="year" :value="year">{{ year }} 年</option>
          </select>
        </label>
        <button
          class="icon-button"
          type="button"
          :disabled="selectedYear >= new Date().getFullYear()"
          @click="setYear(selectedYear + 1)"
        >
          <ChevronRight :size="16" />
        </button>
        <button class="icon-button" type="button" :disabled="loading" @click="reload">
          <RefreshCw :size="16" />
        </button>
      </div>
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

    <p v-if="hasStockDividend" class="rights-notice">
      預估獲配股數可能包含小數，實際零股分配與入帳股數以公司及集保結果為準。
    </p>

    <section class="terminal-panel" v-loading="loading">
      <div class="panel-head">
        <h2>年度股利明細</h2>
        <span>{{ filteredDividends.length }} 筆</span>
      </div>

      <el-table
        :data="filteredDividends"
        row-key="eventId"
        style="width: 100%"
        class="terminal-el-table"
      >
        <el-table-column label="發放日" prop="payDate" width="140">
          <template #default="{ row }">
            <span class="date-text">{{ row.payDate || '待公告' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="除息日" prop="tradingDate" width="140" />
        <el-table-column label="股票" min-width="200">
          <template #default="{ row }">
            <div class="stock-cell">
              <strong>{{ row.stockName }}</strong>
              <span>{{ row.stockId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="shareColumnLabel(dashboardSettingStore.shareUnit, '現金資格')"
          align="right"
          width="130"
        >
          <template #default="{ row }">
            {{ formatShare(row.cashEligibleShares, dashboardSettingStore.shareUnit) }}
          </template>
        </el-table-column>
        <el-table-column label="每股股利" align="right" width="140">
          <template #default="{ row }">$ {{ toNumber(row.earn).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="股利收入" align="right" min-width="150">
          <template #default="{ row }">
            <strong class="value-up">
              {{ formatCurrency(row.cashIncome) }}
            </strong>
          </template>
        </el-table-column>
        <el-table-column label="股票股利權益" align="right" min-width="190">
          <template #default="{ row }">
            <div v-if="row.estimatedStockShares > 0" class="stock-rights-cell">
              <strong>
                {{
                  formatFractionalShare(row.estimatedStockShares, dashboardSettingStore.shareUnit)
                }}
                {{ dashboardSettingStore.shareUnit === 'lot' ? '張' : '股' }}
              </strong>
              <span>{{ row.stockExDate || '除權日待公告' }}</span>
              <el-tag
                :type="row.isStockRightRecognized ? 'success' : 'warning'"
                round
                effect="plain"
                size="small"
              >
                {{ row.isStockRightRecognized ? '已納入估值' : '尚未除權' }}
              </el-tag>
            </div>
            <span v-else class="date-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="股票權益市值" align="right" min-width="150">
          <template #default="{ row }">
            {{ row.stockRightsMarketValue > 0 ? formatCurrency(row.stockRightsMarketValue) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="總價值" align="right" min-width="150">
          <template #default="{ row }">
            <strong>{{ formatCurrency(row.totalBenefitValue) }}</strong>
          </template>
        </el-table-column>
        <template #empty>
          <div class="terminal-empty">此年度沒有股利記錄</div>
        </template>
      </el-table>
    </section>
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
  align-items: end;
  gap: 10px;
}

.terminal-select {
  display: grid;
  gap: 6px;
  color: var(--dashboard-text-muted, #94a3b8);
  font-size: 12px;
  font-weight: 900;
}

.terminal-select select {
  height: 38px;
  min-width: 140px;
  border: 1px solid var(--dashboard-control-border, #30343a);
  border-radius: 10px;
  background: var(--dashboard-control-bg, #111317);
  color: var(--dashboard-text-primary, #d4d8dd);
  padding: 0 10px;
}

.terminal-select select option {
  background: var(--main-surface-color, #0f1320);
  color: var(--dashboard-text-primary, #d4d8dd);
}

.icon-button {
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--dashboard-control-border, #30343a);
  border-radius: 10px;
  background: var(--dashboard-control-bg, #111317);
  color: var(--dashboard-text-secondary, #d4d8dd);
}

.icon-button:disabled {
  opacity: 0.5;
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
  color: var(--dashboard-text-muted, #94a3b8);
  font-size: 12px;
  font-weight: 900;
}

.ticker-card strong {
  display: block;
  margin-top: 10px;
  color: var(--dashboard-text-primary, #f7fafc);
  font-size: 22px;
  font-weight: 900;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  border-bottom: 1px solid var(--main-border-color);
}

.panel-head span,
.date-text {
  color: var(--dashboard-text-muted, #94a3b8);
  font-size: 13px;
  font-weight: 800;
}

.stock-cell {
  display: grid;
  gap: 3px;
}

.stock-rights-cell {
  display: grid;
  justify-items: end;
  gap: 4px;
}

.stock-rights-cell span,
.rights-notice {
  color: var(--dashboard-text-muted, #94a3b8);
  font-size: 12px;
}

.rights-notice {
  margin: 0;
  padding: 0 4px;
  line-height: 1.6;
}

.stock-cell strong {
  color: var(--dashboard-text-primary, #f7fafc);
}

.stock-cell span {
  color: var(--dashboard-text-muted, #7c858f);
  font-size: 12px;
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
  min-width: 1320px;
}

.value-up {
  color: var(--stock-rise-color) !important;
}

@media (max-width: 900px) {
  .market-strip {
    grid-template-columns: 1fr;
  }

  .terminal-titlebar,
  .titlebar-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .terminal-select select,
  .icon-button {
    width: 100%;
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
