import requestSheet from '@/api/useSheetApi.js'
import request from '@/api/useAxios.js'

export const getPrice = (params) => requestSheet('get', 'price', null, params)
export const postPrice = (id) => requestSheet('post', 'price', { stockId: `'${id}` }, null)

export const getExternalPrice = (id) => request('get', `/twse/stock/api/getStockInfo.jsp?json=1&delay=0&ex_ch=tse_${id}.tw`, null, null)

