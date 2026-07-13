export const getStockCode = (stock) => stock?.code || ''

export const getStockName = (stock, fallback = '未命名股票') => stock?.name || fallback

export const getStockFullName = (stock) => stock?.full_name || ''

export const getStockMarket = (stock) => stock?.market || ''

export const getStockIndustryCode = (stock) => stock?.industry_code || ''

export const getStockIndustryChainCodes = (stock) =>
  Array.isArray(stock?.industry_chain_codes) ? stock.industry_chain_codes : []

export const getStockIndustryChains = (stock) =>
  Array.isArray(stock?.industry_chains) ? stock.industry_chains : []

export const getStockDisplayLabel = (stock, fallback = '未命名股票') => {
  const code = getStockCode(stock)
  const name = getStockName(stock, fallback)
  return code ? `${code} ${name}` : name
}

export const getStockRouteCode = (stock) => String(getStockCode(stock))
