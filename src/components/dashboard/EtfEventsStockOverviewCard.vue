<script setup>
import { computed } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import { formatShare } from '@/utils/etfDashboard.js'

const props = defineProps({
  stock: {
    type: Object,
    required: true
  },
  shareUnit: {
    type: String,
    default: 'share'
  }
})

const events = computed(() => (Array.isArray(props.stock.events) ? props.stock.events : []))
const buyShares = computed(() => Number(props.stock.buy_shares || 0))
const sellShares = computed(() => Number(props.stock.sell_shares || 0))
const netShares = computed(() => Number(props.stock.net_shares || 0))
const netTone = computed(() => {
  if (netShares.value > 0) return 'value-up'
  if (netShares.value < 0) return 'value-down'
  return 'value-neutral'
})
const visibleEvents = computed(() => events.value.slice(0, 8))
const hiddenEventCount = computed(() =>
  Math.max(0, events.value.length - visibleEvents.value.length)
)

const eventTypeLabels = {
  first_buy: '首買',
  buy_increase: '加碼',
  first_sell: '首賣',
  sell_decrease: '減碼',
  sell_out: '出清'
}

const isBuyEvent = (event) => {
  const change = Number(event.change_shares ?? event.delta_shares ?? 0)
  if (change !== 0) return change > 0
  return ['first_buy', 'buy_increase'].includes(event.event_type)
}

const eventLabel = (event) =>
  eventTypeLabels[event.event_type] || (isBuyEvent(event) ? '買進' : '賣出')

const eventTone = (event) => (isBuyEvent(event) ? 'event-buy' : 'event-sell')

const formatSignedShare = (value) => {
  const numericValue = Number(value || 0)
  return `${numericValue > 0 ? '+' : ''}${formatShare(numericValue, props.shareUnit)}`
}

const detailRoute = computed(() => ({
  name: 'Dashboard_Etf_Stocks_Detail',
  params: {
    stockCode: String(props.stock.stock_code)
  }
}))

const eventDetailRoute = (event) => ({
  name: 'Dashboard_Etf_Holdings_Detail',
  params: {
    etfCode: String(event.etf_code),
    stockCode: String(props.stock.stock_code)
  }
})
</script>

<template>
  <article class="stock-overview-card">
    <header class="stock-card-header">
      <div class="stock-identity">
        <span>{{ stock.stock_code || '-' }}</span>
        <h3>{{ stock.stock_name || '未命名股票' }}</h3>
      </div>

      <router-link
        v-if="stock.stock_code"
        class="stock-detail-link"
        :to="detailRoute"
        :aria-label="`檢視 ${stock.stock_name || stock.stock_code} 個股觀測`"
      >
        <ArrowUpRight :size="14" aria-hidden="true" />
      </router-link>
    </header>

    <div class="share-ledger">
      <div>
        <span>買進數</span>
        <strong class="value-up">{{ formatShare(buyShares, shareUnit) }}</strong>
      </div>
      <div>
        <span>賣出數</span>
        <strong class="value-down">{{ formatShare(sellShares, shareUnit) }}</strong>
      </div>
      <div>
        <span>淨變動</span>
        <strong :class="netTone">{{ formatSignedShare(netShares) }}</strong>
      </div>
    </div>

    <div class="etf-count-strip">
      <el-tooltip content="當日首買或加碼這檔股票的主動 ETF 數量" placement="top" effect="dark">
        <div class="etf-count-item">
          <span>買進 ETF</span>
          <strong class="value-up">{{ Number(stock.buy_etf_count || 0) }}</strong>
        </div>
      </el-tooltip>

      <el-tooltip
        content="當日首賣、減碼或出清這檔股票的主動 ETF 數量"
        placement="top"
        effect="dark"
      >
        <div class="etf-count-item">
          <span>賣出 ETF</span>
          <strong class="value-down">{{ Number(stock.sell_etf_count || 0) }}</strong>
        </div>
      </el-tooltip>
    </div>

    <div class="event-chip-list">
      <router-link
        v-for="event in visibleEvents"
        :key="`${stock.stock_code}-${event.etf_code}-${event.event_type}`"
        class="event-chip"
        :class="eventTone(event)"
        :to="eventDetailRoute(event)"
        :aria-label="`檢視 ${event.etf_code || 'ETF'} 對 ${stock.stock_name || stock.stock_code} 的分析`"
      >
        <span>{{ event.etf_code || '-' }}</span>
        <strong>{{ eventLabel(event) }}</strong>
      </router-link>
      <div v-if="hiddenEventCount" class="event-chip more">+{{ hiddenEventCount }}</div>
    </div>
  </article>
