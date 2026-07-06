# 2026-07-06

## ETF 每日進出：產業總覽、產業明細與排序統一

### 主旨
後端補強 `/dashboard/etf/events/overview` 所需的產業視角資料，並統一「個股總買賣行為」與「產業別進出總覽」的排序語意。前端本次只需改接 API 與調整顯示，不需要自行重新計算 top stocks。

### 填寫人
Backend

### 影響 API
- `GET /etf/events/industry-overview`
- `GET /etf/events/industry-overview/{industryCode}/stocks`
- `GET /etf/events/stock-overview`

### 改動內容
- `GET /etf/events/industry-overview` 新增 `topN` query 參數，預設 `3`，最大 `10`。
- `GET /etf/events/industry-overview` 的每個 `items[]` 新增 `topStocks`，讓 overview card 可直接顯示該產業代表個股。
- 新增 `GET /etf/events/industry-overview/{industryCode}/stocks`，用於點進產業卡片後顯示該產業內的個股總買賣行為列表。
- `GET /etf/events/stock-overview` 預設排序改為 `estimated_amount`，與產業 API 一致。
- 後端仍保留舊排序值相容既有 URL，但前端下拉建議只顯示下列共用選項。

### 建議排序 Mapping
```js
export const ETF_EVENT_SORT_OPTIONS = [
  { value: 'estimated_amount', label: '估算交易額' },
  { value: 'estimated_buy_amount', label: '估算買進金額' },
  { value: 'estimated_sell_amount', label: '估算賣出金額' },
  { value: 'estimated_net_amount', label: '估算淨買超金額' },
  { value: 'estimated_net_amount_abs', label: '估算淨異動金額' },
  { value: 'event_etf_count', label: '異動 ETF 家數' },
]
```

### 產業總覽 API
```text
GET /etf/events/industry-overview?date=YYYY-MM-DD&type=all&side=all&etfType=all&page=1&pageSize=50&sort=estimated_amount&topN=3
```

`items[].topStocks` 結構：
```json
{
  "topStocks": {
    "buy": [],
    "sell": [],
    "netBuy": [],
    "netSell": [],
    "amount": []
  }
}
```

各陣列內的 item：
```json
{
  "stock": {
    "code": "2330",
    "name": "台積電",
    "full_name": "台灣積體電路製造股份有限公司",
    "market": "listed",
    "industry_code": "24"
  },
  "buy_etf_count": 2,
  "sell_etf_count": 0,
  "event_etf_count": 2,
  "buy_shares": 120000,
  "sell_shares": 0,
  "net_shares": 120000,
  "estimated_buy_amount": 120000000,
  "estimated_sell_amount": 0,
  "estimated_net_amount": 120000000,
  "estimated_amount": 120000000,
  "eventCount": 2
}
```

`topStocks` 用法建議：
- `amount`：總交易額代表股，可放在卡片最主要的代表個股區。
- `buy`：估算買進金額最高的個股。
- `sell`：估算賣出金額最高的個股。
- `netBuy`：估算淨買超金額最高的個股。
- `netSell`：估算淨賣超金額最高的個股。

### 產業內個股明細 API
```text
GET /etf/events/industry-overview/{industryCode}/stocks?date=YYYY-MM-DD&type=all&side=all&etfType=all&page=1&pageSize=50&limitPerStock=50&sort=estimated_amount
```

用途：
- 使用者點擊產業卡片後，顯示該產業內所有異動個股。
- 回傳結構接近 `/etf/events/stock-overview`，每個 `items[]` 都有 `stock`、買進/賣出/淨額、ETF 家數與 nested `events[]`。
- `events[]` 可顯示涉及 ETF、事件類型、異動股數與 OHLC 估算金額。
- 若要進入「ETF 對單一個股」詳情，不需新增新 URL，沿用既有 ETF/stock 專屬頁面入口。

### 對應角色處理
- 前端在產業 overview card 使用 `topStocks.amount` 或依 UI 情境切換 `buy/sell/netBuy/netSell`。
- 前端排序下拉建議在 `stock-overview`、`industry-overview`、`industry-overview/{industryCode}/stocks` 共用同一組 mapping。
- 前端切換 type / side / sort 時，產業總覽與個股明細應使用同一組 query 條件，避免上方與下方資料語意不同。

### 其他必要補充
- `estimated_*` 都是以 OHLC 參考價估算，不是 ETF 真實成交價。
- 若 `amountCoverage.coverageRate` 低於 1，代表部分 event 尚未成功補到 OHLC，金額型排序可能低估。
- 後端排序預設已改為 `estimated_amount`，前端若沒有特殊需求，不需要再帶舊的 `net_shares_abs`。

# 2026-07-05

## 新增 ETF 每日進出「產業別總覽」API

### 主旨

後端新增 `GET /etf/events/industry-overview`，可在 `/dashboard/etf/events/overview` 加入「產業別進出總覽」區塊。此 API 使用與個股總買賣行為相同的 ETF event / OHLC enrichment 資料來源，但聚合維度改為 `industry.code`。

### 填寫人

Backend

### 影響 API

- `GET /etf/events/industry-overview`

### API 使用

```text
GET /etf/events/industry-overview?date=YYYY-MM-DD&type=all&side=all&etfType=all&page=1&pageSize=50&sort=estimated_amount
```

### 支援參數

- `date`：顯示日期，不帶時由後端選最近可用日期。
- `type`：`all|first_buy|buy_increase|first_sell|sell_decrease|sell_out`。
- `side`：`all|buy|sell`。
- `etfType`：`all|active|passive`。
- `industryCode`：選填，指定台股產業代碼。
- `page` / `pageSize`：分頁。
- `sort`：
  - `estimated_amount`：估算總交易額，預設值。
  - `estimated_buy_amount`：估算買進金額。
  - `estimated_sell_amount`：估算賣出金額。
  - `estimated_net_amount`：估算淨買賣金額。
  - `estimated_net_amount_abs`：估算淨買賣金額絕對值。
  - `net_shares_abs`：淨買賣股數絕對值。
  - `net_shares`：淨買賣股數。
  - `buy_shares`：買進股數。
  - `sell_shares`：賣出股數。
  - `buy_stock_count`：買進股票檔數。
  - `sell_stock_count`：賣出股票檔數。
  - `event_stock_count`：異動股票檔數。
  - `buy_etf_count`：買進 ETF 家數。
  - `sell_etf_count`：賣出 ETF 家數。
  - `event_etf_count`：異動 ETF 家數。
  - `industry_code`：產業代碼。

### 回傳重點

```json
{
  "date": "2026-07-03",
  "sort": "estimated_amount",
  "amountCoverage": {
    "eventCount": 59,
    "successCount": 59,
    "missingCount": 0,
    "failedCount": 0,
    "coverageRate": 1
  },
  "items": [
    {
      "industry": {
        "code": "24"
      },
      "event_stock_count": 12,
      "event_etf_count": 7,
      "buy_shares": 1200000,
      "sell_shares": 500000,
      "net_shares": 700000,
      "estimated_buy_amount": 900000000,
      "estimated_sell_amount": 300000000,
      "estimated_net_amount": 600000000,
      "estimated_amount": 1200000000,
      "amount_ratio": 0.08,
      "volume_ratio": 0.04,
      "amount_coverage_rate": 1
    }
  ]
}
```

### 前端處理

- 建議放在 `/dashboard/etf/events/overview`，與「ETF 角度總覽」、「個股總買賣行為」同頁。
- 日期、事件類型、ETF 類型建議與同頁其他 overview 共用。
- 產業名稱由前端使用既有 `industry_code` mapping 顯示；API 第一版只回 `industry.code`。
- 建議第一版卡片欄位：
  - 產業名稱
  - 估算總交易額
  - 估算買進金額
  - 估算賣出金額
  - 估算淨買賣金額
  - 異動股票檔數
  - 異動 ETF 家數
- 若要避免首屏 loading 過重，產業總覽可延遲載入。

### 其他必要補充

- 估算金額依賴 OHLC enrichment；若 `amountCoverage.coverageRate` 不足，畫面需提示「金額覆蓋率不足」。
- 此 API 不回傳產業底下股票明細；未來若需要 drill-down，可再新增 `industryCode` 詳情頁或於同 API 加入輕量 top stocks。

# 2026-07-05

## `/etf/events/stock-overview` 新增估算交易額排序

### 主旨

後端已在 `GET /etf/events/stock-overview` 的 `sort` 參數新增估算交易額相關排序，讓「個股總買賣行為」可以用金額視角排序，而不只看股數或 ETF 家數。

### 填寫人

Backend

### 影響 API

- `GET /etf/events/stock-overview`

### 改動內容

- 新增 `sort` 支援值：
  - `estimated_amount`：估算總交易額
  - `estimated_buy_amount`：估算買進金額
  - `estimated_sell_amount`：估算賣出金額
  - `estimated_net_amount`：估算淨買賣金額
  - `estimated_net_amount_abs`：估算淨買賣金額絕對值
