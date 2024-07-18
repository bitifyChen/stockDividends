import { add, subtract, multiply } from '@/composables/useMath.js'
import stockName from '@/data/stockName.json'
export const getStockList = (state) => {
  const _data = {}
  state.stockIdList.forEach((e) => {
    const _stockListById = state.orgData.filter((f) => f.stockId === e) //此支股票所有資料
    const _stockDateListById = _stockListById.map((e) => new Date(e.buyDate)) //此支股票所有日期
    _data[e] = {
      data: _stockListById
        .map((x) => {
          //股價相關
          const earnPrice = state.orgPriceData[e]
            ? multiply(subtract(state.orgPriceData[e], x.buyPrice), x.buyNum)
            : null
          //股息相關
          const _dividendList = state.orgDividendData[e]
            ? state.orgDividendData[e].filter((date) => date.CashExDividendTradingDate > x.buyDate)
            : null
          //計算此張股票股利
          const earnDividend = _dividendList
            ? _dividendList.reduce((total, dividend) => {
                const dividendEarned = multiply(dividend.CashEarningsDistribution, x.buyNum)
                return add(total, dividendEarned)
              }, 0)
            : null
          return {
            ...x,
            earnPrice: earnPrice,
            earnDividend: earnDividend,
            dividendList: _dividendList
          }
        })
        .sort((a, b) => new Date(b.buyDate) - new Date(a.buyDate)), //日期：近=>遠
      price: state.orgPriceData[e] ?? null, //現價,
      inStockStart: new Date(Math.min(..._stockDateListById)).toISOString(),
      inStockEnd: new Date(Math.max(..._stockDateListById)).toISOString(),
      name: stockName[e] ?? '-'
    }
  })
  return _data
}

export const getDividendList = (state) => {
  const _stockList = state.stockList ?? [] //擁有的所有股票資料
  const _stockDividendList = state.orgDividendData ?? [] //所有股票股利資料
  const _totalDividendList = []

  // Check if _stockList and _stockDividendList are objects
  if (typeof _stockList !== 'object' || typeof _stockDividendList !== 'object') {
    console.error('Invalid stock list or dividend data structure')
    return _totalDividendList // Return empty list in case of error
  }

  for (const [stockId, item] of Object.entries(_stockList)) {
    if (!_stockDividendList[stockId]) {
      console.warn(`No dividend data for stock ID: ${stockId}`)
      continue // Skip to the next stock if no dividend data is found
    }

    // Check if item is an object and has the necessary properties
    if (typeof item !== 'object' || !item.inStockStart || !Array.isArray(item.data)) {
      console.error(`Invalid stock item data for stock ID: ${stockId}`)
      continue // Skip invalid stock items
    }

    const _dividendList = _stockDividendList[stockId]?.filter(
      (e) => e.CashExDividendTradingDate >= item.inStockStart
    )

    if (_dividendList?.length) {
      _dividendList.forEach((i) => {
        // Check if the necessary properties are present in each dividend item
        if (
          !i.CashExDividendTradingDate ||
          !i.CashDividendPaymentDate ||
          !i.CashEarningsDistribution
        ) {
          console.error(`Invalid dividend data for stock ID: ${stockId}`)
          return // Skip invalid dividend items
        }

        const stockNum = item.data
          .filter((x) => x.buyDate <= i.CashExDividendTradingDate)
          .reduce((total, stock) => {
            return add(total, stock.buyNum)
          }, 0)

        const _data = {
          year: new Date(i.CashDividendPaymentDate).getFullYear(),
          month: new Date(i.CashDividendPaymentDate).getMonth() + 1,
          stockId: stockId,
          stockNum: stockNum,
          stockName: item?.name,
          pay_date: i.CashDividendPaymentDate,
          tradingDate: i.CashExDividendTradingDate,
          earn: i.CashEarningsDistribution
        }

        _totalDividendList.push(_data)
      })
    }
  }

  return _totalDividendList.sort((a, b) => new Date(b.pay_date) - new Date(a.pay_date)) //日期：近=>遠
}
