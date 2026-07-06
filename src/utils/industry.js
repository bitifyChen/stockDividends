import twIndustryCodeMap from '@/data/twIndustryCodeMap.json'

export const TW_INDUSTRY_CODE_MAP = twIndustryCodeMap

export const normalizeIndustryCode = (industryCode) => {
  if (industryCode === null || industryCode === undefined || industryCode === '') return ''
  return String(industryCode).trim().padStart(2, '0')
}

export const getIndustryName = (industryCode, fallback = '未分類') => {
  const code = normalizeIndustryCode(industryCode)
  if (!code) return fallback
  return TW_INDUSTRY_CODE_MAP[code] || `未知產業 ${code}`
}

export const getIndustryOption = (industryCode) => {
  const code = normalizeIndustryCode(industryCode)

  return {
    code,
    name: getIndustryName(code)
  }
}

export const getIndustryOptions = () =>
  Object.entries(TW_INDUSTRY_CODE_MAP).map(([code, name]) => ({
    code,
    name,
    label: `${code} ${name}`,
    value: code
  }))

export const getStockIndustryName = (stock, fallback = '未分類') =>
  getIndustryName(stock?.industry_code, fallback)
