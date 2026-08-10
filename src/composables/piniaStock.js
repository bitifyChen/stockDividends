import { add, subtract, multiply, round } from '@/composables/useMath.js'
import stockName from '@/data/stockName.json'
import {
  buildStockDividendBenefits,
  isDividendEligibleLot,
  normalizeDividendEvents
} from '@/utils/stockDividend.js'
export const getStockList = (state, config = null) => {
  const _data = {}
  //如果夾帶搜尋條件
  let rangeStart, rangeEnd
  if (config) {
    rangeStart = new Date(config.dateRange[0])
    rangeEnd = new Date(config.dateRange[1])
  }
  state.stockIdList.forEach((e) => {
    if (e === undefined) return
    const _stockListById =
      rangeStart && rangeEnd
        ? state.orgData.filter(
            (f) =>
              f.stockId === e &&
              new Date(f.buyDate) < new Date(rangeEnd) &&
              (!f.sellDate || new Date(f.sellDate) > new Date(rangeStart))
          )
        : state.orgData.filter((f) => f.stockId === e)
    const _stockDateListById = _stockListById.map((e) => new Date(e?.buyDate)) //此支股票所有日期
    const _reconciliationAdjustments = (state.orgReconciliationData || []).filter(
      (adjustment) =>
        adjustment.stockId === e &&
        adjustment.status === 'confirmed' &&
        adjustment.direction === 'add' &&
        (!rangeEnd || new Date(adjustment.effectiveDate) < rangeEnd)
    )
    const normalizedDividendEvents = normalizeDividendEvents(state.orgDividendData[e], e)
    const dividendBenefits = buildStockDividendBenefits({
      lots: _stockListById,
      quantityAdjustments: _reconciliationAdjustments,
      events: normalizedDividendEvents,
      currentPrice: state.orgPriceData[e],
      stockCode: e,
      stockName: stockName[e] ?? '-'
    })
    const buyNum = _stockListById
      .filter((f) => !f.sellDate)
      .reduce((total, item) => add(total, item.buyNum), 0)
    const buyPrice = _stockListById
      .filter((f) => !f.sellDate)
      .reduce((total, item) => add(total, round(multiply(item.buyPrice, item.buyNum))), 0)
    const reconciliationShares = _reconciliationAdjustments.reduce(
      (total, item) => add(total, item.shares),
      0
    )
    const buyNumWithReconciliation = add(buyNum, reconciliationShares)
    const realHoldingMarketValue = state.orgPriceData[e]
      ? multiply(state.orgPriceData[e], buyNumWithReconciliation)
      : 0

    _data[e] = {
      data: _stockListById
        .map((x) => {
          //股價相關(如有售出日，則以售出價格算)
          const earnPrice = state.orgPriceData[e]
            ? multiply(
                subtract(x.sellDate ? x.sellPrice : state.orgPriceData[e], x.buyPrice),
                x.buyNum
              )
            : null
          //股利相關
          const _dividendList = normalizedDividendEvents.filter(
            (event) => event.cash.totalPerShare > 0 && isDividendEligibleLot(x, event.cash.exDate)
          )
          //計算此張股票股利
          const earnDividend = _dividendList
            ? _dividendList.reduce((total, dividend) => {
                const dividendEarned = multiply(dividend.cash.totalPerShare, x.buyNum)
                return add(total, dividendEarned)
              }, 0)
            : null
          return {
            ...x,
            earnPrice: earnPrice,
            earnDividend: round(earnDividend ?? 0),
            dividendList: _dividendList
          }
        })
        .sort((a, b) => new Date(b.buyDate) - new Date(a.buyDate)), //日期：近=>遠
      price: state.orgPriceData[e] ?? null, //現價,
      inStockStart: _stockDateListById.length
        ? new Date(Math.min(..._stockDateListById))?.toISOString()
        : null,
      inStockEnd: _stockDateListById.length
        ? new Date(Math.max(..._stockDateListById))?.toISOString()
        : null,
      name: stockName[e] ?? '-',
      buyNum: buyNumWithReconciliation,
      buyPrice,
      reconciliationAdjustments: _reconciliationAdjustments,
      reconciliationShares,
      unknownCostShares: reconciliationShares,
      realHoldingMarketValue,
      stockDividendRights: dividendBenefits.summary,
      stockRightsMarketValue: dividendBenefits.summary.stockRightsMarketValue,
      totalReferenceMarketValue:
        realHoldingMarketValue + dividendBenefits.summary.stockRightsMarketValue
    }
  })
  return _data
}

export const getDividendList = (state) => {
  const _stockList = state.stockList ?? {} //擁有的所有股票資料
  const _stockDividendList = state.orgDividendData ?? {} //所有股票股利資料
  const _totalDividendList = []

  // Check if _stockList and _stockDividendList are objects
  if (typeof _stockList !== 'object' || typeof _stockDividendList !== 'object') {
    console.error('Invalid stock list or dividend data structure')
    return _totalDividendList // Return empty list in case of error
  }

  for (const [stockId, item] of Object.entries(_stockList)) {
    if (typeof item !== 'object' || !Array.isArray(item.data)) {
      console.error(`Invalid stock item data for stock ID: ${stockId}`)
      continue // Skip invalid stock items
    }

    const dividendBenefits = buildStockDividendBenefits({
      lots: item.data,
      quantityAdjustments: item.reconciliationAdjustments,
      events: _stockDividendList[stockId],
      currentPrice: item.price,
      stockCode: stockId,
      stockName: item.name
    })
    _totalDividendList.push(...dividendBenefits.rows)
  }

  return _totalDividendList.sort((a, b) => {
    if (!a.displayDate) return 1
    if (!b.displayDate) return -1
    return b.displayDate.localeCompare(a.displayDate) || b.eventId.localeCompare(a.eventId)
  }) //日期：近=>遠
}
