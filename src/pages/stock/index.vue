<script setup>
import { deleteStock } from '@/firebase/stock.js'
import { computed } from 'vue'
import { useStockStore } from '@/stores/useStock.js'
import { useBaseStore } from '@/stores/useBase.js'
const piniaStock = useStockStore()
const piniaBase = useBaseStore()
const stockHoldList = computed(() => piniaStock?.stockList)
const loading = computed(() => piniaStock?.loading)
//van-collapse
const activeStock = ref('null')
//新增
const stockAddHook = ref(null)
const addMethod = () => stockAddHook.value && stockAddHook.value.open()
//更新
const patchMethod = (item) => stockAddHook.value && stockAddHook.value.open(item)
//刪除
const deleteMethod = (item) => {
  showConfirmDialog({
    title: '刪除',
    message: `您將刪除股號${item.stockId}股票，共計${item.buyNum}股，是否確定?`
  }).then(() => {
    deleteStock(item.id)
      .then(() => {
        ElMessage({
          message: '操作成功',
          type: 'success',
          plain: true
        })
        getStockMethod()
      })
      .catch(() => {
        ElMessage({
          message: '操作失敗，請稍後再試',
          type: 'error',
          plain: true
        })
      })
  })
}
//刷新資料
const getStockMethod = () => piniaStock.getData()
</script>

<template>
  <teleport to="#header-slot" v-if="piniaBase?.menuOnMount && !piniaBase?.menuIsOpen">
    <div class="w-full font-black justify-between items-center flex text-[48px] text-[white]">
      <div class="w-[26px] h-[26px]"></div>
      <div class="text-[24px] text-center">庫存</div>
      <van-icon name="plus" size="28" @click="addMethod" />
    </div>
  </teleport>
  <div class="min-h-[50px] cell-list" v-loading="loading">
    <van-collapse v-model="activeStock" accordion>
      <van-collapse-item :name="key" v-for="(value, key) in stockHoldList" :key="key">
        <template #title>
          <div class="flex justify-between">
            <div class="font-black text-[18px]">
              {{ key }}
            </div>
          </div>
        </template>
        <stockList
          :data="value"
          :stockId="key"
          :patchMethod="patchMethod"
          :deleteMethod="deleteMethod"
          @finish="getStockMethod"
        />
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
