<script setup>
import { computed } from 'vue'
import {
  flattenIndustryChainTree,
  getIndustryChainCount,
  getIndustryChainName,
  hasIndustryChainStocks,
  normalizeIndustryChainCode
} from '@/utils/industryChain.js'
import { getStockCode, getStockIndustryChains, getStockName } from '@/utils/stock.js'

const props = defineProps({
  nodes: {
    type: Array,
    default: () => []
  },
  flow: {
    type: Object,
    default: null
  },
  stocks: {
    type: Array,
    default: () => []
  },
  selectedCode: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

const stageMeta = {
  upstream: {
    label: '上游',
    subtitle: 'UPSTREAM',
    tone: 'upstream',
    color: '#60a5fa'
  },
  midstream: {
    label: '中游',
    subtitle: 'MIDSTREAM',
    tone: 'midstream',
    color: '#f59e0b'
  },
  downstream: {
    label: '下游',
    subtitle: 'DOWNSTREAM',
    tone: 'downstream',
    color: '#fb7185'
  }
}

const stageKeys = ['upstream', 'midstream', 'downstream']
const flattenedNodes = computed(() => flattenIndustryChainTree(props.nodes))
const normalizedStocks = computed(() => props.stocks.map((item) => item?.stock || item || {}))

const fallbackFlow = computed(() =>
  stageKeys.reduce((groups, stage) => {
    groups[stage] = flattenedNodes.value.filter((node) => node.stage === stage)
    return groups
  }, {})
)

const stageGroups = computed(() =>
  stageKeys.map((stage) => {
    const nodes = Array.isArray(props.flow?.[stage])
      ? props.flow[stage]
      : fallbackFlow.value[stage] || []
    return {
      key: stage,
      ...stageMeta[stage],
      nodes
    }
  })
)

const nodeCount = (node) => Number(getIndustryChainCount(node) ?? node?.stock_count ?? 0)

const totalStageCount = computed(() =>
  stageGroups.value.reduce(
    (summary, group) => ({
      ...summary,
      [group.key]: group.nodes.reduce((total, node) => total + nodeCount(node), 0)
    }),
    {}
  )
)

const stockChains = (stock) => getStockIndustryChains(stock)

const stocksForNode = (node) =>
  normalizedStocks.value
    .filter((stock) => stockChains(stock).some((chain) => chain.code === node.code))
    .slice(0, 10)

const marketLabel = (market) => {
  if (market === 'listed') return '上市'
  if (market === 'otc') return '上櫃'
  if (market === 'emerging') return '興櫃'
  return market || '-'
}

const selectNode = (node) => {
  if (!hasIndustryChainStocks(node)) return
  emit('select', node)
}

const skeletonColumns = computed(() => Array.from({ length: 3 }))

const sankeyNodes = computed(() => {
  const xByStage = {
    upstream: 78,
    midstream: 500,
    downstream: 922
  }

  return stageGroups.value.flatMap((group) => {
    const sortedNodes = [...group.nodes]
      .sort((a, b) => nodeCount(b) - nodeCount(a))
      .slice(0, group.key === 'midstream' ? 5 : 6)
    const rowGap = 252 / Math.max(sortedNodes.length, 1)

    return sortedNodes.map((node, index) => ({
      ...node,
      stage: group.key,
      color: group.color,
      x: xByStage[group.key],
      y: 44 + rowGap * index + rowGap / 2,
      value: Math.max(nodeCount(node), 1)
    }))
  })
})

const sankeyNodesByStage = computed(() =>
  stageKeys.reduce((groups, stage) => {
    groups[stage] = sankeyNodes.value.filter((node) => node.stage === stage)
    return groups
  }, {})
)

const createSankeyLinks = (fromNodes, toNodes) => {
  if (!fromNodes.length || !toNodes.length) return []
  const topTargets = [...toNodes].sort((a, b) => b.value - a.value).slice(0, 4)

  return fromNodes.flatMap((source) =>
    topTargets.map((target, index) => ({
      id: `${source.code}-${target.code}-${index}`,
      source,
      target,
      width: Math.max(4, Math.min(26, Math.sqrt(Math.min(source.value, target.value)) * 1.4)),
      opacity: 0.1 + Math.min(0.14, Math.min(source.value, target.value) / 1200)
    }))
  )
}

const sankeyLinks = computed(() => [
  ...createSankeyLinks(
    sankeyNodesByStage.value.upstream || [],
    sankeyNodesByStage.value.midstream || []
  ),
  ...createSankeyLinks(
    sankeyNodesByStage.value.midstream || [],
    sankeyNodesByStage.value.downstream || []
  )
])

const sankeyPath = (link) => {
  const startX = link.source.x + 12
  const endX = link.target.x - 12
  const controlOffset = Math.max(120, (endX - startX) * 0.44)
  return `M ${startX} ${link.source.y} C ${startX + controlOffset} ${link.source.y}, ${
    endX - controlOffset
  } ${link.target.y}, ${endX} ${link.target.y}`
}
</script>

<template>
  <section class="industry-flow-map">
    <header class="flow-heading">
      <div>
        <span>產業鏈流向圖</span>
        <h2>上游 / 中游 / 下游供應鏈節點</h2>
      </div>
      <p>先看供應鏈流向，再點擊節點切換下方股票對照清單。</p>
    </header>

    <div v-if="loading" class="flow-skeleton">
      <div v-for="(_, index) in skeletonColumns" :key="index" class="flow-skeleton-column">
        <div class="flow-skeleton-title" />
        <div class="flow-skeleton-card" />
        <div class="flow-skeleton-card short" />
      </div>
    </div>

    <template v-else>
      <section class="sankey-panel">
        <header>
          <div>
            <strong>Sankey Diagram</strong>
            <span>節點大小代表該分類成分股數量，線條呈現上中下游關聯。</span>
          </div>
          <div class="sankey-legend">
            <span v-for="stage in stageGroups" :key="stage.key" :class="stage.tone">
              {{ stage.label }}
            </span>
          </div>
        </header>

        <svg class="sankey-svg" viewBox="0 0 1000 340" role="img" aria-label="產業鏈河流圖">
          <path
            v-for="link in sankeyLinks"
            :key="link.id"
            class="sankey-link"
            :d="sankeyPath(link)"
            :stroke-width="link.width"
            :style="{ opacity: link.opacity }"
          />

          <g
            v-for="node in sankeyNodes"
            :key="`${node.stage}-${node.code}`"
            class="sankey-node"
            :class="{ active: normalizeIndustryChainCode(node.code) === selectedCode }"
            role="button"
            tabindex="0"
            @click="selectNode(node)"
            @keydown.enter.prevent="selectNode(node)"
            @keydown.space.prevent="selectNode(node)"
          >
            <rect
              :x="node.x - 7"
              :y="node.y - 34"
              width="14"
              height="68"
              rx="3"
              :fill="node.color"
            />
            <text
              :x="node.stage === 'downstream' ? node.x - 24 : node.x + 24"
              :y="node.y + 4"
              :text-anchor="node.stage === 'downstream' ? 'end' : 'start'"
            >
              {{ getIndustryChainName(node) }}
            </text>
          </g>
        </svg>
      </section>

      <div class="stage-board">
        <section
          v-for="group in stageGroups"
          :key="group.key"
          class="stage-column"
          :class="group.tone"
        >
          <header class="stage-header">
            <div>
              <h3>{{ group.label }}</h3>
              <span>{{ group.subtitle }}</span>
            </div>
            <strong>{{ totalStageCount[group.key] || group.nodes.length }} 檔</strong>
          </header>

          <div class="stage-scroll">
            <article
              v-for="node in group.nodes"
              :key="node.code"
              class="stage-node"
              :style="{ '--stage-color': group.color }"
              :class="{
                active: normalizeIndustryChainCode(node.code) === selectedCode,
                disabled: !hasIndustryChainStocks(node)
              }"
            >
              <button
                type="button"
                :disabled="!hasIndustryChainStocks(node)"
                @click="selectNode(node)"
              >
                <span>{{ node.code }}</span>
                <strong>{{ getIndustryChainName(node) }}</strong>
                <small>{{ getIndustryChainCount(node) ?? node.stock_count ?? '-' }} 檔</small>
              </button>

              <div v-if="stocksForNode(node).length" class="stage-stock-list">
                <router-link
                  v-for="stock in stocksForNode(node)"
                  :key="`${node.code}-${getStockCode(stock)}`"
                  class="stage-stock-row"
                  :to="{
                    name: 'Dashboard_Etf_Stocks_Detail',
                    params: { stockCode: getStockCode(stock) }
                  }"
                >
                  <span>{{ getStockCode(stock) }}</span>
                  <strong>{{ getStockName(stock) }}</strong>
                  <em>{{ marketLabel(stock.market) }}</em>
                </router-link>
              </div>
            </article>
          </div>
        </section>
      </div>
    </template>
  </section>
