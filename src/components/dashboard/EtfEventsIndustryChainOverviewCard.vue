<script setup>
import { computed } from 'vue'
import {
  formatDecimalRatio,
  formatMarketAmount,
  normalizeArray,
  formatShare,
  shareColumnLabel
} from '@/utils/etfDashboard.js'
import { getStockCode, getStockName } from '@/utils/stock.js'

const props = defineProps({
  chain: {
    type: Object,
    required: true
  },
  shareUnit: {
    type: String,
    default: 'share'
  }
})

const identity = computed(() => props.chain.industryChain || props.chain.industry_chain || {})
const chainCode = computed(() => identity.value.code || identity.value.chain_code || '-')
const chainName = computed(() => identity.value.name || identity.value.chain_name || '未分類產業鏈')
const estimatedNetAmount = computed(() => Number(props.chain.estimated_net_amount || 0))
const netShares = computed(() => Number(props.chain.net_shares || 0))
const topSegments = computed(() => normalizeArray(props.chain.topSegments).slice(0, 3))
const topAmountStocks = computed(() => normalizeArray(props.chain.topStocks?.amount).slice(0, 3))

const amountTone = computed(() => {
  if (estimatedNetAmount.value > 0) return 'value-up'
  if (estimatedNetAmount.value < 0) return 'value-down'
  return 'value-neutral'
})

const shareTone = computed(() => {
  if (netShares.value > 0) return 'value-up'
  if (netShares.value < 0) return 'value-down'
  return 'value-neutral'
})

const formatSignedShare = (value) => {
  const numericValue = Number(value || 0)
  return `${numericValue > 0 ? '+' : ''}${formatShare(numericValue, props.shareUnit)}`
}

const segmentIdentity = (segment) => segment?.industryChain || segment?.industry_chain || {}
const stockRoute = (stock) => {
  const stockCode = getStockCode(stock?.stock)
  return stockCode
    ? {
        name: 'Dashboard_Etf_Stocks_Detail',
        params: { stockCode }
      }
    : undefined
}
</script>

<template>
  <article class="chain-overview-card">
    <header class="chain-card-header">
      <div class="chain-identity">
        <span>{{ chainCode }}</span>
        <h3>{{ chainName }}</h3>
      </div>
      <strong>{{ Number(chain.event_etf_count || 0) }} ETF</strong>
    </header>

    <div class="hero-metric">
      <span>分攤估算交易額</span>
      <strong>{{ formatMarketAmount(chain.estimated_amount) }}</strong>
    </div>

    <div class="amount-ledger">
      <div>
        <span>估買金額</span>
        <strong class="value-up">{{ formatMarketAmount(chain.estimated_buy_amount) }}</strong>
      </div>
      <div>
        <span>估賣金額</span>
        <strong class="value-down">{{ formatMarketAmount(chain.estimated_sell_amount) }}</strong>
      </div>
      <div>
        <span>估淨金額</span>
        <strong :class="amountTone">{{ formatMarketAmount(estimatedNetAmount) }}</strong>
      </div>
    </div>

    <div class="count-strip">
      <div>
        <span>異動股票</span>
        <strong>{{ Number(chain.event_stock_count || 0) }}</strong>
      </div>
      <div>
        <span>異動 ETF</span>
        <strong>{{ Number(chain.event_etf_count || 0) }}</strong>
      </div>
      <div>
        <span>{{ shareColumnLabel(shareUnit, '淨') }}</span>
        <strong :class="shareTone">{{ formatSignedShare(netShares) }}</strong>
      </div>
    </div>

    <div class="ratio-strip">
      <span>量能占比 {{ formatDecimalRatio(chain.volume_ratio) }}</span>
      <span>金額占比 {{ formatDecimalRatio(chain.amount_ratio) }}</span>
    </div>

    <div v-if="topSegments.length" class="segment-list">
      <span>主要鏈節</span>
      <div v-for="segment in topSegments" :key="segmentIdentity(segment).code" class="segment-row">
        <div>
          <strong>{{ segmentIdentity(segment).name || '未命名鏈節' }}</strong>
          <small>{{ segmentIdentity(segment).code || '-' }}</small>
        </div>
        <em>{{ formatMarketAmount(segment.estimated_amount) }}</em>
      </div>
    </div>

    <div v-if="topAmountStocks.length" class="top-stock-list">
      <span>代表個股</span>
      <component
        :is="stockRoute(stock) ? 'router-link' : 'div'"
        v-for="(stock, index) in topAmountStocks"
        :key="`${getStockCode(stock.stock) || 'unknown'}-${index}`"
        class="top-stock-row"
        :to="stockRoute(stock)"
      >
        <div>
          <strong>{{ getStockName(stock.stock, '-') }}</strong>
          <small>{{ getStockCode(stock.stock) || '-' }}</small>
        </div>
        <em>{{ formatMarketAmount(stock.estimated_amount) }}</em>
      </component>
    </div>
  </article>
