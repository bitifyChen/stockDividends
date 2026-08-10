const toNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const getManualOpenShares = (orgData = [], stockId) =>
  orgData
    .filter((lot) => lot?.stockId === stockId && !lot.sellDate)
    .reduce((total, lot) => total + toNumber(lot.buyNum), 0)

const getConfirmedAdjustmentShares = (adjustments = [], stockId) =>
  adjustments
    .filter(
      (adjustment) =>
        adjustment?.stockId === stockId &&
        adjustment?.status === 'confirmed' &&
        adjustment?.direction === 'add'
    )
    .reduce((total, adjustment) => total + toNumber(adjustment.shares), 0)

const compareLedgerRows = (left, right) => {
  const dateDifference = String(left.tradeDate || '').localeCompare(String(right.tradeDate || ''))
  if (dateDifference !== 0) return dateDifference

  // PDF rows are newest-first. The smaller sourceOrder is the latest row on the same day.
  return toNumber(right.sourceOrder) - toNumber(left.sourceOrder)
}

const getLatestRowByStock = (rows = []) => {
  const latestByStock = new Map()

  rows.forEach((row) => {
    if (row?.operationType === 'unsupported') return
    const stockId = String(row?.stockId || '')
    if (!stockId) return

    const current = latestByStock.get(stockId)
    if (!current || compareLedgerRows(row, current) > 0) {
      latestByStock.set(stockId, row)
    }
  })

  return latestByStock
}

export const getObservedHoldingSnapshots = (accounts = [], sourceId = null) =>
  accounts.flatMap((account) => {
    const sourceAsOfDate = account?.sourceAsOfDate || account?.queryEnd || null

    return Array.from(getLatestRowByStock(account?.rows)).map(([stockId, row]) => ({
      stockId,
      observedShares: toNumber(row.balance),
      sourceAsOfDate: sourceAsOfDate || row.tradeDate || null,
      accountFingerprint: account.accountFingerprint || null,
      sourceFingerprint: account.sourceFingerprint || null,
      sourceId: sourceId || account.sourceId || account.adapterId || null,
      brokerName: account.brokerName || null,
      brokerBranchCode: account.brokerBranchCode || null
    }))
  })

export const getObservedBalances = (accounts = []) => {
  const balances = new Map()

  accounts.forEach((account) => {
    getLatestRowByStock(account?.rows).forEach((row, stockId) => {
      const current = balances.get(stockId)
      const balance = toNumber(row.balance)
      if (!current) {
        balances.set(stockId, {
          stockId,
          stockName: row.stockName || '',
          observedShares: balance,
          sourceAsOfDate: account.sourceAsOfDate || account.queryEnd || row.tradeDate,
          accountFingerprints: [account.accountFingerprint].filter(Boolean),
          sourceFingerprints: [account.sourceFingerprint].filter(Boolean)
        })
        return
      }

      current.observedShares += balance
      current.accountFingerprints = [
        ...new Set([...current.accountFingerprints, account.accountFingerprint].filter(Boolean))
      ]
      current.sourceFingerprints = [
        ...new Set([...current.sourceFingerprints, account.sourceFingerprint].filter(Boolean))
      ]
      if (
        String(account.sourceAsOfDate || account.queryEnd || row.tradeDate) > current.sourceAsOfDate
      ) {
        current.sourceAsOfDate = account.sourceAsOfDate || account.queryEnd || row.tradeDate
      }
    })
  })

  return balances
}

const getStockIds = (canonicalResult, orgData, adjustments) => {
  const stockIds = new Set()

  canonicalResult?.accounts?.forEach((account) => {
    account.rows?.forEach((row) => {
      if (row.stockId && row.operationType !== 'unsupported') stockIds.add(row.stockId)
    })
  })
  orgData?.forEach((lot) => {
    if (lot.stockId) stockIds.add(lot.stockId)
  })
  adjustments?.forEach((adjustment) => {
    if (adjustment.stockId) stockIds.add(adjustment.stockId)
  })

  return stockIds
}

export const buildReconciliationPreview = ({
  canonicalResult,
  orgData = [],
  adjustments = [],
  stockNames = {}
} = {}) => {
  const observedBalances = getObservedBalances(canonicalResult?.accounts || [])
  const stockIds = getStockIds(canonicalResult, orgData, adjustments)
  const sourceAsOfDate = canonicalResult?.accounts
    ?.map((account) => account.sourceAsOfDate || account.queryEnd)
    .filter(Boolean)
    .sort()
    .at(-1)

  const rows = Array.from(stockIds)
    .map((stockId) => {
      const observed = observedBalances.get(stockId)
      const adjustmentShares = getConfirmedAdjustmentShares(adjustments, stockId)
      const appShares = getManualOpenShares(orgData, stockId) + adjustmentShares
      const observedShares = observed ? toNumber(observed.observedShares) : null
      const deltaShares = observedShares === null ? null : observedShares - appShares
      const status =
        observedShares === null
          ? 'unobserved'
          : deltaShares > 0
            ? 'add'
            : deltaShares < 0
              ? 'review'
              : 'verified'

      return {
        stockId,
        stockName: observed?.stockName || stockNames[stockId] || '-',
        observedShares,
        appShares,
        deltaShares,
        status,
        selected: status === 'add',
        sourceAsOfDate: observed?.sourceAsOfDate || sourceAsOfDate || null,
        sourceId: canonicalResult?.sourceId || canonicalResult?.adapterId || null,
        accountFingerprints: observed?.accountFingerprints || [],
        sourceFingerprints: observed?.sourceFingerprints || []
      }
    })
    .sort((left, right) => {
      const order = { add: 0, review: 1, unobserved: 2, verified: 3 }
      return order[left.status] - order[right.status] || left.stockId.localeCompare(right.stockId)
    })

  return {
    rows,
    sourceAsOfDate: sourceAsOfDate || null,
    summary: getReconciliationSummary(rows)
  }
}

export const getReconciliationSummary = (rows = []) =>
  rows.reduce(
    (summary, row) => {
      summary.total += 1
      summary[row.status] += 1
      if (row.selected && row.deltaShares > 0) summary.selectedShares += row.deltaShares
      return summary
    },
    { total: 0, add: 0, review: 0, unobserved: 0, verified: 0, selectedShares: 0 }
  )

export const createReconciliationAdjustments = (rows = [], importBatchId, sourceId) =>
  rows
    .filter((row) => row?.selected && row.status === 'add' && toNumber(row.deltaShares) > 0)
    .map((row) => ({
      stockId: row.stockId,
      shares: toNumber(row.deltaShares),
      baselineAppShares: toNumber(row.appShares),
      direction: 'add',
      recordType: 'reconciliation-adjustment',
      costBasisStatus: 'unknown',
      effectiveDate: row.sourceAsOfDate,
      sourceId: sourceId || row.sourceId || 'unknown',
      accountFingerprints: row.accountFingerprints,
      sourceFingerprints: row.sourceFingerprints,
      importBatchId,
      status: 'confirmed'
    }))
