import { defineStore } from 'pinia'
import { getPrice } from '@/api/price.js'
import { getStockList, getDividendList } from '@/composables/piniaStock.js'
import { getStock, getStockDividend } from '@/firebase/stock.js'
import { add } from '@/composables/useMath.js'
import dayjs from 'dayjs'

export const useStockStore = defineStore('stock', {
  persist: true,
  state: () => ({
    loading: false,
    orgData: [],
    orgPriceData: {},
    orgDividendData: {},
    update: {
      isNeedUpdate: false,
      date: null
    }
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
    dividendList: (state) => getDividendList(state),
    totalCost: (state) => {
      const _stockList = state.stockList
      let _cost = 0
      if (_stockList && typeof _stockList === 'object') {
        Object.keys(_stockList).forEach((e) => {
          _cost = add(_cost, _stockList[e]?.buyPrice)
        })
      }
      return _cost
    }
  },
  actions: {
    async getData(isForce = false) {
      //非強制時或非必須更新，檢查是否需要更新
      if (!isForce && !this.update.isNeedUpdate) {
        if (this.update.date && dayjs(this.update.date).isSameOrAfter(dayjs(), 'day'))  {
          {         
            this.loading = false
            return
          }
        }
      }
      this.loading = true
      try {
        const res = await getStock()
        if (res.status === 200) {
          this.orgData = res.data
          // 取得股票清單
          const _set = new Set()
          if (res.data) {
            res.data.forEach((e) => {
              if (!_set.has(e.stockId)) _set.add(e.stockId)
            })
          }
          // 批次取得股票股利與價格
          const promises = []
          _set.forEach((stockId) => {
            const pricePromise = this.getPriceData(stockId).then((data) => {
              this.orgPriceData[stockId] = data
            })
            const dividendPromise = this.getDividendData(stockId).then((data) => {
              this.orgDividendData[stockId] = data
            })

            promises.push(pricePromise, dividendPromise)
          })
          // 等待所有的 promises 完成
          await Promise.all(promises)
          this.update.date = dayjs().format('YYYY-MM-DD')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      this.loading = false
      this.update.isNeedUpdate=false
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
    },
    clear() {
      this.orgData = []
      this.orgPriceData = {}
      this.orgDividendData = {}
    }
  }
})