- response `items[]` 新增：
  - `estimated_amount = estimated_buy_amount + estimated_sell_amount`
- `amount_ratio` 語意明確為：
  - `estimated_amount / reference_turnover`

### 前端處理

- 若畫面有排序下拉，建議 mapping：

```js
export const ETF_STOCK_OVERVIEW_SORT_OPTIONS = [
  { value: 'net_shares_abs', label: '淨買賣股數絕對值' },
  { value: 'net_shares', label: '淨買賣股數' },
  { value: 'buy_shares', label: '買進股數' },
  { value: 'sell_shares', label: '賣出股數' },
  { value: 'buy_etf_count', label: '買進 ETF 家數' },
  { value: 'sell_etf_count', label: '賣出 ETF 家數' },
  { value: 'event_etf_count', label: '異動 ETF 家數' },
  { value: 'stock_code', label: '股票代碼' },
  { value: 'estimated_amount', label: '估算總交易額' },
  { value: 'estimated_buy_amount', label: '估算買進金額' },
  { value: 'estimated_sell_amount', label: '估算賣出金額' },
  { value: 'estimated_net_amount', label: '估算淨買賣金額' },
  { value: 'estimated_net_amount_abs', label: '估算淨買賣金額絕對值' },
]
```

- 預設排序仍建議維持 `net_shares_abs`，避免現有畫面行為突然改變。
- 若想看「市場上 ETF 交易最熱的個股」，優先使用 `estimated_amount`。
- 若想看「買超金額」，使用 `estimated_net_amount`。
- 若想看「不分買賣方向的淨異動強度」，使用 `estimated_net_amount_abs`。

### 其他必要補充

- 估算金額使用 OHLC enrichment 的 `reference_price`，目前是 `reference_turnover / reference_volume`，不是 ETF 真實成交均價。
- 若某些事件尚未補到 OHLC，該事件的估算金額會是 0，畫面仍可參考 `amountCoverage` 或 `amount_coverage_rate`。

# 2026-07-05

## ETF Supabase schema 整併：改以 `etf_configs` 與股票主檔為 canonical source

### 主旨

後端已完成 ETF 相關 Supabase schema 收斂。舊的 `active_etf_*` 與 `etf_ingestion_runs` 已移除，ETF 設定表由 `etf_source_configs` 更名為 `etf_configs`。產品 API 會透過後端 view 補齊前端需要的顯示欄位，但前端文件與後續開發請以 `etf_configs`、`stock` object 作為唯一語意來源。

### 填寫人

Backend

### 影響 API

- `GET /etf/list`
- `GET /etf/source-configs`
- `GET /etf/holdings`
- `GET /etf/holdings/overview`
- `GET /etf/events`
- `GET /etf/events/overview`
- `GET /etf/events/stock-overview`
- `GET /etf/stocks/{stockCode}`

### 改動內容

- `etf_source_configs` 已更名為 `etf_configs`。
- `active_etf_master`、`active_etf_daily_snapshots`、`etf_ingestion_runs` 已移除。
- `etf_holding_snapshots` 實體表不再存：
  - `etf_name`
  - `stock_name`
  - `holding_value`
  - `source_name`
  - `source_payload`
- 後端新增/重建 enriched views，API response 仍會提供畫面需要的 ETF 名稱與股票名稱。
- `source_name` 語意改以 `source_provider` 表達。

### 前端處理

- 前端 API URL 暫時不需要因本次 schema 整併調整。
- 文件或 UI 說明若提到資料來源表，請改寫為 `etf_configs`。
- 前端不要假設 Supabase 存在 `active_etf_*` 或 `etf_source_configs`。
- 股票名稱、產業、上市櫃等資訊仍以 API 回傳的 `stock` object 為主。
- 若 response 仍有 `etf_name`，可作為顯示欄位使用；其來源已由後端從 `etf_configs` 補齊，不是 snapshot 實體表欄位。

### 其他必要補充

- `/etf/source-configs` 仍保留為 `/etf/list` 的相容路由，但新畫面建議優先使用 `/etf/list`。
- 這次是資料庫結構收斂與容量治理，不是新畫面功能。
- 後端仍保留 `get_etf_source_configs` 這類內部函式名稱作為程式相容層；前端不需要關心。

# 2026-07-05

## ETF 持股快照移除每列 `source_payload`

### 主旨

後端已從 `etf_holding_snapshots` 移除 `source_payload`，ETF 持股、事件與個股觀測相關 API 不再提供每列原始來源 JSON。產品畫面請使用結構化欄位與 `stock` object；原始檔追溯改以 Google Drive xlsx backup 與 fetch log metadata 為主。

### 填寫人

Backend

### 影響 API

- `GET /etf/holdings`
- `GET /etf/holdings/overview`
- `GET /etf/events`
- `GET /etf/events/overview`
- `GET /etf/events/stock-overview`
- `GET /etf/stocks/{stockCode}`

### 改動內容

- `etf_holding_snapshots.source_payload` 已從 Supabase 移除。
- 後端不再寫入持股快照每列的 `source_payload`。
- 相關 Supabase views 已重建，輸出不再包含 `source_payload`。
- `active_etf_daily_snapshots.source_payload` 暫時不在本次範圍內，後續 schema 收斂時再處理。

### 前端處理

- 前端不要讀取或顯示 `source_payload`。
- 股票顯示一律使用 `stock` object。
- 若需要檢查來源原始資料，請改由後台或工程流程查 Google Drive xlsx backup，不在產品頁面呈現每列 raw payload。

### 其他必要補充

- 這是資料庫容量精簡的一部分。
- 下一步可繼續評估 `etf_name`、`stock_name`、`holding_value` 與舊 `active_etf_*` 表格是否整併。

# 2026-07-05

## ETF 事件補上 OHLC 參考價、估算交易金額與量能占比

### 主旨

後端已將 ETF 每日進出事件與 Turso OHLC 日線資料串接。前端在事件列表、ETF 當日進出總覽、個股總買賣行為區塊，可以直接讀取 `ohlc` 物件顯示參考價、估算交易金額、成交量占比與成交金額占比。

### 填寫人

Backend

### 影響 API

- `GET /etf/events`
- `GET /etf/events/overview`
- `GET /etf/events/stock-overview`
- `POST /etf/events/enrich-ohlc`
- `GET /etf/fetch-all?save=1`

### 改動內容

- ETF event item 新增 `ohlc` 物件：

```json
{
  "ohlc": {
    "reference_price": 178.58149,
    "reference_volume": 397685486,
    "reference_turnover": 71019266736,
    "enrich_status": {
      "code": 1,
      "label": "success"
    },
    "estimated_amount": 71432596.09529728,
    "estimated_net_amount": 71432596.09529728,
    "volume_ratio": 0.00100581996,
    "amount_ratio": 0.00100581996
  }
}
```

- `reference_price` 使用同一個 display date 的 `reference_turnover / reference_volume` 計算，不使用收盤價。
- `estimated_amount = abs(delta_shares) * reference_price`。
- `estimated_net_amount = delta_shares * reference_price`，買進為正、賣出為負。
- `volume_ratio = abs(delta_shares) / reference_volume`。
- `amount_ratio = estimated_amount / reference_turnover`。
- `enrich_status` mapping：
  - `0 / pending`：尚未補 OHLC。
  - `1 / success`：已補到同日 OHLC，可以顯示金額與占比。
  - `2 / missing`：該日沒有可用 OHLC 或成交量、成交金額無法計算。
  - `3 / failed`：補資料流程失敗。

### `GET /etf/events/stock-overview` 額外欄位

- 每個 `items[]` 會新增：
  - `estimated_buy_amount`
  - `estimated_sell_amount`
  - `estimated_net_amount`
  - `reference_turnover`
  - `reference_volume`
  - `ohlc_success_count`
  - `ohlc_missing_count`
  - `ohlc_failed_count`
  - `amount_coverage_rate`
  - `amount_ratio`
  - `volume_ratio`
- response root 新增 `amountCoverage`：

```json
{
  "amountCoverage": {
    "eventCount": 106,
    "successCount": 106,
    "missingCount": 0,
    "failedCount": 0,
    "coverageRate": 1
  }
}
```

### 前端處理

- `/dashboard/etf/events/overview` 的「個股總買賣行為」可優先顯示：
  - 買進股數 / 賣出股數 / 淨股數。
  - 估算買進金額 / 估算賣出金額 / 估算淨金額。
  - 成交量占比 `volume_ratio`。
  - 成交金額占比 `amount_ratio`。
- 若 `ohlc.enrich_status.code !== 1`，前端應顯示「尚無成交價資料」或隱藏金額欄位，不要自行用收盤價補算。
- `POST /etf/events/enrich-ohlc` 是後端管理與補資料 API，產品頁面不需要自動呼叫。
- 每日 `GET /etf/fetch-all?save=1` 流程已在 ETF 抓取與 OHLC 日更新後，自動執行 event OHLC enrichment。

### 對應角色處理

