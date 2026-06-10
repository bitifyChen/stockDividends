# Agent Role

這份文件供前端與後端工程師共用，用來描述本專案的工作邊界、協作原則與角色責任。

## 專案範圍

- 前端主專案位於 `D:\web-pvt\stockDividends`
- 後端主專案位於 `D:\web-pvt\stockDividendsPy`
- 前端技術棧以 `Vue 3 + Vite` 為主，並使用 `Firebase` 處理 Auth / Firestore 等資料
- 前端也會透過 API 串接外部資料來源，例如 Google Spreadsheet 與行情資料介面

## 共用原則

- 先理解現有架構，再動手修改
- 優先維持既有資料流、命名與分層方式
- 前後端介面變更時，要同步確認 request / response 格式
- 若修改會影響登入、權限、資料一致性或部署流程，需先確認影響範圍
- 盡量將變更切成小步，方便驗證與回復
- 任務完成後必須補文件：
  - 前端功能、API 規格與頁面串接，寫入 `FRONTEND_GUIDE.md`
  - 後端功能、部署變更與 API 實作，寫入 `BACKEND_LOG.md`
- `FRONTEND_GUIDE.md` 與 `BACKEND_LOG.md` 都要採用「新 > 舊」排序
- 若功能需要其他團隊配合，先寫對應 GUIDE，再補實作或交接細節

## 前端共用責任

- 維護頁面、元件、路由、狀態管理與 Firebase 相關串接
- 保持 Firebase Auth、Firestore、前端快取與畫面狀態一致
- 串接後端 API 時，負責在前端整理參數、錯誤處理與 UI 回饋

## 後端工程師角色

我在這個專案中的角色是後端工程師，主要負責 `D:\web-pvt\stockDividendsPy` 內的服務與資料處理邏輯。

### 我負責的事

- 設計與維護後端 API
- 處理商業邏輯、資料驗證、例外處理與回傳格式
- 管理資料來源整合，例如資料庫、第三方服務、排程或批次工作
- 配合前端 Firebase 使用方式，確保登入狀態、授權與資料存取流程一致
- 提供清楚且穩定的 API 合約，避免前端需要猜測欄位或流程

### 我在修改時的標準

- 不隨意改動前端已依賴的欄位名稱與資料結構
- 若需要調整 API，先確認前端是否要同步改版
- 重視可觀測性、錯誤訊息與資料正確性
- 優先避免把前端邏輯搬到後端以外的地方，除非是刻意的架構調整

## 協作提醒

- 這個前端專案目前是 Firebase 為主，不代表後端不存在，而是職責已拆分到另一個資料夾
- 如果看到前端程式碼直接碰 Firebase 或外部 API，應先判斷這是既有設計還是可以抽離的地方
- 若涉及跨專案修改，先確認前端 `D:\web-pvt\stockDividends` 與後端 `D:\web-pvt\stockDividendsPy` 的同步需求
- 任務完成後要補寫對應文件：
  - 前端相關功能與 API 規格，寫入 `FRONTEND_GUIDE.md`
  - 後端相關功能與部署變更，寫入 `BACKEND_LOG.md`
- `FRONTEND_GUIDE.md` 與 `BACKEND_LOG.md` 都要採用「新 > 舊」排序
- 若改動需要其他團隊配合，先寫 guide，再交代對應 API、欄位與行為變更

