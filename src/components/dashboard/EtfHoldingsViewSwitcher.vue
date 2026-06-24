<script setup>
import { LayoutGrid, Rows3 } from 'lucide-vue-next'

defineProps({
  activeMode: {
    type: String,
    required: true,
    validator: (value) => ['overview', 'list'].includes(value)
  }
})

const modes = [
  {
    key: 'overview',
    label: '總覽',
    description: '跨 ETF',
    routeName: 'Dashboard_Etf_Holdings_Overview',
    icon: LayoutGrid
  },
  {
    key: 'list',
    label: '列表',
    description: '單一 ETF',
    routeName: 'Dashboard_Etf_Holdings',
    icon: Rows3
  }
]
</script>

<template>
  <nav class="view-switcher" aria-label="持股檢視方式">
    <div class="switcher-options">
      <router-link
        v-for="mode in modes"
        :key="mode.key"
        class="mode-option"
        :class="{ active: activeMode === mode.key }"
        :to="{ name: mode.routeName }"
        :aria-current="activeMode === mode.key ? 'page' : undefined"
      >
        <component :is="mode.icon" :size="16" aria-hidden="true" />
        <span>
          <strong>{{ mode.label }}</strong>
          <small>{{ mode.description }}</small>
        </span>
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
.view-switcher {
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 18px;
}

.switcher-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.switcher-copy > span {
  color: #708096;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.switcher-copy > strong {
  overflow: hidden;
  color: #dce7f2;
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.switcher-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  min-width: 60px;
  padding: 4px;
  border: 1px solid rgb(148 163 184 / 0.12);
  border-radius: 11px;
  background: rgb(5 7 11 / 0.64);
}

.mode-option {
  display: flex;
  min-width: 0;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #8291a5;
  text-decoration: none;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease;
}

.mode-option > span {
  display: grid;
  gap: 1px;
  line-height: 1.2;
}

.mode-option strong {
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.mode-option small {
  color: #65758b;
  font-size: 9px;
  font-weight: 800;
}

.mode-option:hover {
  color: #c8d5e2;
  background: rgb(255 255 255 / 0.035);
}

.mode-option.active {
  border-color: rgb(34 211 238 / 0.24);
  background: rgb(34 211 238 / 0.1);
  color: #67e8f9;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.035);
}

.mode-option.active small {
  color: #8bdce8;
}

.mode-option:focus-visible {
  outline: 2px solid rgb(34 211 238 / 0.65);
  outline-offset: 2px;
}

@media (max-width: 680px) {
  .view-switcher {
    align-items: stretch;
    flex-direction: column;
    padding: 14px;
  }

  .switcher-options {
    min-width: 0;
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mode-option {
    transition: none;
  }
}
</style>
