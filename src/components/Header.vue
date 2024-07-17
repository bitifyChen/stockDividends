<script setup>
import { useRoute } from 'vue-router'
import { computed, watch } from 'vue'
import { useBaseStore } from '@/stores/useBase.js'
const piniaBase = useBaseStore()
//Route
const route = useRoute()
const currentPath = computed(() => route.name)

const menuShow = computed(() => piniaBase?.menuIsOpen)
const menu = computed(() => [
  {
    title: '首頁',
    path: 'IndexPage',
    icon: ['fas', 'house']
  },
  {
    title: '庫存',
    path: 'StockPage',
    icon: ['fas', 'wallet']
  },
  {
    title: '登出',
    path: 'LogoutPage',
    icon: ['fas', 'right-from-bracket']
  }
])

//
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

watch(
  () => currentPath.value,
  () => {
    piniaBase.toggleMenu()
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <dynamicDom
      class="w-full relative top-0 z-[10] bg-[#3E56D5] p-[20px] overflow-hidden rounded-b-[20px]"
      dom="header-slot"
      :minHight="40"
    >
      <div
        class="text-white text-[28px] absolute top-[20px] left-[20px]"
        @click="piniaBase.toggleMenu()"
      >
        <font-awesome-icon :icon="['fas', 'bars']" v-show="!menuShow" />
        <font-awesome-icon :icon="['fas', 'xmark']" v-show="menuShow" />
      </div>
    </dynamicDom>
    <teleport to="#header-slot" v-if="isMounted && piniaBase?.menuIsOpen">
      <div
        class="font-black justify-center text-[24px] pt-[50px] pb-[20px] text-[white] tracking-wide"
      >
        <router-link
          :to="{ name: item.path }"
          v-for="item in menu"
          :key="item.title"
          class="my-[10px] block border-l-[10px] pl-[10px] border-[transparent]"
          :class="{ 'border-[#FFC940]': currentPath === item.path }"
          ><font-awesome-icon :icon="item.icon" class="mr-[10px]" />{{ item.title }}</router-link
        >
      </div>
    </teleport>
  </div>
</template>

<style scoped lang="scss"></style>