</template>

<style scoped>
.industry-flow-map {
  display: grid;
  min-width: 0;
  gap: 18px;
}

.flow-heading,
.sankey-panel,
.stage-column,
.flow-skeleton-column {
  border: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
  background: var(--dashboard-section-bg);
  box-shadow: var(--dashboard-section-shadow);
}

.flow-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  border-radius: 24px;
  padding: clamp(16px, 2vw, 22px);
}

.flow-heading div {
  display: grid;
  gap: 6px;
}

.flow-heading span {
  color: var(--dashboard-accent, #67e8f9);
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.08em;
}

.flow-heading h2 {
  margin: 0;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: clamp(20px, 2vw, 28px);
  font-weight: 950;
  letter-spacing: -0.04em;
}

.flow-heading p {
  max-width: 430px;
  margin: 0;
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.7;
}

.sankey-panel {
  display: grid;
  gap: 16px;
  overflow: hidden;
  border-radius: 24px;
  padding: clamp(16px, 2vw, 22px);
}

.sankey-panel header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.sankey-panel header div:first-child {
  display: grid;
  gap: 5px;
}

.sankey-panel strong {
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 14px;
  font-weight: 950;
}

.sankey-panel span {
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 12px;
  font-weight: 850;
}

.sankey-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sankey-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 950;
}

