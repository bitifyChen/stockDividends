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

const etfEventAmountSortOptions = [
  { label: '估算交易額', value: 'estimated_amount' },
  { label: '估算買進金額', value: 'estimated_buy_amount' },
  { label: '估算賣出金額', value: 'estimated_sell_amount' },
  { label: '估算淨買超金額', value: 'estimated_net_amount' },
  { label: '估算淨異動金額', value: 'estimated_net_amount_abs' }
]

const etfEventShareSortOptions = [
  { label: '淨異動股數', value: 'net_shares_abs' },
  { label: '買進股數', value: 'buy_shares' },
  { label: '賣出股數', value: 'sell_shares' }
]

const etfEventEtfCountSortOptions = [
  { label: '買進 ETF 家數', value: 'buy_etf_count' },
  { label: '賣出 ETF 家數', value: 'sell_etf_count' },
  { label: '異動 ETF 家數', value: 'event_etf_count' }
]

export const etfEventStockSortOptions = [
  ...etfEventAmountSortOptions,
  ...etfEventShareSortOptions,
  ...etfEventEtfCountSortOptions
]

export const etfEventIndustrySortOptions = [
  ...etfEventAmountSortOptions,
  ...etfEventShareSortOptions,
  { label: '異動股票數', value: 'event_stock_count' },
  { label: '買進股票數', value: 'buy_stock_count' },
  { label: '賣出股票數', value: 'sell_stock_count' },
  ...etfEventEtfCountSortOptions
]

export const etfEventSortOptions = etfEventStockSortOptions
