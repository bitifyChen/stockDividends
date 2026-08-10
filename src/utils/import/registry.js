import { createImportAdapterRegistry, ImportParseError } from './adapter.js'

export const importAdapterRegistry = createImportAdapterRegistry()

let adaptersLoaded = false
let adaptersLoadPromise = null

const loadImportAdapters = async () => {
  if (adaptersLoaded) return

  adaptersLoadPromise ||= (async () => {
    const { tdccLedgerPdfAdapter } = await import('./adapters/tdccLedgerPdf.js')
    importAdapterRegistry.register(tdccLedgerPdfAdapter)
    adaptersLoaded = true
  })()

  await adaptersLoadPromise
}

export const detectAndParseImport = async (files, options = {}) => {
  await loadImportAdapters()
  const detectedCandidates = await importAdapterRegistry.detect(files)
  const candidates = options.sourceId
    ? detectedCandidates.filter((candidate) => candidate.adapter.id === options.sourceId)
    : detectedCandidates
  if (!candidates.length) {
    throw new ImportParseError(
      options.sourceId ? '選取的匯入來源不支援目前檔案格式。' : '找不到支援的匯入格式。',
      'UNSUPPORTED_SOURCE'
    )
  }

  const [candidate, nextCandidate] = candidates
  if (nextCandidate && candidate.score === nextCandidate.score) {
    throw new ImportParseError('無法判斷匯入來源，請只選擇同一種來源的檔案。', 'AMBIGUOUS_SOURCE')
  }

  return candidate.adapter.parse(files, options)
}
