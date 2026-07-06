<script setup>
import { computed } from 'vue'
import { ArrowUpRight, Info } from 'lucide-vue-next'
import { formatRatio, formatShare, shareColumnLabel } from '@/utils/etfDashboard.js'
import { getStockCode, getStockName } from '@/utils/stock.js'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  selectedDate: {
    type: String,
    default: ''
  },
  shareUnit: {
    type: String,
    default: 'share'
  }
})

const holdings = computed(() => (Array.isArray(props.group.holdings) ? props.group.holdings : []))
const displayDate = computed(() => props.group.display_date || props.selectedDate || '-')
const hasCarriedForward = computed(() =>
  holdings.value.some((holding) => Boolean(holding.is_carried_forward))
)

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
      return 'tone-up'
    case 'not_updated':
      return 'tone-warn'
    case 'fetch_failed':
      return 'tone-down'
    default:
      return 'tone-muted'
  }
}

const progressPercentage = (value) => {
  const ratio = Number(value)
  if (!Number.isFinite(ratio)) return 0
  return Math.min(100, Math.max(0, ratio))
}

const shareTooltip = (holding) => {
  const label = shareColumnLabel(props.shareUnit, '持股')
  const value = formatShare(holding.holding_shares, props.shareUnit)
  return `${label}：${value}`
}

const detailRoute = (holding) => ({
  name: 'Dashboard_Etf_Holdings_Detail',
  params: {
    etfCode: String(props.group.etf_code),
    stockCode: getStockCode(holding.stock)
  }
})
</script>

<template>
  <article class="overview-card">
    <header class="card-header">
      <div class="fund-identity">
        <span class="fund-code">{{ group.etf_code || '-' }}</span>
        <h2>{{ group.etf_name || 'ETF 前十大持股' }}</h2>
      </div>

      <el-tag :class="statusTone(group.status)" effect="dark" round size="small">
        {{ statusLabel(group.status) }}
      </el-tag>
    </header>

    <div class="card-summary">
      <span>資料日 {{ displayDate }}</span>
      <span>{{ holdings.length }} 檔持股</span>
      <span v-if="hasCarriedForward" class="carried-forward">含延用資料</span>
    </div>

    <div v-if="holdings.length" class="holding-list">
      <div
        v-for="holding in holdings"
        :key="`${group.etf_code}-${getStockCode(holding.stock)}`"
        class="holding-row"
      >
        <div class="holding-rank" aria-hidden="true">
          {{ holding.holding_rank || holding.source_rank || '-' }}
        </div>

        <div class="holding-main">
          <div class="holding-heading">
            <div class="stock-identity">
              <strong>{{ getStockName(holding.stock, '-') }}</strong>
              <span>{{ getStockCode(holding.stock) || '-' }}</span>
            </div>

            <strong class="holding-ratio">{{ formatRatio(holding.holding_ratio) }}</strong>
          </div>

          <el-tooltip
            :content="shareTooltip(holding)"
            placement="top"
            effect="dark"
            popper-class="holding-share-tooltip"
          >
            <button
              class="weight-visual"
              type="button"
              :aria-label="`${getStockName(holding.stock, getStockCode(holding.stock))}，${shareTooltip(holding)}，權重 ${formatRatio(holding.holding_ratio)}`"
            >
              <el-progress
                :percentage="progressPercentage(holding.holding_ratio)"
                :show-text="false"
                :stroke-width="6"
                color="#22d3ee"
              />
            </button>
          </el-tooltip>
        </div>

        <router-link
          v-if="getStockCode(holding.stock)"
          class="detail-link"
          :to="detailRoute(holding)"
          :aria-label="`查看 ${getStockName(holding.stock, getStockCode(holding.stock))} 詳情`"
        >
          <ArrowUpRight :size="14" aria-hidden="true" />
        </router-link>
      </div>
    </div>

    <div v-else class="card-empty">
      <strong>沒有持股資料</strong>
      <span>{{ displayDate }} 尚無可顯示的前十大持股。</span>
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

.carried-forward {
  color: #facc15;
}

.holding-list {
  display: grid;
  flex: 1;
  border-top: 1px solid rgb(148 163 184 / 0.12);
}

.holding-row {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 6px 14px;
  border-bottom: 1px solid rgb(148 163 184 / 0.1);
  transition: background-color 0.16s ease;
}

.holding-row:last-child {
  border-bottom: 0;
}

.holding-row:hover {
  background: rgb(34 211 238 / 0.035);
}

.holding-rank {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border: 1px solid rgb(148 163 184 / 0.14);
  border-radius: 7px;
  background: rgb(255 255 255 / 0.025);
  color: #718197;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  font-weight: 900;
}

.holding-main {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.holding-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
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

.holding-ratio {
  flex: 0 0 auto;
  color: #d9f7fb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.weight-visual {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 13px;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: #5f7188;
  cursor: help;
}

.weight-visual:focus-visible {
  outline: 2px solid rgb(34 211 238 / 0.75);
  outline-offset: 4px;
  border-radius: 4px;
}

.weight-visual :deep(.el-progress) {
  width: 100%;
}

.weight-visual :deep(.el-progress-bar__outer) {
  background-color: rgb(148 163 184 / 0.1);
}

.weight-visual :deep(.el-progress-bar__inner) {
  box-shadow: 0 0 12px rgb(34 211 238 / 0.22);
}

.detail-link {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 8px;
  border: 1px solid rgb(148 163 184 / 0.14);
  border-radius: 7px;
  background: rgb(255 255 255 / 0.025);
  color: #9cabbc;
  font-size: 11px;
  font-weight: 900;
  text-decoration: none;
  white-space: nowrap;
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

.tone-up {
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

.tone-down {
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

  .holding-row {
    grid-template-columns: 24px minmax(0, 1fr) 30px;
    gap: 8px;
    padding-inline: 12px;
  }

  .detail-link {
    width: 30px;
    padding: 0;
  }

  .detail-link span {
    position: absolute;
    overflow: hidden;
    width: 1px;
    height: 1px;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .overview-card,
  .holding-row,
  .detail-link {
    transition: none;
  }

  .overview-card:hover {
    transform: none;
  }
}
</style>
