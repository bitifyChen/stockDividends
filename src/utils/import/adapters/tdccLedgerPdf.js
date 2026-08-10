/* global globalThis */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { IMPORT_ADAPTER_IDS, IMPORT_SOURCE_TYPES, ImportParseError } from '../adapter.js'

const TDCC_REPORT_TITLE = '證券存摺登摺資料'
const VISIBLE_FONT_SIZE_LIMIT = 20
const ROW_Y_TOLERANCE = 1.3
const WRAPPED_CELL_Y_TOLERANCE = 7
let pdfWorkerConfigured = false

const ensurePdfWorker = async () => {
  if (pdfWorkerConfigured || typeof window === 'undefined') return

  const workerModule = await import('pdfjs-dist/legacy/build/pdf.worker.mjs?url')
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default
  pdfWorkerConfigured = true
}

const isPdfFile = (file) =>
  file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf')

const toText = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()

const getFontSize = (item) =>
  Math.max(Math.abs(item?.transform?.[0] || 0), Math.abs(item?.transform?.[3] || 0))

const isVisibleTextItem = (item) =>
  toText(item?.str) && getFontSize(item) <= VISIBLE_FONT_SIZE_LIMIT

const getPositionedItems = (content) =>
  content.items.filter(isVisibleTextItem).map((item, index) => ({
    id: index,
    text: toText(item.str),
    x: item.transform[4],
    y: item.transform[5],
    size: getFontSize(item)
  }))

const groupByY = (items, tolerance = ROW_Y_TOLERANCE) => {
  const groups = []

  items
    .slice()
    .sort((left, right) => right.y - left.y || left.x - right.x)
    .forEach((item) => {
      const group = groups.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance)
      if (group) {
        group.items.push(item)
        group.y = (group.y * (group.items.length - 1) + item.y) / group.items.length
      } else {
        groups.push({ y: item.y, items: [item] })
      }
    })

  return groups.map((group) => ({
    ...group,
    items: group.items.slice().sort((left, right) => left.x - right.x)
  }))
}

const getColumnText = (items, minX, maxX, separator = '') =>
  items
    .filter((item) => item.x >= minX && item.x < maxX)
    .sort((left, right) => left.x - right.x)
    .map((item) => item.text)
    .join(separator)
    .trim()

const parseNumber = (value) => {
  const normalized = String(value || '').replace(/[^0-9-]/g, '')
  if (!normalized || normalized === '-') return null
  const number = Number(normalized)
  return Number.isFinite(number) ? number : null
}

