import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  buildReconciliationPreview,
  createReconciliationAdjustments,
  getObservedBalances,
  getObservedHoldingSnapshots
} from '../src/utils/import/reconciliation.js'
import {
  createImportFingerprint,
  mergeImportAccounts
} from '../src/utils/import/adapters/tdccLedgerPdf.js'
import { createImportAdapterRegistry } from '../src/utils/import/adapter.js'
import { buildStockDividendBenefits } from '../src/utils/stockDividend.js'

const canonicalResult = {
  adapterId: 'fixture-ledger',
  sourceType: 'fixture',
  sourceMedia: 'fixture',
  reportType: 'transaction-ledger',
  coverage: 'partial',
  importFingerprint: 'fixture-import',
  accounts: [
    {
      accountFingerprint: 'account-a',
      sourceFingerprint: 'source-a',
      sourceAsOfDate: '2026-08-10',
      rows: [
        {
          stockId: '0050',
          stockName: 'ETF 0050',
          tradeDate: '2026-08-10',
          sourceOrder: 1,
          balance: 100,
          operationType: 'buy'
        },
        {
          stockId: '0050',
          stockName: 'ETF 0050',
          tradeDate: '2026-08-10',
          sourceOrder: 0,
          balance: 125,
          operationType: 'transfer'
        },
        {
          stockId: '2330',
          stockName: 'Stock 2330',
          tradeDate: '2026-08-09',
          sourceOrder: 0,
          balance: 80,
          operationType: 'sell'
        }
      ]
    }
  ]
}

const readPortfolioImportFixture = async () =>
  JSON.parse(
    await readFile(new URL('./fixtures/portfolio-import-samples.json', import.meta.url), 'utf8')
  )

test('uses the newest same-day ledger balance and keeps transfer rows neutral', () => {
  const balances = getObservedBalances(canonicalResult.accounts)

  assert.equal(balances.get('0050').observedShares, 125)
  assert.equal(balances.get('2330').observedShares, 80)
})

test('keeps the latest observed holding snapshot separated by broker account', () => {
  const snapshots = getObservedHoldingSnapshots(
    [
      {
        accountFingerprint: 'account-broker-a',
        sourceFingerprint: 'source-a',
        brokerName: '測試券商甲',
        sourceAsOfDate: '2026-08-10',
        rows: [
          {
            stockId: '2330',
            tradeDate: '2026-08-10',
            sourceOrder: 0,
            balance: 100,
            operationType: 'buy'
          }
        ]
      },
      {
        accountFingerprint: 'account-broker-b',
        sourceFingerprint: 'source-b',
        brokerName: '測試券商乙',
        sourceAsOfDate: '2026-08-10',
        rows: [
          {
            stockId: '2330',
            tradeDate: '2026-08-10',
            sourceOrder: 0,
            balance: 250,
            operationType: 'buy'
          }
        ]
      }
    ],
    'tdcc-ledger-pdf'
  )

  assert.deepEqual(
    snapshots.map(({ accountFingerprint, brokerName, stockId, observedShares }) => ({
      accountFingerprint,
      brokerName,
      stockId,
      observedShares
    })),
    [
      {
        accountFingerprint: 'account-broker-a',
        brokerName: '測試券商甲',
        stockId: '2330',
        observedShares: 100
      },
      {
        accountFingerprint: 'account-broker-b',
        brokerName: '測試券商乙',
        stockId: '2330',
        observedShares: 250
      }
    ]
  )
})

test('deduplicates reissued broker ledgers and keeps merged-account transfers neutral', async () => {
  const fixture = await readPortfolioImportFixture()
  const samples = fixture.samples
  const mergedAccounts = await mergeImportAccounts(samples)
  const reversedMergedAccounts = await mergeImportAccounts([...samples].reverse())

  assert.equal(samples.length, 3)
  assert.equal(mergedAccounts.length, 2)
  assert.equal(
    mergedAccounts.find((account) => account.accountFingerprint === 'fixture-account-broker-a')
      .fileCount,
    2
  )
  assert.equal(
    mergedAccounts.find((account) => account.accountFingerprint === 'fixture-account-broker-a')
      .duplicateFileCount,
    1
  )
  assert.equal(
    mergedAccounts.find((account) => account.accountFingerprint === 'fixture-account-broker-a').rows
      .length,
    2
  )

  const balances = getObservedBalances(mergedAccounts)
  assert.equal(balances.get('2330').observedShares, 100)
  assert.equal(balances.get('0050').observedShares, 150)
  assert.equal(
    await createImportFingerprint(mergedAccounts),
    await createImportFingerprint(reversedMergedAccounts)
  )

  const preview = buildReconciliationPreview({
    canonicalResult: {
      ...canonicalResult,
      accounts: mergedAccounts,
      adapterId: 'fixture-broker-batch'
    },
    orgData: [
      { stockId: '2330', buyNum: 100, buyDate: '2026-01-01' },
      { stockId: '0050', buyNum: 100, buyDate: '2026-01-01' }
    ]
  })

  assert.equal(preview.rows.find((row) => row.stockId === '2330').status, 'verified')
  assert.equal(preview.rows.find((row) => row.stockId === '0050').deltaShares, 50)
})

