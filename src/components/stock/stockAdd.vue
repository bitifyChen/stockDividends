<script setup>
import { postStock, patchStock } from '@/firebase/stock.js'
import stockName from '@/data/stockName.json'
import { keysToKeep } from '@/utils/base.js'
import { re } from 'mathjs'
const emit = defineEmits(['finish'])
const active = ref(false)
const isSell = ref(false)
const open = (item = null, isItemSell = false) => {
  if (item) {
    parentForm.value = { ...item }
    currentId.value = item.id ?? null
    isSell.value = isItemSell
  }
  active.value = true
}
const currentId = ref(null)
const isEditMode = computed(() => currentId.value !== null)
const fields = computed(() =>
  [
    {
      name: 'stockId',
      label: '股票代碼',
      slot: 'stockId',
      readonly: isEditMode.value,
      rules: [
        { required: true, message: '必填' },
        {
          validator: () => {
            return stockName[parentForm.value.stockId] ? true : false
          },
          trigger: 'change',
          message: '請檢察股票代碼'
        }
      ]
    },
    {
      name: 'buyDate',
      label: '買入日期',
      type: 'date',
      rules: [{ required: true, message: '必填' }]
    },
    isSell.value && {
      name: 'sellDate',
      label: '售出日期',
      type: 'date',
      rules: [{ required: true, message: '必填' }]
    },
    {
      name: 'buyPrice',
      label: '買入價',
      type: 'text',
      rules: [{ required: true, message: '必填' }]
    },
    isSell.value && {
      name: 'sellPrice',
      label: '售出價',
      type: 'text',
      rules: [{ required: true, message: '必填' }]
    },
    {
      name: 'buyNum',
      label: '買入股數',
      type: 'text',
      rules: [{ required: true, message: '必填' }]
    }
  ].filter(Boolean)
)
const isChanged = ref(false)
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
        isChanged.value = true
        ElMessage({
          message: '新增成功',
          type: 'success',
          plain: true
        })
        if (!stay) {
          active.value = false
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
        isChanged.value = true
        ElMessage({
          message: '更新成功',
          type: 'success',
          plain: true
        })
        active.value = false
        parentForm.value = {}
      }
    })
    .finally(() => {
      submitting.value = false
    })
}
//股票名稱
const stockSearch = ref(null)
const openStockSearch = () => {
  stockSearch.value && stockSearch.value.open()
}
const stockNameList = computed(() => {
  return Object.keys(stockName).map((id) => {
    return { text: `(${id}) ${stockName[id]}`, value: id }
  })
})
const stockNameDisplay = computed(() => {
  return stockName[parentForm.value.stockId] ?? null
})
//Popup
const onClose = () => {
  if (isChanged.value) emit('finish') //如果有過異動，離開時更新
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
        <template #stockId>
          <el-input
            v-model="parentForm.stockId"
            class="h-[48px]"
            :readonly="fields.find((e) => e.name === 'stockId').readonly"
          ></el-input>
          <div class="flex text-[12px] leading-4 justify-between">
            <div class="text-[var(--main-primary-color)]">
              {{ stockNameDisplay ?? '-' }}
            </div>
            <div class="text-[var(--main-primary-color)]" @click="openStockSearch">
              <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="mr-[4px]" />股票代碼查詢
            </div>
          </div>
        </template>
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
    <TwoStockSearch
      ref="stockSearch"
      :list="stockNameList"
      @finish="(e) => (parentForm.stockId = e)"
    />
  </van-popup>
</template>

<style scoped lang="scss"></style>