</template>

<style scoped>
.chain-overview-card {
  position: relative;
  display: grid;
  min-width: 0;
  gap: 14px;
  overflow: hidden;
  border: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
  border-radius: 18px;
  background: radial-gradient(circle at 100% 0%, rgb(245 158 11 / 0.13), transparent 32%),
    radial-gradient(circle at 0% 100%, rgb(34 211 238 / 0.1), transparent 34%),
    var(--dashboard-section-bg);
  box-shadow: var(--dashboard-section-shadow);
  padding: 16px;
  color: var(--dashboard-text-secondary, #cbd5e1);
  transition:
    border-color 0.18s ease,
    transform 0.18s ease;
}

.chain-overview-card:hover {
  border-color: rgb(245 158 11 / 0.34);
  transform: translateY(-2px);
}

.chain-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.chain-card-header > strong {
  flex: 0 0 auto;
  border: 1px solid rgb(245 158 11 / 0.24);
  border-radius: 999px;
  background: rgb(245 158 11 / 0.1);
  color: #fbbf24;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 950;
  line-height: 1;
  padding: 7px 9px;
}

.chain-identity {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.chain-identity span {
  color: #fbbf24;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 950;
  letter-spacing: 0.05em;
}

.chain-identity h3 {
  overflow: hidden;
  margin: 0;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 18px;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-metric {
  display: grid;
  gap: 5px;
}

.hero-metric span,
.amount-ledger span,
.count-strip span,
.ratio-strip span,
.segment-list > span,
.top-stock-list > span {
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 11px;
  font-weight: 900;
}

.hero-metric strong {
  color: var(--dashboard-text-primary, #f8fbff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: clamp(24px, 3vw, 34px);
  font-weight: 950;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
}

.amount-ledger,
.count-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--main-border-color, rgb(148 163 184 / 0.12));
}

.amount-ledger > div,
.count-strip > div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.amount-ledger strong,
.count-strip strong {
  overflow: hidden;
  color: var(--dashboard-text-primary, #f8fbff);
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
}

.segment-list,
.top-stock-list {
  display: grid;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--main-border-color, rgb(148 163 184 / 0.12));
}

.segment-row,
.top-stock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.top-stock-row {
  border-radius: 10px;
  color: inherit;
  text-decoration: none;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.top-stock-row:hover,
.top-stock-row:focus-visible {
  background: rgb(34 211 238 / 0.08);
  color: var(--dashboard-text-primary, #f8fbff);
}

.segment-row div,
.top-stock-row div {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.segment-row strong,
.top-stock-row strong {
  overflow: hidden;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 12px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.segment-row small,
.top-stock-row small {
  color: var(--dashboard-text-muted, #7c8794);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  font-weight: 850;
}

.segment-row em,
.top-stock-row em {
  color: color-mix(in srgb, #fbbf24 76%, var(--dashboard-text-primary, #f8fbff));
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-style: normal;
  font-weight: 950;
  white-space: nowrap;
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

:global(.dashboard-theme-light) .chain-overview-card {
  background: radial-gradient(circle at 100% 0%, rgb(217 119 6 / 0.1), transparent 32%),
    radial-gradient(circle at 0% 100%, rgb(8 145 178 / 0.08), transparent 34%),
    var(--dashboard-section-bg);
}

:global(.dashboard-theme-light) .chain-card-header > strong {
  border-color: rgb(217 119 6 / 0.18);
  background: rgb(217 119 6 / 0.08);
  color: #b45309;
}

:global(.dashboard-theme-light) .chain-identity span {
  color: #b45309;
}

@media (max-width: 560px) {
  .amount-ledger,
  .count-strip {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chain-overview-card {
    transition: none;
  }

  .chain-overview-card:hover {
    transform: none;
  }
}
</style>
