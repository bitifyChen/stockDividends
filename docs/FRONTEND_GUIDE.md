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
