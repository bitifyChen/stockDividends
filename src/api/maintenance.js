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

export const getBatchStatus = (params = {}) => get('/maintenance/batch-status', params)

export const runEtfFetchAll = ({ force = false } = {}) =>
  get('/etf/fetch-all', { save: 1, force: force ? 1 : null })

export const runDividendBatch = ({ stockId = null } = {}) =>
  get('/dividend', stockId ? { stockId } : { mode: 'all' })

export const runEtfEventsSummaryNotify = ({
  date = null,
  send = false,
  etfType = null,
  topN = 5
} = {}) =>
  get('/etf/events/summary-notify', {
    date,
    send: send ? 1 : 0,
    etfType,
    topN
  })

export const runOhlcDailyFetch = ({ tradeDate = null, force = false } = {}) =>
  request('post', `${apiBaseUrl}/ohlc/daily-fetch`, {
    tradeDate,
    force
  })
