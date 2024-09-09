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
const sellPrice = computed(() => props.item.sellPrice ?? 0)
const isSell = computed(() => props.item.sellDate)
//Show Info
const totalDividend = computed(() => props?.item?.earnDividend ?? null)
const totalDividendShow = computed(() =>
  totalDividend.value !== null ? totalDividend.value : '尚未更新'
)
const totalUnrealized = computed(() => props?.item?.earnPrice ?? null)
const total = computed(() => add(totalDividend.value ?? 0, totalUnrealized.value ?? 0))
</script>

<template>
  <div class="p-[6px] text-[var(--text-secondary-color)]">
    <div class="flex justify-between">
      <div class="font-black text-[color:var(--text-main-color)]">
        {{ buyDateShow }}
      </div>
      <div class="font-black text-[color:var(--text-main-color)]">{{ buyNum }}股</div>
    </div>
    <div class="flex justify-between items-center">
      <div class="">購入價</div>
      <div class="">{{ buyPrice }}</div>
    </div>
    <div class="flex justify-between items-center" v-if="isSell">
      <div class="">售出價</div>
      <div class="">{{ sellPrice }}</div>
    </div>
    <div class="flex justify-between items-center">
      <div class="">已領股利</div>
      <div class="font-bold">{{ totalDividendShow }}</div>
    </div>
    <div class="flex justify-between items-center">
      <div class="">{{ isSell ? '已' : '未' }}實現價差</div>
      <div class="font-bold">
        {{ totalUnrealized }}
      </div>
    </div>
    <div class="flex justify-between items-center">
      <div class="">{{ isSell ? '實際收益' : '預期收益' }}</div>
      <div
        class="font-bold text-right"
        :class="{
          'text-[var(--main-fall-color)]': totalUnrealized < 0,
          'text-[var(--main-rise-color)]': totalUnrealized > 0
        }"
      >
        {{ total }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>
