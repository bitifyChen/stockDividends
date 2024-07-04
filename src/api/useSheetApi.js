import axios from 'axios'
/* KEY */
const apiKey = 'AKfycbwUSUHDe4wlSIS0YOd91kbhkCP0ZPf2xwX3mlE4naYwaEzeivEcLrQwzhgUKuYMk1S5gQ'
const apiUrl = `https://script.google.com/macros/s/${apiKey}/exec`
// create an axios instance
const instance = axios.create({
  withCredentials: false,
  timeout: 10000
})
instance.interceptors.response.use((res) => {
  return res.data
})

const request = async (method, page, data, queryParams) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const response = await instance({
      method,
      url: apiUrl,
      data: JSON.stringify(data),
      params: queryParams
    })
    return response
  } catch (error) {
    throw error
  }
}

export default request
