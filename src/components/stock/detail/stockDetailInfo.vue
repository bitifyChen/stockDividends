<script setup>
import { computed } from 'vue'
import { add, subtract, multiply, divide, round } from '@/composables/useMath.js'
const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})
const buyNum = computed(() => props.data?.buyNum ?? 0)
const buyPrice = computed(() => props.data?.buyPrice ?? 0)
const buyPriceAve = computed(() => round(divide(props.data?.buyPrice, props.data?.buyNum), 2) ?? 0)
const nowPrice = computed(() => multiply(props.data?.buyNum, nowPriceAve.value) ?? 0)
const nowPriceAve = computed(() => props.data?.price ?? 0)
const totalDividend = computed(
  () => props?.data?.data?.reduce((acc, current) => add(acc, current?.earnDividend ?? 0), 0) ?? 0
)
const totalUnrealized = computed(() => subtract(nowPrice.value, buyPrice.value) ?? 0)
</script>


<template>
  <div>
    <div>股票概要</div>
    <div class="text-[var(--text-secondary-color)] text-[14px] space-y-1">
      <div
        class="flex justify-between border-dashed border-b-2 border-[var(--text-secondary-color)s]"
      >
        数量
        <span class="text-[var(--main-primary-color)] font-black">{{
          buyNum.toLocaleString()
        }}</span>
      </div>
      <div
        class="flex justify-between border-dashed border-b-2 border-[var(--text-secondary-color)s]"
      >
        <div class="">均價<br />市值</div>
        <div class="text-[var(--main-primary-color)] font-black text-end">
          {{ buyPriceAve }}
          <br />
          {{ nowPriceAve }}
        </div>
      </div>
      <div
        class="flex justify-between border-dashed border-b-2 border-[var(--text-secondary-color)s]"
      >
        <div class="">總股利</div>
        <div class="font-black text-end text-[var(--main-rise-color)] text-[18px]">
          $ {{ totalDividend.toLocaleString() }}
        </div>
      </div>
      <div
        class="flex justify-between border-dashed border-b-2 border-[var(--text-secondary-color)s]"
      >
        <div>總買價<br />總市值</div>
        <div class="text-[var(--main-primary-color)] font-black text-end">
          {{ buyPrice.toLocaleString() }} <br />
          {{ nowPrice.toLocaleString() }} <br />
          <span
            class="text-[18px]"
            :class="{
              'text-[var(--main-fall-color)]': totalUnrealized < 0,
              'text-[var(--main-rise-color)]': totalUnrealized >= 0
            }"
            >$ {{ totalUnrealized.toLocaleString() }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
</style>