- 前端只需要改接 response 欄位與畫面呈現。
- 後端負責 enrichment、cache table 與每日批次整合。
- 若前端看到 `amountCoverage.coverageRate < 1`，代表該日仍有事件缺 OHLC，可在後台或內部工具再手動補跑，不需要產品頁面重試。

### 其他必要補充

- 估算金額沒有存進資料庫，是 API view layer 依 `delta_shares` 與 OHLC reference 即時計算。
- Supabase 只儲存事件對應的 OHLC 參考值與 enrichment 狀態。
- 正式站 Render 使用 `TURSO_DEFAULT_TARGET=backup`，本地測試若要對齊正式 OHLC 資料，需在本地環境設定同樣目標。

# 2026-07-04

## 股票資訊欄位統一改用 `stock` object，移除扁平欄位

### 主旨

後端 public API response 將股票識別資訊統一收斂到 `stock` 物件，前端需要一次性改吃 `stock.code / stock.name / stock.full_name / stock.market / stock.industry_code`。舊的 `stock_code`、`stock_name`、`stock_full_name`、`stock_market`、`industry_code` 扁平欄位不再保留，避免同一筆資料有兩套來源造成顯示混亂。

### 填寫人

Backend

### 影響 API

- `GET /etf/events/stock-overview`
- `GET /etf/events`
- `GET /etf/holdings`
- `GET /etf/holdings/overview`
- `GET /etf/stocks`
- `GET /etf/stocks/{stockCode}`
- `GET /etf/stocks/{stockCode}/series`
- `GET /etf/{etfCode}/{stockCode}`
- `GET /etf/{etfCode}/{stockCode}/series`
- `GET /ohlc/stocks`
- `GET /ohlc/stocks/{stockCode}`
- `GET /ohlc/stocks/{stockCode}/candles`
- `GET /ohlc/stocks/{stockCode}/available-dates`

### 改動內容

- 後端 public response 統一回傳 nested stock object：

```json
{
  "stock": {
    "code": "2330",
    "name": "台積電",
    "full_name": "台灣積體電路製造股份有限公司",
    "market": "listed",
    "industry_code": "24"
  }
}
```

- API response 不再回傳下列扁平 identity 欄位：
  - `full_name`
  - `market`
  - `aliases`
  - `stock_code`
  - `stock_name`
  - `stock_full_name`
  - `stock_market`
  - `stock_aliases`
  - `industry_code`
- `source_stock_name` 若存在，仍只作為來源追蹤或 debug，不應作為正式顯示名稱。
- URL path 或 query 仍維持 `stockCode` 參數，例如 `/etf/stocks/2330`、`/ohlc/stocks/2330/candles`，這不屬於 response 扁平欄位。

### 前端處理

- 前端請一次性改用：

```js
const stockCode = item.stock?.code
const stockName = item.stock?.name
const stockFullName = item.stock?.full_name
const stockMarket = item.stock?.market
const industryCode = item.stock?.industry_code
```

- 不要再寫 fallback 到舊欄位，例如不要使用 `item.stock?.code ?? item.stock_code`。
- 共用顯示 helper 可以統一接受 `stock` 物件，避免各頁自行拼欄位。
- `industry_code` 轉中文名稱時，沿用前端 `TW_INDUSTRY_CODE_MAP`，但資料來源改為 `item.stock?.industry_code`。

### 對應角色處理

- `/dashboard/etf/events/overview` 的「個股總買賣行為」請改讀 `item.stock`。
- 股票詳情頁與 ETF 對單一股票詳情頁可使用同一套 stock display helper。
- `industry_code` 轉中文名稱時，使用 `item.stock?.industry_code` 並沿用前端 `TW_INDUSTRY_CODE_MAP`。

### 其他必要補充

- 這是 intentional breaking change，目的是移除舊欄位歧義。
- 若某一筆 response 缺少 `stock`，請視為後端資料或 API bug 回報，不要在前端補舊欄位 fallback。
- provider 測試或匯入類 API 可能仍保留來源原始欄位，不應用於產品畫面顯示。

# 2026-07-04

## 個股產業大類先使用 `industry_code` 前端 mapping

### 主旨

目前先不建立 `sub_industry_code`，前端先用既有 `industry_code` 做台股官方產業大類顯示。細產業鏈如記憶體、玻璃纖維、IC 設計、晶圓代工，等後續確認正式資料源後再設計。

### 填寫人

Backend

### 影響 API

- 無新增 API
- 既有股票主檔資料已有 `industry_code`
- 若頁面資料尚未回傳 `industry_code`，前端先保留 mapping 檔，等後端後續在相關 API 補欄位

### 改動內容

- 前端可建立靜態 mapping，例如：

```js
export const TW_INDUSTRY_CODE_MAP = {
  "01": "水泥工業",
  "02": "食品工業",
  "03": "塑膠工業",
  "04": "紡織纖維",
  "05": "電機機械",
  "06": "電器電纜",
  "08": "玻璃陶瓷",
  "09": "造紙工業",
  "10": "鋼鐵工業",
  "11": "橡膠工業",
  "12": "汽車工業",
  "14": "建材營造",
  "15": "航運業",
  "16": "觀光餐旅",
  "17": "金融保險",
  "18": "貿易百貨",
  "20": "綜合",
  "21": "化學工業",
  "22": "生技醫療業",
  "23": "油電燃氣業",
  "24": "半導體業",
  "25": "電腦及週邊設備業",
  "26": "光電業",
  "27": "通信網路業",
  "28": "電子零組件業",
  "29": "電子通路業",
  "30": "資訊服務業",
  "31": "其他電子業",
  "32": "綠能環保",
  "33": "數位雲端",
  "34": "運動休閒",
  "35": "居家生活",
  "80": "其他"
}
```

- 建議前端 helper：

```js
export function getIndustryName(industryCode) {
  if (!industryCode) return "未分類"
  const code = String(industryCode).padStart(2, "0")
  return TW_INDUSTRY_CODE_MAP[code] || `未知產業 ${code}`
}
```

### 對應角色處理

- 前端先新增 mapping JSON / JS 檔，不需要等待後端新增資料表。
- 顯示股票產業時，使用 `industry_code` 轉中文名稱。
- 不要先建立 `sub_industry_code` 的 UI 或假資料，避免之後與正式產業鏈資料源衝突。

### 其他必要補充

- `industry_code` 是官方大類，適合顯示「半導體業、電子零組件業、光電業」這種層級。
- `industry_code` 無法表達「記憶體、玻璃纖維、IC 設計、晶圓代工」這類細產業鏈。
- 若後續要做產業鏈流向圖，建議另行設計 `industry_chain / segment / upstream-midstream-downstream`，不要塞進單一 `industry_code`。

# 2026-07-02

## `/maintenance/batch-status` 改為標準 job status schema

### 主旨

後端統一 Firebase `maintenance_status` schema，前端設定頁不需要再針對 ETF / OHLC / 股利 / 通知寫不同欄位 mapping。

### 填寫人

Backend

### 影響 API

- `GET /maintenance/batch-status`
- `GET /maintenance/batch-status?includeDetails=1`

### 改動內容

- 預設 response 只讀 Firebase `maintenance_status`，不再每次都查 Supabase / Turso / Firebase stocks 詳情。
- `items` 底下每個 job 直接是標準欄位，不再包一層 `status`。
- 標準欄位：
  - `key`
  - `label`
  - `category`
  - `enabled`
  - `lastStatus`
  - `lastRunAt`
  - `lastFinishedAt`
  - `lastSuccessAt`
  - `lastError`
  - `lastDataDate`
  - `lastSourceDate`
  - `successCount`
  - `failedCount`
  - `skippedCount`
  - `waitingCount`
  - `rowCount`
  - `payload`
  - `updatedAt`
- `includeDetails=1` 時才額外附加 debug/detail 資訊：
  - `items.etfFetchAll.latestSuccessLog`
  - `items.ohlcDailyFetch.latestSuccessRun`
  - `items.dividendFetchAll.firebaseSummary`

### 前端接法

- 取得 job：

```js
const job = response.items.etfFetchAll
```

- 狀態：

```js
job.lastStatus
```

- 前次成功時間：

```js
job.lastSuccessAt
```

- 本次實際資料日：

```js
job.lastDataDate
```

- 錯誤摘要：

```js
job.lastError
```

### 對應角色處理

- `/dashboard/setting` 可移除舊 fallback mapping：
  - `record.status`
  - `record.latestSuccessRun`
  - `record.latestSuccessLog`
- 狀態卡片統一讀 `lastStatus`、`lastSuccessAt`、`lastDataDate`。
- 若要顯示進階 debug，再使用 `includeDetails=1`；一般進頁不要帶，避免多查資料庫。

### 其他必要補充

- 既有 Firebase 舊欄位不需要手動刪除；後端下次寫入同一 job 時會覆寫成標準 schema。
- 在任務尚未重新寫入前，後端會把舊格式 normalize 成標準 response，避免過渡期前端壞掉。
- `lastError` 代表最近一次執行結束後的錯誤；若本次成功、正常等待或正常略過，會清為 `null`。

# 2026-07-02

