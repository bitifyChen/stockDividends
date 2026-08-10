export const IMPORT_ADAPTER_IDS = Object.freeze({
  TDCC_LEDGER_PDF: 'tdcc-ledger-pdf'
})

export const IMPORT_SOURCE_TYPES = Object.freeze({
  TDCC: 'tdcc'
})

export class ImportParseError extends Error {
  constructor(message, code = 'IMPORT_PARSE_ERROR') {
    super(message)
    this.name = 'ImportParseError'
    this.code = code
  }
}

export const createImportAdapterRegistry = (adapters = []) => {
  const registeredAdapters = [...adapters]

  return {
    register(adapter) {
      if (
        !adapter?.id ||
        typeof adapter.detect !== 'function' ||
        typeof adapter.parse !== 'function'
      ) {
        throw new TypeError('匯入來源 adapter 必須提供 id、detect 與 parse')
      }

      registeredAdapters.push(adapter)
      return adapter
    },
    async detect(files) {
      const candidates = []

      for (const adapter of registeredAdapters) {
        const score = await adapter.detect(files)
        if (score > 0) candidates.push({ adapter, score })
      }

      return candidates.sort((left, right) => right.score - left.score)
    },
    list() {
      return [...registeredAdapters]
    }
  }
}
