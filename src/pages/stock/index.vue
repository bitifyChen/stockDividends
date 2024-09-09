<script setup>
import { Plus, ListPlus, ChartLine } from 'lucide-vue-next'
import { deleteStock } from '@/firebase/stock.js'
import { computed } from 'vue'
import { useStockStore } from '@/stores/useStock.js'
import { useBaseStore } from '@/stores/useBase.js'
import { useRouter } from 'vue-router'
const router = useRouter()
const piniaStock = useStockStore()
const piniaBase = useBaseStore()
const stockHoldList = computed(() => piniaStock?.stockList)
const loading = computed(() => piniaStock?.loading)
//van-collapse
const activeStock = ref(null)
//新增
const stockAddHook = ref(null)
//售出
const stockSellHook = ref(null)
const addMethod = (stockId = null) =>
  stockId
    ? stockAddHook.value && stockAddHook.value.open({ stockId })
    : stockAddHook.value && stockAddHook.value.open()
//更新
const patchMethod = (item, isSell) => stockAddHook.value && stockAddHook.value.open(item, isSell)
//售出
const sellMethod = (item) => stockSellHook.value && stockSellHook.value.open(item)
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
//詳情
const detailMethod = ({ stockId = null, id = null }) => {
  if (!stockId) return
  router.push({ name: 'StockDetailPage', params: { id: stockId } })
}
//刷新資料
const getStockMethod = () => piniaStock.getData()
</script>

<template>
  <teleport to="#header-slot" v-if="piniaBase?.menuOnMount && !piniaBase?.menuIsOpen">
    <div class="w-full font-black justify-between items-center flex text-[48px] text-[white]">
      <div class="w-[26px] h-[26px]"></div>
      <div class="text-[24px] text-center">庫存</div>
      <div class="w-[26px] h-[26px]"></div>
    </div>
  </teleport>
  <div class="min-h-[50px] cell-list" v-loading="loading">
    <van-collapse v-model="activeStock" accordion>
      <van-collapse-item :name="key" v-for="(value, key) in stockHoldList" :key="key">
        <template #title>
          <div class="flex justify-between">
            <div class="font-black text-[18px]">
              {{ value.name }} <span class="text-[12px]">{{ key }}</span>
            </div>
            <div class="text-[12px] font-black">{{ value.buyNum }}股</div>
          </div>
        </template>
        <stockList
          :data="value"
          :stockId="key"
          :patchMethod="patchMethod"
          :sellMethod="sellMethod"
          :deleteMethod="deleteMethod"
          @finish="getStockMethod"
        />
      </van-collapse-item>
    </van-collapse>
  </div>

  <stockAdd ref="stockAddHook" @finish="getStockMethod" />
  <stockSell ref="stockSellHook" @finish="getStockMethod" />
  <fixedFooter>
    <div class="space-y-[10px]">
      <div
        v-show="activeStock"
        class="w-[50px] h-[50px] bg-[var(--main-primary-color)] text-[white] rounded-[50%] flex justify-center items-center"
      >
        <ChartLine size="24" @click="detailMethod({ stockId: activeStock })" />
      </div>
      <div
        v-show="activeStock"
        class="w-[50px] h-[50px] bg-[var(--main-primary-color)] text-[white] rounded-[50%] flex justify-center items-center"
      >
        <ListPlus size="24" @click="addMethod(activeStock)" />
      </div>
      <div
        class="w-[50px] h-[50px] bg-[var(--main-primary-color)] text-[white] rounded-[50%] flex justify-center items-center"
      >
        <Plus size="24" @click="addMethod()" />
      </div>
    </div>
  </fixedFooter>
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
