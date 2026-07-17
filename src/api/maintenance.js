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

const maintenanceToken = import.meta.env.VITE_MAINTENANCE_API_TOKEN

const maintenanceRequestOptions = () =>
  maintenanceToken
    ? {
        headers: {
          Authorization: `Bearer ${maintenanceToken}`
        }
      }
    : {}

const get = (path, params = null, options = {}) =>
  request('get', `${apiBaseUrl}${path}`, null, cleanParams(params), options)

export const getBatchStatus = (params = {}) => get('/maintenance/batch-status', params)

export const runEtfFetchAll = ({ force = false } = {}) =>
  get('/etf/fetch-all', { save: 1, force: force ? 1 : null }, maintenanceRequestOptions())

export const runDividendBatch = ({ stockId = null } = {}) =>
  get(
    '/dividend',
    stockId ? { stockId } : { mode: 'all' },
    stockId ? {} : maintenanceRequestOptions()
  )

export const runEtfEventsSummaryNotify = ({
  date = null,
  send = false,
  etfType = null,
  section = null,
  topN = 5
} = {}) =>
  get(
    '/etf/events/summary-notify',
    {
      date,
      send: send ? 1 : 0,
      etfType,
      section,
      topN
    },
    send ? maintenanceRequestOptions() : {}
  )

export const runOhlcDailyFetch = ({ tradeDate = null, force = false } = {}) =>
  request(
    'post',
    `${apiBaseUrl}/ohlc/daily-fetch`,
    {
      tradeDate,
      force
    },
    null,
    maintenanceRequestOptions()
  )
