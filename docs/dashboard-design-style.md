# Dashboard Design Style

## 2026-06-07

此文件記錄 `docs/mockup` 參考圖所代表的新 dashboard 設計方向，後續 `/dashboard` 相關頁面都應優先遵守此風格。

## 整體方向

- Dashboard 是桌機優先的後台資料工作區，不是前台展示頁
- 視覺應接近深色金融 CMS / market terminal
- 重點是資料掃描、表格比較、狀態判讀與重複操作
- 避免大面積白底、行銷式 hero、過多卡片堆疊與過度裝飾
- 專案規劃來源以 `docs/project.md` 為準，mockup 只定義視覺方向

## Layout

- 左側固定 sidebar，桌機寬度約 `240px - 260px`
- 右側為主內容區，頂部有固定 topbar
- 手機與窄版改為抽屜式 sidebar
- 主內容區要支援滿版 dashboard，不受主站 `#app` 版心限制
- Dashboard 內可分為既有個人資料區與新增 ETF 工作台區，但視覺風格維持一致

## Product Direction

- 既有個人持股與股利追蹤仍使用 Firebase 使用者資料流
- 主動式 ETF 觀測是新增主軸，資料分析與歷史快照優先放在 Supabase / Postgres
- ETF 前端第一階段以可讀、可比對、可切換 ETF 為主，不急著做複雜模型
- 後端已可查回單日 `00403A` / `00981A` holdings 與 events，前端可作為正式資料表來源
- 真正的每日增減、出清與多 ETF 事件仍需要第二個交易日以上資料才能完整呈現

## 色彩

- 背景主色：接近黑灰，例如 `#101113`
- Sidebar：略亮或略深的黑灰，例如 `#151619`
- Topbar：`#181a1e`
- Panel / card：`#1b1d21`
- Table header：`#202328`
- Border：低對比灰線，例如 `#2f3339`
- 主要文字：`#f7fafc` / `#d4d8dd`
- 次要文字：`#7c858f` / `#94a3b8`
- Accent：薄荷綠 / 青綠，例如 `#9ff7ef`、`#10bfae`
- 下跌或負值：橘紅，例如 `#f97352`

## Component Style

- 圓角保持低調，常用 `4px - 6px`
- 面板以薄邊框和深色底區分，不使用厚陰影
- 表格要密集，欄位可多，支援橫向捲動
- Button / tab / select 使用深色底、薄邊框、低圓角
- Active 狀態用灰底或薄荷色提示，不用高飽和大面積色塊
- 優先使用 lucide icon，不自行畫 icon

## Dashboard Navigation

- Sidebar 需要分組為：
  - `主動 ETF`
  - `我的`
- `主動 ETF` 底下固定包含：
  - `每日進出`
  - `目前持股`
  - `首次買入`
- `我的` 底下固定包含登入後個人資料功能：
  - `持股管理`
  - `股利記錄`
- Nav item 高度緊湊，icon + text 即可
- Topbar 應保留搜尋框與小型工具 icon 位置
- 使用者頭像區放在 topbar 或 sidebar 下方皆可，但不要干擾資料閱讀

## ETF Page Direction

- ETF 模組入口應直接是資料工作台
- 流程固定為：支援 ETF 清單 -> 選定 ETF -> 查看持股比例與每日進出
- 不要把 ETF 首頁做成中繼導覽卡片
- 資料表可以同時顯示最新持股與每日進出，讓使用者在同一畫面比較
- ETF selector 以 `GET /etf/list` 為唯一優先來源
- ETF 子功能頁面：
  - `/dashboard/etf/events`：每日進出
  - `/dashboard/etf/holdings`：目前持股
  - `/dashboard/etf/first-buy`：首次買入
- 目前已設定 ETF：
  - `00403A`：主動統一升級50，來源 `ezmoney`，source code `63YTW`
  - `00981A`：主動統一台股增長，來源 `ezmoney`，source code `49YTW`
- 空資料狀態仍需保留，因為指定日期或未來 ETF 可能尚無 snapshot / movement records

## API / Data Boundary

- 前端不直接連 Supabase，也不能放 service role key
- 一般展示資料由後端 API 提供
- OpenAPI 文件來源為 `docs/openapi.json`
- 後端新增 API 或欄位時，必須同步更新 OpenAPI 與對應 guide
