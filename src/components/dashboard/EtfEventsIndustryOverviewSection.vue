<script setup>
import { computed } from 'vue'
import EtfEventsIndustryOverviewCard from '@/components/dashboard/EtfEventsIndustryOverviewCard.vue'
import EtfOverviewCardSkeleton from '@/components/dashboard/EtfOverviewCardSkeleton.vue'

const props = defineProps({
  selectedSort: {
    type: String,
    default: 'estimated_amount'
  },
  sortOptions: {
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
  selectedSortLabel: {
    type: String,
    default: '估算總交易額'
  },
  amountCoverage: {
    type: Object,
    default: () => ({})
  },
  detailQuery: {
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

const emit = defineEmits(['update:selectedSort', 'load-more'])

const isCoverageLow = computed(
  () =>
    props.amountCoverage.coverageRate !== undefined && Number(props.amountCoverage.coverageRate) < 1
)
</script>

<template>
  <section class="overview-block" aria-labelledby="industry-overview-title">
    <div class="overview-head">
      <div>
        <span>INDUSTRY FLOW</span>
        <h2 id="industry-overview-title">產業別進出總覽</h2>
        <p>以產業大類彙總同日 ETF 買賣行為，快速判斷資金集中流向。</p>
      </div>

      <div class="overview-tools">
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
      <strong>{{ totalCount }} 個產業</strong>
      <span>{{ selectedEtfTypeLabel }}</span>
      <span>{{ selectedSortLabel }}</span>
      <span v-if="isCoverageLow" class="coverage-warning">金額覆蓋率不足</span>
    </div>

    <div class="overview-card-grid">
      <template v-if="showLoading">
        <EtfOverviewCardSkeleton
          v-for="(_, index) in skeletonCards"
          :key="`industry-event-skeleton-${index}`"
          :rows="5"
        />
      </template>

      <EtfEventsIndustryOverviewCard
        v-for="industry in items"
        :key="`${industry.industry?.code || 'unknown'}-${selectedDate}`"
        :industry="industry"
        :detail-query="detailQuery"
        :share-unit="shareUnit"
      />
    </div>

    <div v-if="!items.length && !showLoading" class="empty-state">目前沒有符合條件的產業資料</div>

    <div class="footer-actions" v-if="hasMore">
      <button
        class="load-more-button"
        type="button"
        :disabled="loadingMore"
        @click="$emit('load-more')"
      >
        {{ loadingMore ? '載入中' : '載入更多產業' }}
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

.coverage-warning {
  color: #fde047;
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
