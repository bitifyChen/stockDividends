<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
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
  const today = dayjs().format('YYYY-MM-DD')
  return props.data
    .filter((item) => {
      return item.displayDate && item.displayDate >= today
    })
    .sort((a, b) => new Date(a.displayDate) - new Date(b.displayDate))
})

const earnedData = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return props.data
    .filter((item) => {
      return !item.displayDate || item.displayDate < today
    })
    .slice(0, 10)
})
</script>

<template>
  <van-tabs v-model:active="activeTab" animated>
    <van-tab :title="item.title" v-for="item in tabs" :key="item.key" :name="item.key">
      <dividendCard v-for="event in item.data" :key="event.eventId" :data="event" class="my-[10px]"
    /></van-tab>
  </van-tabs>
</template>

<style scoped></style>
