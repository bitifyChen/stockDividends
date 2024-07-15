import { defineStore } from 'pinia'
import { useCookies } from '@vueuse/integrations/useCookies'
import { getStock } from '@/api/stock.js'
import { getStockDividend } from '@/api/stock.js'
import { getPrice } from '@/api/price.js'
import { getStockList, getDividendList } from '@/composables/piniaStock.js'
const cookies = useCookies(['token'])

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
      const _token = cookies.get('token')
      await getStock({ id: _token }).then((res) => {
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
            //如已有股利不重複拿取(因資料大)
            if (!this.orgDividendData[stockId])
              this.orgDividendData[stockId] = await this.getDividendData(stockId)
          })
        }
      })
      this.loading = false
    },
    async getDividendData(stockId) {
      return getStockDividend({ id: stockId }).then((res) => {
        if (res.status === 200) {
          return res.data.map((e) => ({
            CashExDividendTradingDate: e.CashExDividendTradingDate, //除權息日
            CashDividendPaymentDate: e.CashDividendPaymentDate, //付款日期
            CashEarningsDistribution: e.CashEarningsDistribution //現金配息
          }))
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
