<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RefreshCw, Search } from 'lucide-vue-next'
import { getEtfStocks } from '@/api/etf.js'
import TwoTable from '@/components/Two/TwoTable.vue'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import {
  formatNumber,
  formatShare,
  normalizeArray,
  normalizeObject,
  shareColumnLabel
} from '@/utils/etfDashboard.js'

const dashboardSettingStore = useDashboardSettingStore()
const loading = ref(false)
const q = ref('')
const page = ref(1)
const pageSize = ref(50)
const rows = ref([])
const pagination = ref({})
const errorMessage = ref('')

const columns = computed(() => [
  { label: '股票', slot: 'stock', minWidth: '180' },
  {
    label: '持有 ETF 數',
    prop: 'holder_count',
    formatter: (row) => formatNumber(row.holder_count),
    minWidth: '120'
  },
  {
    label: shareColumnLabel(dashboardSettingStore.shareUnit, '總持有'),
    prop: 'total_current_shares',
    formatter: (row) => formatShare(row.total_current_shares, dashboardSettingStore.shareUnit),
    minWidth: '150'
  },
  { label: '最新日期', prop: 'latest_snapshot_date', width: '130' },
  { label: '操作', slot: 'actions', width: '96', align: 'center' }
])

const total = computed(
  () => pagination.value.total || pagination.value.totalItems || rows.value.length
)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const detailRoute = (row) => ({
  name: 'Dashboard_Etf_Stocks_Detail',
  params: {
    stockCode: String(row.stock_code)
  }
})

const loadRows = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const data = await getEtfStocks({
      page: page.value,
      pageSize: pageSize.value,
      q: q.value || null
    })
    const payload = normalizeObject(data)
    rows.value = normalizeArray(payload.items || payload.data || data)
    pagination.value = payload.pagination || payload.meta || payload
  } catch (error) {
    errorMessage.value = error?.message || '讀取個股觀測清單失敗'
    rows.value = []
  } finally {
    loading.value = false
  }
}

const submitSearch = () => {
  page.value = 1
  loadRows()
}

const nextPage = () => {
  if (page.value >= totalPages.value) return
  page.value += 1
}

const prevPage = () => {
  if (page.value <= 1) return
  page.value -= 1
}

watch(page, () => {
  loadRows()
})

onMounted(() => {
  loadRows()
})
</script>

<template>
  <div class="stocks-page">
    <section class="console-bar">
      <div>
        <div class="breadcrumb">ETF / 個股觀測</div>
        <h1>個股觀測</h1>
      </div>

      <div class="console-tools">
        <label class="search-field">
          <Search :size="16" />
          <input
            v-model.trim="q"
            type="search"
            placeholder="搜尋股票代號或名稱"
            @keydown.enter="submitSearch"
          />
        </label>
        <button class="action-button" type="button" @click="submitSearch">搜尋</button>
        <button class="refresh-button" type="button" :disabled="loading" @click="loadRows">
          <RefreshCw :size="16" />
        </button>
      </div>
    </section>

    <section class="console-panel">
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <TwoTable :data="rows" :columns="columns" :loading="loading">
        <template #stock="{ row }">
          <div class="stock-cell">
            <strong>{{ row.stock_name || '-' }}</strong>
            <span>{{ row.stock_code || '-' }}</span>
          </div>
        </template>
        <template #actions="{ row }">
          <router-link v-if="row.stock_code" class="detail-link" :to="detailRoute(row)"
            >詳情</router-link
          >
          <span v-else class="detail-disabled">-</span>
        </template>
        <template #empty>{{ loading ? '資料讀取中' : '目前沒有個股觀測資料' }}</template>
      </TwoTable>

      <div class="pagination-bar">
        <span>第 {{ page }} / {{ totalPages }} 頁</span>
        <div>
          <button type="button" :disabled="page <= 1 || loading" @click="prevPage">上一頁</button>
          <button type="button" :disabled="page >= totalPages || loading" @click="nextPage">
            下一頁
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.stocks-page {
  display: grid;
  gap: 16px;
  color: #cbd5e1;
}

.console-bar,
.console-panel {
  border: 1px solid #2f3339;
  border-radius: 6px;
  background: #1b1d21;
}

.console-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.breadcrumb {
  color: #7c858f;
  font-size: 12px;
  font-weight: 900;
}

h1 {
  margin: 4px 0 0;
  color: #f7fafc;
  font-size: 22px;
  font-weight: 900;
}

.console-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-field {
  display: flex;
  height: 36px;
  min-width: 260px;
  align-items: center;
  gap: 8px;
  border: 1px solid #30343a;
  border-radius: 6px;
  background: #111317;
  padding: 0 10px;
  color: #7c858f;
}

.search-field input {
  width: 100%;
  border: 0;
  background: transparent;
  color: #d4d8dd;
  outline: 0;
}

.action-button,
.refresh-button,
.detail-link,
.pagination-bar button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #30343a;
  border-radius: 6px;
  background: #111317;
  color: #d4d8dd;
  font-weight: 900;
}

.action-button {
  height: 36px;
  padding: 0 14px;
}

.refresh-button {
  width: 36px;
  height: 36px;
}

.detail-link {
  min-height: 30px;
  padding: 0 10px;
  font-size: 12px;
  text-decoration: none;
}

.detail-link:hover {
  border-color: #10bfae;
  color: #10bfae;
}

.detail-disabled {
  color: var(--stock-neutral-color);
}

.console-panel {
  padding: 16px;
}

.stock-cell {
  display: grid;
  gap: 2px;
}

.stock-cell strong {
  color: #f7fafc;
}

.stock-cell span {
  color: #7c858f;
  font-size: 12px;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 14px;
  color: #7c858f;
  font-size: 13px;
}

.pagination-bar div {
  display: flex;
  gap: 8px;
}

.pagination-bar button {
  min-height: 32px;
  padding: 0 12px;
}

.pagination-bar button:disabled,
.refresh-button:disabled {
  opacity: 0.5;
}

.error-banner {
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid #7f1d1d;
  border-radius: 4px;
  background: #2a1717;
  color: #fecaca;
  font-size: 13px;
  font-weight: 800;
}

@media (max-width: 900px) {
  .console-bar,
  .console-tools,
  .pagination-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .search-field {
    width: 100%;
    min-width: 0;
  }

  .action-button,
  .refresh-button,
  .pagination-bar button {
    width: 100%;
  }

  .pagination-bar div {
    flex-direction: column;
  }

  .console-panel {
    padding: 12px;
  }
}
</style>

<route>
{
  name: "Dashboard_Etf_Stocks",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
