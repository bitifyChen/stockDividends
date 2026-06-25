<script setup>
import { computed, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import stockName from '@/data/stockName.json'
import { deleteStock, patchStock, postStock } from '@/firebase/stock.js'
import { toNumber } from '@/utils/etfDashboard.js'

const emit = defineEmits(['finish'])

const visible = ref(false)
const submitting = ref(false)
const mode = ref('buy')
const currentItem = ref(null)
const formRef = ref(null)
const form = reactive({
  stockId: '',
  buyDate: dayjs().format('YYYY-MM-DD'),
  buyPrice: null,
  buyNum: null,
  sellDate: dayjs().format('YYYY-MM-DD'),
  sellPrice: null,
  sellNum: null
})

const stockOptions = computed(() =>
  Object.entries(stockName)
    .map(([id, name]) => ({
      value: id,
      label: `${id} ${name}`
    }))
    .sort((a, b) => a.value.localeCompare(b.value))
)

const isEditMode = computed(() => mode.value === 'edit')
const isSellMode = computed(() => mode.value === 'sell')
const drawerTitle = computed(() => {
  if (isSellMode.value) return '賣出持股'
  if (isEditMode.value) return '編輯交易'
  return '新增買進'
})
const selectedStockName = computed(() => stockName[form.stockId] || '尚未選擇股票')
const maxSellShares = computed(() => toNumber(currentItem.value?.buyNum))
const remainingShares = computed(() => Math.max(0, maxSellShares.value - toNumber(form.sellNum)))

const rules = computed(() => ({
  stockId: [{ required: true, message: '請選擇股票', trigger: 'change' }],
  buyDate: [{ required: true, message: '請選擇買進日期', trigger: 'change' }],
  buyPrice: [{ required: true, message: '請輸入買進價格', trigger: 'blur' }],
  buyNum: [{ required: true, message: '請輸入買進股數', trigger: 'blur' }],
  sellDate: [
    {
      required: isSellMode.value || Boolean(currentItem.value?.sellDate),
      message: '請選擇賣出日期',
      trigger: 'change'
    },
    {
      validator: (_rule, value, callback) => {
        if (!value || !form.buyDate || !dayjs(value).isBefore(dayjs(form.buyDate), 'day')) {
          callback()
          return
        }
        callback(new Error('賣出日期不可早於買進日期'))
      },
      trigger: 'change'
    }
  ],
  sellPrice: [
    {
      required: isSellMode.value || Boolean(currentItem.value?.sellDate),
      message: '請輸入賣出價格',
      trigger: 'blur'
    }
  ],
  sellNum: [
    { required: isSellMode.value, message: '請輸入賣出股數', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        const sellNum = toNumber(value)
        if (!isSellMode.value || (sellNum > 0 && sellNum <= maxSellShares.value)) {
          callback()
          return
        }
        callback(new Error(`賣出股數需介於 1 到 ${maxSellShares.value.toLocaleString()} 之間`))
      },
      trigger: 'blur'
    }
  ]
}))

const resetForm = () => {
  currentItem.value = null
  form.stockId = ''
  form.buyDate = dayjs().format('YYYY-MM-DD')
  form.buyPrice = null
  form.buyNum = null
  form.sellDate = dayjs().format('YYYY-MM-DD')
  form.sellPrice = null
  form.sellNum = null
  formRef.value?.clearValidate()
}

const open = ({ type = 'buy', item = null, stockId = '' } = {}) => {
  resetForm()
  mode.value = type
  currentItem.value = item

  if (item) {
    form.stockId = item.stockId || stockId
    form.buyDate = item.buyDate || dayjs().format('YYYY-MM-DD')
    form.buyPrice = toNumber(item.buyPrice) || null
    form.buyNum = toNumber(item.buyNum) || null
    form.sellDate = item.sellDate || dayjs().format('YYYY-MM-DD')
    form.sellPrice = item.sellPrice ? toNumber(item.sellPrice) : null
    form.sellNum = type === 'sell' ? toNumber(item.buyNum) : null
  } else if (stockId) {
    form.stockId = stockId
  }

  visible.value = true
}

const buildBuyPayload = () => ({
  stockId: form.stockId,
  buyDate: form.buyDate,
  buyPrice: toNumber(form.buyPrice),
  buyNum: toNumber(form.buyNum)
})

const submitBuy = async () => {
  await postStock(buildBuyPayload())
  ElMessage.success('已新增買進紀錄')
}

const submitEdit = async () => {
  const payload = {
    ...buildBuyPayload()
  }

  if (currentItem.value?.sellDate || form.sellPrice) {
    payload.sellDate = form.sellDate
    payload.sellPrice = toNumber(form.sellPrice)
  }

  await patchStock(currentItem.value.id, payload)
  ElMessage.success('已更新交易紀錄')
}

const submitSell = async () => {
  const sellNum = toNumber(form.sellNum)
  const buyNum = maxSellShares.value
  const isSellOut = sellNum === buyNum

  await patchStock(currentItem.value.id, {
    buyNum: sellNum,
    sellDate: form.sellDate,
    sellPrice: toNumber(form.sellPrice)
  })

  if (!isSellOut) {
    await postStock({
      stockId: form.stockId,
      buyDate: form.buyDate,
      buyPrice: toNumber(form.buyPrice),
      buyNum: buyNum - sellNum
    })
  }

  ElMessage.success('已完成賣出紀錄')
}