## 新增 OHLC 官方日更新手動重跑 API

### 主旨

後端新增獨立 OHLC 日更新 API，前端設定頁可單獨重跑 K 線日資料，不需要連同 ETF 批次一起執行。

### 填寫人

Backend

### 影響 API

- 新增 `POST /ohlc/daily-fetch`
- 新增 `GET /ohlc/daily-fetch`
- 既有 `GET /maintenance/batch-status`

### 建議接法

- 後台設定頁的 OHLC 卡片可新增「重跑 OHLC 日線」按鈕：
  - `POST /ohlc/daily-fetch`
- 若只是一般重跑，不需要帶參數：

```json
{}
```

- 若要指定交易日：

```json
{
  "tradeDate": "2026-07-02"
}
```

- 若要強制重寫指定交易日：

```json
{
  "tradeDate": "2026-07-02",
  "force": true
}
```

### 支援參數

- `tradeDate`：選填，指定交易日，格式 `YYYY-MM-DD`
- `force`：選填，`true` 時即使該交易日已有足量資料，也會重新寫入
- `syncWatchlistFirst`：選填，預設 `true`，是否先同步 OHLC watchlist

### 日期規則

- 未帶 `tradeDate` 時，後端不會直接使用系統日期。
- 後端會檢查 TWSE / TPEx 官方資料，使用「最近可取得的交易日」。
- 因此若明早執行，而官方來源已揭露今天交易資料，會寫入今天交易日。
- 若官方尚未揭露，會自動退回最近有資料的交易日，避免寫入空資料或錯誤日期。

### 對應角色處理

- `/dashboard/setting` 的 OHLC 卡片可改接 `POST /ohlc/daily-fetch`。
- 執行完成後重新打 `GET /maintenance/batch-status`，讀取 `items.ohlcDailyFetch.latestSuccessRun.finished_at` 顯示前次成功時間。
- `POST /ohlc/fetch` 仍是 FinMind 指定股票歷史補資料用途，不建議當作每日全市場 OHLC 重跑按鈕。

### `/dashboard/setting` 重跑與強制重跑差異

- ETF 批次更新：
  - `重跑 ETF 批次`：呼叫 `GET /etf/fetch-all?save=1`，依各 provider 的 release 時間與既有保護規則執行；若來源尚未到公布時間，可能回 `waiting`。
  - `強制重跑`：呼叫 `GET /etf/fetch-all?save=1&force=1`，略過 release 時間判斷，適合已確認資料已公布但一般重跑仍被擋住時使用。
  - 強制重跑可能重新寫入同一資料日、重新備份檔案，並重新發送批次通知，前端必須保留二次確認。
- OHLC 日線批次：
  - `重跑 OHLC 日線`：呼叫 `POST /ohlc/daily-fetch`，後端會解析最近官方可取得交易日；若該日已有足量資料，會略過重寫並回傳 `skipped=true`。
  - `強制重跑`：呼叫 `POST /ohlc/daily-fetch` 並帶 `{ "force": true }`，即使該交易日已有資料也會重新寫入。
  - 未指定 `tradeDate` 時，後端以官方 TWSE / TPEx 可取得資料決定實際 `trade_date`，不是單純用今天日期。
- 股利資料更新：
  - `更新全部股利`：呼叫 `GET /dividend?mode=all`，跑全市場既有 Firebase stocks 清單。
  - `更新單一股票`：呼叫 `GET /dividend?stockId={stockCode}`，只補指定股票。
  - 股利目前沒有 `force` 參數，前端不需要做「強制重跑」按鈕。
- ETF 摘要通知：
  - `預覽通知`：呼叫 `GET /etf/events/summary-notify?send=0`，只回傳 message，不發 Telegram。
  - `發送 Telegram`：呼叫 `GET /etf/events/summary-notify?send=1`，會真的送出通知；前端需保留二次確認。

### 其他必要補充

- 此 API 不發 Telegram。
- 此 API 不會抓 ETF 持股，也不會觸發 `/etf/fetch-all`。
- response 的 `trade_date` 是實際寫入的交易日，前端若要提示使用者，應顯示此欄位。

# 2026-07-02

## 後台維運操作 API：ETF 批次、股利、摘要通知

### 主旨

後端提供後台可手動觸發的維運 API，前端可在管理畫面新增按鈕或表單，用於重跑 ETF 批次、重跑股利資料，以及補發 ETF 今日事件摘要 Telegram 通知。

### 填寫人

Backend

### 影響 API

- `GET /etf/fetch-all?save=1`
- `GET /etf/fetch-all?save=1&force=1`
- `GET /dividend?mode=all`
- `GET /dividend?stockId={stockCode}`
- `GET /etf/events/summary-notify`
- `GET /maintenance/batch-status`

### 建議接法

- 重跑 ETF 每日批次：
  - `GET /etf/fetch-all?save=1`
  - 會依 provider 規則抓取 ETF 持股、寫入 Supabase、備份 xlsx，並執行 OHLC 日更新
  - 成功後會發出原本 ETF 批次 Telegram 通知，並額外發一則 `ETF 今日事件摘要`
- 強制重跑 ETF 每日批次：
  - `GET /etf/fetch-all?save=1&force=1`
  - 用於超過一般 release 時間判斷或需要強制重抓時；前端建議加確認視窗
- 預覽 ETF 今日事件摘要，不發 Telegram：
  - `GET /etf/events/summary-notify?date=YYYY-MM-DD&send=0`
- 補發 ETF 今日事件摘要 Telegram：
  - `GET /etf/events/summary-notify?date=YYYY-MM-DD&send=1`
  - 若不帶 `date`，後端會使用最新可用 ETF event display date
- 查詢批次狀態：
  - `GET /maintenance/batch-status`
  - 回傳 ETF 批次、股利批次、ETF 摘要通知、OHLC 日更新的上次狀態與最近成功資訊
- 重跑全部股利資料：
  - `GET /dividend?mode=all`
  - 會逐一跑目前 Firebase `stocks` collection 內所有股票
- 重跑單一股利資料：
  - `GET /dividend?stockId=00919`

### 支援參數

- `/etf/events/summary-notify`
  - `date`：指定摘要日期，格式 `YYYY-MM-DD`
  - `send`：`1` 發送 Telegram，`0` 只預覽 message
  - `etfType`：`all | active | passive`，預設 `all`
  - `topN`：每個 type 取前幾檔，預設 `5`，最大 `20`
- `/etf/fetch-all`
  - `save`：`1` 寫入，`0` dry-run
  - `force`：`1` 強制執行，預設 `0`
- `/maintenance/batch-status`
  - `includeDetails`：`1` 時會額外彙總 Firebase stocks 股利更新狀態，預設不帶以維持輕量
  - `items.etfFetchAll.status.lastSuccessAt`：ETF 批次最近完整成功時間
  - `items.dividendFetchAll.status.lastSuccessAt`：股利批次最近完整成功時間
  - `items.etfEventSummaryNotify.status.lastSuccessAt`：ETF 摘要通知最近成功發送時間
  - `items.ohlcDailyFetch.latestSuccessRun.finished_at`：OHLC 日更新最近成功時間

### 對應角色處理

- 後台按鈕建議區分「預覽」與「送出」，尤其是 Telegram 補發通知。
- 前端進入維運頁時可先打 `/maintenance/batch-status`，顯示各功能最近成功時間，再讓使用者判斷是否需要重跑。
- 這些是維運操作，不建議放在一般使用者可見頁面。
- 前端不需要解析 ETF 批次通知內容；若要顯示結果，可直接呈現 API response 的 `results`、`ohlc`、`eventSummary`。

### 其他必要補充

- `/etf/events/summary-notify` 是新 API，已同步寫入 `docs/openapi.json`。
- `/dividend?mode=all` 目前是既有 API，可能執行較久，前端應顯示 loading 與錯誤訊息。
- `/etf/fetch-all?save=1` 會真的寫入資料與發通知，前端操作需加二次確認。

# 2026-06-26

## 新增 00994A、00406A、00995A、00401A ETF 追蹤資料

### 主旨

後端新增第一金、中信投信與摩根投信來源，並已先寫入 `2026-06-25` 快照。前端正式畫面不需要新增專屬 API，照既有 ETF 與個股觀測 API 顯示即可。

### 填寫人

Backend

### 影響 API

- `GET /etf/list`
- `GET /etf/holdings?etfCode={etfCode}`
- `GET /etf/available-dates?etfCode={etfCode}`
- `GET /etf/{etfCode}/{stockCode}`
- `GET /etf/{etfCode}/{stockCode}/series`
- `GET /etf/stocks/{stockCode}`
- `GET /etf/stocks/{stockCode}/series`
- `GET /etf/events`
- `GET /etf/events/overview`
- `GET /etf/events/stock-overview`
- `GET /etf/holdings/overview`

### 改動內容

- 新增追蹤 ETF：
  - `00994A`：主動第一金台股優，provider=`first`
  - `00406A`：主動中信台灣收益，provider=`ctbc`
  - `00995A`：主動中信台灣卓越，provider=`ctbc`
  - `00401A`：主動摩根台灣鑫收，provider=`jpm`
