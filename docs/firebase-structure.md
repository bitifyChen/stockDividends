# Firebase / API 結構整理

這份文件整理目前專案中和 Firebase、外部 API 相關的資料結構與資料流，供後續優化用。

## 1. 目前使用的資料來源

### Firebase

目前程式碼實際使用的是：

- Firebase Authentication
- Cloud Firestore

`firebaseConfig` 裡有 `databaseURL`，但目前程式碼沒有看到 Realtime Database 的讀寫。

### 外部 API

- Google Apps Script API
  - 用在股票價格查詢 / 回寫
- TWSE 外部查詢 API
  - `getExternalPrice()` 有保留，但目前主要流程看起來不是核心依賴

---

## 2. Firestore 結構

### `users`

路徑：

- `users/{uid}`

用途：

- 儲存登入使用者的基本資訊
- 路由守衛會透過 `checkUser()` 驗證登入狀態，並把 `user.uid` 存進 cookie `token`

目前程式中可見的使用方式：

- `src/router/index.js`
- `src/stores/useUserInfo.js`

推測 / 實際使用的欄位：

- `displayName`
- `name`
- `uid`
- Firebase Auth user object 的其他欄位

備註：

- `useUserInfoStore.userInfo` 直接存整包 user object
- `userName` getter 目前讀的是 `displayName`
- 部分頁面讀的是 `name`

這表示使用者欄位命名目前有不一致的風險。

---

### `users/{uid}/stock`

路徑：

- `users/{uid}/stock/{docId}`

用途：

- 儲存使用者的持股交易紀錄
- 一筆文件代表一段買進 / 賣出狀態的持股紀錄

目前 CRUD：

- `postStock()`：新增
- `getStock()`：讀取
- `patchStock()`：更新
- `deleteStock()`：刪除

目前文件欄位依程式使用情況整理如下：

- `stockId`
- `buyDate`
- `buyPrice`
- `buyNum`
- `sellDate` `optional`
- `sellPrice` `optional`
- `sellNum` `optional`，主要出現在表單暫存與賣出流程
- `createDate`：`serverTimestamp()`

賣出流程目前的資料行為：

- 先把原紀錄 patch 成賣出狀態
- 若是部分賣出，會再新增一筆剩餘持股紀錄
- 若全數賣出，則只保留原紀錄的賣出狀態

---

### `stocks`

路徑：

- `stocks/{stockId}`

用途：

- 股票主資料索引 / 佔位集合
- `postStock()` 時會先寫入一筆空文件，確保該 `stockId` 存在

目前使用方式：

- `setDoc(doc(db, 'stocks', params.stockId), {}, { merge: true })`

這個集合看起來是作為股票代碼主檔的入口。

---

### `stocks/{stockId}/dividend`

路徑：

- `stocks/{stockId}/dividend/{docId}`

用途：

- 儲存單一股票的股利歷史資料

目前讀取方式：

- `getStockDividend(stockId)`

目前文件欄位依程式使用情況整理如下：

- `CashExDividendTradingDate`
- `CashDividendPaymentDate`
- `CashEarningsDistribution`

這三個欄位是後續股利統計的核心欄位。

---

## 3. Google Apps Script API 結構

### `price`

檔案：

- `src/api/price.js`
- `src/api/useSheetApi.js`

目前行為：

- `getPrice({ stockId })`
  - 透過 Google Apps Script 取得價格資料
- `postPrice(stockId)`
  - 新增 / 回寫股票代碼到表單或試算表流程

請注意：

- `useSheetApi` 會自動把 cookie 裡的 `token` 一起送出
- `token` 來源是 Firebase Auth 的 `uid`

因此這條 API 並不是單純的公開查價，而是和登入狀態綁在一起。

---

## 4. 外部查價 API

### TWSE

檔案：

- `src/api/price.js`

函式：

- `getExternalPrice(id)`

URL 格式：

- `https://www.twse.com.tw/...getStockInfo.jsp?json=1&delay=0&ex_ch=tse_${id}.tw`

目前看起來：

- 有保留
- 但主要資料流程仍以 Firebase + Google Apps Script 為主

---

## 5. 前端資料流

### 首頁 / 持股 / 歷史頁

主要流程在 `useStockStore.getData()`：

1. 讀取 `users/{uid}/stock`
2. 依 `stockId` 分組
3. 對每個 `stockId` 讀取價格資料
4. 對每個 `stockId` 讀取股利資料
5. 產生衍生資料：
   - `stockList`
   - `dividendList`
   - `totalCost`

### 衍生計算

`src/composables/piniaStock.js` 會組出：

- 每檔股票的持股明細
- 未賣出持股數量
- 成本
- 現價
- 損益
- 股利收入

首頁與歷史頁再以這些 derived data 做統計與篩選。

---

## 6. 目前結構的幾個明顯耦合點

1. `token` cookie = Firebase `uid`
   - 所有 stock 相關資料都依賴這個 cookie
2. 使用者資訊欄位命名不一致
   - `displayName`、`name` 都有被使用
3. `users/{uid}/stock` 是交易紀錄集合
   - 目前看起來是以事件紀錄方式儲存，不是純持倉快照
4. `stocks/{stockId}` 同時扮演主檔和衍生資料入口
5. 價格與股利資料是逐檔抓取
   - 股票數量變多時，會有多次 API / Firestore 讀取

---

## 7. 後續優化建議方向

### 資料結構

- 統一使用者資料欄位命名
- 明確定義 stock transaction schema
- 將股票主檔、價格、股利、交易紀錄分層

### 效能

- 減少每次進頁都發生的 N+1 抓取
- 對價格 / 股利做快取或批次更新
- 避免在 store getter 裡做過重計算

### 維運

- 把 Firestore 路徑與欄位抽成常數或 schema 文件
- 將 API 請求與資料轉換分開
- 補上錯誤處理與空資料 fallback

---

## 8. 目前可優先整理的檔案

- `src/firebase/stock.js`
- `src/api/price.js`
- `src/api/useSheetApi.js`
- `src/composables/piniaStock.js`
- `src/stores/useStock.js`
- `src/router/index.js`

