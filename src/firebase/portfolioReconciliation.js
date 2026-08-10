/* global globalThis */

import app from './index.js'
import { useCookies } from '@vueuse/integrations/useCookies'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore'
import {
  createReconciliationAdjustments,
  getObservedHoldingSnapshots,
  getReconciliationSummary
} from '@/utils/import/reconciliation.js'

const cookies = useCookies(['token'])
const db = getFirestore(app)

const getUserRef = () => {
  const uid = cookies.get('token')
  if (!uid) throw new Error('請先登入後再匯入持股資料。')
  return doc(db, 'users', uid)
}

const getCollection = (name) => collection(getUserRef(), name)

const createLocalSalt = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const getPortfolioImportSalt = async () => {
  const saltRef = doc(getUserRef(), 'settings', 'portfolioImport')
  const snapshot = await getDoc(saltRef)
  if (snapshot.exists() && snapshot.data()?.salt) return snapshot.data().salt

  const salt = createLocalSalt()
  await setDoc(saltRef, { salt, createdAt: serverTimestamp() }, { merge: true })
  return salt
}

export const getPortfolioReconciliationData = async () => {
  const [batchSnapshot, adjustmentSnapshot, sourceSnapshot, holdingSnapshot] = await Promise.all([
    getDocs(getCollection('portfolioImportBatches')),
    getDocs(getCollection('portfolioReconciliationAdjustments')),
    getDocs(getCollection('portfolioImportSources')),
    getDocs(getCollection('portfolioImportHoldings'))
  ])

  return {
    batches: batchSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    adjustments: adjustmentSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    sources: sourceSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    holdings: holdingSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
  }
}

const getSafeDocumentId = (value) => encodeURIComponent(String(value || '')).replaceAll('%', '_')
const omitUndefined = (value) =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))

export const savePortfolioReconciliation = async ({ canonicalResult, rows = [] } = {}) => {
  if (!canonicalResult?.importFingerprint) throw new Error('缺少匯入資料指紋，無法儲存對帳結果。')

  const importBatchId = canonicalResult.importFingerprint
  const adjustments = createReconciliationAdjustments(
    rows,
    importBatchId,
    canonicalResult.sourceId || canonicalResult.adapterId
  )
  const holdingSnapshots = getObservedHoldingSnapshots(
    canonicalResult.accounts,
    canonicalResult.sourceId || canonicalResult.adapterId
  )
  const existingHoldingSnapshot = await getDocs(getCollection('portfolioImportHoldings'))
  const existingHoldingById = new Map(
    existingHoldingSnapshot.docs.map((item) => [item.id, item.data()])
  )
  const reconciliationSummary = getReconciliationSummary(rows)
  const batch = writeBatch(db)
  const batchRef = doc(getCollection('portfolioImportBatches'), importBatchId)

  batch.set(
    batchRef,
    omitUndefined({
      sourceId: canonicalResult.sourceId || canonicalResult.adapterId,
      adapterId: canonicalResult.adapterId || canonicalResult.sourceId,
      sourceType: canonicalResult.sourceType,
      sourceMedia: canonicalResult.sourceMedia,
      reportType: canonicalResult.reportType,
      coverage: canonicalResult.coverage,
      importFingerprint: canonicalResult.importFingerprint,
      stats: canonicalResult.stats || {},
      sourceAsOfDates: canonicalResult.accounts
        .map((account) => account.sourceAsOfDate || account.queryEnd)
        .filter(Boolean),
      accountFingerprints: canonicalResult.accounts
        .map((account) => account.accountFingerprint)
        .filter(Boolean),
      selectedAdjustmentCount: adjustments.length,
      reconciliationSummary,
      status: 'completed',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }),
    { merge: true }
  )

  adjustments.forEach((adjustment) => {
    const adjustmentId = getSafeDocumentId(
      `${importBatchId}_${adjustment.stockId}_${adjustment.baselineAppShares}`
    )
    const adjustmentRef = doc(getCollection('portfolioReconciliationAdjustments'), adjustmentId)
    batch.set(
      adjustmentRef,
      omitUndefined({
        ...adjustment,
        importFingerprint: canonicalResult.importFingerprint,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }),
      { merge: true }
    )
  })

  canonicalResult.accounts.forEach((account) => {
    if (!account.accountFingerprint) return
    const sourceRef = doc(getCollection('portfolioImportSources'), account.accountFingerprint)
    batch.set(
      sourceRef,
      omitUndefined({
        sourceType: account.sourceType,
        sourceMedia: account.sourceMedia,
        brokerName: account.brokerName,
        brokerBranchCode: account.brokerBranchCode,
        accountFingerprint: account.accountFingerprint,
        queryStart: account.queryStart,
        queryEnd: account.queryEnd,
        sourceAsOfDate: account.sourceAsOfDate,
        latestImportFingerprint: canonicalResult.importFingerprint,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }),
      { merge: true }
    )
  })

  holdingSnapshots.forEach((snapshot) => {
    if (!snapshot.accountFingerprint || !snapshot.stockId) return

    const snapshotId = getSafeDocumentId(`${snapshot.accountFingerprint}_${snapshot.stockId}`)
    const previous = existingHoldingById.get(snapshotId)
    if (
      previous?.sourceAsOfDate &&
      snapshot.sourceAsOfDate &&
      previous.sourceAsOfDate > snapshot.sourceAsOfDate
    ) {
      return
    }

    const holdingRef = doc(getCollection('portfolioImportHoldings'), snapshotId)
    batch.set(
      holdingRef,
      omitUndefined({
        stockId: snapshot.stockId,
        observedShares: snapshot.observedShares,
        sourceAsOfDate: snapshot.sourceAsOfDate,
        accountFingerprint: snapshot.accountFingerprint,
        sourceFingerprint: snapshot.sourceFingerprint,
        sourceId: snapshot.sourceId,
        brokerName: snapshot.brokerName,
        brokerBranchCode: snapshot.brokerBranchCode,
        importFingerprint: canonicalResult.importFingerprint,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }),
      { merge: true }
    )
  })

  await batch.commit()
  return {
    importBatchId,
    adjustmentCount: adjustments.length,
    reconciliationSummary,
    failedCount: 0,
    status: 'completed'
  }
}