- 已先寫入 `2026-06-25` 資料：
  - `00994A`：36 筆
  - `00406A`：50 筆
  - `00995A`：53 筆
  - `00401A`：65 筆
- 三支 ETF 都納入 `/etf/fetch-all?save=1` 每日批次。
- 新增 Internal 手動測試入口：
  - `GET /etf/first?sourceCode=182&save=0|1`
  - `GET /etf/ctbc?sourceCode=00682450&save=0|1`
  - `GET /etf/ctbc?sourceCode=00653201&save=0|1`
  - `GET /etf/jpm?sourceCode=00401A&save=0|1`

### 對應角色處理

- 前端 ETF list、持股頁、個股詳情頁、事件總覽頁照既有 API 顯示即可。
- `/etf/first`、`/etf/ctbc` 是後端手動測試入口，前端正式畫面不需要直接呼叫。
- 若日期選擇器需要禁用無資料日，仍使用 `GET /etf/available-dates?etfCode=00994A|00406A|00995A|00401A`。

### 其他必要補充

- 這三支目前只建立每日抓取與最新快照；歷史回補等所有 ETF provider 建立完成後再批次處理。
- 摩根來源 xlsx 的 `Valuation Date` 為 `2026-06-26`，後端依 provider 規則正規化為 display date `2026-06-25`。
- `docs/openapi.json` 已補上 `/etf/first`、`/etf/ctbc`、`/etf/jpm` Internal endpoint 說明。

# 2026-06-25

## 新增 00997A、00996A、00980A、00999A、00985A ETF 追蹤資料

### 主旨

後端新增 5 檔 ETF 追蹤資料，前端可用既有 ETF 頁面與個股觀測頁自然顯示，不需要新增專屬 API 串接。

### 填寫人

Backend

### 影響 API

- `GET /etf/list`
- `GET /etf/holdings?etfCode={etfCode}`
- `GET /etf/available-dates?etfCode={etfCode}`
- `GET /etf/{etfCode}/{stockCode}`
- `GET /etf/{etfCode}/{stockCode}/series`
- `GET /etf/stocks/{stockCode}`
- `GET /etf/stocks/{stockCode}/series`
- `GET /etf/events`
- `GET /etf/events/overview`
- `GET /etf/events/stock-overview`
- `GET /etf/holdings/overview`

### 改動內容

- 新增追蹤 ETF：
  - `00997A`：主動群益美國增長，provider=`capitalfund`
  - `00996A`：主動兆豐台灣豐收，provider=`mega`
  - `00980A`：主動野村臺灣優選，provider=`nomura`
  - `00999A`：主動野村臺灣高息，provider=`nomura`
  - `00985A`：主動野村臺灣50，provider=`nomura`
- 已補入歷史資料：
  - `00997A`：51 個可用資料日
  - `00980A`：280 個可用資料日
  - `00999A`：37 個可用資料日
  - `00985A`：226 個可用資料日
- `00996A` 來源目前無歷史查詢能力，先有最新快照。
- `00997A` 含海外持股；後端只把台股持股寫入 Supabase，海外持股只保留在 Google Drive 備份，不進前端分析 API。

### 對應角色處理

- 前端 ETF list、持股頁、個股詳情頁、事件總覽頁照既有 API 顯示即可。
- 若使用者在 `00997A` 頁看到持股數偏少，這是預期行為：平台目前只分析台股持股。
- `GET /etf/available-dates?etfCode=00980A|00985A|00999A|00997A` 可取得已補齊的日期，日期選擇器可依既有邏輯 disabled 無資料日。
- 個股頁 `GET /etf/stocks/{stockCode}` 會自然納入新 ETF 持有狀態。

### 其他必要補充

- `/etf/mega`、`/etf/nomura` 是後端手動測試入口，前端正式畫面不需要直接呼叫。
- 目前 `fhtrust / 00991A` 官方 Excel 仍可能回傳無效檔案，這不是本次新增 provider 造成。

# 2026-06-25

## 00405A 主動富邦台灣龍耀納入追蹤

### 主旨

新增 `00405A` 作為 Fubon provider 追蹤標的。此來源是富邦投信 ASP.NET 頁面，後端已新增專屬 parser。

### 填寫人

Backend

### 影響 API

- `GET /etf/list`
- `GET /etf/holdings?etfCode=00405A`
- `GET /etf/available-dates?etfCode=00405A`
- `GET /etf/stocks/{stockCode}`
- `GET /etf/events`
- `GET /etf/events/overview`
- `GET /etf/events/stock-overview`

### 改動內容

- `00405A / 00405A` 已加入富邦投信批次抓取設定。
- ETF 名稱：`主動富邦台灣龍耀`。
- 此 ETF 設定為主動式 ETF，會納入每日批次更新。
- 後端已先寫入 `2026-06-24` 快照：
  - 寫入資料庫持股：50 筆
  - Google Drive 備份：`2026-06-24.xls`
- 富邦來源提供的是 `.xls` 匯出，後端會原樣備份，不影響前端 API response。

### 對應角色處理

- 前端不需要新增特殊判斷；照既有 ETF list、holdings、stock detail、events API 顯示即可。
- 若使用者從個股頁查看持有 ETF，既有 `GET /etf/stocks/{stockCode}` 會自然納入 `00405A`。
- 若要在 UI 顯示資料來源，可使用 API 回傳的 `source_provider=fubon` 與 `source_company=富邦投信`。

### 其他必要補充

- `/etf/fubon` 是後端手動測試入口，前端正式畫面不需要直接呼叫。
- 此來源目前解析富邦頁面的「基金資產」持股表。

# 2026-06-25

## 00990A 元大全球AI新經濟納入追蹤

### 主旨

新增 `00990A` 作為 Yuanta provider 追蹤標的；此 ETF 含海外持股，但前台既有 ETF 與個股觀測 API 只會看到其中的台股持股。

### 填寫人

Backend

### 影響 API

- `GET /etf/list`
- `GET /etf/holdings?etfCode=00990A`
- `GET /etf/available-dates?etfCode=00990A`
- `GET /etf/stocks/{stockCode}`
- `GET /etf/events`
- `GET /etf/events/overview`
- `GET /etf/events/stock-overview`

### 改動內容

- `00990A / 00990A` 已新增為元大投信來源。
- ETF 名稱：`元大全球AI新經濟主動式ETF基金`。
- 此 ETF 設定為主動式 ETF，會納入每日批次更新。
- Supabase 只儲存台股持股；海外持股不會出現在前端 ETF 持股、個股觀測、事件總覽 API。
- Google Drive 備份會保留官方完整來源持股，包含海外持股。
- 已先寫入 `2026-06-24` 資料：
  - 官方來源完整持股：49 筆
  - 寫入資料庫台股持股：13 筆

### 對應角色處理

- 前端不需要新增特殊判斷；照既有 ETF list 與 holdings API 顯示即可。
- 若使用者詢問為何畫面只看到部分持股，文案可說明目前平台只將台股持股納入分析與個股頁關聯。
- 個股頁若該股票被 `00990A` 持有，既有 `GET /etf/stocks/{stockCode}` 會自然出現此 ETF。

### 其他必要補充

- `00990A` 的海外持股不會有個股詳情、K 線、ETF 對個股關係圖。
- 此規則與 `00988A` 一致：備份保留完整來源，資料庫與前端分析只使用台股。

# 2026-06-25

## 00988A 統一全球創新納入追蹤

### 主旨

新增 `00988A` 作為 ezmoney provider 追蹤標的。此 ETF 含海外持股，但前端 API 只會看到其中的台股持股。

### 填寫人

Backend

### 影響 API

- `GET /etf/list`
- `GET /etf/holdings?etfCode=00988A`
- `GET /etf/available-dates?etfCode=00988A`
- `GET /etf/stocks/{stockCode}`
- `GET /etf/events`
- `GET /etf/events/overview`
- `GET /etf/events/stock-overview`

### 改動內容

- `00988A / 61YTW` 已加入 ezmoney 批次抓取設定。
- Google Drive 備份沿用 ezmoney 既有檔名規則，原始 xlsx 會完整保留海外持股。
- Supabase 只寫入台股持股，海外股票不進資料庫、不進 `/etf/stocks`、不進事件分析。
- 目前本地已寫入 `2026-06-23` 快照：
  - 原始 xlsx：44 筆
  - 寫入資料庫台股：13 筆

### 對應角色處理

- 前端不需針對海外股票新增頁面或走勢功能。
- 若 ETF 持股頁顯示 `00988A` 筆數較少，這是預期行為，因為 API 只回傳台股持股。
- 個股觀測頁若該台股被 `00988A` 持有，會自然顯示 `00988A`。

### 其他必要補充

- 此規則目前只影響設定為 `twHoldingsOnly=true` 的來源。
- 若未來要顯示海外持股，應重新評估資料模型，不建議把海外代碼混入台股主流程。

# 2026-06-24

