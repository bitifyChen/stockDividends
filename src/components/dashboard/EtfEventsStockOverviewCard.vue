<script setup>
import { computed } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import { formatDecimalRatio, formatMarketAmount, formatShare } from '@/utils/etfDashboard.js'
import { getStockIndustryName } from '@/utils/industry.js'
import { getStockCode, getStockName } from '@/utils/stock.js'

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
const estimatedBuyAmount = computed(() => Number(props.stock.estimated_buy_amount || 0))
const estimatedSellAmount = computed(() => Number(props.stock.estimated_sell_amount || 0))
const estimatedNetAmount = computed(() => Number(props.stock.estimated_net_amount || 0))
const hasAmountData = computed(
  () =>
    Number(props.stock.ohlc_success_count || 0) > 0 ||
    estimatedBuyAmount.value !== 0 ||
    estimatedSellAmount.value !== 0 ||
    estimatedNetAmount.value !== 0
)
const netTone = computed(() => {
  if (netShares.value > 0) return 'value-up'
  if (netShares.value < 0) return 'value-down'
  return 'value-neutral'
})
const amountTone = computed(() => {
  if (estimatedNetAmount.value > 0) return 'value-up'
  if (estimatedNetAmount.value < 0) return 'value-down'
  return 'value-neutral'
})
const visibleEvents = computed(() => events.value.slice(0, 8))
const hiddenEventCount = computed(() =>
  Math.max(0, events.value.length - visibleEvents.value.length)
)
const stockObject = computed(() => props.stock.stock || {})
const stockCode = computed(() => getStockCode(stockObject.value))
const stockName = computed(() => getStockName(stockObject.value))
const stockIndustryName = computed(() =>
  stockObject.value.industry_code ? getStockIndustryName(stockObject.value) : ''
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

const eventChangeShares = (event) => Number(event.change_shares ?? event.delta_shares ?? 0)
const eventEstimatedAmount = (event) =>
  event.ohlc?.estimated_net_amount ?? event.estimated_net_amount ?? event.ohlc?.estimated_amount

const formatSignedShare = (value) => {
  const numericValue = Number(value || 0)
  return `${numericValue > 0 ? '+' : ''}${formatShare(numericValue, props.shareUnit)}`
}

const formatEventAmount = (event) => {
  const value = eventEstimatedAmount(event)
  if (value === null || value === undefined || value === '') return '無估值'
  return formatMarketAmount(value)
}

const detailRoute = computed(() => ({
  name: 'Dashboard_Etf_Stocks_Detail',
  params: {
    stockCode: stockCode.value
  }
}))

const eventDetailRoute = (event) => ({
  name: 'Dashboard_Etf_Holdings_Detail',
  params: {
    etfCode: String(event.etf_code),
    stockCode: stockCode.value
  }
})
</script>

<template>
  <article class="stock-overview-card">
    <header class="stock-card-header">
      <div class="stock-identity">
        <div class="stock-meta-line">
          <span class="stock-code">{{ stockCode || '-' }}</span>
          <span v-if="stockIndustryName" class="industry-tag">{{ stockIndustryName }}</span>
        </div>
        <h3>{{ stockName }}</h3>
      </div>

      <router-link
        v-if="stockCode"
        class="stock-detail-link"
        :to="detailRoute"
        :aria-label="`檢視 ${stockName || stockCode} 個股觀測`"
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

    <div v-if="hasAmountData" class="amount-ledger">
      <div>
        <span>估買金額</span>
        <strong class="value-up">{{ formatMarketAmount(estimatedBuyAmount) }}</strong>
      </div>
      <div>
        <span>估賣金額</span>
        <strong class="value-down">{{ formatMarketAmount(estimatedSellAmount) }}</strong>
      </div>
      <div>
        <span>估淨金額</span>
        <strong :class="amountTone">{{ formatMarketAmount(estimatedNetAmount) }}</strong>
      </div>
    </div>

    <div v-if="hasAmountData" class="ratio-strip">
      <span>量能占比 {{ formatDecimalRatio(stock.volume_ratio) }}</span>
      <span>金額占比 {{ formatDecimalRatio(stock.amount_ratio) }}</span>
    </div>
    <div v-else class="ohlc-note">尚無成交價資料</div>

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
        :key="`${stockCode}-${event.etf_code}-${event.event_type}`"
        class="event-chip"
        :class="eventTone(event)"
        :to="eventDetailRoute(event)"
        :aria-label="`檢視 ${event.etf_code || 'ETF'} 對 ${stockName || stockCode} 的分析`"
      >
        <span>{{ event.etf_code || '-' }}</span>
        <strong>{{ eventLabel(event) }}</strong>
        <small>
          {{ formatSignedShare(eventChangeShares(event)) }} · {{ formatEventAmount(event) }}
        </small>
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

.stock-meta-line {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.stock-code {
  flex: 0 0 auto;
  color: #67e8f9;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.industry-tag {
  display: inline-flex;
  max-width: 132px;
  min-height: 20px;
  align-items: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, #67e8f9 24%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, #67e8f9 10%, transparent);
  padding: 0 8px;
  color: color-mix(in srgb, #67e8f9 84%, #f8fbff);
  font-size: 11px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
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

:global(.dashboard-theme-light) .industry-tag {
  border-color: rgb(8 145 178 / 0.18);
  background: rgb(8 145 178 / 0.08);
  color: #0e7490;
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

.amount-ledger {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 10px 0 0;
  border-top: 1px solid var(--main-border-color, rgb(148 163 184 / 0.12));
}

.amount-ledger > div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.amount-ledger span,
.ratio-strip span {
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 11px;
  font-weight: 900;
}

.amount-ledger strong {
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 15px;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ratio-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: -4px;
}

.ohlc-note {
  border-top: 1px solid var(--main-border-color, rgb(148 163 184 / 0.12));
  padding-top: 10px;
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 12px;
  font-weight: 900;
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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  min-height: 28px;
}

.event-chip {
  display: grid;
  gap: 6px;
  min-height: 48px;
  align-content: center;
  border: 1px solid var(--dashboard-control-border, rgb(148 163 184 / 0.14));
  border-radius: 12px;
  padding: 7px 9px;
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
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-chip strong {
  line-height: 1;
}

.event-chip small {
  overflow: hidden;
  color: var(--dashboard-text-muted, #7c8794);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  min-height: 32px;
  color: var(--dashboard-text-muted, #7c8794);
}

@media (max-width: 560px) {
  .share-ledger,
  .amount-ledger,
  .etf-count-strip {
    grid-template-columns: 1fr;
  }

  .event-chip-list {
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