const parseRocDate = (value) => {
  const match = String(value || '').match(/(\d{2,3})年\s*(\d{1,2})月\s*(\d{1,2})日/)
  if (!match) return null

  const year = Number(match[1]) + 1911
  const month = String(match[2]).padStart(2, '0')
  const day = String(match[3]).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseRocDateRange = (value) => {
  const matches = String(value || '').match(/(\d{2,3}年\s*\d{1,2}月\s*\d{1,2}日)/g) || []
  return {
    start: parseRocDate(matches[0]),
    end: parseRocDate(matches[1] || matches[0])
  }
}

const groupVisibleLines = (items) =>
  groupByY(items, 1.5).map((group) => ({
    y: group.y,
    text: getColumnText(group.items, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, ''),
    items: group.items
  }))

const getHeaderText = (lines) =>
  lines
    .filter((line) => line.y > 380)
    .map((line) => line.text)
    .join('\n')

const getRowDate = (items) => {
  const dateText = getColumnText(items, 40, 120, ' ')
  const parts = dateText.match(/\d{2,3}/g) || []

  if (parts.length < 3 || !/^1\d{2}$/.test(parts[0])) return null
  return parseRocDate(`${parts[0]}年${parts[1]}月${parts[2]}日`)
}

const getStockCode = (items) => {
  const code = items
    .filter((item) => item.x >= 120 && item.x < 200)
    .map((item) => item.text)
    .join('')
    .replace(/[^0-9A-Za-z]/g, '')

  return /^[0-9A-Za-z]{4,6}$/.test(code) ? code : null
}

const getStockName = (allItems, rowY) =>
  allItems
    .filter(
      (item) => item.x >= 195 && item.x < 305 && Math.abs(item.y - rowY) <= WRAPPED_CELL_Y_TOLERANCE
    )
    .sort((left, right) => right.y - left.y || left.x - right.x)
    .map((item) => item.text)
    .join('')
    .trim()

const getOperationType = (summary) => {
  if (/融資|融券|借券|權證|期貨|海外/.test(summary)) return 'unsupported'
  if (/合併轉入|合併轉出|存券匯撥|轉入|轉出|匯撥/.test(summary)) return 'transfer'
  if (/買進/.test(summary)) return 'buy'
  if (/賣出/.test(summary)) return 'sell'
  return 'unsupported'
}

const parsePageRows = (items, pageNumber, startSequence) => {
  const lines = groupByY(items)
  let sequence = startSequence

  const rows = lines
    .map((line) => {
      const tradeDate = getRowDate(line.items)
      const stockId = getStockCode(line.items)
      const summary = getColumnText(line.items, 295, 390)
      if (!tradeDate || !stockId || !summary) return null

      const withdrawal = parseNumber(getColumnText(line.items, 370, 445))
      const deposit = parseNumber(getColumnText(line.items, 445, 570))
      const balance = parseNumber(getColumnText(line.items, 570, 690))
      const operationType = getOperationType(summary)
      if (
        operationType !== 'unsupported' &&
        (balance === null || (withdrawal === null && deposit === null))
      ) {
        throw new ImportParseError(
          `第 ${pageNumber} 頁有無法驗證的流水欄位，已停止匯入。`,
          'ROW_VALIDATION_FAILED'
        )
      }

      const row = {
        sourceRecordId: [
          tradeDate,
          stockId,
          summary,
          withdrawal ?? '',
          deposit ?? '',
          balance
        ].join('|'),
        pageNumber,
        sourceOrder: sequence++,
        tradeDate,
        stockId,
        stockName: getStockName(items, line.y),
        summary,
        operationType,
        transferGroupId:
          operationType === 'transfer'
            ? [tradeDate, stockId, Math.max(withdrawal || 0, deposit || 0)].join('|')
            : null,
        withdrawal,
        deposit,
        balance
      }

      return row
    })
    .filter(Boolean)

  return { rows, nextSequence: sequence }
}

const parsePdf = async (file, password) => {
  const data = new Uint8Array(await file.arrayBuffer())
  let loadingTask
  const normalizedPassword = String(password || '').trim()

  try {
    await ensurePdfWorker()
    loadingTask = pdfjsLib.getDocument({
      data,
      password: normalizedPassword,
      disableWorker: true
    })
    loadingTask.onPassword = (updatePassword, reason) => {
      if (reason === pdfjsLib.PasswordResponses?.NEED_PASSWORD) {
        updatePassword(normalizedPassword)
        return
      }

      updatePassword(
        new ImportParseError('PDF 密碼錯誤，請確認密碼後重新輸入。', 'INVALID_PASSWORD')
      )
    }
    const pdf = await loadingTask.promise
    const rows = []
    let sourceOrder = 0
    let metadataText = ''

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const items = getPositionedItems(content)
      const lines = groupVisibleLines(items)
      if (pageNumber === 1 && !getHeaderText(lines).includes(TDCC_REPORT_TITLE)) {
        throw new ImportParseError(
          '這不是集保證券存摺登摺資料，請確認選擇的是交易異動 PDF。',
          'UNSUPPORTED_REPORT'
        )
      }
      metadataText += `${lines
        .filter((line) => line.y > 380)
        .map((line) => line.text)
        .join('\n')}\n`

      const parsed = parsePageRows(items, pageNumber, sourceOrder)
      rows.push(...parsed.rows)
      sourceOrder = parsed.nextSequence
      page.cleanup()
    }

    const brokerName = metadataText.match(/證券商名稱：([^\n]+)/)?.[1]?.trim() || ''
    const brokerBranchCode = metadataText.match(/證商代號：([A-Za-z0-9]+)/)?.[1] || ''
    const accountNumber = metadataText.match(/帳號：([^\n\s]+)/)?.[1] || ''
    const queryRange = parseRocDateRange(metadataText.match(/交易明細查詢期間：([^\n]+)/)?.[1])

    if (!brokerName || !brokerBranchCode || !accountNumber || !queryRange.end || !rows.length) {
      throw new ImportParseError(
        '集保流水缺少必要欄位，無法安全建立對帳資料。',
        'MISSING_REQUIRED_FIELDS'
      )
    }

    return {
      fileName: file.name,
      fileSize: file.size,
      pageCount: pdf.numPages,
      brokerName,
      brokerBranchCode,
      accountNumber,
      queryStart: queryRange.start,
      queryEnd: queryRange.end,
      rows
    }
  } catch (error) {
    if (error?.name === 'PasswordException' || error?.code === pdfjsLib.PasswordException?.code) {
      throw new ImportParseError('PDF 密碼錯誤，請重新輸入。', 'INVALID_PASSWORD')
    }
    if (error instanceof ImportParseError) throw error
    throw new ImportParseError('集保 PDF 解析失敗，請確認檔案未損毀且格式受支援。', 'PARSE_FAILED')
  } finally {
    await loadingTask?.destroy?.()
  }
}