## ETF 當日進出股票彙總 API

### 主旨

新增「以股票角度彙總 ETF 當日進出」API，供前端在 `/dashboard/etf/events` 或相關總覽區塊顯示哪些股票被多檔 ETF 同日買進或賣出。

### 填寫人

Backend

### 影響 API

- 新增 `GET /etf/events/stock-overview`
- 既有 `GET /etf/events/overview` 不變，仍是 ETF 角度分頁

### 建議接法

- ETF 角度總覽仍使用：
  - `GET /etf/events/overview?date=YYYY-MM-DD&type=all&page=1&pageSize=12`
- 股票角度彙總使用：
  - `GET /etf/events/stock-overview?date=YYYY-MM-DD&page=1&pageSize=50`
- 若不帶 `date`，後端會自動使用最新有資料的 `display_date`，並在 response 回傳實際使用的 `date`
- 前端日期選擇器可沿用 response 的 `availableDates`

### 支援參數

- `date`：指定資料日期，格式 `YYYY-MM-DD`
- `type`：`all | first_buy | buy_increase | first_sell | sell_decrease | sell_out`
- `side`：`all | buy | sell`
- `etfType`：`all | active | passive`
- `stockCode`：只看單一股票，例如 `2330`
- `sort`：`net_shares_abs | net_shares | buy_shares | sell_shares | buy_etf_count | sell_etf_count | event_etf_count | stock_code`
- `page` / `pageSize`：股票分頁，`pageSize` 最大 200
- `limitPerStock`：每檔股票底下最多回傳幾筆 ETF 事件，預設 50，最大 500

### 回應重點

- `items[]` 每筆是一檔股票，不是一筆事件
- `buy_etf_count`：當日買進或加碼該股票的 ETF 數量
- `sell_etf_count`：當日賣出、減碼或清倉該股票的 ETF 數量
- `event_etf_count`：當日對該股票有任一事件的 ETF 數量
- `buy_shares`：買進方向合計股數
- `sell_shares`：賣出方向合計股數，為正數
- `net_shares`：買進股數減賣出股數
- `events[]`：該股票底下的 ETF 明細事件

### 對應角色處理

- 前端可在「所有 ETF 當日進出總覽」旁新增股票角度排行榜，例如「今日共同買進」、「今日共同賣出」、「淨買超股數」
- 不建議前端自行用 `/etf/events/overview` 的當頁資料計算共同買入，因為該 API 是 ETF 分頁，會造成統計不完整
- 若只做延遲載入，可等使用者滑到股票彙總區塊再打 `/etf/events/stock-overview`

### 其他必要補充

- `0050` 等被動 ETF 可能因規模較大影響股數排序，前端若要看主動 ETF 訊號，建議加 `etfType=active`
- `type=first_buy` 已排除 ETF 首次匯入日造成的假首次買入
- response schema 已同步更新至 `docs/openapi.json`

# 2026-06-24

## Dashboard 深淺色設計準則

### 目的

- `/dashboard` 是獨立後台視覺系統，深色與淺色都必須可讀，且不得影響前台。
- 前台共用樣式集中在 `src/assets/main.css`，dashboard 調整不得修改該檔。
- Dashboard 外觀由 `src/layouts/dashboard.vue` 控制，頁面層只使用既有 token，不自行硬寫深色或淺色。

### Token 使用

- 背景與容器優先使用 `--dashboard-section-bg`、`--dashboard-panel-bg`、`--dashboard-glass-bg`。
- 陰影與玻璃材質使用 `--dashboard-section-shadow`、`--dashboard-panel-shadow`。
- 文字使用 `--dashboard-text-primary`、`--dashboard-text-secondary`、`--dashboard-text-muted`。
- 表單與按鈕使用 `--dashboard-control-bg`、`--dashboard-control-border`。
- 邊框使用 `--main-border-color`，不要在頁面內硬寫 `#30343a`、`rgb(8 11 16 / ...)`、`#111317` 這類只適合暗色模式的值。
- 漲跌色統一使用 `--stock-rise-color` 與 `--stock-fall-color`，全站維持漲為紅色、跌為綠色。

### Element Plus 規範

- Element Plus 的深色模式只由 dashboard layout 同步 `document.documentElement.classList.toggle('dark')`。
- 頁面若需要覆蓋 `el-input`、`el-select`、`el-table`，必須使用 dashboard token，避免固定暗色背景。
- 原生 `input`、`select` 在 dashboard 內需確認深淺色的文字、placeholder、邊框與下拉選單可讀。

### 表單與前台隔離

- Dashboard 表單優先使用 Element Plus 表單、Drawer、Dialog，維持後台一致的密度與互動。
- 不直接重用前台 `TwoDynamicForm`，除非另包 dashboard 專用樣式或拆出 dashboard 版本。
- Dashboard 頁面樣式以 scoped style 或 dashboard 專用 scss 為主，不把後台規則寫回前台全域 CSS。

### 新增頁面檢查清單

- 深色模式：標題區、卡片、表格、空狀態、錯誤狀態、下拉選單都可讀。
- 淺色模式：沒有殘留暗色玻璃背景，表單欄位與 Element Plus popper 文字對比足夠。
- RWD：手機寬度不超出 viewport，長表格需有局部橫向滾動，不推開整體 layout。
- 互動狀態：loading、disabled、hover、active、empty 狀態都要符合目前 dashboard 視覺。
- 中文內容：修改後必須以 UTF-8 檢查，不可以出現連續三個問號或 U+FFFD replacement character。

# 2026-06-22

### 主旨

ETF overview 改為 ETF 分組，日期預設採最新可用資料日

### 填寫人

Backend

### 影響 API

- 調整 `GET /etf/events/overview`
- 調整 `GET /etf/holdings/overview`

### 改動內容

- 兩支 API 的 `date` 均改為選填；首次進頁可不帶日期，後端會回傳最新有資料的 `display_date`
- response 新增：
  - `date`：本次實際採用的資料日
  - `requestedDate`：前端原本指定的日期；未指定時為 `null`
  - `availableDates`：所有有資料的日期，由新至舊排列
- `GET /etf/events/overview?page=1&pageSize=12&limitPerEtf=100&type=all`
  - 分頁單位改為 ETF，不再是單筆 event
  - 每個 `items[]` 是一檔 ETF，內含 `status`、`eventCount`、`eventsHasMore`、`events[]`
  - 當日已更新但沒有進出事件的 ETF 仍會出現，且 `events=[]`
  - `type` 仍支援 `all`、`first_buy`、`buy_increase`、`first_sell`、`sell_decrease`、`sell_out`
- `GET /etf/holdings/overview?page=1&pageSize=12&limitPerEtf=10`
  - 原本 ETF 分組結構不變
  - 新增自動日期與 `availableDates`

### 對應角色處理

- 首次載入不要自行計算「昨天」或「上周五」，直接省略 `date`
- 收到 response 後，以 `date` 設定目前畫面日期，並以 `availableDates` 控制日期選擇器可選狀態
- 使用者切換日期後，再明確傳入 `date=YYYY-MM-DD`
- events 頁面的 infinite scroll 需依 ETF page 載入；`totalCount`、`pageSize` 都代表 ETF 數量

### 其他必要補充

- 明確指定沒有資料的休市日時，後端不會自動改日期；ETF 會回 `not_updated` 與空資料
- 目前最新可用資料日為 `2026-06-18`，`2026-06-19` 為休市日
- 詳細 response schema 以 `docs/openapi.json` 為準

# 2026-06-22

### 主旨

ETF 當日進出與前十大持股改接跨 ETF overview API

### 填寫人

Backend

### 影響 API

- 新增 `GET /etf/events/overview`
- 新增 `GET /etf/holdings/overview`
- 既有 `GET /etf/events` 與 `GET /etf/holdings` 不變

### 改動內容

- `/dashboard/etf/events` 改為所有追蹤 ETF 的指定日進出總覽：
  - `GET /etf/events/overview?date=2026-06-18&type=all&page=1&pageSize=50`
  - `date` 必填，使用已正規化的 `display_date`
  - `type` 支援 `all`、`first_buy`、`buy_increase`、`first_sell`、`sell_decrease`、`sell_out`
  - 可選擇傳入 `etfCode` 或 `stockCode` 過濾
  - response 提供 `totalCount`、`hasMore`、`nextPage`，可供 infinite scroll 使用
  - `coverage` 顯示追蹤 ETF、已更新、未更新、抓取失敗與尚未成立數量
  - `notUpdatedEtfs` 提供當日未完成更新的 ETF 清單
- ETF 前十大持股總覽改接：
  - `GET /etf/holdings/overview?date=2026-06-18&page=1&pageSize=12&limitPerEtf=10`
  - 分頁單位是 ETF，不是持股列
  - 每個 ETF item 會回傳 `status`、`display_date`、`latest_available_date` 與 `holdings`
  - `status` 支援 `updated`、`not_updated`、`not_started`、`fetch_failed`
  - 未更新 ETF 仍保留 item，但 `holdings=[]`，不可拿前一日資料替代
  - 被動 ETF 若指定日已抓取成功但依政策未新增 snapshot，會回傳最近一次已確認持股，並標示 `is_carried_forward=true`

