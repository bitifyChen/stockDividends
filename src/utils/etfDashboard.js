import dayjs from 'dayjs'

export const normalizeArray = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.holders)) return value.holders
  if (Array.isArray(value?.details)) return value.details
  if (Array.isArray(value?.rows)) return value.rows
  return []
}

export const normalizeObject = (value) => {
  if (!value || Array.isArray(value)) return {}
  if (value.data && !Array.isArray(value.data)) return value.data
  return value
}

export const toNumber = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  return toNumber(value).toLocaleString()
}

export const shareUnitLabel = (unit) => (unit === 'lot' ? '張' : '股')

export const shareColumnLabel = (unit, prefix = '') =>
  `${prefix}${unit === 'lot' ? '張數' : '股數'}`

export const toShareUnitValue = (value, unit = 'share') => {
  const numberValue = toNumber(value)
  return unit === 'lot' ? numberValue / 1000 : numberValue
}

export const formatShare = (value, unit = 'share') => {
  if (value === null || value === undefined || value === '') return '-'
  const converted = toShareUnitValue(value, unit)
  return converted.toLocaleString(undefined, {
    maximumFractionDigits: unit === 'lot' ? 2 : 0
  })
}

export const formatFractionalShare = (value, unit = 'share') => {
  if (value === null || value === undefined || value === '') return '-'
  const converted = toShareUnitValue(value, unit)
  return converted.toLocaleString(undefined, {
    maximumFractionDigits: unit === 'lot' ? 6 : 4
  })
}

export const formatRatio = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return String(value)
  return `${numberValue.toFixed(2)}%`
}

export const formatDecimalRatio = (value, fractionDigits = 2) => {
  if (value === null || value === undefined || value === '') return '-'
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return '-'
  return `${(numberValue * 100).toFixed(fractionDigits)}%`
}

export const formatMarketAmount = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return '-'

  const absValue = Math.abs(numberValue)
  const sign = numberValue < 0 ? '-' : ''

  if (absValue >= 100000000) {
    const digits = absValue >= 1000000000 ? 1 : 2
    return `${sign}${(absValue / 100000000).toFixed(digits)} 億`
  }

  if (absValue >= 10000) {
    const digits = absValue >= 1000000 ? 1 : 2
    return `${sign}${(absValue / 10000).toFixed(digits)} 萬`
  }

  return `${sign}${Math.round(absValue).toLocaleString()}`
}

export const isOhlcEnriched = (ohlc) =>
  Number(ohlc?.enrich_status?.code) === 1 || ohlc?.enrich_status?.label === 'success'

export const formatDateTime = (value) => {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY/MM/DD HH:mm') : String(value)
}

export const getSeriesItems = (value) =>
  normalizeArray(value?.series || value?.holders || value?.data || value)
    .filter((item) => item?.snapshot_date || item?.date)
    .sort(
      (a, b) =>
        dayjs(a.snapshot_date || a.date).valueOf() - dayjs(b.snapshot_date || b.date).valueOf()
    )

export const getSeriesPoints = (value, key = 'holding_shares') =>
  getSeriesItems(value).map((item) => item[key])
