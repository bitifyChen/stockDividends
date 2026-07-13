<script setup>
import { computed } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import { getIndustryName } from '@/utils/industry.js'
import {
  getStockCode,
  getStockFullName,
  getStockIndustryChains,
  getStockIndustryChainCodes,
  getStockIndustryCode,
  getStockName
} from '@/utils/stock.js'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingMore: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  totalCount: {
    type: Number,
    default: 0
  },
  selectedNode: {
    type: Object,
    default: null
  }
})

defineEmits(['load-more'])

const skeletonRows = computed(() => Array.from({ length: 8 }))

const stockFromItem = (item) => item?.stock || item || {}

const stockRoute = (stock) => ({
  name: 'Dashboard_Etf_Stocks_Detail',
  params: {
    stockCode: getStockCode(stock)
  }
})

const displayIndustryChains = (stock) => {
  const chains = getStockIndustryChains(stock)
  if (chains.length) return chains
  return getStockIndustryChainCodes(stock).map((code) => ({ code, name: code, stage: '' }))
}

const stageLabel = (stage) => {
  if (stage === 'upstream') return '上游'
  if (stage === 'midstream') return '中游'
  if (stage === 'downstream') return '下游'
  return ''
}
</script>

<template>
  <section class="industry-stock-list">
    <header class="stock-list-heading">
      <div>
        <span>股票對照</span>
        <h2>{{ selectedNode?.name || '請選擇產業節點' }}</h2>
      </div>
      <strong>{{ totalCount.toLocaleString() }} 檔</strong>
    </header>

    <div v-if="loading && !items.length" class="stock-list-skeleton">
      <div v-for="(_, index) in skeletonRows" :key="index" class="stock-skeleton-row" />
    </div>

    <div v-else-if="items.length" class="stock-list-grid">
      <router-link
        v-for="item in items"
        :key="getStockCode(stockFromItem(item))"
        class="stock-list-card"
        :to="stockRoute(stockFromItem(item))"
      >
        <div class="stock-main">
          <span>{{ getStockCode(stockFromItem(item)) || '-' }}</span>
          <h3>{{ getStockName(stockFromItem(item)) }}</h3>
          <p>{{ getStockFullName(stockFromItem(item)) || '尚無公司全名' }}</p>
        </div>

        <el-scrollbar class="stock-tags-scrollbar" max-height="96px">
          <div class="stock-tags">
            <em>{{ getIndustryName(getStockIndustryCode(stockFromItem(item)), '未分類') }}</em>
            <small
              v-for="chain in displayIndustryChains(stockFromItem(item))"
              :key="`${getStockCode(stockFromItem(item))}-${chain.code}`"
            >
              {{ stageLabel(chain.stage) ? `${stageLabel(chain.stage)} · ` : ''
              }}{{ chain.name || chain.code }}
            </small>
          </div>
        </el-scrollbar>

        <ArrowUpRight :size="15" class="stock-link-icon" aria-hidden="true" />
      </router-link>
    </div>

    <div v-else class="empty-state">
      <strong>目前沒有股票資料</strong>
      <span>可切換其他產業節點，或等待後端同步更多產業鏈資料。</span>
    </div>

    <button
      v-if="hasMore"
      class="load-more-button"
      type="button"
      :disabled="loadingMore"
      @click="$emit('load-more')"
    >
      {{ loadingMore ? '載入中...' : '載入更多股票' }}
    </button>
  </section>
</template>

<style scoped>
.industry-stock-list {
  display: grid;
  gap: 16px;
  min-width: 0;
  border: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
  border-radius: 24px;
  background: var(--dashboard-section-bg);
  box-shadow: var(--dashboard-section-shadow);
  padding: clamp(16px, 2vw, 22px);
}

.stock-list-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
}

.stock-list-heading div {
  display: grid;
  gap: 5px;
}

