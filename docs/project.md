# StockDividends 專案規劃

## 2026-06-07 重新梳理

本專案目前分成兩個主要部分：

- 前台：`D:\web-pvt\stockDividends`
- 微後端：`D:\web-pvt\stockDividendsPy`

前台既有核心仍是個人持股、股利與 Firebase 使用者資料。新增方向是把「主動式 ETF 觀測」做成獨立工作台，資料分析與歷史快照優先放到 Supabase / Postgres。

## 產品目標

### 1. 個人持股與股利追蹤

既有功能繼續維持：

- 使用 Firebase 保存使用者與個人持股資料
- 顯示個人持股、股利、歷史紀錄與設定
- 後端仍保留既有股價與股利更新 API

這一塊不是本次 Supabase 遷移的主目標。

### 2. 主動式 ETF 工作台

新增主軸是「主動式 ETF 每日持股與進出觀測」。

目標畫面可接近參考圖的深色資訊工作台風格：

- 左側固定導航
- 上方搜尋與狀態列
- 主畫面以資料表為核心
- 支援 ETF 切換
- 顯示最新資料更新時間
- 以股票為列，呈現不同時間區間或不同 ETF 的持股變化
- 保留高資訊密度，避免做成行銷頁或卡片牆

第一階段以前端可讀、可比對資料為優先，不急著做複雜模型。

### 3. ETF 可觀測清單

前端需要知道目前系統已設定哪些 ETF 可以觀測。

主要 API：

- `GET /etf/list`

目前已設定：

- `00403A`：主動統一升級50，來源 `ezmoney`，source code `63YTW`
- `00981A`：主動統一台股增長，來源 `ezmoney`，source code `49YTW`

前端 ETF selector 應以 `/etf/list` 為資料來源。

### 3-1. 新來源擴充原則

不同公司、不同官網、不同 Excel 結構的 ETF，原則上都要獨立處理，不要混用同一個 parser。

建議規則：

- 每家公司一個 `source_provider`
- 每個 provider 對應自己的 crawler / parser module
- 每個 provider 可以有自己的檔名規則
- 最後仍輸出成同一套標準化 snapshot / holdings / events 格式

以群益 `00982A` 為例：

- `source_provider = capitalfund`
- `source_code = 399`
- `parser_key = capitalfund_portfolio_xlsx`
- Google Drive 備份檔名不要沿用原始檔名 `00982A.xlsx`
- 建議改成：
  - `ETF_00982A_capitalfund_2026-06-08.xlsx`
  - 若同日可能重抓，可再加時間戳

這樣做可以避免：

- 不同公司資料結構互相污染
- 檔名重複覆蓋
- crawler / parser 互相耦合過深
- 後續維護時難以定位來源

### 4. ETF 持股與每日進出

前端需要支援以下查詢：

- 查某 ETF 最新持股
- 查某 ETF 指定日期持股
- 查某 ETF 某日相對前一筆快照的進出變化
- 查某股票目前被哪些主動式 ETF 持有
- 查某股票是否出現首次買入、首次賣出、多家 ETF 同時買入或賣出等事件

主要 API：

- `GET /etf/holdings?etfCode=00403A`
- `GET /etf/holdings?etfCode=00403A&date=YYYY-MM-DD`
- `GET /etf/holdings?stockCode=2330`
- `GET /etf/events?mode=etf&etfCode=00403A&date=YYYY-MM-DD`
- `GET /etf/events?mode=stock&stockCode=2330&date=YYYY-MM-DD`

### 5. API 文件頁

前端已規劃 API 文件畫面，用於顯示目前後端可打的 API、用途、參數與回應。

文件來源：

- `docs/openapi.json`

頁面草稿：

- `src/pages/dashboard/api.vue`

後續若後端新增 API，必須同步更新 OpenAPI 文件，避免前後端認知分歧。

## 目前前端規劃符合度

目前方向大致符合網站目標。

已符合：

- 已開始建立 dashboard 型態的前台結構
- 已新增 ETF API client：`src/api/etf.js`
- 已有 ETF 工作台草稿頁：
  - `src/pages/dashboard/etf/index.vue`
  - `src/pages/dashboard/etf/holdings.vue`
  - `src/pages/dashboard/etf/events.vue`
