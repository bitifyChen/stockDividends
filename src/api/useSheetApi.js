import axios from 'axios'
/* KEY */
const apiKey = 'AKfycbwr7ryuW3ZqeM0YiYrQqmWDOYRvolmQPgzkhHugvkxc0iTFVGRUXFrsXfuL0rWpGh0i3A'
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
