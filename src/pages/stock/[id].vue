<script setup>
import { useStockStore } from '@/stores/useStock.js'
import { useBaseStore } from '@/stores/useBase.js'
import { useRoute } from 'vue-router'
const route = useRoute()
const piniaStock = useStockStore()
const piniaBase = useBaseStore()
//本頁ID
const stockId = route.params.id
const stockName = computed(() => currentStock?.value?.name)
//總資料
const currentStock = computed(() => ({ id: stockId, ...piniaStock?.stockList[stockId] }))
</script>


<template>
  <teleport to="#header-slot" v-if="piniaBase?.menuOnMount && !piniaBase?.menuIsOpen">
    <div class="w-full font-black justify-between items-center flex text-[48px] text-[white]">
      <div class="w-[26px] h-[26px]"></div>
      <div class="text-[24px] text-center">{{ stockName }}</div>
      <div class="w-[26px] h-[26px]"></div>
    </div>
  </teleport>
  <div
    class="mt-[-76px] pt-[86px] p-[10px] bg-[var(--main-primary-color)] h-[100dvh] space-y-4 overflow-y-auto"
  >
    <stockDetailInfo class="card" :data="currentStock" />
    <stockDetailHold class="card" :data="currentStock" />
    <stockDetailDividend class="card" :data="currentStock" />
  </div>
</template>


<style scoped>
.card {
  border-radius: 0.75rem;
  font-weight: 700;
  background: white;
  color: var(--main-primary-color);
  padding: 10px;
}
</style>


<route>
    {
      name: "StockDetailPage",
      meta: {
        requiresAuth: true
      }
    }
    </route>
    