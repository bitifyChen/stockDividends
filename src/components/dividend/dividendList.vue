<script setup>
import { computed } from 'vue'
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})
const activeTab = ref('future')
const tabs = computed(() => [
  {
    title: '即將',
    key: 'future',
    data: futureData.value
  },
  {
    title: '已獲得',
    key: 'earned',
    data: earnedData.value
  }
])

const futureData = computed(() => {
  return props.data
    .filter((item) => {
      return new Date(item.payDate) >= new Date()
    })
    .sort((a, b) => new Date(a.payDate) - new Date(b.payDate))
})

const earnedData = computed(() => {
  return props.data
    .filter((item) => {
      return new Date(item.payDate) < new Date()
    })
    .slice(0, 10)
})
</script>

<template>
  <van-tabs v-model:active="activeTab" animated>
    <van-tab :title="item.title" v-for="item in tabs" :key="item.key" :name="item.key">
      <dividendCard v-for="(item, index) in item.data" :key="index" :data="item" class="my-[10px]"
    /></van-tab>
  </van-tabs>
</template>

<style scoped></style>
