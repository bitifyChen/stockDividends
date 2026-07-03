export const chartRangeOptions = ['6m', '1y', 'max']

export const holdingSeriesRangeOptions = ['1w', '1m', '6m', '1y', 'max']

export const chartIntervalOptions = [
  { label: '日K', value: 'daily' },
  { label: '周K', value: 'week' },
  { label: '月K', value: 'month' }
]

export const etfTypeOptions = [
  { label: '全部 ETF', value: '' },
  { label: '主動 ETF', value: 'active' },
  { label: '被動 ETF', value: 'passive' }
]

export const etfEventTypeOptions = [
  { label: '全部', value: 'all' },
  { label: '首買', value: 'first_buy' },
  { label: '加碼', value: 'buy_increase' },
  { label: '首賣', value: 'first_sell' },
  { label: '減碼', value: 'sell_decrease' },
  { label: '出清', value: 'sell_out' }
]

export const etfEventStockSortOptions = [
  { label: '淨變動絕對值', value: 'net_shares_abs' },
  { label: '淨買超', value: 'net_shares' },
  { label: '買進合計', value: 'buy_shares' },
  { label: '賣出合計', value: 'sell_shares' },
  { label: '買進 ETF 數', value: 'buy_etf_count' },
  { label: '賣出 ETF 數', value: 'sell_etf_count' },
  { label: '事件 ETF 數', value: 'event_etf_count' },
  { label: '股票代號', value: 'stock_code' }
]
