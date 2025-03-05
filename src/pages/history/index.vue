<script setup>
import { CalendarCog, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { deleteStock } from '@/firebase/stock.js'
import { computed } from 'vue'
import { useStockStore } from '@/stores/useStock.js'
import { useBaseStore } from '@/stores/useBase.js'
import { useRouter } from 'vue-router'
const router = useRouter()
const piniaStock = useStockStore()
const piniaBase = useBaseStore()
//股利清單
const piniaStockLoading = computed(() => piniaStock?.loading)
const dividendDataList = computed(() =>
  piniaStock?.dividendList?.filter((item) => item?.year === rangeYear.value)
)
const loading = computed(() => piniaStock?.loading)

//週期
const rangeYear = ref(new Date().getFullYear())
const rangeHook = ref(null)
const rangeMethod = () => rangeHook.value && rangeHook.value.open({ year: rangeYear.value })
</script>

<template>
  <teleport to="#header-slot" v-if="piniaBase?.menuOnMount && !piniaBase?.menuIsOpen">
    <div class="w-full font-black justify-between items-center flex text-[48px] text-[white]">
      <div class="w-[26px] h-[26px]"></div>
      <div class="text-[24px] text-center">歷史</div>
      <div class="w-[26px] h-[26px]"></div>
    </div>
  </teleport>
  <div class="min-h-[50px] p-[10px] cell-list mb-[60px]" v-loading="loading">
    <IndexSummary
      :data="dividendDataList"
      v-loading="piniaStockLoading"
      open
      :year="rangeYear"
      :key="rangeYear"
    />
  </div>
  <historyRange ref="rangeHook" @setYear="rangeYear = $event" />
  <fixedFooter
    class="space-x-[10px] text-[white] [&>div]:p-[10px] [&>div]:bg-[var(--main-primary-color)] [&>div]:rounded-full [&>div]:flex [&>div]:justify-center [&>div]:items-center"
  >
    <div @click="rangeYear = rangeYear - 1">
      <ChevronLeft size="24" />
    </div>
    <div @click="rangeMethod()">
      <CalendarCog size="24" />
    </div>
    <div
      @click="rangeYear >= new Date().getFullYear() ? null : (rangeYear = rangeYear + 1)"
      :class="rangeYear >= new Date().getFullYear() ? 'opacity-50' : ''"
    >
      <ChevronRight size="24" />
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
  name: "HistoryPage",
  meta: {
    requiresAuth: true
  }
}
</route>
