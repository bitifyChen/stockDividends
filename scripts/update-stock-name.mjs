/* eslint-env node */

import { readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = path.resolve(fileURLToPath(new URL('../', import.meta.url)))
const DEFAULT_API_BASE_URL = 'https://stockdividends.onrender.com'
const DEFAULT_PAGE_SIZE = 200
const MAX_PAGE_SIZE = 200
const REQUEST_TIMEOUT_MS = 30_000
const STOCK_CODE_PATTERN = /^[0-9A-Z]{4,6}$/

const defaultOutputPath = path.join(PROJECT_ROOT, 'src', 'data', 'stockName.json')

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

const parsePositiveInteger = (value, label) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive integer.`)
  }
  return parsed
}

export const parseArgs = (argv = []) => {
  const options = {
    apiBaseUrl: process.env.STOCKDIVIDENDS_API_BASE_URL || DEFAULT_API_BASE_URL,
    dryRun: false,
    outputPath: defaultOutputPath,
    pageSize: DEFAULT_PAGE_SIZE
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--') continue

    const [flag, inlineValue] = argument.split('=', 2)

    if (flag === '--help' || flag === '-h') {
      options.help = true
      continue
    }

    if (flag === '--dry-run') {
      options.dryRun = true
      continue
    }

    if (flag === '--api-base-url') {
      options.apiBaseUrl = inlineValue || argv[++index]
      continue
    }

    if (flag === '--output') {
      options.outputPath = path.resolve(PROJECT_ROOT, inlineValue || argv[++index])
      continue
    }

    if (flag === '--page-size') {
      options.pageSize = parsePositiveInteger(inlineValue || argv[++index], '--page-size')
      continue
    }

    throw new Error(`Unknown option: ${argument}`)
  }

  if (!options.apiBaseUrl) throw new Error('--api-base-url cannot be empty.')
  if (!options.outputPath) throw new Error('--output cannot be empty.')
  if (options.pageSize > MAX_PAGE_SIZE) {
    throw new Error(`--page-size cannot be greater than ${MAX_PAGE_SIZE}.`)
  }

  return options
}

const getArgumentValue = (value) => String(value ?? '').trim()

export const extractStockUpdate = (item) => {
  const stock = isRecord(item?.stock) ? item.stock : null
  const code = getArgumentValue(stock?.code).toUpperCase()
  const name = getArgumentValue(stock?.name)

  if (!STOCK_CODE_PATTERN.test(code) || !name) return null
  return { code, name }
}

export const extractStockUpdates = (items = []) => {
  if (!Array.isArray(items)) throw new Error('The API response items must be an array.')

  const updates = new Map()
  for (const item of items) {
    const update = extractStockUpdate(item)
    if (update) updates.set(update.code, update.name)
  }
  return updates
}

export const extractEtfUpdates = (items = []) => {
  if (!Array.isArray(items)) throw new Error('The ETF API response must be an array.')

  const updates = new Map()
  for (const item of items) {
    const code = getArgumentValue(item?.etf_code).toUpperCase()
    const name = getArgumentValue(item?.etf_name)
    if (STOCK_CODE_PATTERN.test(code) && name) updates.set(code, name)
  }
  return updates
}

const buildPageUrl = (apiBaseUrl, page, pageSize) => {
  const url = new URL('/etf/stocks', apiBaseUrl)
  url.searchParams.set('page', String(page))
  url.searchParams.set('pageSize', String(pageSize))
  return url
}

const fetchJson = async (url) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`API request failed with HTTP ${response.status}.`)
    }

    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

export const fetchStockUpdates = async ({ apiBaseUrl, pageSize }) => {
  const updates = new Map()
  let page = 1
  let fetchedItems = 0
  let totalCount = null

  while (page <= 1000) {
    const payload = await fetchJson(buildPageUrl(apiBaseUrl, page, pageSize))
    if (!isRecord(payload) || !Array.isArray(payload.items)) {
      throw new Error(`Invalid API response on page ${page}: expected an items array.`)
    }

    const items = payload.items
    fetchedItems += items.length
    if (Number.isInteger(payload.totalCount) && payload.totalCount >= 0) {
      totalCount = payload.totalCount
    }

    for (const [code, name] of extractStockUpdates(items)) updates.set(code, name)

    if (items.length === 0 || (totalCount !== null && fetchedItems >= totalCount)) break
    if (items.length < pageSize) break
    page += 1
  }

  if (page > 1000) throw new Error('Stopped after 1000 pages; the API pagination may be invalid.')
  return { fetchedItems, pageCount: page, updates }
}

export const fetchEtfUpdates = async ({ apiBaseUrl }) => {
  const payload = await fetchJson(new URL('/etf/list', apiBaseUrl))
  const updates = extractEtfUpdates(payload)
  return { fetchedItems: Array.isArray(payload) ? payload.length : 0, updates }
}

export const fetchNameUpdates = async ({ apiBaseUrl, pageSize }) => {
  const [stockResult, etfResult] = await Promise.all([
    fetchStockUpdates({ apiBaseUrl, pageSize }),
    fetchEtfUpdates({ apiBaseUrl })
  ])

  if (stockResult.updates.size === 0 || etfResult.updates.size === 0) {
    throw new Error('The API returned no valid stock or ETF names; the mapping was not changed.')
  }

  const updates = new Map(stockResult.updates)
  for (const [code, name] of etfResult.updates) updates.set(code, name)

  return {
    etfCount: etfResult.fetchedItems,
    pageCount: stockResult.pageCount,
    stockCount: stockResult.fetchedItems,
    updates
  }
}

export const readStockNameMapping = async (filePath = defaultOutputPath) => {
  let parsed
  try {
    parsed = JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`Unable to read stock name mapping: ${error.message}`)
  }

  if (!isRecord(parsed)) throw new Error('The stock name mapping must be a JSON object.')
  return parsed
}

const isStockCodeKey = (key) => STOCK_CODE_PATTERN.test(key)

const compareStockCodes = (left, right) => left.localeCompare(right, 'en', { numeric: true })

export const mergeStockNameMapping = (existing, updates) => {
  const next = { ...existing }
  for (const [code, name] of updates) next[code] = name

  const stockEntries = Object.entries(next)
    .filter(([key]) => isStockCodeKey(key))
    .sort(([left], [right]) => compareStockCodes(left, right))
  const nonStockEntries = Object.entries(next).filter(([key]) => !isStockCodeKey(key))

  return Object.fromEntries([...stockEntries, ...nonStockEntries])
}

export const getMappingChanges = (existing, updates) => {
  let added = 0
  let changed = 0

  for (const [code, name] of updates) {
    if (!(code in existing)) added += 1
    else if (existing[code] !== name) changed += 1
  }

  return { added, changed, total: added + changed }
}

const writeStockNameMapping = async (filePath, mapping) => {
  const temporaryPath = `${filePath}.tmp-${process.pid}`
  try {
    await writeFile(temporaryPath, `${JSON.stringify(mapping, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, filePath)
  } catch (error) {
    await unlink(temporaryPath).catch(() => {})
    throw error
  }
}