.stock-list-heading span {
  color: var(--dashboard-accent, #67e8f9);
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.08em;
}

.stock-list-heading h2 {
  margin: 0;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: clamp(19px, 2vw, 26px);
  font-weight: 950;
  letter-spacing: -0.04em;
}

.stock-list-heading strong {
  color: var(--dashboard-text-secondary, #cbd5e1);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  font-weight: 950;
  white-space: nowrap;
}

.stock-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  align-items: start;
  gap: 12px;
}

.stock-list-card {
  position: relative;
  display: grid;
  gap: 14px;
  min-width: 0;
  min-height: 178px;
  border: 1px solid var(--main-border-color, rgb(148 163 184 / 0.14));
  border-radius: 18px;
  background: rgb(2 6 23 / 0.2);
  padding: 15px;
  color: inherit;
  text-decoration: none;
  align-self: start;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    transform 0.18s ease;
}

.stock-list-card:hover,
.stock-list-card:focus-visible {
  border-color: rgb(34 211 238 / 0.32);
  background: rgb(34 211 238 / 0.08);
  transform: translateY(-2px);
}

.stock-list-card:focus-visible {
  outline: 2px solid rgb(34 211 238 / 0.62);
  outline-offset: 2px;
}

.stock-main {
  display: grid;
  min-width: 0;
  gap: 5px;
  padding-right: 26px;
}

.stock-main span {
  color: var(--dashboard-accent, #67e8f9);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.08em;
}

.stock-main h3 {
  overflow: hidden;
  margin: 0;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 17px;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stock-main p {
  overflow: hidden;
  margin: 0;
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stock-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-right: 8px;
}

.stock-tags-scrollbar {
  min-height: 32px;
  max-height: 96px;
}

.stock-tags em,
.stock-tags small {
  display: inline-flex;
  max-width: 100%;
  min-height: 22px;
  align-items: center;
  overflow: hidden;
  border: 1px solid rgb(148 163 184 / 0.14);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  padding: 0 8px;
  color: var(--dashboard-text-secondary, #cbd5e1);
  font-size: 11px;
  font-style: normal;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stock-tags small {
  border-color: rgb(34 211 238 / 0.2);
  background: rgb(34 211 238 / 0.08);
  color: var(--dashboard-accent, #67e8f9);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.stock-link-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  color: var(--dashboard-text-muted, #7c8794);
}

.load-more-button {
  justify-self: center;
  border: 1px solid rgb(34 211 238 / 0.24);
  border-radius: 999px;
  background: rgb(34 211 238 / 0.08);
  padding: 10px 18px;
  color: var(--dashboard-accent, #67e8f9);
  font-size: 13px;
  font-weight: 950;
}

.load-more-button:disabled {
  cursor: progress;
  opacity: 0.58;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 8px;
  border: 1px dashed var(--main-border-color, rgb(148 163 184 / 0.18));
  border-radius: 18px;
  padding: 34px 18px;
  text-align: center;
}

.empty-state strong {
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 15px;
  font-weight: 950;
}

.empty-state span {
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 13px;
  font-weight: 800;
}

.stock-list-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.stock-skeleton-row {
  position: relative;
  overflow: hidden;
  height: 138px;
  border-radius: 18px;
  background: rgb(148 163 184 / 0.08);
}

.stock-skeleton-row::after {
  position: absolute;
  inset: 0;
  animation: stock-list-shimmer 1.2s infinite;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.08), transparent);
  content: '';
  transform: translateX(-100%);
}

:global(.dashboard-theme-light) .stock-list-card {
  background: rgb(255 255 255 / 0.5);
}

:global(.dashboard-theme-light) .stock-tags em {
  background: rgb(15 23 42 / 0.04);
}

:global(.dashboard-theme-light) .stock-tags small {
  border-color: rgb(8 145 178 / 0.18);
  background: rgb(8 145 178 / 0.08);
  color: #0e7490;
}

@media (max-width: 640px) {
  .stock-list-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .stock-list-grid,
  .stock-list-skeleton {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stock-list-card {
    transition: none;
  }

  .stock-list-card:hover,
  .stock-list-card:focus-visible {
    transform: none;
  }
}

@keyframes stock-list-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
