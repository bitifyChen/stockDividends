<script setup>
import { computed } from 'vue'
import { useBaseStore } from '@/stores/useBase.js'
import { useUserInfoStore } from '@/stores/useUserInfo.js'
import { useStockStore } from '@/stores/useStock.js'
const piniaUserInfo = useUserInfoStore()
const piniaStock = useStockStore()
const piniaBase = useBaseStore()
const name = computed(() => piniaUserInfo?.userInfo?.name)
// piniaStock.getData()
//股利清單
const piniaStockLoading = computed(() => piniaStock?.loading)
const dividendDataList = computed(() => piniaStock?.dividendList)

const openFull = ref(false)
</script>

<template>
  <teleport to="#header-slot" v-if="piniaBase?.menuOnMount && !piniaBase?.menuIsOpen">
    <div class="w-full font-black justify-center text-[48px] text-[white]">
      <div class="text-[24px] mb-[10px] text-center">Stock!</div>
      <div class="card bg-[white] rounded-xl text-[24px] text-[var(--main-primary-color)] p-[10px]">
        <div class="flex justify-end">
          <font-awesome-icon
            :icon="[
              'fas',
              openFull ? 'down-left-and-up-right-to-center' : 'up-right-and-down-left-from-center'
            ]"
            class="text-[var(--main-primary-color)] text-[16px]"
            @click="openFull = !openFull"
          />
        </div>
        <div class="flex justify-between"><span>累積股息</span><span>$200</span></div>
        <div class="h-[200px] bg-[#141c45a2] rounded-xl" v-show="openFull"></div>
      </div>
    </div>
  </teleport>
  <div class="p-[10px] pt-[40px] h-full flex flex-col">
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
