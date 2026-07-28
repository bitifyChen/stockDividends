<script setup>
import dayjs from 'dayjs'
const props = defineProps({
  data: {
    type: Object,
    default: () => {}
  }
})
const stockId = computed(() => props?.data?.stockId ?? '-')
const stockName = computed(() => props?.data?.stockName ?? '-')
const cashEligibleShares = computed(() => Number(props?.data?.cashEligibleShares ?? 0))
const cashPerShare = computed(() => Number(props?.data?.cash?.totalPerShare ?? 0))
const cashIncome = computed(() => Number(props?.data?.cashIncome ?? 0))
const stockRatio = computed(() => Number(props?.data?.stock?.ratio ?? 0))
const estimatedStockShares = computed(() => Number(props?.data?.estimatedStockShares ?? 0))
const stockRightsMarketValue = computed(() => Number(props?.data?.stockRightsMarketValue ?? 0))
const totalBenefitValue = computed(() => Number(props?.data?.totalBenefitValue ?? 0))
const hasCashDividend = computed(() => cashIncome.value > 0)
const hasStockDividend = computed(() => estimatedStockShares.value > 0)
const tradingDate = computed(() =>
  props?.data?.tradingDate ? dayjs(props?.data?.tradingDate).format('YYYY-MM-DD') : '-'
)
const payDate = computed(() =>
  props?.data?.payDate ? dayjs(props?.data?.payDate).format('YYYY-MM-DD') : '-'
)

const stockExDate = computed(() =>
  props?.data?.stockExDate ? dayjs(props?.data?.stockExDate).format('YYYY-MM-DD') : '-'
)
const formatCurrency = (value) => Math.round(value).toLocaleString()
const formatShares = (value) => value.toLocaleString(undefined, { maximumFractionDigits: 4 })
//簡易模式
const easyMode = ref(true)
</script>

<template>
  <div
    class="px-[10px] border border-[var(--main-gray-color)] divide-y divide-[var(--main-gray-color)]"
    @click="easyMode = !easyMode"
  >
    <div class="font-black text-[16px] py-[10px]">
      <div class="text-[var(--main-primary-color)]">{{ stockId }} {{ stockName }}</div>
      <div v-if="hasCashDividend">
        <span class="text-[var(--main-primary-color)]">{{ payDate }}</span>
        {{ payDate === '-' ? '發放日待公告，預估現金股利' : '現金股利' }}
        <span class="text-[var(--main-primary-color)]">{{ formatCurrency(cashIncome) }}</span>
        元
      </div>
      <div v-if="hasStockDividend">
        預估獲配
        <span class="text-[var(--main-primary-color)]">
          {{ formatShares(estimatedStockShares) }}
        </span>
        股
      </div>
    </div>
    <div v-if="hasCashDividend" v-show="!easyMode">
      <div class="text-[14px] py-[10px]">
        <div class="flex justify-between">
          <span>除息日期</span>
          <span class="text-[var(--main-primary-color)]">{{ tradingDate }}</span>
        </div>
      </div>
    </div>
    <div v-if="hasCashDividend" v-show="!easyMode">
      <div class="text-[14px] py-[10px]">
        <div class="flex justify-between">
          <span>參加庫存</span>
          <span class="text-[var(--main-primary-color)]">
            {{ formatShares(cashEligibleShares) }} 股
          </span>
        </div>
        <div class="">
          每股現金股利
          <span class="text-[var(--main-primary-color)]">{{ cashPerShare }}</span>
          元，約可收到
          <span class="text-[var(--main-primary-color)]">{{ formatCurrency(cashIncome) }}</span>
          元
        </div>
      </div>
    </div>
    <div v-if="hasStockDividend" v-show="!easyMode">
      <div class="text-[14px] py-[10px] space-y-1">
        <div class="flex justify-between">
          <span>股票除權日</span>
          <span class="text-[var(--main-primary-color)]">{{ stockExDate }}</span>
        </div>
        <div class="flex justify-between">
          <span>配股率</span>
          <span class="text-[var(--main-primary-color)]">{{ (stockRatio * 100).toFixed(2) }}%</span>
        </div>
        <div class="flex justify-between">
          <span>股票權益目前參考市值</span>
          <span class="text-[var(--main-primary-color)]">
            {{
              props.data.isStockRightRecognized
                ? `${formatCurrency(stockRightsMarketValue)} 元`
                : '尚未除權'
            }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="hasCashDividend || hasStockDividend" v-show="!easyMode">
      <div class="text-[14px] py-[10px]">
        <div class="flex justify-between font-black">
          <span>現金加股票權益總價值</span>
          <span class="text-[var(--main-primary-color)]"
            >{{ formatCurrency(totalBenefitValue) }} 元</span
          >
        </div>
        <p v-if="hasStockDividend" class="mt-2 text-[12px] text-[var(--text-secondary-color)]">
          預估獲配股數可能包含小數，實際零股分配與入帳股數以公司及集保結果為準。
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
