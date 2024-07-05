<script setup>
import dayjs from 'dayjs'
import { add, subtract, multiply } from '@/composables/math.js'
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

//Stock Now
const nowPrice = computed(() => props.stockPrice ?? 0)

//Show Info
const totalDividend = computed(() => 0)
const totalUnrealized = computed(() =>
  multiply(subtract(nowPrice.value, buyPrice.value), buyNum.value)
)
const total = computed(() => add(totalDividend.value, totalUnrealized.value))
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
      <div class="font-bold">{{ totalDividend }}</div>
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
