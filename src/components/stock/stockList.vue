<script setup>
import { getPrice } from '@/api/price.js'
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  stockId: {
    type: String,
    required: true
  }
})

const stockPrice = ref(null)
getPrice({ stockId: props.stockId }).then((res) => {
  if (res.status === 200) {
    stockPrice.value = res?.data?.price
  }
})
</script>

<template>
  <div v-loading="stockPrice === null" class="mx-[-16px] mt-[-12px]">
    <div
      class="bg-[var(--main-sub-color)] px-[16px] py-[10px] text-[white] font-black text-[18px] text-right flex justify-between items-center"
    >
      <span class="text-[14px]">現價/收盤價</span>
      {{ stockPrice }}
    </div>
    <div class="divide-y divide-[#808080] px-[16px]">
      <van-swipe-cell v-for="item in data" :key="item.id">
        <stockListCard :item="item" :stockPrice="stockPrice" />
      </van-swipe-cell>
    </div>
  </div>
</template>

<style scoped></style>
