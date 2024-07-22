import axios from 'axios'
import { useCookies } from '@vueuse/integrations/useCookies'

/* KEY */
const apiPriceKey = import.meta.env.VITE_GS_API_PRICE_KEY
const apiUrl = (id) => `https://script.google.com/macros/s/${id}/exec`
//API Mapping

const apiMapping = {
  price: apiPriceKey
}

// create an axios instance
const instance = axios.create({
  withCredentials: false,
  timeout: 100000
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