.sankey-legend span::before {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  content: '';
}

.sankey-legend .upstream::before {
  background: #60a5fa;
}

.sankey-legend .midstream::before {
  background: #f59e0b;
}

.sankey-legend .downstream::before {
  background: #fb7185;
}

.sankey-svg {
  width: 100%;
  min-height: 320px;
}

.sankey-link {
  fill: none;
  stroke: color-mix(in srgb, var(--dashboard-text-secondary, #cbd5e1) 82%, transparent);
  stroke-linecap: round;
}

.sankey-node {
  cursor: pointer;
}

.sankey-node text {
  fill: var(--dashboard-text-primary, #f8fbff);
  font-size: 13px;
  font-weight: 950;
  paint-order: stroke;
  stroke: rgb(5 8 14 / 0.72);
  stroke-width: 4px;
}

.sankey-node.active rect {
  filter: drop-shadow(0 0 14px rgb(34 211 238 / 0.42));
}

.stage-board,
.flow-skeleton {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.stage-column,
.flow-skeleton-column {
  min-width: 0;
  border-radius: 18px;
  padding: 16px;
}

.stage-column {
  display: grid;
  gap: 14px;
}

.stage-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.stage-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 950;
  letter-spacing: -0.04em;
}

.stage-header span {
  display: block;
  margin-top: 3px;
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 11px;
  font-weight: 950;
  letter-spacing: 0.12em;
}

.stage-header strong {
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  padding: 4px 9px;
  color: var(--dashboard-text-secondary, #cbd5e1);
  font-size: 12px;
  font-weight: 950;
}

.upstream .stage-header h3 {
  color: #60a5fa;
}

.midstream .stage-header h3 {
  color: #f59e0b;
}

.downstream .stage-header h3 {
  color: #fb7185;
}

.stage-scroll {
  display: grid;
  gap: 12px;
  max-height: 520px;
  overflow: auto;
  padding-right: 4px;
  overscroll-behavior: contain;
}

.stage-node {
  display: grid;
  gap: 8px;
}

.stage-node > button {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--stage-color) 38%, transparent);
  border-radius: 14px;
  background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--stage-color) 16%, transparent),
      transparent
    ),
    rgb(255 255 255 / 0.045);
  box-shadow: inset 3px 0 0 color-mix(in srgb, var(--stage-color) 86%, transparent);
  padding: 11px 12px 11px 14px;
  color: var(--dashboard-text-secondary, #cbd5e1);
  text-align: left;
}

