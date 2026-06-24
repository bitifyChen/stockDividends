<script setup>
import { computed } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import { formatShare, shareColumnLabel } from '@/utils/etfDashboard.js'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  selectedDate: {
    type: String,
    default: ''
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

const events = computed(() => (Array.isArray(props.group.events) ? props.group.events : []))
const displayDate = computed(() => props.group.display_date || props.selectedDate || '-')

const typeLabels = {
  all: '全部異動',
  first_buy: '首買',
  buy_increase: '加碼',
  first_sell: '首賣',
  sell_decrease: '減碼',
  sell_out: '出清'
}

const statusLabel = (status) => {
  switch (status) {
    case 'updated':
      return '已更新'
    case 'not_updated':
      return '未更新'
    case 'not_started':
      return '未開始'
    case 'fetch_failed':
      return '更新失敗'
    default:
      return status || '未知狀態'
  }
}

const statusTone = (status) => {
  switch (status) {
    case 'updated':
      return 'tone-updated'
    case 'not_updated':
      return 'tone-warn'
    case 'fetch_failed':
      return 'tone-failed'
    default:
      return 'tone-muted'
  }
}

const eventLabel = (event) => {
  if (event.event_type) return typeLabels[event.event_type] || event.event_type
  if (event.is_first_buy) return '首買'
  if (event.is_buy_increase) return '加碼'
  if (event.is_sell_out) return '出清'
  if (event.is_sell_decrease) return '減碼'
  if (event.is_first_sell) return '首賣'
  return '持股異動'
}

const changeValue = (event) => Number(event.change_shares ?? event.delta_shares ?? 0)
const isBuyEvent = (event) => {
  if (changeValue(event) !== 0) return changeValue(event) > 0
  return ['first_buy', 'buy_increase'].includes(event.event_type)
}

const eventTone = (event) => (isBuyEvent(event) ? 'event-buy' : 'event-sell')

const formatSignedShare = (event) => {
  const value = changeValue(event)
  return `${value > 0 ? '+' : ''}${formatShare(value, props.shareUnit)}`
}

const changePercentage = (event) => {
  const previous = Math.abs(Number(event.previous_shares || 0))
  const current = Math.abs(Number(event.current_shares || 0))
  const change = Math.abs(changeValue(event))
  if (!previous) return current || change ? 100 : 0
  return (change / previous) * 100
}

const formatPercentage = (event) => {
  const percentage = changePercentage(event)
  if (!Number.isFinite(percentage)) return '-'
  return `${percentage >= 100 ? percentage.toFixed(0) : percentage.toFixed(1)}%`
}

const eventTooltip = (event) => {
  const unitLabel = shareColumnLabel(props.shareUnit)
  const previous = formatShare(event.previous_shares, props.shareUnit)
  const current = formatShare(event.current_shares, props.shareUnit)
  return `前次${unitLabel}：${previous}｜目前${unitLabel}：${current}｜本次變動：${formatSignedShare(event)}｜幅度：${formatPercentage(event)}`
}

const eventGroupOrder = (event) => (isBuyEvent(event) ? 0 : 1)
const sortedEvents = computed(() =>
  [...events.value].sort((a, b) => {
    const groupDiff = eventGroupOrder(a) - eventGroupOrder(b)
    if (groupDiff !== 0) return groupDiff
    return changePercentage(b) - changePercentage(a)
  })
)
const hasScrollableEvents = computed(() => sortedEvents.value.length > 10)

const detailRoute = (event) => ({
  name: 'Dashboard_Etf_Holdings_Detail',
  params: {
    etfCode: String(props.group.etf_code),
    stockCode: String(event.stock_code)
  }
})
</script>

<template>
  <article class="overview-card">
    <header class="card-header">
      <div class="fund-identity">
        <span class="fund-code">{{ group.etf_code || '-' }}</span>
        <h2>{{ group.etf_name || 'ETF 當日進出' }}</h2>
      </div>

      <el-tag :class="statusTone(group.status)" effect="dark" round size="small">
        {{ statusLabel(group.status) }}
      </el-tag>
    </header>

    <div class="card-summary">
      <span>資料日 {{ displayDate }}</span>
      <span>{{ group.eventCount ?? events.length }} 筆異動</span>
      <span>{{ typeLabels[selectedType] || selectedType }}</span>
      <span v-if="group.eventsHasMore" class="has-more">尚有更多資料</span>
    </div>

    <el-scrollbar
      v-if="events.length"
      class="event-scroll"
      :class="{ 'is-scrollable': hasScrollableEvents }"
    >
      <div class="event-list">
        <div
          v-for="event in sortedEvents"
          :key="`${group.etf_code}-${event.stock_code}-${event.snapshot_date}-${event.event_type}`"
          class="event-row"
        >
          <el-tag class="event-type" :class="eventTone(event)" effect="plain" round size="small">
            {{ eventLabel(event) }}
          </el-tag>

          <div class="event-main">
            <div class="stock-identity">
              <strong>{{ event.stock_name || '-' }}</strong>
              <span>{{ event.stock_code || '-' }}</span>
            </div>
          </div>

          <div class="event-metrics">
            <el-tooltip
              :content="eventTooltip(event)"
              placement="top"
              effect="dark"
              popper-class="event-share-tooltip"
            >
              <button
                class="change-percent"
                type="button"
                :class="eventTone(event)"
                :aria-label="`${event.stock_name || event.stock_code}，${eventTooltip(event)}`"
              >
                {{ formatPercentage(event) }}
              </button>
            </el-tooltip>

            <strong class="event-change" :class="eventTone(event)">
              {{ formatSignedShare(event) }}
            </strong>
          </div>

          <router-link
            v-if="event.stock_code"
            class="detail-link"
            :to="detailRoute(event)"
            :aria-label="`查看 ${event.stock_name || event.stock_code} 詳情`"
          >
            <ArrowUpRight :size="14" aria-hidden="true" />
          </router-link>
        </div>
      </div>
    </el-scrollbar>

    <div v-else class="card-empty">
      <strong>{{ group.status === 'updated' ? '本日沒有進出異動' : '尚無事件資料' }}</strong>
      <span>{{ displayDate }} 沒有符合目前條件的持股異動。</span>
    </div>
  </article>
</template>

<style scoped>
.overview-card {
  position: relative;
  display: flex;
  overflow: hidden;
  min-width: 0;
  height: 100%;
  flex-direction: column;
  border: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
  border-radius: 16px;
  background: radial-gradient(circle at 100% 0%, rgb(34 211 238 / 0.07), transparent 30%),
    var(--main-surface-color, #0f1320);
  color: #dbe7f3;
  box-shadow:
    0 16px 36px rgb(0 0 0 / 0.16),
    inset 0 1px 0 rgb(255 255 255 / 0.03);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  border-color: rgb(34 211 238 / 0.3);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
}

.fund-identity {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.fund-code {
  color: #67e8f9;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

h2 {
  overflow: hidden;
  margin: 0;
  color: #f4f8fc;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  min-height: 34px;
  padding: 0 18px 12px;
  color: #8392a6;
  font-size: 11px;
  font-weight: 800;
}

.has-more {
  color: #facc15;
}

.event-scroll {
  flex: 1;
  border-top: 1px solid rgb(148 163 184 / 0.12);
}

.event-scroll.is-scrollable {
  max-height: 470px;
}

.event-list {
  display: grid;
}

.event-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 8px 14px;
  border-bottom: 1px solid rgb(148 163 184 / 0.1);
  transition: background-color 0.16s ease;
}

.event-row:last-child {
  border-bottom: 0;
}

.event-row:hover {
  background: rgb(34 211 238 / 0.035);
}

.event-main {
  display: grid;
  min-width: 0;
}

.stock-identity {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 7px;
}

.stock-identity strong {
  overflow: hidden;
  color: #eef6ff;
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stock-identity span {
  flex: 0 0 auto;
  color: #6f8198;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  font-weight: 800;
}

.event-metrics {
  display: grid;
  min-width: 76px;
  justify-items: end;
  gap: 3px;
}

.event-change,
.change-percent {
  flex: 0 0 auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-variant-numeric: tabular-nums;
}

.event-change {
  font-size: 11px;
}

.change-percent {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: help;
  font-size: 12px;
  font-weight: 900;
}

.change-percent:focus-visible {
  outline: 2px solid rgb(34 211 238 / 0.75);
  outline-offset: 3px;
  border-radius: 4px;
}

.event-buy {
  border-color: color-mix(in srgb, var(--stock-rise-color) 34%, transparent);
  background: color-mix(in srgb, var(--stock-rise-color) 11%, transparent);
  color: var(--stock-rise-color);
}

.event-sell {
  border-color: color-mix(in srgb, var(--stock-fall-color) 34%, transparent);
  background: color-mix(in srgb, var(--stock-fall-color) 11%, transparent);
  color: var(--stock-fall-color);
}

.detail-link {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  border: 1px solid rgb(148 163 184 / 0.14);
  border-radius: 7px;
  background: rgb(255 255 255 / 0.025);
  color: #9cabbc;
  text-decoration: none;
  transition:
    border-color 0.16s ease,
    color 0.16s ease,
    background-color 0.16s ease;
}

.detail-link:hover,
.detail-link:focus-visible {
  border-color: rgb(34 211 238 / 0.32);
  background: rgb(34 211 238 / 0.08);
  color: #67e8f9;
}

.detail-link:focus-visible {
  outline: 2px solid rgb(34 211 238 / 0.6);
  outline-offset: 2px;
}

.card-empty {
  display: grid;
  min-height: 160px;
  flex: 1;
  align-content: center;
  justify-items: center;
  gap: 6px;
  padding: 24px;
  border-top: 1px solid rgb(148 163 184 / 0.12);
  color: #718197;
  text-align: center;
}

.card-empty strong {
  color: #b8c4d2;
  font-size: 13px;
}

.card-empty span {
  font-size: 11px;
  line-height: 1.6;
}

.tone-updated {
  border-color: rgb(34 211 238 / 0.24);
  background: rgb(34 211 238 / 0.12);
  color: #67e8f9;
}

.tone-warn {
  border-color: rgb(250 204 21 / 0.24);
  background: rgb(250 204 21 / 0.1);
  color: #fde047;
}

.tone-muted {
  border-color: rgb(148 163 184 / 0.2);
  background: rgb(148 163 184 / 0.1);
  color: #a8b5c5;
}

.tone-failed {
  border-color: rgb(248 113 113 / 0.24);
  background: rgb(248 113 113 / 0.1);
  color: #fca5a5;
}

@media (max-width: 520px) {
  .card-header {
    padding: 16px 14px 10px;
  }

  .card-summary {
    padding: 0 14px 10px;
  }

  .event-row {
    grid-template-columns: minmax(0, 1fr) auto 30px;
    gap: 8px;
    padding-inline: 12px;
  }

  .event-type {
    grid-column: 1 / -1;
    justify-self: start;
  }

  .detail-link {
    width: 30px;
    padding: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .overview-card,
  .event-row,
  .detail-link {
    transition: none;
  }

  .overview-card:hover {
    transform: none;
  }
}
</style>