- 已有 API 文件頁草稿：`src/pages/dashboard/api.vue`

需要調整：

- 目前多個前端文件與部分畫面文字曾出現 UTF-8 亂碼，後續文件與畫面文案需重新整理
- ETF 工作台可以朝參考圖的深色、高資訊密度資料表方向收斂
- 前端目前可先用 `/etf/list` 對選單與畫面骨架；真正持股資料要等後端 ingestion 完整驗證後再接正式資料

## 目前已執行的後端規劃

### 已建立的 Supabase 資料域

目前已把 ETF 分析資料從 Firebase 切出，獨立放到 Supabase。

已建立或使用中的資料表：

- `etf_source_configs`
- `active_etf_master`
- `active_etf_daily_snapshots`
- `etf_holding_snapshots`
- `etf_ingestion_runs`

已建立或使用中的查詢 views：

- `v_active_etf_current`
- `v_etf_latest_holdings`
- `v_etf_current_totals`
- `v_stock_current_etf_holdings`
- `v_etf_holding_changes`
- `v_etf_daily_event_summary`
- `v_stock_daily_event_summary`

### `etf_source_configs`

用途是管理「哪些 ETF 可以爬、怎麼爬、何時更新」。

目前欄位方向：

- ETF 代碼與名稱
- 來源 provider，例如 `ezmoney`
- 來源公司，例如統一投信
- 來源站內代碼，例如 `63YTW`
- crawler 類型，例如 `xlsx`
- parser key，例如 `ezmoney_asset_xlsx`
- 預設揭露時間，例如 `16:30`
- 時區，例如 `Asia/Taipei`
- 是否啟用
- 是否允許批次更新
- 最近執行狀態
- 最近成功時間
- 最近錯誤訊息
- 下一次預計執行時間

這張表的方向是合理的，因為未來不同 ETF 公司可能有不同官網、不同 XLSX / HTML / API 格式。

### `etf_ingestion_runs`

用途是保存每次爬蟲或匯入執行紀錄。

目前設計方向：

- 紀錄執行類型
- 紀錄來源 provider / source code / ETF code
- 紀錄 run date / snapshot date
- 紀錄 running / success / failed
- 紀錄 row count 與錯誤訊息

這張表應該保留，因為之後排程、重試、除錯都需要歷史紀錄。

### `active_etf_master` 與 snapshots

目前後端設計希望形成：

- `active_etf_master`：ETF 主檔
- `active_etf_daily_snapshots`：每日 active ETF 快照
- `etf_holding_snapshots`：每日 ETF 成分股持股快照

方向合理，但目前 FK 與 upsert 流程尚未完整驗證完成。

## 目前後端實作狀態

已完成並上線：

- `GET /etf/health`
- `GET /etf/list`
- `GET /etf/source-configs`
- `GET /etf/active-list`
- `GET /etf/holdings`
- `GET /etf/events`
- `GET /etf/fetch-all`
- `GET /etf/ezmoney`
- `POST /etf/ezmoney`
- Supabase REST client
- ezmoney XLSX 下載流程
- `00403A` / `00981A` source config
- XLSX parser 已確認可在本機解析兩支 ETF，日期為 `2026-06-05`，各 50 筆

已完成端到端驗證：

- `/etf/fetch-all?force=1&save=1` 已成功寫入兩支 ETF
- `00403A` 已寫入 `2026-06-05` 持股 50 筆
- `00981A` 已寫入 `2026-06-05` 持股 50 筆
- `active_etf_master` 會在 daily snapshot 前先 upsert，已解除 FK 錯誤
- `/etf/list` 可回傳 2 筆 ETF config，且兩筆 `last_status` 均為 `success`
- `/etf/active-list` 可回傳 2 筆 active ETF
- `/etf/holdings?etfCode=00403A` 可回傳 50 筆
- `/etf/holdings?etfCode=00981A` 可回傳 50 筆
- `/etf/holdings?stockCode=2330` 可回傳 2 筆，代表台積電同時被兩支 ETF 持有
- `/etf/events?mode=etf&etfCode=00403A&date=2026-06-05` 可回傳 50 筆
- `/etf/events?mode=etf&etfCode=00981A&date=2026-06-05` 可回傳 50 筆
- `/etf/events?mode=stock&stockCode=2330&date=2026-06-05` 可回傳 2 筆

