<script setup>
import { postStock, patchStock } from '@/firebase/stock.js'
import stockName from '@/data/stockName.json'

const emit = defineEmits(['setYear'])
const active = ref(false)

const open = (item = null) => {
  if (item) parentForm.value = { ...item }
  active.value = true
}

const fields = computed(() => [
  {
    name: 'year',
    label: '年度',
    type: 'select',
    selectOption: Array.from(
      { length: new Date().getFullYear() - 1960 + 1 },
      (_, i) => new Date().getFullYear() - i
    ).map((item) => ({ label: item, value: item })),
    rules: [{ required: true, message: '必填' }]
  }
])
const formHook = ref(null)
const parentForm = ref({})
const submitting = ref(false)

const submitMethod = () => {
  emit('setYear', parentForm.value.year)
  parentForm.value = {}
  active.value = false
}

//Popup
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
    @close="onClose"
    closeable
  >
    <div class="my-[50px] px-[10px]">
      <TwoDynamicForm
        ref="formHook"
        :fields="fields"
        :parentForm="parentForm"
        submitText="搜尋"
        :submitting="submitting"
        @submitFn="submitMethod()"
      >
      </TwoDynamicForm>
    </div>
  </van-popup>
</template>

<style scoped lang="scss"></style>
