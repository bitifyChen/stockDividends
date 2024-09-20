<script setup>
import { computed, onMounted } from 'vue'
import { useBaseStore } from '@/stores/useBase.js'
import { useUserInfoStore } from '@/stores/useUserInfo.js'
import { useStockStore } from '@/stores/useStock.js'
const piniaUserInfo = useUserInfoStore()
const piniaStock = useStockStore()
const piniaBase = useBaseStore()
const isMounted = ref(false)
const name = computed(() => piniaUserInfo?.userInfo?.name)
//股利清單
const piniaStockLoading = computed(() => piniaStock?.loading)
const dividendDataList = computed(() => piniaStock?.dividendList)

//取得資料
onMounted(() => {
  piniaStock.getData()
  isMounted.value = true
})
</script>

<template>
  <teleport to="#header-slot" v-if="isMounted && piniaBase?.menuOnMount && !piniaBase?.menuIsOpen">
    <div class="w-full justify-center">
      <div class="text-[24px] font-black text-[white] mb-[10px] text-center">Stock!</div>
      <IndexSummary :data="dividendDataList" v-loading="piniaStockLoading" />
    </div>
  </teleport>
  <div class="p-[10px] h-full flex flex-col">
    <div class="w-full" v-loading="piniaStockLoading">
      <dividendList :data="dividendDataList" v-loading="piniaStockLoading" />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>

<route>
{
  name: "IndexPage",
  meta: {
    requiresAuth: true
  }
}
</route>