const digest = async (value) => {
  const data = new TextEncoder().encode(value)
  const buffer = await globalThis.crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const normalizeAccount = async (account, accountSalt) => {
  const accountFingerprint = await digest(
    `${accountSalt}:${account.brokerBranchCode}:${account.accountNumber}`
  )
  const rows = account.rows
    .map((row) => ({
      ...row,
      accountFingerprint,
      sourceId: IMPORT_ADAPTER_IDS.TDCC_LEDGER_PDF
    }))
    .sort((left, right) =>
      [left.tradeDate, left.stockId, left.summary, left.sourceRecordId]
        .join('|')
        .localeCompare(
          [right.tradeDate, right.stockId, right.summary, right.sourceRecordId].join('|')
        )
    )
  const sourceFingerprint = await digest(
    JSON.stringify({
      accountFingerprint,
      queryStart: account.queryStart,
      queryEnd: account.queryEnd,
      rows: rows.map((row) => row.sourceRecordId)
    })
  )

  const unsupportedRowCount = rows.filter((row) => row.operationType === 'unsupported').length

  return {
    sourceId: IMPORT_ADAPTER_IDS.TDCC_LEDGER_PDF,
    sourceType: IMPORT_SOURCE_TYPES.TDCC,
    sourceMedia: 'pdf',
    coverage: 'partial',
    reportType: 'transaction-ledger',
    brokerName: account.brokerName,
    brokerBranchCode: account.brokerBranchCode,
    accountFingerprint,
    queryStart: account.queryStart,
    queryEnd: account.queryEnd,
    sourceAsOfDate: account.queryEnd,
    sourceFingerprint,
    rows,
    warnings: [
      '流水只涵蓋查詢期間內有異動的股票，未出現股票不代表零。',
      ...(unsupportedRowCount ? [`有 ${unsupportedRowCount} 筆不支援摘要未納入持股對帳。`] : [])
    ],
    unsupportedRowCount
  }
}

export const mergeImportAccounts = async (accounts) => {
  const byAccount = new Map()

  accounts.forEach((account) => {
    const existing = byAccount.get(account.accountFingerprint)
    if (!existing) {
      byAccount.set(account.accountFingerprint, {
        ...account,
        rows: new Map(account.rows.map((row) => [row.sourceRecordId, row])),
        fileCount: 1,
        duplicateFileCount: 0
      })
      return
    }

    let changed = false
    account.rows.forEach((row) => {
      if (!existing.rows.has(row.sourceRecordId)) {
        existing.rows.set(row.sourceRecordId, row)
        changed = true
      }
    })
    existing.fileCount += 1
    if (!changed) existing.duplicateFileCount += 1
    if (account.queryStart && account.queryStart < existing.queryStart) {
      existing.queryStart = account.queryStart
    }
    if (account.queryEnd && account.queryEnd > existing.queryEnd) {
      existing.queryEnd = account.queryEnd
      existing.sourceAsOfDate = account.queryEnd
    }
  })

  return Promise.all(
    Array.from(byAccount.values()).map(async (account) => {
      const rows = Array.from(account.rows.values())
      return {
        ...account,
        rows,
        fileCount: account.fileCount,
        duplicateFileCount: account.duplicateFileCount,
        unsupportedRowCount: rows.filter((row) => row.operationType === 'unsupported').length,
        sourceFingerprint: await digest(
          JSON.stringify({
            accountFingerprint: account.accountFingerprint,
            queryStart: account.queryStart,
            queryEnd: account.queryEnd,
            rows: rows.map((row) => row.sourceRecordId).sort()
          })
        )
      }
    })
  )
}

export const createImportFingerprint = async (accounts) =>
  digest(
    JSON.stringify(
      accounts
        .map((account) => ({
          accountFingerprint: account.accountFingerprint,
          sourceFingerprint: account.sourceFingerprint
        }))
        .sort((left, right) => left.accountFingerprint.localeCompare(right.accountFingerprint))
    )
  )

export const tdccLedgerPdfAdapter = {
  id: IMPORT_ADAPTER_IDS.TDCC_LEDGER_PDF,
  sourceType: IMPORT_SOURCE_TYPES.TDCC,
  async detect(files) {
    const fileList = Array.from(files || [])
    return fileList.length > 0 && fileList.every(isPdfFile) ? 1 : 0
  },
  async parse(files, options = {}) {
    const fileList = Array.from(files || [])
    if (!fileList.length) throw new ImportParseError('請選擇至少一份 PDF。', 'NO_FILES')
    const password = String(options.password || '').trim()
    if (!password) throw new ImportParseError('請輸入 PDF 密碼。', 'PASSWORD_REQUIRED')
    if (!options.accountSalt)
      throw new ImportParseError('缺少本機帳戶識別設定，無法安全對帳。', 'ACCOUNT_SALT_REQUIRED')

    const parsedAccounts = []
    for (const file of fileList) {
      const parsed = await parsePdf(file, password)
      parsedAccounts.push(await normalizeAccount(parsed, options.accountSalt))
    }

    const accounts = await mergeImportAccounts(parsedAccounts)
    const importFingerprint = await createImportFingerprint(accounts)

    return {
      sourceId: IMPORT_ADAPTER_IDS.TDCC_LEDGER_PDF,
      adapterId: IMPORT_ADAPTER_IDS.TDCC_LEDGER_PDF,
      sourceType: IMPORT_SOURCE_TYPES.TDCC,
      sourceMedia: 'pdf',
      reportType: 'transaction-ledger',
      coverage: 'partial',
      importFingerprint,
      accounts,
      warnings: [...new Set(accounts.flatMap((account) => account.warnings))],
      stats: {
        fileCount: fileList.length,
        accountCount: accounts.length,
        duplicateFileCount: accounts.reduce(
          (total, account) => total + account.duplicateFileCount,
          0
        ),
        rowCount: accounts.reduce((total, account) => total + account.rows.length, 0),
        unsupportedRowCount: accounts.reduce(
          (total, account) => total + account.unsupportedRowCount,
          0
        )
      }
    }
  }
}