.stage-node > button:hover:not(:disabled),
.stage-node > button:focus-visible:not(:disabled),
.stage-node.active > button {
  border-color: color-mix(in srgb, var(--stage-color) 62%, transparent);
  background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--stage-color) 24%, transparent),
      transparent
    ),
    rgb(255 255 255 / 0.055);
}

.stage-node > button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.stage-node > button span,
.stage-node > button small {
  color: color-mix(in srgb, var(--stage-color) 72%, var(--dashboard-text-muted, #7c8794));
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 900;
}

.stage-node > button strong {
  overflow: hidden;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 13px;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage-stock-list {
  display: grid;
  gap: 6px;
}

.stage-stock-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  border: 1px solid rgb(148 163 184 / 0.08);
  border-radius: 12px;
  background: rgb(5 10 23 / 0.26);
  padding: 9px 10px;
  color: var(--dashboard-text-secondary, #cbd5e1);
  text-decoration: none;
}

.stage-stock-row:hover {
  border-color: rgb(34 211 238 / 0.22);
  background: rgb(34 211 238 / 0.06);
}

.stage-stock-row span {
  color: var(--dashboard-text-primary, #f8fbff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 950;
}

.stage-stock-row strong {
  overflow: hidden;
  font-size: 12px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage-stock-row em {
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  padding: 2px 7px;
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 10px;
  font-style: normal;
  font-weight: 900;
}

.flow-skeleton-column {
  display: grid;
  gap: 10px;
}

.flow-skeleton-title,
.flow-skeleton-card {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  background: rgb(148 163 184 / 0.08);
}

.flow-skeleton-title {
  height: 26px;
}

.flow-skeleton-card {
  height: 104px;
}

.flow-skeleton-card.short {
  height: 84px;
}

.flow-skeleton-title::after,
.flow-skeleton-card::after {
  position: absolute;
  inset: 0;
  animation: flow-shimmer 1.2s infinite;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.08), transparent);
  content: '';
  transform: translateX(-100%);
}

:global(.dashboard-theme-light) .stage-node > button,
:global(.dashboard-theme-light) .stage-stock-row {
  background: rgb(255 255 255 / 0.46);
}

:global(.dashboard-theme-light) .stage-node > button {
  background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--stage-color) 13%, transparent),
      transparent
    ),
    rgb(255 255 255 / 0.7);
}

:global(.dashboard-theme-light) .sankey-node text {
  stroke: rgb(255 255 255 / 0.76);
}

@media (max-width: 1180px) {
  .stage-board,
  .flow-skeleton {
    grid-template-columns: 1fr;
  }

  .stage-scroll {
    max-height: 420px;
  }
}

@media (max-width: 760px) {
  .flow-heading,
  .sankey-panel header {
    align-items: flex-start;
    flex-direction: column;
  }

  .sankey-panel {
    overflow-x: auto;
  }

  .sankey-svg {
    min-width: 820px;
  }
}

@keyframes flow-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
