<script setup>
import EtfEventsStockOverviewCard from '@/components/dashboard/EtfEventsStockOverviewCard.vue'
import EtfOverviewCardSkeleton from '@/components/dashboard/EtfOverviewCardSkeleton.vue'
import { formatDecimalRatio } from '@/utils/etfDashboard.js'
import { getStockCode } from '@/utils/stock.js'

defineProps({
  selectedSort: {
    type: String,
    default: 'net_shares_abs'
  },
  selectedEtfType: {
    type: String,
    default: ''
  },
  sortOptions: {
    type: Array,
    default: () => []
  },
  etfTypeOptions: {
    type: Array,
    default: () => []
  },
  errorMessage: {
    type: String,
    default: ''
  },
  selectedDate: {
    type: String,
    default: ''
  },
  totalCount: {
    type: Number,
    default: 0
  },
  selectedEtfTypeLabel: {
    type: String,
    default: '全部 ETF'
  },
  amountCoverage: {
    type: Object,
    default: () => ({})
  },
  loadingData: {
    type: Boolean,
    default: false
  },
  loadingMore: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array,
    default: () => []
  },
  skeletonCards: {
    type: Array,
    default: () => []
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  shareUnit: {
    type: String,
    default: 'share'
  },
  showLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:selectedSort', 'update:selectedEtfType', 'load-more'])
</script>

<template>
  <section class="overview-block" aria-labelledby="stock-overview-title">
    <div class="overview-head">
      <div>
        <span>STOCK FLOW</span>
        <h2 id="stock-overview-title">個股總買賣行為</h2>
        <p>以股票為單位彙總同日所有主動 ETF 的買進、賣出與淨變動。</p>
      </div>

      <div class="overview-tools">
        <label class="field compact">
          <span>ETF 類型</span>
          <el-select
            :model-value="selectedEtfType"
            class="dashboard-select"
            @update:model-value="emit('update:selectedEtfType', $event)"
          >
            <el-option
              v-for="item in etfTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </label>

        <label class="field compact">
          <span>排序</span>
          <el-select
            :model-value="selectedSort"
            class="dashboard-select"
            @update:model-value="emit('update:selectedSort', $event)"
          >
            <el-option
              v-for="item in sortOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </label>
      </div>
    </div>

    <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

    <div class="overview-summary-line">
      <span>{{ selectedDate || '最新資料日期' }}</span>
      <strong>{{ totalCount }} 檔股票</strong>
      <span>{{ selectedEtfTypeLabel }}</span>
      <span v-if="amountCoverage.coverageRate !== undefined">
        估算覆蓋 {{ formatDecimalRatio(amountCoverage.coverageRate) }}
      </span>
    </div>

    <div class="overview-card-grid">
      <template v-if="showLoading">
        <EtfOverviewCardSkeleton
          v-for="(_, index) in skeletonCards"
          :key="`stock-event-skeleton-${index}`"
          :rows="5"
        />
      </template>

      <EtfEventsStockOverviewCard
        v-for="stock in items"
        :key="`${getStockCode(stock.stock)}-${selectedDate}`"
        :stock="stock"
        :share-unit="shareUnit"
      />
    </div>

    <div v-if="!items.length && !showLoading" class="empty-state">
      目前沒有符合條件的個股彙總資料
    </div>

    <div class="footer-actions" v-if="hasMore">
      <button
        class="load-more-button"
        type="button"
        :disabled="loadingMore"
        @click="$emit('load-more')"
      >
        {{ loadingMore ? '載入中' : '載入更多個股' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.overview-block {
  display: grid;
  gap: 14px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
}

.overview-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.overview-head span {
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.overview-head h2 {
  margin: 4px 0 0;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 20px;
  font-weight: 900;
}

.overview-head p {
  max-width: 58ch;
  margin: 7px 0 0;
  color: var(--dashboard-text-muted, #94a3b8);
  font-size: 13px;
  line-height: 1.7;
}

.overview-tools {
  display: flex;
  align-items: end;
  gap: 10px;
}

.overview-summary-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  color: var(--dashboard-text-muted, #94a3b8);
  font-size: 12px;
  font-weight: 900;
}

.overview-summary-line strong {
  color: var(--dashboard-text-primary, #f8fbff);
}

.overview-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 1500px) {
  .overview-card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1180px) {
  .overview-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .overview-head,
  .overview-tools {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 680px) {
  .overview-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
