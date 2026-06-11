import request from './useAxios.js'

const apiBaseUrl = 'https://stockdividends.onrender.com'

const cleanParams = (params = {}) => {
  if (!params) return {}
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '')
  )
}

const get = (path, params = null) => request('get', `${apiBaseUrl}${path}`, null, cleanParams(params))

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
  includeTrendDays = null
}) => get('/etf/holdings', { etfCode, stockCode, date, mode, dateRange, includeTrendDays })

export const getEtfEvents = ({ mode = 'stock', stockCode = null, etfCode = null, date = null }) =>
  get('/etf/events', { mode, stockCode, etfCode, date })

export const getEtfFirstBuyEvents = ({
  page = 1,
  pageSize = 50,
  date = null,
  stockCode = null,
  etfCode = null
} = {}) =>
  get('/etf/events', {
    type: 'first_buy',
    page,
    pageSize,
    date,
    stockCode,
    etfCode
  })

export const getEtfStockDetail = ({ etfCode, stockCode }) => get(`/etf/${etfCode}/${stockCode}`)

export const getEtfStockSeries = ({ etfCode, stockCode, range = '1m' }) =>
  get(`/etf/${etfCode}/${stockCode}/series`, { range })

export const getEtfStocks = ({ page = 1, pageSize = 50, q = null } = {}) =>
  get('/etf/stocks', { page, pageSize, q })

export const getEtfObservedStockDetail = ({ stockCode }) => get(`/etf/stocks/${stockCode}`)

export const getEtfObservedStockSeries = ({ stockCode, range = '1m' }) =>
  get(`/etf/stocks/${stockCode}/series`, { range })
