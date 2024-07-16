import { defineStore } from 'pinia'
import { getPrice } from '@/api/price.js'
import { getStockList, getDividendList } from '@/composables/piniaStock.js'
import { getStock, getStockDividend } from '@/firebase/stock.js'

export const useStockStore = defineStore('stock', {
  persist: true,
  state: () => ({
    loading: false,
    orgData: [],
    orgPriceData: {},
    orgDividendData: {}
  }),
  getters: {
    stockIdList: (state) => {
      const _set = new Set()
      if (state.orgData) {
        state.orgData.map((e) => {
          if (!_set.has(e.stockId)) _set.add(e.stockId)
        })
      }
      return _set
    },
    stockList: (state) => getStockList(state),
    dividendList: (state) => getDividendList(state)
  },
  actions: {
    async getData() {
      this.loading = true
      await getStock().then((res) => {
        if (res.status === 200) {
          this.orgData = res.data
          //取得股票清單
          const _set = new Set()
          if (res.data) {
            res.data.map((e) => {
              if (!_set.has(e.stockId)) _set.add(e.stockId)
            })
          }
          //批次取得股票股利與價格
          _set.forEach(async (stockId) => {
            this.orgPriceData[stockId] = await this.getPriceData(stockId)
            this.orgDividendData[stockId] = await this.getDividendData(stockId)
          })
        }
      })
      this.loading = false
    },
    async getDividendData(stockId) {
      return getStockDividend(stockId).then((res) => {
        if (res.status === 200) {
          return res.data
            .map((e) => {
              if (
                e.CashExDividendTradingDate &&
                e.CashDividendPaymentDate &&
                e.CashEarningsDistribution
              )
                return {
                  CashExDividendTradingDate: e.CashExDividendTradingDate, //除權息日
                  CashDividendPaymentDate: e.CashDividendPaymentDate, //付款日期
                  CashEarningsDistribution: e.CashEarningsDistribution //現金配息
                }
              else {
                return null
              }
            })
            .filter(Boolean)
        } else {
          return null
        }
      })
    },
    async getPriceData(stockId) {
      return getPrice({ stockId: stockId }).then((res) => {
        if (res.status === 200) {
          return res?.data?.price !== '' ? res?.data?.price : null
        }
      })
    }
  }
})