const printHelp = () => {
  console.log(`Usage: pnpm data:update-stock-name [options]

Fetches stock.code / stock.name from GET /etf/stocks and etf_code / etf_name from
GET /etf/list, then safely updates src/data/stockName.json. Existing non-stock
mappings are preserved.

Options:
  --dry-run                         Preview changes without writing the file
  --api-base-url <url>              Override the API base URL
  --page-size <number>              Page size, from 1 to ${MAX_PAGE_SIZE} (default: ${DEFAULT_PAGE_SIZE})
  --output <path>                   Override the output JSON path
  --help                            Show this help`)
}

export const run = async (options) => {
  if (options.help) {
    printHelp()
    return { written: false }
  }

  const existing = await readStockNameMapping(options.outputPath)
  const result = await fetchNameUpdates(options)

  const changes = getMappingChanges(existing, result.updates)
  const next = mergeStockNameMapping(existing, result.updates)

  console.log(
    `Fetched ${result.stockCount} stock records across ${result.pageCount} page(s) and ` +
      `${result.etfCount} ETF records; ${result.updates.size} valid names found.`
  )
  console.log(`Changes: ${changes.added} added, ${changes.changed} updated.`)

  if (options.dryRun || changes.total === 0) {
    console.log(options.dryRun ? 'Dry run: no file written.' : 'No changes: file not written.')
    return { written: false, changes, mapping: next }
  }

  await writeStockNameMapping(options.outputPath, next)
  console.log(`Updated ${options.outputPath}`)
  return { written: true, changes, mapping: next }
}

const main = async () => {
  const options = parseArgs(process.argv.slice(2))
  await run(options)
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isDirectExecution) {
  main().catch((error) => {
    console.error(`stockName update failed: ${error.message}`)
    process.exitCode = 1
  })
}
