<script setup>
import { computed } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import {
  formatDecimalRatio,
  formatMarketAmount,
  formatShare,
  shareColumnLabel
} from '@/utils/etfDashboard.js'
import { getIndustryName, normalizeIndustryCode } from '@/utils/industry.js'
import { getStockCode, getStockName } from '@/utils/stock.js'

const props = defineProps({
  industry: {
    type: Object,
    required: true
  },
  detailQuery: {
    type: Object,
    default: () => ({})
  },
  shareUnit: {
    type: String,
    default: 'share'
  }
})

const industryCode = computed(() => normalizeIndustryCode(props.industry.industry?.code))
const industryName = computed(() => getIndustryName(industryCode.value, '未分類產業'))
const estimatedNetAmount = computed(() => Number(props.industry.estimated_net_amount || 0))
const netShares = computed(() => Number(props.industry.net_shares || 0))
const topAmountStocks = computed(() =>
  Array.isArray(props.industry.topStocks?.amount) ? props.industry.topStocks.amount.slice(0, 3) : []
)
const detailRoute = computed(() => ({
  name: 'Dashboard_Etf_Events_Industry_Detail',
  params: {
    industryCode: industryCode.value || 'unknown'
  },
  query: props.detailQuery
}))

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
</script>

<template>
  <article class="industry-overview-card">
    <header class="industry-card-header">
      <div class="industry-identity">
        <h3>{{ industryName }}</h3>
      </div>

      <router-link
        class="industry-detail-link"
        :to="detailRoute"
        :aria-label="`檢視 ${industryName} 產業明細`"
      >
        <ArrowUpRight :size="14" aria-hidden="true" />
      </router-link>
    </header>

    <div class="hero-metric">
      <span>估算總交易額</span>
      <strong>{{ formatMarketAmount(industry.estimated_amount) }}</strong>
    </div>

    <div class="amount-ledger">
      <div>
        <span>估買金額</span>
        <strong class="value-up">{{ formatMarketAmount(industry.estimated_buy_amount) }}</strong>
      </div>
      <div>
        <span>估賣金額</span>
        <strong class="value-down">{{ formatMarketAmount(industry.estimated_sell_amount) }}</strong>
      </div>
      <div>
        <span>估淨金額</span>
        <strong :class="amountTone">{{ formatMarketAmount(estimatedNetAmount) }}</strong>
      </div>
    </div>

    <div class="count-strip">
      <div>
        <span>異動股票</span>
        <strong>{{ Number(industry.event_stock_count || 0) }}</strong>
      </div>
      <div>
        <span>異動 ETF</span>
        <strong>{{ Number(industry.event_etf_count || 0) }}</strong>
      </div>
      <div>
        <span>{{ shareColumnLabel(shareUnit, '淨') }}</span>
        <strong :class="shareTone">{{ formatSignedShare(netShares) }}</strong>
      </div>
    </div>

    <div class="ratio-strip">
      <span>量能占比 {{ formatDecimalRatio(industry.volume_ratio) }}</span>
      <span>金額占比 {{ formatDecimalRatio(industry.amount_ratio) }}</span>
    </div>

    <div v-if="topAmountStocks.length" class="top-stock-list">
      <span>代表個股</span>
      <div v-for="stock in topAmountStocks" :key="getStockCode(stock.stock)" class="top-stock-row">
        <div>
          <strong>{{ getStockName(stock.stock, '-') }}</strong>
          <small>{{ getStockCode(stock.stock) || '-' }}</small>
        </div>
        <em>{{ formatMarketAmount(stock.estimated_amount) }}</em>
      </div>
    </div>
  </article>
</template>

<style scoped>
.industry-overview-card {
  position: relative;
  display: grid;
  min-width: 0;
  gap: 14px;
  overflow: hidden;
  border: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
  border-radius: 18px;
  background: radial-gradient(circle at 100% 0%, rgb(34 211 238 / 0.12), transparent 32%),
    var(--dashboard-section-bg);
  box-shadow: var(--dashboard-section-shadow);
  padding: 16px;
  color: var(--dashboard-text-secondary, #cbd5e1);
  transition:
    border-color 0.18s ease,
    transform 0.18s ease;
}

.industry-overview-card:hover {
  border-color: rgb(34 211 238 / 0.32);
  transform: translateY(-2px);
}

.industry-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.industry-identity {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.industry-identity h3 {
  overflow: hidden;
  margin: 0;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 18px;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.industry-detail-link {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(34 211 238 / 0.2);
  border-radius: 10px;
  background: rgb(34 211 238 / 0.08);
  color: #67e8f9;
  text-decoration: none;
  opacity: 0.86;
}

.industry-detail-link:hover,
.industry-detail-link:focus-visible {
  border-color: rgb(34 211 238 / 0.36);
  opacity: 0.9;
}

.hero-metric {
  display: grid;
  gap: 5px;
}

.hero-metric span,
.amount-ledger span,
.count-strip span,
.ratio-strip span {
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

.top-stock-list {
  display: grid;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--main-border-color, rgb(148 163 184 / 0.12));
}

.top-stock-list > span {
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 11px;
  font-weight: 900;
}

.top-stock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.top-stock-row div {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.top-stock-row strong {
  overflow: hidden;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 12px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-stock-row small {
  color: var(--dashboard-text-muted, #7c8794);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  font-weight: 850;
}

.top-stock-row em {
  color: color-mix(in srgb, #67e8f9 78%, var(--dashboard-text-primary, #f8fbff));
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

:global(.dashboard-theme-light) .industry-overview-card {
  background: radial-gradient(circle at 100% 0%, rgb(8 145 178 / 0.1), transparent 32%),
    var(--dashboard-section-bg);
}

:global(.dashboard-theme-light) .industry-detail-link {
  border-color: rgb(8 145 178 / 0.18);
  background: rgb(8 145 178 / 0.08);
  color: #0e7490;
}

@media (max-width: 560px) {
  .amount-ledger,
  .count-strip {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .industry-overview-card {
    transition: none;
  }

  .industry-overview-card:hover {
    transform: none;
  }
}
</style>
