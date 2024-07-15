<script setup>
import dayjs from 'dayjs'
import { add } from '@/composables/useMath.js'
import { computed } from 'vue'
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  stockPrice: {
    type: Number,
    required: true
  }
})

//Stock Have
const buyPrice = computed(() => props.item.buyPrice ?? 0)
const buyNum = computed(() => props.item.buyNum ?? 0)
const buyDateShow = computed(() => dayjs(props.item.buyDate).format('YYYY-MM-DD') ?? '-')

//Show Info
const totalDividend = computed(() => props?.item?.earnDividend ?? null)
const totalDividendShow = computed(() =>
  totalDividend.value !== null ? totalDividend.value : '尚未更新'
)
const totalUnrealized = computed(() => props?.item?.earnPrice ?? null)
const total = computed(() => add(totalDividend.value ?? 0, totalUnrealized.value ?? 0))
</script>

<template>
  <div class="py-[10px] text-[var(--text-secondary-color)]">
    <div class="flex justify-between">
      <div class="font-black text-[color:var(--text-main-color)] text-[18px]">
        <span class="text-[14px]">$</span> {{ buyPrice }}
      </div>
      <div class="font-black text-[color:var(--text-main-color)] text-[14px]">{{ buyNum }}股</div>
    </div>
    <div class="flex justify-between items-center">
      <div class="">購入日</div>
      <div class="">{{ buyDateShow }}</div>
    </div>
    <div class="flex justify-between items-center">
      <div class="">已領股利</div>
      <div class="font-bold">{{ totalDividendShow }}</div>
    </div>
    <div class="flex justify-between items-center">
      <div class="">未實現價差</div>
      <div class="font-bold">
        {{ totalUnrealized }}
      </div>
    </div>
    <div
      class="text-[24px] font-bold text-right"
      :class="{
        'text-[var(--main-fall-color)]': totalUnrealized < 0,
        'text-[var(--main-rise-color)]': totalUnrealized > 0
      }"
    >
      {{ total }}
    </div>
  </div>
  <!-- <template #right>
        <van-button square text="售出" type="danger" class="delete-button" />
      </template> -->
</template>

<style scoped></style>