const submit = async () => {
  await formRef.value?.validate()
  submitting.value = true

  try {
    if (isSellMode.value) await submitSell()
    else if (isEditMode.value) await submitEdit()
    else await submitBuy()

    visible.value = false
    emit('finish')
  } finally {
    submitting.value = false
  }
}

const remove = async () => {
  if (!currentItem.value?.id) return

  await ElMessageBox.confirm('刪除後無法復原，確認刪除此筆交易？', '刪除交易', {
    confirmButtonText: '刪除',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await deleteStock(currentItem.value.id)
  ElMessage.success('已刪除交易紀錄')
  visible.value = false
  emit('finish')
}

defineExpose({ open })
</script>

<template>
  <el-drawer
    v-model="visible"
    class="dashboard-trade-drawer"
    direction="rtl"
    :size="520"
    :title="drawerTitle"
  >
    <div class="trade-drawer-body">
      <div class="trade-context">
        <span>{{ form.stockId || '----' }}</span>
        <strong>{{ selectedStockName }}</strong>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="股票代號" prop="stockId">
          <el-select
            v-model="form.stockId"
            class="dashboard-form-control"
            filterable
            :disabled="isEditMode || isSellMode"
            placeholder="搜尋股票代號或名稱"
          >
            <el-option
              v-for="item in stockOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <div class="form-grid">
          <el-form-item label="買進日期" prop="buyDate">
            <el-date-picker
              v-model="form.buyDate"
              class="dashboard-form-control"
              type="date"
              value-format="YYYY-MM-DD"
              :disabled="isSellMode"
            />
          </el-form-item>

          <el-form-item label="買進價格" prop="buyPrice">
            <el-input-number
              v-model="form.buyPrice"
              class="dashboard-form-control"
              :min="0"
              :precision="2"
              controls-position="right"
              :disabled="isSellMode"
            />
          </el-form-item>
        </div>

        <el-form-item label="買進股數" prop="buyNum">
          <el-input-number
            v-model="form.buyNum"
            class="dashboard-form-control"
            :min="1"
            :precision="0"
            controls-position="right"
            :disabled="isSellMode"
          />
        </el-form-item>

        <template v-if="isSellMode || currentItem?.sellDate">
          <div class="form-divider">賣出資訊</div>

          <div class="form-grid">
            <el-form-item label="賣出日期" prop="sellDate">
              <el-date-picker
                v-model="form.sellDate"
                class="dashboard-form-control"
                type="date"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>

            <el-form-item label="賣出價格" prop="sellPrice">
              <el-input-number
                v-model="form.sellPrice"
                class="dashboard-form-control"
                :min="0"
                :precision="2"
                controls-position="right"
              />
            </el-form-item>
          </div>

          <el-form-item v-if="isSellMode" label="賣出股數" prop="sellNum">
            <el-input-number
              v-model="form.sellNum"
              class="dashboard-form-control"
              :min="1"
              :max="maxSellShares"
              :precision="0"
              controls-position="right"
            />
          </el-form-item>

          <div v-if="isSellMode" class="sell-summary">
            <span>本次賣出 {{ Number(form.sellNum || 0).toLocaleString() }} 股</span>
            <strong>剩餘 {{ remainingShares.toLocaleString() }} 股</strong>
          </div>
        </template>
      </el-form>
    </div>

    <template #footer>
      <div class="drawer-actions">
        <el-button v-if="isEditMode" type="danger" plain @click="remove">刪除</el-button>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">
          {{ isSellMode ? '確認賣出' : isEditMode ? '儲存修改' : '新增買進' }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">
.trade-drawer-body {
  display: grid;
  gap: 18px;
}

.trade-context {
  display: grid;
  gap: 6px;
  border: 1px solid var(--main-border-color);
  border-radius: 16px;
  background: var(--dashboard-section-bg);
  box-shadow: var(--dashboard-section-shadow);
  padding: 14px;
}

.trade-context span {
  color: #0891b2;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 900;
}

.trade-context strong {
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 18px;
  font-weight: 900;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dashboard-form-control {
  width: 100%;
}

.form-divider {
  margin: 18px 0 12px;
  border-top: 1px solid var(--main-border-color);
  padding-top: 14px;
  color: var(--dashboard-text-muted, #8a97a8);
  font-size: 12px;
  font-weight: 900;
}

.sell-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid rgb(34 211 238 / 0.18);
  border-radius: 14px;
  background: rgb(34 211 238 / 0.08);
  padding: 12px;
  color: var(--dashboard-text-secondary, #cbd5e1);
  font-size: 13px;
  font-weight: 800;
}

.sell-summary strong {
  color: var(--dashboard-text-primary, #f8fbff);
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:global(.dashboard-trade-drawer) {
  --el-drawer-bg-color: var(--main-surface-color);
  --el-text-color-primary: var(--dashboard-text-primary, #f8fbff);
  --el-text-color-regular: var(--dashboard-text-secondary, #cbd5e1);
}

@media (max-width: 640px) {
  :global(.dashboard-trade-drawer) {
    width: 100% !important;
  }

  .form-grid,
  .sell-summary {
    grid-template-columns: 1fr;
  }

  .sell-summary {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
