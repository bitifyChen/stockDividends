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

- `stock_code` is the unique key for stock identity.
- `stock_name` is now normalized by backend canonical stock master.
- Source-specific Excel/API names are no longer trusted as display names.
- If source and canonical names differ, backend may include `source_stock_name`.
- Backend may also include `stock_full_name`, `stock_market`, and `stock_aliases`.

## Frontend Handling

- Use `stock_code` for identity, routing, grouping, comparison, and de-duplication.
- Use `stock_name` for normal display.
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

- `stock_code` / `stock_name`: stock
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
      "stock_code": "3363",
      "stock_name": "上詮",
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
