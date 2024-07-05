import request from '@/api/useSheetApi.js'

export const getUser = (params) => request('get', 'user', null, params)

export const postUser = (params) => request('post', 'user', params)
