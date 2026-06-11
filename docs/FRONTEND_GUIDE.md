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
  - 主動 ETF 新增「個股觀測」。
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
  - 從個股角度查看所有主動 ETF 對該股的持有與變化。
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
修正 Dashboard 主動 ETF 子頁資料流與顯示欄位，使頁面符合目前後端 ETF API 定義。

### 重點
- 主動 ETF 項目：每日進出、目前持股、首次買入。
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
