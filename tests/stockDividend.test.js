import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildStockDividendBenefits,
  getDividendAnnualTotals,
  normalizeDividendEvents
} from '../src/utils/stockDividend.js'

const legacyEvent = {
  CashEarningsDistribution: 1.5,
  CashExDividendTradingDate: '2025-08-10',
  CashDividendPaymentDate: '2025-09-01'
}

const normalizedEvent = {
  eventId: '2025-annual-1',
  stockCode: '1513',
  fiscalYear: 2025,
  cash: {
    earningsPerShare: 1.5,
    totalPerShare: 1.5,
    exDate: '2025-08-10',
    paymentDate: '2025-09-01'
  },
  stock: { totalPerShare: 0, ratio: null, exDate: null },
  source: 'TWSE',
  contentHash: 'hash-2025-annual-1'
}

test('merges legacy and normalized copies of the same dividend event', () => {
  const events = normalizeDividendEvents([legacyEvent, normalizedEvent], '1513')

  assert.equal(events.length, 1)
  assert.equal(events[0].eventId, '2025-annual-1')
})

test('keeps different dividend events in the same year', () => {
  const events = normalizeDividendEvents(
    [
      normalizedEvent,
      {
        ...normalizedEvent,
        eventId: '2025-annual-2',
        cash: { ...normalizedEvent.cash, exDate: '2025-12-10', paymentDate: null },
        contentHash: 'hash-2025-annual-2'
      }
    ],
    '1513'
  )

  assert.equal(events.length, 2)
})

test('keeps events with the same payment date when the ex-date or amount differs', () => {
  const events = normalizeDividendEvents(
    [
      normalizedEvent,
      {
        ...normalizedEvent,
        eventId: '2025-annual-2',
        cash: { ...normalizedEvent.cash, totalPerShare: 2, exDate: '2025-08-11' },
        contentHash: 'hash-2025-annual-2'
      }
    ],
    '1513'
  )

  assert.equal(events.length, 2)
})

test('does not duplicate benefits when a lot was sold', () => {
  const { rows, summary } = buildStockDividendBenefits({
    stockCode: '1513',
    stockName: '中興電',
    lots: [{ buyDate: '2025-01-01', buyNum: 1000, sellDate: '2025-12-01', sellPrice: 10 }],
    events: [legacyEvent, normalizedEvent]
  })

  assert.equal(rows.length, 1)
  assert.equal(summary.cashIncome, 1500)
})

test('aggregates all stocks by annual cash income and excludes stock-only rights', () => {
  const totals = getDividendAnnualTotals([
    { stockId: '2330', stockName: '台積電', cashIncome: 1200, total: 1200 },
    { stockId: '2330', stockName: '台積電', cashIncome: 800, total: 800 },
    { stockId: '1513', stockName: '中興電', cashIncome: 1500, total: 1500 },
    { stockId: '0050', stockName: '元大台灣50', cashIncome: 0, total: 0 }
  ])

  assert.deepEqual(totals, [
    { stockId: '2330', stockName: '台積電', yearTotal: 2000 },
    { stockId: '1513', stockName: '中興電', yearTotal: 1500 }
  ])
  assert.equal(
    totals.reduce((total, item) => total + item.yearTotal, 0),
    3500
  )
})