</template>

<style scoped>
.stock-overview-card {
  position: relative;
  display: grid;
  min-width: 0;
  gap: 14px;
  overflow: hidden;
  border: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
  border-radius: 18px;
  background: var(--dashboard-section-bg);
  box-shadow: var(--dashboard-section-shadow);
  padding: 16px;
  color: var(--dashboard-text-secondary, #cbd5e1);
  transition:
    border-color 0.18s ease,
    transform 0.18s ease;
}

.stock-overview-card:hover {
  border-color: rgb(34 211 238 / 0.32);
  transform: translateY(-2px);
}

.stock-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.stock-identity {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.stock-identity span {
  color: #67e8f9;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.stock-identity h3 {
  overflow: hidden;
  margin: 0;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 18px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stock-detail-link {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--dashboard-control-border, rgb(148 163 184 / 0.14));
  border-radius: 10px;
  background: var(--dashboard-control-bg, rgb(255 255 255 / 0.04));
  color: var(--dashboard-text-secondary, #cbd5e1);
  text-decoration: none;
}

.stock-detail-link:hover,
.stock-detail-link:focus-visible {
  border-color: rgb(34 211 238 / 0.36);
  color: #67e8f9;
}

.share-ledger > div {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 2px 0;
}

.share-ledger span {
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 11px;
  font-weight: 900;
}

.share-ledger strong {
  color: var(--dashboard-text-primary, #f8fbff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: clamp(17px, 2vw, 22px);
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.share-ledger {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 4px 0 2px;
}

.etf-count-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
}

.etf-count-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  cursor: help;
}

.etf-count-item span {
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 11px;
  font-weight: 900;
}

.etf-count-item strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 16px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.value-up {
  color: var(--stock-rise-color) !important;
}

.value-down {
  color: var(--stock-fall-color) !important;
}

.value-neutral {
  color: var(--dashboard-text-muted, #7c8794) !important;
}

.event-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 28px;
}

.event-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  border: 1px solid var(--dashboard-control-border, rgb(148 163 184 / 0.14));
  border-radius: 999px;
  padding: 0 9px;
  font-size: 11px;
  font-weight: 900;
  text-decoration: none;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    transform 0.16s ease;
}

.event-chip:hover,
.event-chip:focus-visible {
  transform: translateY(-1px);
}

.event-chip:focus-visible {
  outline: 2px solid rgb(34 211 238 / 0.68);
  outline-offset: 2px;
}

.event-chip span {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.event-buy {
  border-color: color-mix(in srgb, var(--stock-rise-color) 34%, transparent);
  background: color-mix(in srgb, var(--stock-rise-color) 10%, transparent);
  color: var(--stock-rise-color);
}

.event-sell {
  border-color: color-mix(in srgb, var(--stock-fall-color) 34%, transparent);
  background: color-mix(in srgb, var(--stock-fall-color) 10%, transparent);
  color: var(--stock-fall-color);
}

.event-chip.more {
  color: var(--dashboard-text-muted, #7c8794);
}

@media (max-width: 560px) {
  .share-ledger,
  .etf-count-strip {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stock-overview-card {
    transition: none;
  }

  .stock-overview-card:hover,
  .event-chip:hover,
  .event-chip:focus-visible {
    transform: none;
  }
}
</style>
