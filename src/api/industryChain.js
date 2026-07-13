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

export const getIndustryChains = ({ scope = 'all', includeCounts = true } = {}) =>
  get('/industry-chains', { scope, includeCounts })

export const getIndustryChain = ({ code, includeCounts = true } = {}) =>
  get(`/industry-chains/${code}`, { includeCounts })

export const getIndustryChainStocks = ({
  code,
  includeChildren = true,
  market = null,
  page = 1,
  pageSize = 50
} = {}) =>
  get(`/industry-chains/${code}/stocks`, {
    includeChildren,
    market,
    page,
    pageSize
  })
