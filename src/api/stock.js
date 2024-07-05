import request from '@/api/useSheetApi.js'

export const getStock = (params) => request('get', 'stock', null, params)

export const postStock = (params) => request('post', 'stock', params)
