import dayjs from 'dayjs'

const toNumber = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const toDateValue = (value) => {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  return value
}

export const toDividendDate = (value) => {
  const parsed = dayjs(toDateValue(value))
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null
}

const normalizeCash = (event) => {
  const legacyEarnings = toNumber(event?.CashEarningsDistribution)
  const legacyReserve = toNumber(event?.CashStatutorySurplus)

  return {
    earningsPerShare: toNumber(event?.cash?.earningsPerShare ?? legacyEarnings),
    legalReservePerShare: toNumber(event?.cash?.legalReservePerShare),
    capitalReservePerShare: toNumber(event?.cash?.capitalReservePerShare ?? legacyReserve),
    reservePerShare: toNumber(event?.cash?.reservePerShare ?? legacyReserve),
    totalPerShare: toNumber(event?.cash?.totalPerShare ?? legacyEarnings + legacyReserve),
    exDate: toDividendDate(event?.cash?.exDate ?? event?.CashExDividendTradingDate),
    paymentDate: toDividendDate(event?.cash?.paymentDate ?? event?.CashDividendPaymentDate)
  }
}

const normalizeStock = (event) => {
  const hasStandardStock = event?.stock && typeof event.stock === 'object'
  const legacyEarnings = toNumber(event?.StockEarningsDistribution)
  const legacyReserve = toNumber(event?.StockStatutorySurplus)
  const totalPerShare = toNumber(event?.stock?.totalPerShare ?? legacyEarnings + legacyReserve)
  const ratioValue = event?.stock?.ratio

  return {
    earningsPerShare: toNumber(event?.stock?.earningsPerShare ?? legacyEarnings),
    legalReservePerShare: toNumber(event?.stock?.legalReservePerShare),
    capitalReservePerShare: toNumber(event?.stock?.capitalReservePerShare ?? legacyReserve),
    reservePerShare: toNumber(event?.stock?.reservePerShare ?? legacyReserve),
    totalPerShare,
    ratio: hasStandardStock
      ? ratioValue === null || ratioValue === undefined
        ? null
        : toNumber(ratioValue)
      : totalPerShare / 10,
    exDate: toDividendDate(event?.stock?.exDate ?? event?.StockExDividendTradingDate)
  }
}

export const normalizeDividendEvent = (event, stockCode = '') => {
  if (!event || typeof event !== 'object') return null

  const cash = normalizeCash(event)
  const stock = normalizeStock(event)
  const normalizedStockCode = String(event.stockCode || stockCode || '')
  const eventId = String(
    event.eventId ||
      event.id ||
      [normalizedStockCode, cash.exDate || stock.exDate || event.decisionDate || 'unknown'].join(
        '-'
      )
  )

  return {
    ...event,
    eventId,
    stockCode: normalizedStockCode,
    fiscalYear: Number(event.fiscalYear) || null,
    decisionDate: toDividendDate(event.decisionDate),
    cash,
    stock
  }
}

export const normalizeDividendEvents = (events, stockCode = '') =>
  (Array.isArray(events) ? events : [])
    .map((event) => normalizeDividendEvent(event, stockCode))
    .filter(Boolean)

export const isDividendEligibleLot = (lot, exDate) => {
  const normalizedExDate = toDividendDate(exDate)
  const buyDate = toDividendDate(lot?.buyDate)
  const sellDate = toDividendDate(lot?.sellDate)

  if (!normalizedExDate || !buyDate) return false
  return buyDate < normalizedExDate && (!sellDate || sellDate >= normalizedExDate)
}

export const getEligibleShares = (lots, exDate) =>
  (Array.isArray(lots) ? lots : [])
    .filter((lot) => isDividendEligibleLot(lot, exDate))
    .reduce((total, lot) => total + toNumber(lot.buyNum), 0)

const getEventDisplayDate = (event) =>
  event.cash.paymentDate || event.cash.exDate || event.stock.exDate || event.decisionDate

export const buildStockDividendBenefits = ({
  lots = [],
  events = [],
  currentPrice = 0,
  stockCode = '',
  stockName = '',
  today = dayjs().format('YYYY-MM-DD')
} = {}) => {
  const normalizedEvents = normalizeDividendEvents(events, stockCode)
  const stockBenefits = new Map()
  let recognizedDerivedShares = 0

  normalizedEvents
    .filter((event) => event.stock.ratio > 0 && event.stock.exDate)
    .sort(
      (a, b) => a.stock.exDate.localeCompare(b.stock.exDate) || a.eventId.localeCompare(b.eventId)
    )
    .forEach((event) => {
      const transactionShares = getEligibleShares(lots, event.stock.exDate)
      const eligibleShares = transactionShares + recognizedDerivedShares
      const estimatedShares = eligibleShares * event.stock.ratio
      const isRecognized = event.stock.exDate <= today

      stockBenefits.set(event.eventId, {
        transactionShares,
        eligibleShares,
        estimatedShares,
        isRecognized
      })

      if (isRecognized) recognizedDerivedShares += estimatedShares
    })

  const rows = normalizedEvents
    .map((event) => {
      const cashEligibleShares =
        event.cash.totalPerShare > 0 ? getEligibleShares(lots, event.cash.exDate) : 0
      const cashIncome = cashEligibleShares * event.cash.totalPerShare
      const stockBenefit = stockBenefits.get(event.eventId) || {
        transactionShares: 0,
        eligibleShares: 0,
        estimatedShares: 0,
        isRecognized: false
      }
      const stockRightsMarketValue = stockBenefit.isRecognized
        ? stockBenefit.estimatedShares * toNumber(currentPrice)
        : 0
      const displayDate = getEventDisplayDate(event)
      const displayDateValue = displayDate ? dayjs(displayDate) : null

      return {
        ...event,
        stockId: event.stockCode || String(stockCode),
        stockName,
        displayDate,
        year: displayDateValue?.isValid() ? displayDateValue.year() : event.fiscalYear,
        month: displayDateValue?.isValid() ? displayDateValue.month() + 1 : null,
        payDate: event.cash.paymentDate,
        tradingDate: event.cash.exDate,
        stockExDate: event.stock.exDate,
        stockNum: cashEligibleShares,
        earn: event.cash.totalPerShare,
        cashEligibleShares,
        cashIncome,
        stockEligibleTransactionShares: stockBenefit.transactionShares,
        stockEligibleShares: stockBenefit.eligibleShares,
        estimatedStockShares: stockBenefit.estimatedShares,
        isStockRightRecognized: stockBenefit.isRecognized,
        stockRightsMarketValue,
        totalBenefitValue: cashIncome + stockRightsMarketValue
      }
    })
    .filter((row) => row.cashIncome > 0 || row.estimatedStockShares > 0)
    .sort((a, b) => {
      if (!a.displayDate) return 1
      if (!b.displayDate) return -1
      return b.displayDate.localeCompare(a.displayDate) || b.eventId.localeCompare(a.eventId)
    })

  const summary = rows.reduce(
    (result, row) => {
      result.cashIncome += row.cashIncome
      result.estimatedStockShares += row.estimatedStockShares
      if (row.isStockRightRecognized) {
        result.recognizedStockShares += row.estimatedStockShares
        result.stockRightsMarketValue += row.stockRightsMarketValue
      } else {
        result.pendingStockShares += row.estimatedStockShares
      }
      result.totalBenefitValue += row.totalBenefitValue
      return result
    },
    {
      cashIncome: 0,
      estimatedStockShares: 0,
      recognizedStockShares: 0,
      pendingStockShares: 0,
      stockRightsMarketValue: 0,
      totalBenefitValue: 0
    }
  )

  return { rows, summary }
}
