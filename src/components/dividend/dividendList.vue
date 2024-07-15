<script setup>
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
  <dividendCard v-for="(item, index) in props.data" :key="index" :data="item" class="my-[10px]" />
</template>

<style scoped></style>