test('does not turn unsupported ledger rows into an unobserved holding', () => {
  const preview = buildReconciliationPreview({
    canonicalResult: {
      ...canonicalResult,
      accounts: [
        {
          ...canonicalResult.accounts[0],
          rows: [
            {
              stockId: '8888',
              stockName: '不支援商品',
              operationType: 'unsupported',
              tradeDate: '2026-08-10',
              balance: null
            }
          ]
        }
      ]
    }
  })

  assert.equal(
    preview.rows.some((row) => row.stockId === '8888'),
    false
  )
})

test('creates only positive unknown-cost adjustments and leaves negative differences for review', () => {
  const preview = buildReconciliationPreview({
    canonicalResult,
    orgData: [
      { stockId: '0050', buyNum: 100, buyDate: '2026-01-01' },
      { stockId: '2330', buyNum: 100, buyDate: '2026-01-01' }
    ]
  })

  const addRow = preview.rows.find((row) => row.stockId === '0050')
  const reviewRow = preview.rows.find((row) => row.stockId === '2330')
  assert.equal(addRow.status, 'add')
  assert.equal(addRow.deltaShares, 25)
  assert.equal(reviewRow.status, 'review')
  assert.equal(reviewRow.selected, false)
  assert.deepEqual(createReconciliationAdjustments(preview.rows, 'batch-a', 'fixture-ledger'), [
    {
      stockId: '0050',
      shares: 25,
      baselineAppShares: 100,
      direction: 'add',
      recordType: 'reconciliation-adjustment',
      costBasisStatus: 'unknown',
      effectiveDate: '2026-08-10',
      sourceId: 'fixture-ledger',
      accountFingerprints: ['account-a'],
      sourceFingerprints: ['source-a'],
      importBatchId: 'batch-a',
      status: 'confirmed'
    }
  ])
})

test('treats stocks missing from the partial ledger as unknown, not zero', () => {
  const preview = buildReconciliationPreview({
    canonicalResult,
    orgData: [{ stockId: '9999', buyNum: 50, buyDate: '2026-01-01' }]
  })
  const row = preview.rows.find((item) => item.stockId === '9999')

  assert.equal(row.status, 'unobserved')
  assert.equal(row.observedShares, null)
  assert.equal(row.selected, false)
})

test('does not create a second adjustment when the same import is previewed again', () => {
  const firstPreview = buildReconciliationPreview({
    canonicalResult,
    orgData: [{ stockId: '0050', buyNum: 100, buyDate: '2026-01-01' }]
  })
  const adjustments = createReconciliationAdjustments(firstPreview.rows, 'batch-a')
  const secondPreview = buildReconciliationPreview({
    canonicalResult,
    orgData: [{ stockId: '0050', buyNum: 100, buyDate: '2026-01-01' }],
    adjustments
  })

  const row = secondPreview.rows.find((item) => item.stockId === '0050')
  assert.equal(row.status, 'verified')
  assert.equal(row.deltaShares, 0)
  assert.equal(createReconciliationAdjustments(secondPreview.rows, 'batch-a').length, 0)
})

test('keeps prior adjustments when later manual activity creates a new positive difference', () => {
  const firstPreview = buildReconciliationPreview({
    canonicalResult,
    orgData: [{ stockId: '0050', buyNum: 100, buyDate: '2026-01-01' }]
  })
  const firstAdjustments = createReconciliationAdjustments(firstPreview.rows, 'batch-a')
  const secondPreview = buildReconciliationPreview({
    canonicalResult,
    orgData: [{ stockId: '0050', buyNum: 80, buyDate: '2026-01-01' }],
    adjustments: firstAdjustments
  })
  const secondAdjustments = createReconciliationAdjustments(secondPreview.rows, 'batch-a')

  assert.equal(secondAdjustments[0].shares, 20)
  assert.equal(secondAdjustments[0].baselineAppShares, 105)
  assert.equal(firstAdjustments[0].shares + secondAdjustments[0].shares, 45)
})

test('unknown-cost adjustments only affect future dividend eligibility', () => {
  const events = [
    {
      eventId: 'future',
      stockCode: '0050',
      cash: { totalPerShare: 1, exDate: '2027-01-01', paymentDate: '2027-01-10' },
      stock: { totalPerShare: 0, ratio: null, exDate: null }
    },
    {
      eventId: 'past',
      stockCode: '0050',
      cash: { totalPerShare: 1, exDate: '2026-01-01', paymentDate: '2026-01-10' },
      stock: { totalPerShare: 0, ratio: null, exDate: null }
    }
  ]
  const { rows } = buildStockDividendBenefits({
    stockCode: '0050',
    quantityAdjustments: [
      {
        stockId: '0050',
        shares: 100,
        direction: 'add',
        status: 'confirmed',
        effectiveDate: '2026-08-10'
      }
    ],
    events,
    today: '2026-08-10'
  })

  assert.deepEqual(
    rows.map((row) => row.eventId),
    ['future']
  )
  assert.equal(rows[0].cashIncome, 100)
})

test('adapter registry accepts an independent future source adapter contract', async () => {
  const registry = createImportAdapterRegistry([
    {
      id: 'fixture-screenshot',
      async detect(files) {
        return files?.some((file) => file.type === 'image/png') ? 1 : 0
      },
      async parse() {
        return { adapterId: 'fixture-screenshot', coverage: 'partial', accounts: [] }
      }
    }
  ])

  const candidates = await registry.detect([{ type: 'image/png' }])
  const result = await candidates[0].adapter.parse([{ type: 'image/png' }])
  assert.equal(candidates[0].adapter.id, 'fixture-screenshot')
  assert.equal(result.adapterId, 'fixture-screenshot')
})