### 對應角色處理

- `/dashboard/etf/events` 初次載入 page 1，捲動到底且 `hasMore=true` 時使用 `nextPage` 載入下一頁
- ETF 前十大持股頁同樣採動態載入，但每頁新增的是 ETF 區塊
- 使用者切換日期、事件類型或 filter 時，需清空目前列表並從 page 1 重新載入
- 畫面上方顯示 `coverage.updated_etf_count / coverage.tracked_etf_count`
- `not_updated` 與 `fetch_failed` 必須明確顯示，避免被誤認為當日沒有交易或沒有持股

### 其他必要補充

- 兩支 overview API 都強制使用同一個 `date`，不會混用各 ETF 的最新日期
- `nextPage=null` 或 `hasMore=false` 時停止載入
- 前端不需先取得 ETF list 再逐檔呼叫 holdings，避免 N+1 request
- 完整 response schema 已更新至 `docs/openapi.json`

# 2026-06-15

### 主旨

OHLC K 線頁面只保留 candles 依賴，Supabase 維持列表與標記欄位

### 填寫人

Backend

### 前端必要 API

- `GET /ohlc/stocks/{stockCode}/candles?range=1w|1m|6m|1y|max&interval=daily|week|month`

### 後端可選 API

- `GET /ohlc/stocks/{stockCode}`
- `GET /ohlc/stocks/{stockCode}/available-dates`
- `POST /ohlc/fetch`
- `POST /ohlc/backup-drive`

### 前端建議流程

- K 線圖預設放在 `/dashboard/etf/stocks/{stockCode}` 這類個股詳情頁
- 頁面主要資料仍由 Supabase 的股票 / ETF 頁面資料提供
- 進圖表頁時，只打 `GET /ohlc/stocks/{stockCode}/candles?...`
- 使用者切換區間或週期時，只需重打 candles，不必重打其他 OHLC API
- 若未來前端要 disable 日期選擇器，再視需加打 `GET /ohlc/stocks/{stockCode}/available-dates`

### 設計說明

- 前端不需要再把 OHLC 當成第二個列表資料來源
- 股票列表、標記欄位、歷史資料存在與否，應回寫到 Supabase，讓前端仍只讀 Supabase 來畫列表與 badge
- Turso 只負責儲存 OHLC 與供應 candles
- `candles` API 是唯一前端圖表主依賴

### 備註

- 日常 fetch 只抓當天
- 建構期補歷史資料時，才會明確帶日期區間
- `has_history`、`ohlc_start_date`、`ohlc_last_date`、`ohlc_point_count` 建議同步回 Supabase，供列表頁使用

# 2026-06-12

## Subject

ETF events API 補齊五種事件，並修正被動 ETF 曲線延展

## Owner

Backend

## Affected APIs

- `GET /etf/events?type=first_buy&page=1&pageSize=20`
- `GET /etf/events?type=buy_increase&page=1&pageSize=20`
- `GET /etf/events?type=first_sell&page=1&pageSize=20`
- `GET /etf/events?type=sell_decrease&page=1&pageSize=20`
- `GET /etf/events?type=sell_out&page=1&pageSize=20`
- `GET /etf/stocks/{stockCode}`
- `GET /etf/stocks/{stockCode}/series?range=1w|1m|6m|1y|max`
- `GET /etf/{etfCode}/{stockCode}/series?range=1w|1m|6m|1y|max`

## Change

- `/etf/events` 現在支援五種 `type`：
  - `first_buy`：單一 ETF 對單一股票首次建倉
  - `buy_increase`：加碼
  - `first_sell`：第一次賣出，包含第一次減碼或第一次直接清倉
  - `sell_decrease`：減碼但仍持有
  - `sell_out`：清倉，股票在下一個快照中消失
- event item 新增：
  - `event_type`
  - `change_shares`
  - `buy_shares`
  - `sell_shares`
  - `delta_shares`
- `buy_shares` 只在買入事件為正數，賣出事件為 `0`。
- `sell_shares` 只在賣出事件為正數，買入事件為 `0`。
- `change_shares` 是有正負號的變動量，買入為正、賣出為負。
- `event_shares` 是事件當天 ETF 對該股票的持股數；`current_shares` 是目前最新持股數。
- 被動 ETF 若當日 fetch 成功但因 holdings 沒變而未新增 snapshot，series 會補 `is_carried_forward=true` 的水平延展點。

## Frontend Handling

- 事件頁可以用同一張 table 切換五種 `type`，不需要換 endpoint。
- 賣出事件請優先顯示 `sell_shares`，不要自己用 `change_shares` 取絕對值。
- 買入事件請優先顯示 `buy_shares`。
- 曲線圖遇到 `is_carried_forward=true` 時，視為後端為了畫水平線補上的顯示點，不要當作實際新增 snapshot。
- `0050` 這類 `etf_type=passive` 的 ETF，若 6/12 已抓取但成分股沒變，曲線仍會在 6/12 顯示水平延展。

## Notes

- `first_buy` 的判斷維持原規則：排除 ETF 本身第一天被匯入的初始持股，避免初始資料被誤判成新買入。
- 群益 `00982A` / `00992A` 的展示日期已改為與來源 API 日期一致，不再做 `-1 day`。

# 2026-06-12

## Subject

納入被動式 ETF `0050`，前端沿用既有 ETF / 個股觀測 API

## Owner

Backend

## Affected APIs

- `GET /etf/list`
- `GET /etf/holdings?etfCode=0050`
- `GET /etf/available-dates?etfCode=0050`
- `GET /etf/stocks/{stockCode}`
- `GET /etf/stocks/{stockCode}/series?range=1w|1m|6m|1y|max`
- `GET /etf/0050/{stockCode}`
- `GET /etf/0050/{stockCode}/series?range=1w|1m|6m|1y|max`
- `GET /etf/yuanta?sourceCode=0050&save=0`

## Change

- 新增元大來源 `yuanta`，第一檔為 `0050`。
- `0050` 設定為 `etf_type=passive`，不同於主動式 ETF。
- `0050` 每日仍會抓取，但只有成分股組合變更時才新增 holdings snapshot 與 Google Drive xlsx。
- `GET /etf/list` 會回傳：
  - `etf_type`
  - `snapshot_policy`
  - `backup_policy`
- `GET /etf/holdings` 與股票觀測 API 也會帶出 `etf_type` 等欄位。
- 被動式 ETF 的 series 可能包含 `is_carried_forward=true` 的點位，用於讓圖表在區間內沒有新 snapshot 時仍顯示水平線。

## Frontend Handling

- ETF list / selector 不要只假設都是主動式 ETF，可用 `etf_type` 顯示或篩選。
- 個股觀測頁查 `2330` 時，`0050` 會正常出現在 holders 內。
- 若畫線遇到 `is_carried_forward=true`，可視為後端補上的延展點，不需當作實際抓取日。
- 目前前端一般畫面不需要呼叫 `/etf/yuanta`；該 API 是後端手動測試/抓取 endpoint。
- 若要顯示可用日期，仍使用 `GET /etf/available-dates?etfCode=0050`，目前只會列出有保存 snapshot 的日期。

## Notes

- 0050 的持股曲線通常會是水平線，因為被動 ETF 不會每天新增 snapshot。
- 若未來加入更多大型被動 ETF，前端可沿用同一套 `etf_type=passive` 行為。

# 2026-06-11

## Subject

Stock display names now use canonical Taiwan stock master

## Owner

Backend

## Affected APIs

- `GET /etf/holdings?etfCode=XXXX`
- `GET /etf/holdings?stockCode=2327`
- `GET /etf/stocks`
- `GET /etf/stocks/{stockCode}`
- `GET /etf/stocks/{stockCode}/series`
- `GET /etf/events?type=first_buy`

## Change

- This historical note is superseded by the 2026-07-04 `stock` object rule.
- `stock.code` is the unique key for stock identity.
- `stock.name` is normalized by backend canonical stock master.
- Source-specific Excel/API names are no longer trusted as display names.
- If source and canonical names differ, backend may include `source_stock_name`.
- Backend may also include `stock.full_name`, `stock.market`, and `stock_aliases`.

## Frontend Handling

- Use `stock.code` for identity, routing, grouping, comparison, and de-duplication.
- Use `stock.name` for normal display.
- Do not group by ETF source stock names such as `國巨*` or `國巨股份`.
- `source_stock_name` is for debug/source trace only; do not use it as the product display name.
- Example: `2327` should display as `國巨` across `00403A`, `00981A`, `00982A`, and `00991A`.

# 2026-06-11

## Subject

Active ETF list adds `00991A`

## Owner

Backend

## Affected APIs

- `GET /etf/list`
- `GET /etf/available-dates?etfCode=00991A`
- `GET /etf/holdings?etfCode=00991A`
- `GET /etf/holdings?etfCode=00991A&date=YYYY-MM-DD`
- `GET /etf/stocks/{stockCode}/series?range=1w|1m|6m|1y|max`
- `GET /etf/fhtrust?sourceCode=ETF23&date=YYYY-MM-DD&save=0`

