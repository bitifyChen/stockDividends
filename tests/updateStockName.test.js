/* eslint-env node */
/* global globalThis */

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  extractStockUpdates,
  extractEtfUpdates,
  fetchNameUpdates,
  fetchStockUpdates,
  getMappingChanges,
  mergeStockNameMapping,
  parseArgs,
  run
} from '../scripts/update-stock-name.mjs'

test('extracts only canonical stock identity records', () => {
  const updates = extractStockUpdates([
    { stock: { code: '2330', name: '台積電' } },
    { stock: { code: '', name: '無代號' } },
    { stock: { code: '2317', name: '' } },
    { stock: { code: '2454', name: '聯發科' } }
  ])

  assert.deepEqual(
    [...updates],
    [
      ['2330', '台積電'],
      ['2454', '聯發科']
    ]
  )
})

test('extracts ETF codes and names from the ETF list', () => {
  const updates = extractEtfUpdates([
    { etf_code: '00403A', etf_name: '主動統一升級50' },
    { etf_code: '', etf_name: '無代號' },
    { etf_code: '00404A', etf_name: '' }
  ])

  assert.deepEqual([...updates], [['00403A', '主動統一升級50']])
})

test('does not overwrite the mapping when the API has no valid records', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'stock-name-update-'))
  const outputPath = path.join(temporaryDirectory, 'stockName.json')
  const originalContent = '{\n  "2330": "台積電"\n}\n'
  const originalFetch = globalThis.fetch

  await writeFile(outputPath, originalContent, 'utf8')
  globalThis.fetch = async (url) => ({
    ok: true,
    async json() {
      return new URL(url).pathname === '/etf/list' ? [] : { items: [] }
    }
  })

  try {
    await assert.rejects(
      run({
        apiBaseUrl: 'http://localhost:3000',
        dryRun: false,
        outputPath,
        pageSize: 200
      }),
      /no valid stock or ETF names/
    )
    assert.equal(await readFile(outputPath, 'utf8'), originalContent)
  } finally {
    globalThis.fetch = originalFetch
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
})

test('fetches every API page until totalCount is reached', async () => {
  const originalFetch = globalThis.fetch
  const requestedPages = []
  globalThis.fetch = async (url) => {
    const page = new URL(url).searchParams.get('page')
    requestedPages.push(page)
    return {
      ok: true,
      async json() {
        return page === '1'
          ? {
              totalCount: 3,
              items: [
                { stock: { code: '1101', name: '台泥' } },
                { stock: { code: '2330', name: '台積電' } }
              ]
            }
          : {
              totalCount: 3,
              items: [{ stock: { code: '2454', name: '聯發科' } }]
            }
      }
    }
  }

  try {
    const result = await fetchStockUpdates({
      apiBaseUrl: 'http://localhost:3000',
      pageSize: 2
    })

    assert.deepEqual(requestedPages, ['1', '2'])
    assert.equal(result.fetchedItems, 3)
    assert.equal(result.pageCount, 2)
    assert.equal(result.updates.size, 3)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('combines stock and ETF names from both API endpoints', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url) => ({
    ok: true,
    async json() {
      return new URL(url).pathname === '/etf/list'
        ? [{ etf_code: '00403A', etf_name: '主動統一升級50' }]
        : { totalCount: 1, items: [{ stock: { code: '2330', name: '台積電' } }] }
    }
  })

  try {
    const result = await fetchNameUpdates({
      apiBaseUrl: 'http://localhost:3000',
      pageSize: 200
    })

    assert.equal(result.updates.get('2330'), '台積電')
    assert.equal(result.updates.get('00403A'), '主動統一升級50')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('dry-run leaves a valid mapping unchanged', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'stock-name-dry-run-'))
  const outputPath = path.join(temporaryDirectory, 'stockName.json')
  const originalContent = '{\n  "2330": "舊名稱"\n}\n'
  const originalFetch = globalThis.fetch

  await writeFile(outputPath, originalContent, 'utf8')
  globalThis.fetch = async (url) => ({
    ok: true,
    async json() {
      return new URL(url).pathname === '/etf/list'
        ? [{ etf_code: '00403A', etf_name: '主動統一升級50' }]
        : { items: [{ stock: { code: '2330', name: '台積電' } }] }
    }
  })

  try {
    const result = await run({
      apiBaseUrl: 'http://localhost:3000',
      dryRun: true,
      outputPath,
      pageSize: 200
    })

    assert.equal(result.written, false)
    assert.equal(await readFile(outputPath, 'utf8'), originalContent)
  } finally {
    globalThis.fetch = originalFetch
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
})

test('does not overwrite the mapping when the API request fails', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'stock-name-api-error-'))
  const outputPath = path.join(temporaryDirectory, 'stockName.json')
  const originalContent = '{\n  "2330": "台積電"\n}\n'
  const originalFetch = globalThis.fetch

  await writeFile(outputPath, originalContent, 'utf8')
  globalThis.fetch = async () => {
    throw new Error('backend unavailable')
  }

  try {
    await assert.rejects(
      run({
        apiBaseUrl: 'http://localhost:3000',
        dryRun: false,
        outputPath,
        pageSize: 200
      }),
      /backend unavailable/
    )
    assert.equal(await readFile(outputPath, 'utf8'), originalContent)
  } finally {
    globalThis.fetch = originalFetch
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
})

test('merges stock names while preserving non-stock mappings', () => {
  const existing = {
    2330: '舊名稱',
    '0050': 'ETF 名稱',
    TAIEX: '加權指數'
  }
  const updates = new Map([
    ['2330', '台積電'],
    ['1101', '台泥']
  ])

  assert.deepEqual(mergeStockNameMapping(existing, updates), {
    '0050': 'ETF 名稱',
    1101: '台泥',
    2330: '台積電',
    TAIEX: '加權指數'
  })
  assert.deepEqual(getMappingChanges(existing, updates), {
    added: 1,
    changed: 1,
    total: 2
  })
})

test('supports dry-run and API overrides from CLI arguments', () => {
  assert.deepEqual(
    parseArgs(['--', '--dry-run', '--page-size=50', '--api-base-url', 'http://localhost:3000']),
    {
      apiBaseUrl: 'http://localhost:3000',
      dryRun: true,
      outputPath: expectPath(),
      pageSize: 50
    }
  )
})

const expectPath = () => {
  return fileURLToPath(new URL('../src/data/stockName.json', import.meta.url))
}
