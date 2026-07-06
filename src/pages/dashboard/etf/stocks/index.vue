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
import { getStockCode, getStockName } from '@/utils/stock.js'

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
    stockCode: getStockCode(row.stock)
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
            <strong>{{ getStockName(row.stock, '-') }}</strong>
            <span>{{ getStockCode(row.stock) || '-' }}</span>
          </div>
        </template>
        <template #actions="{ row }">
          <router-link v-if="getStockCode(row.stock)" class="detail-link" :to="detailRoute(row)"
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

<route>
{
  name: "Dashboard_Etf_Stocks",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