仍需後續驗證：

- 目前只有單日快照，真正的每日進出需要至少第二個交易日資料
- `v_etf_holding_changes` 雖可回傳資料，但增加、減少、出清等狀態要等多日快照後才能完整驗證
- `v_stock_daily_event_summary` 的首次買入、首次賣出、多家同步事件也需要多日與更多 ETF 資料後再確認

## 後端設計需重新審視的點

在繼續推送前，需要先重新整理資料庫設計與驗證流程。

### 1. 不應再修一個推一個

後端資料管線應改成以下節奏：

1. 本地或測試資料庫確認 schema
2. 寫清楚資料表責任與 FK 關係
3. 用同一組測試資料驗證完整 ingestion
4. 驗證查詢 views 與前端 API
5. 更新 OpenAPI / BACKEND_LOG / FRONTEND_GUIDE
6. 最後才 commit / push / deploy

### 2. Schema 要先定義資料真相

建議明確分層：

- `etf_source_configs`：爬蟲設定，不是市場資料
- `active_etf_master`：ETF 主檔
- `active_etf_daily_snapshots`：某日有哪些 ETF 被列入 active list
- `etf_holding_snapshots`：某日某 ETF 持有某股票多少
- `etf_ingestion_runs`：每次抓取與匯入紀錄
- views：只做查詢整理，不做資料真相來源

### 3. 寫入流程要一次設計完整

ETF holdings ingestion 應採固定流程：

1. 讀取 `etf_source_configs`
2. 下載來源檔案
3. 解析 snapshot date 與 holdings rows
4. upsert `active_etf_master`
5. upsert `active_etf_daily_snapshots`
6. upsert `etf_holding_snapshots`
7. 寫入 `etf_ingestion_runs`
8. 更新 `etf_source_configs.last_status`
9. 查詢 API 驗證資料可讀

目前程式接近這個方向，但還沒有完整端到端成功。

### 4. RLS 與權限

目前後端使用 `SUPABASE_SERVICE_ROLE_KEY`，前端不直接連 Supabase。

因此短期可由後端保護資料存取；但 Supabase public schema 仍應補 RLS 設計，尤其是：

- `etf_source_configs`
- `active_etf_master`
- `active_etf_daily_snapshots`
- `etf_holding_snapshots`
- `etf_ingestion_runs`

原則：

- 前端不要放 service role key
- 一般展示資料由後端 API 提供
- 若未來開放前端直連 Supabase，必須先補 RLS policy

## 接下來建議順序

### 第一階段：後端資料管線收斂

- 重新審視 Supabase schema
- 整理 FK、unique constraint、upsert rule
- 用 `00403A`、`00981A` 驗證完整 ingestion
- 確認兩支 ETF 各 50 筆持股可由 `/etf/holdings` 查回
- 確認 `/etf/list` 狀態欄位會更新

### 第二階段：前端 ETF 工作台

- 以 `/etf/list` 建 ETF selector
- 以 `/etf/holdings?etfCode=00403A` 顯示目前持股
- 以 `/etf/events?mode=etf&etfCode=00403A` 顯示每日進出
- 視覺方向對齊深色工作台與高密度資料表

### 第三階段：多日與多 ETF 事件分析

- 累積至少兩個交易日快照
- 驗證新增、增加、減少、出清
- 驗證股票層級事件：
  - 首次買入
  - 多家首次買入
  - 首次賣出
  - 多家首次賣出
  - 被賣空或持股歸零

### 第四階段：持股販售時間點分析

此功能依賴更完整的歷史資料、K 線與個人持股資料。

在 ETF pipeline 穩定前，不建議先做模型。

未來可以再拆成：

- K 線資料表
- 個人持股交易紀錄正規化
- 技術指標與風險指標
- 回測結果
- 離場訊號

## 目前結論

目前網站方向符合原始目標，且第一批 ETF 後端資料已可支撐前端先做持股畫面。

最務實的判斷：

- 前端可以使用 `00403A` / `00981A` 的單日持股資料開始對畫面
- 後端後續仍需維持「先完整驗證，再一次推送」的流程
- 下一個關鍵驗證點是第二個交易日快照，確認每日進出與首次買賣事件