## Change

- Added Fhtrust active ETF `00991A`.
- Display name: `主動復華未來50`.
- Official name: `復華台灣未來50主動式ETF基金`.
- Source provider: `fhtrust`.
- Source code: `ETF23`.
- Listing/display start date: `2025-12-18`.
- Display date offset is `0`, same as ezmoney/unified dates.
- Historical data has been backfilled through latest available source date `2026-06-10`.

## Frontend Handling

- No new frontend wrapper is required for normal screens.
- ETF selectors and list pages should receive `00991A` from `GET /etf/list`.
- Date picker should use `GET /etf/available-dates?etfCode=00991A`.
- Current holdings can use `GET /etf/holdings?etfCode=00991A`.
- Stock detail pages should automatically include `00991A` in stock-level series when that stock is held.
- `/etf/fhtrust` is a backend manual test/fetch endpoint; frontend product pages normally do not need to call it.

# 2026-06-11

## Subject

First-buy page uses global ETF event list with current holdings

## Owner

Backend

## Affected APIs

- `GET /etf/events?type=first_buy`
- `GET /etf/events?type=first_buy&date=YYYY-MM-DD`
- `GET /etf/events?type=first_buy&stockCode=3363`
- `GET /etf/events?type=first_buy&etfCode=00992A`

## Change

- First-buy events no longer require selecting one ETF first.
- The backend now returns first-buy rows across all tracked ETFs.
- `etfCode`, `stockCode`, and `date` are optional filters.
- Pagination is supported by `page` and `pageSize`.
- Rows from each ETF's first tracked snapshot are excluded, so initial imports do not mark every holding as first-buy.
- `buy_shares` is the first-build shares on the event date.
- `event_shares` is the ETF holding shares on the event date.
- `current_shares` is the latest current holding shares for the same ETF-stock pair.
- `snapshot_date` is the first-buy event date.
- `current_snapshot_date` is the latest current holding date.
- `is_currently_held=false` means the ETF no longer holds this stock in the latest snapshot.

## Suggested Table Columns

- `stock.code` / `stock.name`: stock
- `etf_code` / `etf_name`: ETF
- `buy_shares`: first-build shares
- `current_shares`: latest current shares
- `snapshot_date`: first-buy event date
- `current_snapshot_date`: latest holding date

## Example

`GET /etf/events?type=first_buy&date=2026-06-08`

Response shape:

```json
{
  "type": "first_buy",
  "snapshot_date": "2026-06-08",
  "page": 1,
  "pageSize": 200,
  "totalCount": 1,
  "items": [
    {
      "stock": {
        "code": "3363",
        "name": "上詮",
        "full_name": null,
        "market": "listed",
        "industry_code": "27"
      },
      "etf_code": "00992A",
      "etf_name": "主動群益科技創新",
      "buy_shares": 300000,
      "event_shares": 300000,
      "current_shares": 300000,
      "snapshot_date": "2026-06-08",
      "current_snapshot_date": "2026-06-10",
      "event_holding_ratio": 0.54,
      "current_holding_ratio": 0.5,
      "is_currently_held": true
    }
  ]
}
```

## Frontend Handling

- The first-buy table should label `buy_shares` as first-build shares.
- The first-buy table should label `current_shares` as latest/current shares.
- If a row needs event-day inventory, use `event_shares`.
- If `is_currently_held=false`, show current shares as `0` or a sold-out state.

# 2026-06-10

## Subject

Active ETF list adds `00992A`

## Owner

Backend

## Affected APIs

- `GET /etf/list`
- `GET /etf/available-dates?etfCode=00992A`
- `GET /etf/holdings?etfCode=00992A`
- `GET /etf/holdings?etfCode=00992A&date=YYYY-MM-DD`
- `GET /etf/stocks/{stockCode}/series?range=1w|1m|6m|1y|max`

## Change

- Added Capital Fund ETF `00992A`.
- Display name: `主動群益科技創新`.
- Source provider: `capitalfund`.
- Source code: `500`.
- Listing/display start date: `2025-12-30`.
- Data source dates follow the same Capital Fund rule as `00982A`: source date is one day after display date.

## Frontend Handling

- No new API wrapper is required.
- ETF selectors and list pages should receive `00992A` from `GET /etf/list`.
- Date picker should use `GET /etf/available-dates?etfCode=00992A`.
- Current holdings can use `GET /etf/holdings?etfCode=00992A`.
- Stock detail pages should automatically include `00992A` in stock-level series when that stock is held.

# FRONTEND_GUIDE

本文件記錄前端協作脈絡、Dashboard 方向、ETF API 使用方式與已知注意事項。紀錄採新到舊排序。

## 2026-06-09

### 任務

新增 ETF 單一個股詳情與個股觀測功能，詳情頁一律使用獨立頁，方便後續擴充更多功能。

### 負責角色

Frontend

### 使用 API

- `GET /etf/{etfCode}/{stockCode}`
- `GET /etf/{etfCode}/{stockCode}/series?range=1w|1m|6m|1y|max`
- `GET /etf/stocks?page=1&pageSize=50&q={keyword}`
- `GET /etf/stocks/{stockCode}`
- `GET /etf/stocks/{stockCode}/series?range=1w|1m|6m|1y|max`

### 變更摘要

- [src/api/etf.js](/src/api/etf.js)
  - 新增 ETF 內單一個股詳情 API wrapper。
  - 新增個股觀測列表與個股觀測詳情 API wrapper。
- [src/router/SidebarData.js](/src/router/SidebarData.js)
  - ETF 新增「個股觀測」。
  - 修正側邊欄可見中文。
- [src/layouts/dashboard.vue](/src/layouts/dashboard.vue)
  - 修正 Dashboard layout 可見中文與 breadcrumb。
- [src/pages/dashboard/etf/holdings.vue](/src/pages/dashboard/etf/holdings.vue)
  - 目前持股列表最右側新增「詳情」按鈕。
  - 詳情連到 `/dashboard/etf/holdings/{etfCode}/{stockCode}`。
- [src/pages/dashboard/etf/holdings/[etfCode]/[stockCode].vue](/src/pages/dashboard/etf/holdings/[etfCode]/[stockCode].vue)
  - 新增「ETF 內單一個股詳情」獨立頁。
  - 摘要與曲線分段載入。
- [src/pages/dashboard/etf/stocks.vue](/src/pages/dashboard/etf/stocks.vue)
  - 新增「個股觀測」列表頁。
  - 支援搜尋、分頁、詳情入口。
- [src/pages/dashboard/etf/stocks/[stockCode].vue](/src/pages/dashboard/etf/stocks/[stockCode].vue)
  - 新增「個股觀測詳情」獨立頁。
  - 從個股角度查看所有ETF 對該股的持有與變化。
- [src/utils/etfDashboard.js](/src/utils/etfDashboard.js)
  - 新增 ETF Dashboard 共用 formatter 與資料 normalize helper。

### 注意事項

- 所有詳情都使用獨立頁，不使用 drawer 或 modal。
- 詳情頁採「摘要先載入、曲線後載入」策略，避免曲線 API 拖慢整頁。
- 曲線 range 固定先支援 `1w / 1m / 6m / 1y / max`。

## 2026-06-09

### 任務

修正 `/dashboard/etf/holdings` 的 30 日曲線顯示與全站漲跌色規則。

### 重點

- Sparkline 改為純線圖，不再填滿面積。
- 全站規則固定為漲紅、跌綠。
- ETF 持股曲線資料需依日期由舊到新排序後再繪製。

## 2026-06-08

### 任務

修正 Dashboard ETF 子頁資料流與顯示欄位，使頁面符合目前後端 ETF API 定義。

### 重點

- ETF 項目：每日進出、目前持股、首次買入。
- 我的項目：持股管理、股利記錄。
- ETF 頁面不要預設查今天，未指定日期時以最新 `snapshot_date` 為準。
- events 頁面使用後端新欄位：`previous_shares`、`current_shares`、`delta_shares`、`is_first_buy`、`is_buy_increase`、`is_sell_decrease`、`is_sell_out`。

## 2026-06-07

### 任務

依據 `docs/project.md` 與 `docs/mockup` 重新定義 Dashboard 方向。

### 設計方向

- Dashboard 採深色 CMS / market terminal 風格。
- 視覺重點是高密度資料表、低圓角、細邊框、暗色背景與 mint accent。
- Dashboard 應與原本手機版主流程抽離，避免影響既有 UI/UX。

## 2026-06-05

### 任務

建立 Dashboard layout、OpenAPI 文件頁與 Firebase / ETF 資料邊界。

### 重點

- Dashboard 登入沿用現有 Firebase 登入邏輯。
- API 文件來源以 `docs/openapi.json` 為準。
- 使用者持股與股利資料仍在 Firebase。
- ETF 相關資料逐步由後端 API 提供。
