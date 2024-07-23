<script setup>
import { ref, computed } from 'vue'
const props = defineProps({
  list: {
    type: Array,
    required: true
  }
})
const emit = defineEmits(['finish'])
//Popup
const show = ref(false)
const columnSelected = ref([])
const columns = computed(() => {
  if (!searchInput.value) {
    return props.list
  } else {
    return props.list.filter((item) => item['text'].includes(searchInput.value))
  }
})
//picker
const optionOnClick = (item) => {
  if (columnSelected.value[0] === item.value) onFinish(item.value)
}
//搜索功能
const searchInput = ref(null)

//確認
const onFinish = (e) => {
  emit('finish', e)
  show.value = false
}

//外部開啟
const open = () => (show.value = true)
defineExpose({
  open
})
</script>


<template>
  <van-popup class="" v-model:show="show" position="bottom" round>
    <div
      class="h-[40px] bg-[var(--main-primary-color)] flex justify-center items-center text-white text-[20px]"
    >
      股票小幫手
    </div>
    <div class="p-[10px]">
      <el-input class="mb-[10px]" v-model="searchInput" :clearable="true" />
      <van-picker v-model="columnSelected" :columns="columns" :show-toolbar="false">
        <template #option="item">
          <div class="text-[var(--main-primary-color)] font-bold" @click="optionOnClick(item)">
            {{ item.text }}
          </div>
        </template>
      </van-picker>
    </div>
  </van-popup>
</template>


<style scoped>
</style>