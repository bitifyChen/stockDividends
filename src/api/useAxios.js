import axios from 'axios'
import { useCookies } from '@vueuse/integrations/useCookies'


// create an axios instance
const instance = axios.create({
  withCredentials: false,
  timeout: 100000
})
instance.interceptors.response.use((res) => {
  return res.data
})

const request = async (method, url, data, queryParams) => {
  try {
    const response = await instance({
      method,
      url: url,
      data: data,
      params: queryParams
    })
    return response
  } catch (error) {
    throw error
  }
}

export default request
