import axios from 'axios'
import { useCookies } from '@vueuse/integrations/useCookies'

/* KEY */
const apiUserKey = 'AKfycbx_86TUDpzyfYc84zcxsmI0Bq8To4agJuZDqm3rX8IY2KFO9GZLds9supM7oPTe2AK8'
const apiStockKey = 'AKfycbz1lmMHULbIjs2U5EByLYBd48SBalk_B0m2bV1Ychk0OeE5JGuF9MKws_qNosP3HRoR'
const apiStockDividendKey =
  'AKfycbzE6oGTkI0xe9ony1usM1YfycmYH1DNHOji8DkKfahE1H7JcsU-8T7qYIGafv2BKVGm'
const apiPriceKey = 'AKfycbz25Q07jOsw9IcB681vTvzEADIOW8i6o4VgfvoTYf6igrdyKRkIL4HCxPjtn18kl0k'
const apiUrl = (id) => `https://script.google.com/macros/s/${id}/exec`
//API Mapping

const apiMapping = {
  user: apiUserKey,
  stock: apiStockKey,
  price: apiPriceKey,
  stockDividend: apiStockDividendKey
}

// create an axios instance
const instance = axios.create({
  withCredentials: false,
  timeout: 10000
})
instance.interceptors.response.use((res) => {
  return res.data
})

const request = async (method, page, data, queryParams) => {
  /* TOKEN */
  const cookies = useCookies(['token'])
  const _token = cookies.get('token')
  // eslint-disable-next-line no-useless-catch
  const apiKey = apiMapping[page] || null
  if (!apiKey) throw new Error('API KEY NOT FOUND')
  try {
    const response = await instance({
      method,
      url: apiUrl(apiKey),
      data: JSON.stringify({ ...data, token: _token ?? null }),
      params: queryParams
    })
    return response
  } catch (error) {
    throw error
  }
}

export default request
