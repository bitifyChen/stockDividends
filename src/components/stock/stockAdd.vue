<script setup>
import { postStock, patchStock } from '@/firebase/stock.js'
import { keysToKeep } from '@/utils/base.js'
const emit = defineEmits(['finish'])
const active = ref(false)
const open = (item = null) => {
  if (item) {
    parentForm.value = { ...item }
    currentId.value = item.id
  }
  active.value = true
}
const currentId = ref(null)
const isEditMode = computed(() => currentId.value !== null)
const fields = computed(() => [
  {
    name: 'stockId',
    label: '股票代碼',
    type: 'text',
    cssStyle: true,
    readonly: isEditMode.value,
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
const formHook = ref(null)
const parentForm = ref({})
const submitting = ref(false)
const keepSubmitMethod = () => {
  formHook.value && formHook.value.validateFormMethod().then(() => submitMethod(true))
}

const submitMethod = (stay = false) => {
  submitting.value = true
  postStock(parentForm.value)
    .then((res) => {
      if (res.status === 200) {
        ElMessage({
          message: '新增成功',
          type: 'success',
          plain: true
        })
        if (!stay) {
          active.value = false
          emit('finish')
        } else {
          const stockId = parentForm.value.stockId
          parentForm.value = { stockId }
        }
      }
    })
    .finally(() => {
      submitting.value = false
    })
}

const patchMethod = () => {
  submitting.value = true
  const _data = keysToKeep(
    parentForm.value,
    fields.value.map((e) => e.name)
  )
  patchStock(currentId.value, _data)
    .then((res) => {
      if (res.status === 200) {
        ElMessage({
          message: '更新成功',
          type: 'success',
          plain: true
        })
        active.value = false
        parentForm.value = {}
        emit('finish')
      }
    })
    .finally(() => {
      submitting.value = false
    })
}
//Popup
const onClose = () => {
  parentForm.value = {}
  currentId.value = null
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
    @close="onClose"
    closeable
  >
    <div class="my-[50px] px-[10px]">
      <TwoDynamicForm
        ref="formHook"
        :fields="fields"
        :parentForm="parentForm"
        :submitText="isEditMode ? '更新' : '新增'"
        :submitting="submitting"
        @submitFn="isEditMode ? patchMethod() : submitMethod()"
      >
        <template #bottom v-if="!isEditMode">
          <el-button
            @click="keepSubmitMethod"
            class="ml-auto mr-auto !h-[48px] w-full !rounded-[7px] text-[16px] btn-submit !bg-[var(--main-sub-color)]"
            :loading="submitting"
          >
            連續新增
          </el-button>
        </template>
      </TwoDynamicForm>
    </div>
  </van-popup>
</template>

<style scoped lang="scss"></style>
