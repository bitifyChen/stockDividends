import axios from 'axios'
import { useCookies } from '@vueuse/integrations/useCookies'

/* KEY */
const apiUserKey = 'AKfycbx_86TUDpzyfYc84zcxsmI0Bq8To4agJuZDqm3rX8IY2KFO9GZLds9supM7oPTe2AK8'
const apiStockKey = 'AKfycby3NF0MAaVQI3r7qV5_4GYIA2yvwLp3Ob0xcTD-OALN_psh5rqvQ3xCh3_XPcNLseQS'
const apiPriceKey = 'AKfycbz25Q07jOsw9IcB681vTvzEADIOW8i6o4VgfvoTYf6igrdyKRkIL4HCxPjtn18kl0k'
const apiUrl = (id) => `https://script.google.com/macros/s/${id}/exec`

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
  try {
    const response = await instance({
      method,
      url: apiUrl(
        page === 'user'
          ? apiUserKey
          : page === 'stock'
            ? apiStockKey
            : page === 'price'
              ? apiPriceKey
              : null
      ),
      data: JSON.stringify({ ...data, token: _token ?? null }),
      params: queryParams
    })
    return response
  } catch (error) {
    throw error
  }
}

export default request
