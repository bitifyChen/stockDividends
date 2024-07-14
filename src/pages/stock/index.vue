<script setup>
import { computed } from 'vue'
import { useStockStore } from '@/stores/useStock.js'
const piniaStock = useStockStore()
const stockHoldList = computed(() => piniaStock?.stockList)
const loading = computed(() => piniaStock?.loading)
//van-collapse
const activeStock = ref('null')
//新增
const stockAddHook = ref(null)
const addMethod = () => stockAddHook.value && stockAddHook.value.open()
//更新
const getStockMethod = () => piniaStock.getData()
</script>

<template>
  <Navbar> <van-icon name="plus" size="28" @click="addMethod" /> </Navbar>
  <div class="min-h-[50px] cell-list" v-loading="loading">
    <van-collapse v-model="activeStock" accordion>
      <van-collapse-item :name="key" v-for="(value, key) in stockHoldList" :key="key">
        <template #title>
          <div class="flex justify-between">
            <div class="font-black text-[18px]">
              {{ key }}
            </div>
            <div class="font-black text-[color:var(--text-main-color)] text-[14px]">
              {{ value.data.reduce((a, b) => a + b.buyNum, 0) }}股
            </div>
          </div>
        </template>
        <stockList :data="value" :stockId="key" />
      </van-collapse-item>
    </van-collapse>
  </div>

  <stockAdd ref="stockAddHook" @finish="getStockMethod" />
</template>

<style scoped lang="scss">
.cell-list :deep() {
  .van-cell {
    background-color: var(--form-bg-color);
    color: var(--form-text-color);
  }
}
</style>

<route>
{
  name: "StockPage",
  meta: {
    requiresAuth: true
  }
}
</route>
