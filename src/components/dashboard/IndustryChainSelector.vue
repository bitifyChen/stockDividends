<script setup>
import { computed, ref } from 'vue'
import {
  flattenIndustryChainTree,
  getIndustryChainCount,
  getIndustryChainName,
  getIndustryChainStageLabel,
  hasIndustryChainStocks,
  normalizeIndustryChainCode
} from '@/utils/industryChain.js'

const props = defineProps({
  nodes: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const keyword = ref('')
const flattenedNodes = computed(() => flattenIndustryChainTree(props.nodes))
const filteredNodes = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  if (!value) return flattenedNodes.value
  return flattenedNodes.value.filter((node) =>
    `${node.code || ''} ${getIndustryChainName(node)} ${getIndustryChainStageLabel(node.stage)}`
      .toLowerCase()
      .includes(value)
  )
})
const skeletonRows = computed(() => Array.from({ length: 6 }))

const selectNode = (node) => {
  if (!hasIndustryChainStocks(node)) return
  const code = normalizeIndustryChainCode(node.code)
  emit('update:modelValue', code)
  emit('select', node)
}
</script>

<template>
  <aside class="industry-chain-selector">
    <div class="selector-heading">
      <span>產業鏈</span>
      <strong>{{ flattenedNodes.length }}</strong>
    </div>

    <label class="selector-search">
      <input v-model="keyword" type="search" placeholder="搜尋節點或代碼" />
    </label>

    <div v-if="loading && !flattenedNodes.length" class="selector-skeleton">
      <div v-for="(_, index) in skeletonRows" :key="index" class="selector-skeleton-row" />
    </div>

    <div v-else class="selector-list">
      <button
        v-for="node in filteredNodes"
        :key="node.code"
        class="selector-node"
        :class="{
          active: normalizeIndustryChainCode(node.code) === modelValue,
          disabled: !hasIndustryChainStocks(node)
        }"
        :style="{ '--node-depth': node.depth }"
        type="button"
        :disabled="!hasIndustryChainStocks(node)"
        @click="selectNode(node)"
      >
        <span class="node-title">{{ getIndustryChainName(node) }}</span>
        <span class="node-meta">
          <em>{{ node.code }}</em>
          <small>{{ getIndustryChainStageLabel(node.stage) }}</small>
        </span>
        <strong v-if="getIndustryChainCount(node) !== null">{{
          getIndustryChainCount(node)
        }}</strong>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.industry-chain-selector {
  display: grid;
  gap: 14px;
  min-width: 0;
  border: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
  border-radius: 22px;
  background: var(--dashboard-section-bg);
  box-shadow: var(--dashboard-section-shadow);
  padding: 16px;
}

.selector-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 12px;
  font-weight: 900;
}

.selector-heading strong {
  color: var(--dashboard-accent, #67e8f9);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.selector-list {
  display: grid;
  gap: 8px;
  max-height: 620px;
  overflow: auto;
  padding-right: 2px;
}

.selector-search input {
  width: 100%;
  height: 38px;
  border: 1px solid var(--dashboard-control-border, rgb(148 163 184 / 0.14));
  border-radius: 12px;
  background: var(--dashboard-control-bg, rgb(255 255 255 / 0.04));
  padding: 0 12px;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 13px;
  font-weight: 850;
  outline: 0;
}

.selector-search input:focus {
  border-color: rgb(34 211 238 / 0.38);
}

.selector-node {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 10px;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  padding: 10px 10px 10px calc(10px + var(--node-depth, 0) * 15px);
  color: var(--dashboard-text-secondary, #cbd5e1);
  text-align: left;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease;
}

.selector-node:hover:not(:disabled),
.selector-node:focus-visible:not(:disabled) {
  border-color: rgb(34 211 238 / 0.24);
  background: rgb(34 211 238 / 0.08);
  color: var(--dashboard-text-primary, #f8fbff);
}

.selector-node:focus-visible {
  outline: 2px solid rgb(34 211 238 / 0.62);
  outline-offset: 2px;
}

.selector-node.active {
  border-color: rgb(34 211 238 / 0.34);
  background: linear-gradient(135deg, rgb(34 211 238 / 0.18), rgb(14 165 233 / 0.07));
  color: var(--dashboard-text-primary, #f8fbff);
}

.selector-node.disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.node-title {
  overflow: hidden;
  font-size: 13px;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-meta {
  display: flex;
  min-width: 0;
  gap: 6px;
  grid-column: 1;
  color: var(--dashboard-text-muted, #7c8794);
  font-size: 10px;
  font-weight: 850;
}

.node-meta em,
.node-meta small {
  overflow: hidden;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selector-node strong {
  grid-column: 2;
  grid-row: 1 / span 2;
  color: var(--dashboard-accent, #67e8f9);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 950;
}

.selector-skeleton {
  display: grid;
  gap: 9px;
}

.selector-skeleton-row {
  position: relative;
  overflow: hidden;
  height: 48px;
  border-radius: 14px;
  background: rgb(148 163 184 / 0.08);
}

.selector-skeleton-row::after {
  position: absolute;
  inset: 0;
  animation: selector-shimmer 1.2s infinite;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.08), transparent);
  content: '';
  transform: translateX(-100%);
}

:global(.dashboard-theme-light) .industry-chain-selector {
  background: var(--dashboard-section-bg);
}

:global(.dashboard-theme-light) .selector-node:hover:not(:disabled),
:global(.dashboard-theme-light) .selector-node:focus-visible:not(:disabled),
:global(.dashboard-theme-light) .selector-node.active {
  border-color: rgb(8 145 178 / 0.2);
  background: rgb(8 145 178 / 0.08);
}

@keyframes selector-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
