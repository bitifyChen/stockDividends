<script setup>
import EtfEventsOverviewCard from '@/components/dashboard/EtfEventsOverviewCard.vue'
import EtfOverviewCardSkeleton from '@/components/dashboard/EtfOverviewCardSkeleton.vue'

defineProps({
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
  displayedEventCount: {
    type: Number,
    default: 0
  },
  updatedEtfCount: {
    type: Number,
    default: 0
  },
  trackedEtfCount: {
    type: Number,
    default: 0
  },
  notUpdatedEtfCount: {
    type: Number,
    default: 0
  },
  notStartedEtfCount: {
    type: Number,
    default: 0
  },
  failedEtfCount: {
    type: Number,
    default: 0
  },
  loadingData: {
    type: Boolean,
    default: false
  },
  loadingMore: {
    type: Boolean,
    default: false
  },
  groupedCards: {
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
  selectedType: {
    type: String,
    default: 'all'
  },
  shareUnit: {
    type: String,
    default: 'share'
  }
})

defineEmits(['load-more'])
</script>

<template>
  <section class="console-panel">
    <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

    <div class="summary-line">
      <div>
        <strong>{{ selectedDate || '最新資料' }}</strong>
        <span>全 ETF 當日進出總覽</span>
      </div>
      <div>
        <span>ETF / 事件</span>
        <strong>{{ totalCount }} / {{ displayedEventCount }}</strong>
      </div>
    </div>

    <div class="metric-strip">
      <div class="metric-box">
        <span>已更新 ETF</span>
        <strong>{{ updatedEtfCount }}</strong>
      </div>
      <div class="metric-box">
        <span>追蹤 ETF</span>
        <strong>{{ trackedEtfCount }}</strong>
      </div>
      <div class="metric-box">
        <span>未更新 / 未開始 / 失敗</span>
        <strong>{{ notUpdatedEtfCount }} / {{ notStartedEtfCount }} / {{ failedEtfCount }}</strong>
      </div>
    </div>

    <div class="card-grid">
      <template v-if="loadingData && !groupedCards.length">
        <EtfOverviewCardSkeleton
          v-for="(_, index) in skeletonCards"
          :key="`event-skeleton-${index}`"
          :rows="6"
          variant="events"
        />
      </template>

      <EtfEventsOverviewCard
        v-for="card in groupedCards"
        :key="`${card.etf_code}-${card.display_date}`"
        :group="card"
        :selected-date="selectedDate"
        :selected-type="selectedType"
        :share-unit="shareUnit"
      />
    </div>

    <div v-if="!groupedCards.length && !loadingData" class="empty-state">
      目前沒有符合條件的進出資料
    </div>

    <div class="footer-actions" v-if="hasMore">
      <button
        class="load-more-button"
        type="button"
        :disabled="loadingMore"
        @click="$emit('load-more')"
      >
        {{ loadingMore ? '載入中' : '載入更多' }}
      </button>
    </div>

    <slot name="after" />
  </section>
</template>
