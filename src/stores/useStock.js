import { defineStore } from 'pinia'
import { getPrice } from '@/api/price.js'
import { getStockList, getDividendList } from '@/composables/piniaStock.js'
import { getStock, getStockDividend } from '@/firebase/stock.js'
import { getPortfolioReconciliationData } from '@/firebase/portfolioReconciliation.js'
import { add } from '@/composables/useMath.js'
import { normalizeDividendEvents } from '@/utils/stockDividend.js'
import dayjs from 'dayjs'

const STOCK_DATA_SCHEMA_VERSION = 4

export const useStockStore = defineStore('stock', {
  persist: true,
  state: () => ({
    loading: false,
    orgData: [],
    orgReconciliationData: [],
    orgImportSources: [],
    orgImportHoldings: [],
    orgImportBatches: [],
    orgPriceData: {},
    orgDividendData: {},
    dataSchemaVersion: 0,
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
          if (e.stockId && !_set.has(e.stockId)) _set.add(e.stockId)
        })
      }
      if (state.orgReconciliationData) {
        state.orgReconciliationData.forEach((item) => {
          if (item.stockId && !_set.has(item.stockId)) _set.add(item.stockId)
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
      if (this.dataSchemaVersion !== STOCK_DATA_SCHEMA_VERSION) isForce = true

      //非強制時或非必須更新，檢查是否需要更新
      if (!isForce && !this.update.isNeedUpdate) {
        if (this.update.date && dayjs(this.update.date).isSameOrAfter(dayjs(), 'day')) {
          {
            this.getPriceData() // 僅更新價格
            this.loading = false
            return
          }
        }
      }
      this.loading = true
      try {
        const [stockResult, reconciliationResult] = await Promise.allSettled([
          getStock(),
          getPortfolioReconciliationData()
        ])
        const res = stockResult.status === 'fulfilled' ? stockResult.value : null
        if (res?.status === 200) {
          this.orgData = res.data
        }
        if (reconciliationResult.status === 'fulfilled') {
          this.orgReconciliationData = reconciliationResult.value.adjustments
          this.orgImportSources = reconciliationResult.value.sources
          this.orgImportHoldings = reconciliationResult.value.holdings
          this.orgImportBatches = reconciliationResult.value.batches
        }

        if (res?.status === 200 || reconciliationResult.status === 'fulfilled') {
          // 取得股票清單
          const _set = new Set()
          if (this.orgData) {
            this.orgData.forEach((e) => {
              if (e.stockId && !_set.has(e.stockId)) _set.add(e.stockId)
            })
          }
          this.orgReconciliationData.forEach((item) => {
            if (item.stockId && !_set.has(item.stockId)) _set.add(item.stockId)
          })
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
          this.dataSchemaVersion = STOCK_DATA_SCHEMA_VERSION
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      this.loading = false
      this.update.isNeedUpdate = false
    },
    async getDividendData(stockId) {
      if (!stockId) return []
      return getStockDividend(stockId).then((res) => {
        if (res.status === 200) {
          return normalizeDividendEvents(res.data, stockId)
        } else {
          return []
        }
      })
    },
    async getPriceData(stockId = null) {
      if (stockId) {
        return getPrice({ stockId: stockId }).then((res) => {
          if (res.status === 200) {
            return res?.data?.price !== '' ? res?.data?.price : null
          }
        })
      } else {
        Object.keys(this.orgPriceData).forEach(async (e) => {
          this.orgPriceData[e] = await this.getPriceData(e)
        })
      }
    },
    //Methods
    //持股=>帶搜尋條件
    getStockList(config = null) {
      return getStockList(useStockStore(), config)
    },
    //價格=>帶搜尋條件
    getStockCost(config = null) {
      const _stockList = this.getStockList(config)
      let _cost = 0
      if (_stockList && typeof _stockList === 'object') {
        Object.keys(_stockList).forEach((e) => {
          _cost = add(_cost, _stockList[e]?.buyPrice)
        })
      }
      return _cost
    },
    clear() {
      this.orgData = []
      this.orgReconciliationData = []
      this.orgImportSources = []
      this.orgImportHoldings = []
      this.orgImportBatches = []
      this.orgPriceData = {}
      this.orgDividendData = {}
      this.dataSchemaVersion = 0
      this.update.isNeedUpdate = true
    }
  }
})
