<script setup>
import { computed } from 'vue'
import { round, multiply, divide } from '@/composables/useMath.js'
const props = defineProps({
  totalEarn: {
    type: Number || String,
    default: 0
  },
  totalCost: {
    type: Number || String,
    default: 0
  }
})
const totalYield = computed(() =>
  round(multiply(divide(props.totalEarn ?? 0, props.totalCost ?? 0), 100), 2)
)
</script>

<template>
  <div>
    <div>殖利率</div>
    <div class="flex justify-between items-center">
      <div class="text-[var(--text-secondary-color)] text-[14px]">
        <div class="">
          今年股利
          <span class="text-[var(--main-primary-color)]">{{
            Number(totalEarn).toLocaleString()
          }}</span>
        </div>
        <div class="">
          投資總成本
          <span class="text-[var(--main-primary-color)]">{{
            Number(totalCost).toLocaleString()
          }}</span>
        </div>
      </div>
      <div class="text-[var(--main-sub-color)] text-[48px] font-black">{{ totalYield }}%</div>
    </div>
  </div>
</template>

<style scoped></style>
