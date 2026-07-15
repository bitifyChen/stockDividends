import request from './useAxios.js'

const apiBaseUrl = 'https://stockdividends.onrender.com'

const cleanParams = (params = {}) => {
  if (!params) return {}
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== null && value !== undefined && value !== ''
    )
  )
}

const get = (path, params = null) =>
  request('get', `${apiBaseUrl}${path}`, null, cleanParams(params))

export const getEtfHealth = () => get('/etf/health')
export const getEtfList = (params = {}) => get('/etf/list', params)
export const getEtfSourceConfigs = (params = {}) => get('/etf/source-configs', params)
export const getEtfActiveList = () => get('/etf/active-list')
export const getEtfAvailableDates = ({ etfCode = null, from = null, to = null }) =>
  get('/etf/available-dates', { etfCode, from, to })

export const getEtfHoldings = ({
  etfCode = null,
  stockCode = null,
  date = null,
  mode = null,
  dateRange = null,
  includeTrendDays = null,
  industryChainCode = null,
  includeChildren = null
}) =>
  get('/etf/holdings', {
    etfCode,
    stockCode,
    date,
    mode,
    dateRange,
    includeTrendDays,
    industryChainCode,
    includeChildren
  })

export const getEtfHoldingsOverview = ({
  date = null,
  page = 1,
  pageSize = 12,
  limitPerEtf = 10,
  industryChainCode = null,
  includeChildren = null
} = {}) =>
  get('/etf/holdings/overview', {
    date,
    page,
    pageSize,
    limitPerEtf,
    industryChainCode,
    includeChildren
  })

export const getEtfEvents = ({
  mode = 'stock',
  stockCode = null,
  etfCode = null,
  date = null,
  industryChainCode = null,
  includeChildren = null
}) => get('/etf/events', { mode, stockCode, etfCode, date, industryChainCode, includeChildren })

export const getEtfEventsOverview = ({
  date = null,
  type = 'all',
  stockCode = null,
  etfCode = null,
  page = 1,
  pageSize = 20,
  limitPerEtf = 100,
  industryChainCode = null,
  includeChildren = null
} = {}) =>
  get('/etf/events/overview', {
    date,
    type,
    stockCode,
    etfCode,
    page,
    pageSize,
    limitPerEtf,
    industryChainCode,
    includeChildren
  })

export const getEtfEventsStockOverview = ({
  date = null,
  type = 'all',
  side = 'all',
  etfType = null,
  stockCode = null,
  industryChainCode = null,
  includeChildren = null,
  sort = 'estimated_amount',
  page = 1,
  pageSize = 12,
  limitPerStock = 50
} = {}) =>
  get('/etf/events/stock-overview', {
    date,
    type,
    side,
    etfType,
    stockCode,
    industryChainCode,
    includeChildren,
    sort,
    page,
    pageSize,
    limitPerStock
  })

export const getEtfEventsIndustryOverview = ({
  date = null,
  type = 'all',
  side = 'all',
  etfType = null,
  industryCode = null,
  industryChainCode = null,
  includeChildren = null,
  sort = 'estimated_amount',
  page = 1,
  pageSize = 12,
  topN = 3
} = {}) =>
  get('/etf/events/industry-overview', {
    date,
    type,
    side,
    etfType,
    industryCode,
    industryChainCode,
    includeChildren,
    sort,
    page,
    pageSize,
    topN
  })

export const getEtfEventsIndustryChainOverview = ({
  date = null,
  type = 'all',
  side = 'all',
  etfType = null,
  industryChainCode = null,
  includeChildren = null,
  sort = 'estimated_amount',
  page = 1,
  pageSize = 20,
  topN = 3
} = {}) =>
  get('/etf/events/industry-chain-overview', {
    date,
    type,
    side,
    etfType,
    industryChainCode,
    includeChildren,
    sort,
    page,
    pageSize,
    topN
  })

export const getEtfEventsIndustryStocks = ({
  industryCode,
  date = null,
  type = 'all',
  side = 'all',
  etfType = null,
  industryChainCode = null,
  includeChildren = null,
  sort = 'estimated_amount',
  page = 1,
  pageSize = 50,
  limitPerStock = 50
} = {}) =>
  get(`/etf/events/industry-overview/${industryCode}/stocks`, {
    date,
    type,
    side,
    etfType,
    industryChainCode,
    includeChildren,
    sort,
    page,
    pageSize,
    limitPerStock
  })

export const getEtfFirstBuyEvents = ({
  page = 1,
  pageSize = 50,
  date = null,
  stockCode = null,
  etfCode = null,
  industryChainCode = null,
  includeChildren = null
} = {}) =>
  get('/etf/events', {
    type: 'first_buy',
    page,
    pageSize,
    date,
    stockCode,
    etfCode,
    industryChainCode,
    includeChildren
  })

export const getEtfStockDetail = ({ etfCode, stockCode }) => get(`/etf/${etfCode}/${stockCode}`)

export const getEtfStockSeries = ({ etfCode, stockCode, range = '1m' }) =>
  get(`/etf/${etfCode}/${stockCode}/series`, { range })

export const getEtfStocks = ({
  page = 1,
  pageSize = 50,
  q = null,
  industryChainCode = null,
  includeChildren = null
} = {}) => get('/etf/stocks', { page, pageSize, q, industryChainCode, includeChildren })

export const getEtfObservedStockDetail = ({ stockCode }) => get(`/etf/stocks/${stockCode}`)

export const getEtfObservedStockSeries = ({ stockCode, range = '1m' }) =>
  get(`/etf/stocks/${stockCode}/series`, { range })

export const getEtfStockCandles = ({ stockCode, range = '1m', interval = 'daily' }) =>
  get(`/ohlc/stocks/${stockCode}/candles`, { range, interval })
