import request from '@/api/useSheetApi.js'

export const getPrice = (params) => request('get', 'price', null, params)
export const postPrice = (id) => request('post', 'price', { stockId: `'${id}` }, null)
