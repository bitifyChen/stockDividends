<script setup>
import { add } from '@/composables/useMath.js'
import { computed } from 'vue'
const props = defineProps({
  data: {
    type: Object,
    default: () => {}
  },
  stockId: {
    type: String,
    required: true
  },
  patchMethod: {
    type: Function,
    default: () => {}
  },
  sellMethod: {
    type: Function,
    default: () => {}
  },
  deleteMethod: {
    type: Function,
    default: () => {}
  }
})
//持股
const stockHoldList = computed(() => props?.data?.data)
//現價
const stockPrice = computed(() => props?.data?.price ?? '未更新')
//已領股利
const earnDividend = computed(
  () => stockHoldList.value?.reduce((a, b) => add(a, b.earnDividend), 0) ?? 0
)
//未實現價差
const earnPrice = computed(() => stockHoldList.value?.reduce((a, b) => add(a, b.earnPrice), 0) ?? 0)
//合計
const earnTotal = computed(() => add(earnDividend.value, earnPrice.value))
</script>

<template>
  <div>
    <div class="border-2 border-[var(--main-primary-color)] p-[4px]">
      <div class="font-black text-[18px] text-right">
        <div class="text-[var(--main-primary-color)] flex justify-between items-center">
          <span class="text-[14px]">現價/收盤價</span> {{ stockPrice }}
        </div>
      </div>
      <div class="text-[color:var(--text-main-color)] text-[14px] font-black">
        <div class="flex justify-between items-center">
          <span>已領股利</span> {{ earnDividend }}
        </div>
        <div class="flex justify-between items-center">
          <span>未實現價差</span>
          <span>{{ earnPrice }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span>合計</span>
          <span
            :class="{
              'text-[var(--main-fall-color)]': earnTotal < 0,
              'text-[var(--main-rise-color)]': earnTotal > 0
            }"
          >
            {{ earnTotal }}</span
          >
        </div>
      </div>
    </div>
    <div class="divide-y divide-[var(--main-gray-color)]">
      <van-swipe-cell v-for="item in stockHoldList" :key="item.id">
        <template #left>
          <van-button square type="primary" text="詳情" class="swipe-cell-button" />
        </template>
        <stockListCard :item="item" :stockPrice="stockPrice" />
        <template #right>
          <van-button
            square
            color="green"
            text="修改"
            class="swipe-cell-button"
            @click="props.patchMethod(item, !!item.sellDate)"
          />
          <van-button
            v-if="!item.sellDate"
            square
            type="warning"
            text="售出"
            class="swipe-cell-button"
            @click="props.sellMethod(item)"
          />
          <van-button
            square
            type="danger"
            text="刪除"
            class="swipe-cell-button"
            @click="props.deleteMethod(item)"
          />
        </template>
      </van-swipe-cell>
    </div>
  </div>
</template>

<style scoped>
.swipe-cell-button {
  height: 100%;
}
</style>
