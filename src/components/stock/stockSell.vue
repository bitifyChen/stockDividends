<script setup>
import { postStock, patchStock } from '@/firebase/stock.js'
import stockName from '@/data/stockName.json'
import { keysToKeep } from '@/utils/base.js'
const emit = defineEmits(['finish'])
const active = ref(false)
const open = (item = null) => {
  if (item) {
    parentForm.value = { ...item }
    currentId.value = item.id ?? null
  }
  active.value = true
}
const currentId = ref(null)
const fields = computed(() => [
  {
    name: 'sellDate',
    label: '售出日期',
    type: 'date',
    rules: [
      { required: true, message: '必填' },
      {
        validator: () => {
          return new Date(parentForm.value.sellDate) >= new Date(parentForm.value.buyDate)
        },
        trigger: 'change',
        message: `售出日不得小於購買日${parentForm.value.buyDate}`
      }
    ]
  },
  {
    name: 'sellPrice',
    label: '售出價',
    type: 'text',
    rules: [{ required: true, message: '必填' }]
  },
  {
    name: 'sellNum',
    label: '售出股數',
    type: 'text',
    rules: [
      { required: true, message: '必填' },
      {
        validator: () => {
          return parentForm.value.sellNum * 1 <= parentForm.value.buyNum * 1
        },
        trigger: 'change',
        message: `已超過持有股數${parentForm.value.buyNum}`
      }
    ]
  },
  {
    name: 'summary',
    label: '總覽',
    slot: 'summary'
  }
])
const isChanged = ref(false)
const formHook = ref(null)
const parentForm = ref({})
const submitting = ref(false)

const sellMethod = async () => {
  submitting.value = true
  //更改此筆資料(張數減少、添加售出日)
  const editData = {
    buyNum: parentForm.value.sellNum * 1,
    sellDate: parentForm.value.sellDate,
    sellPrice: parentForm.value.sellPrice
  }
  await patchStock(currentId.value, editData).then((res) => {
    if (res.status === 200) {
      isChanged.value = true
    }
  })
  //添加新資料(未售出的股票)
  const newData = {
    stockId: parentForm.value.stockId,
    buyDate: parentForm.value.buyDate,
    buyPrice: parentForm.value.buyPrice,
    buyNum: parentForm.value.buyNum * 1 - parentForm.value.sellNum * 1
  }
  await postStock(newData).then((res) => {
    if (res.status === 200) {
      isChanged.value = true
    }
  })
  ElMessage({
    message: '更新成功',
    type: 'success',
    plain: true
  })
  active.value = false
  submitting.value = false
}

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
        submitText="售出"
        :submitting="submitting"
        @submitFn="sellMethod()"
      >
        <template #summary>
          <div class="text-[16px] font-black">
            <div class="text-left">{{ stockNameDisplay }}({{ parentForm.stockId }})</div>
            <div class="flex justify-between">
              <span>{{ parentForm.buyDate }}</span
              ><span>{{ parentForm.buyNum }}股</span>
            </div>
            <div class="flex justify-between" v-show="parentForm.sellNum && parentForm.sellDate">
              <span>{{ parentForm.sellDate }}</span>
              <span class="text-[var(--main-rise-color)]">{{
                parentForm.sellNum * 1 > parentForm.buyNum * 1
                  ? '已超過上限'
                  : `-${parentForm.sellNum}股`
              }}</span>
            </div>
            <div class="flex justify-between" v-show="parentForm.sellNum && parentForm.sellDate">
              <span>剩餘</span>
              <span class="text-[var(--main-primary-color)]">{{
                parentForm.sellNum * 1 > parentForm.buyNum * 1
                  ? '已超過上限'
                  : `${parentForm.buyNum * 1 - parentForm.sellNum * 1}股`
              }}</span>
            </div>
          </div>
        </template>
      </TwoDynamicForm>
    </div>
  </van-popup>
</template>

<style scoped lang="scss"></style>
