<script setup>
import { postStock } from '@/api/stock.js'
const emit = defineEmits(['finish'])
const active = ref(false)
const open = () => (active.value = true)
const fields = computed(() => [
  {
    name: 'stockId',
    label: '股票代碼',
    type: 'text',
    cssStyle: true,
    rules: [{ required: true, message: '必填' }]
  },
  {
    name: 'buyDate',
    label: '買入日期',
    type: 'date',
    cssStyle: true,
    rules: [{ required: true, message: '必填' }]
  },
  {
    name: 'buyPrice',
    label: '買入價',
    type: 'text',
    cssStyle: true,
    rules: [{ required: true, message: '必填' }]
  },
  {
    name: 'buyNum',
    label: '買入股數',
    type: 'text',
    cssStyle: true,
    rules: [{ required: true, message: '必填' }]
  }
])
const parentForm = ref({})
const submitMethod = () => {
  postStock(parentForm.value).then((res) => {
    if (res.status === 200) {
      ElMessage({
        message: '新增成功',
        type: 'success',
        plain: true
      })
      active.value = false
      emit('finish')
    }
  })
}

defineExpose({
  open
})
</script>

<template>
  <!-- 右側彈出 -->
  <van-popup
    v-model:show="active"
    position="right"
    :style="{ width: '100%', height: '100%' }"
    closeable
  >
    <div class="my-[50px] px-[10px]">
      <TwoDynamicForm
        :fields="fields"
        :parentForm="parentForm"
        submitText="新增"
        @submitFn="submitMethod"
      />
    </div>
  </van-popup>
</template>

<style scoped lang="scss"></style>
