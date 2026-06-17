# ECPay 綠界金流串接計畫

**狀態：✅ 完成** — 所有 45 個測試通過（含 13 個 ECPay 整合測試）
**歸檔路徑**：`docs/plans/archive/2026-05-26-ecpay-integration.md`

## Context

花卉電商目前的「付款」是本地模擬（PATCH `/api/orders/:id/pay` 直接改狀態）。本次要串接綠界 ECPay AIO 金流，讓使用者真正跳轉綠界測試付款頁完成信用卡付款。

**關鍵限制**：專案純本地運行，綠界無法 POST 到 `localhost`（ReturnURL server notify 無效）。  
**解決方案**：付款後，消費者瀏覽器被綠界導回本地頁面（ClientBackURL），由本地前端主動呼叫 `QueryTradeInfo/V5` API 驗證付款結果。

---

## 技術選擇

- **金流方案**：AIO（全方位金流）— CMV-SHA256 加密，最簡單，30 分鐘可跑通
- **付款方式**：`ChoosePayment=Credit`（信用卡，測試最方便）
- **環境**：測試環境 `payment-stage.ecpay.com.tw`
- **HTTP Client**：Node.js 原生 `fetch`（Node 18+，無需新增套件）
- **測試帳號**（公開，只用於測試）：MerchantID `3002607` / HashKey `pwFHCqoQZGmho4w6` / HashIV `EkRm7iFT261dpevs`

---

## 付款流程

```
1. 使用者填結帳表單 → POST /api/orders → 建立訂單（現有流程）
2. 導向 /orders/:id 訂單詳情頁
3. 點擊「前往綠界付款」→ 前端呼叫 POST /api/orders/:id/ecpay-checkout
4. 後端：產生 MerchantTradeNo、計算 CheckMacValue、回傳 { action, params }
5. 前端：動態建立 form 並 submit → 瀏覽器導向綠界付款頁
6. 消費者輸入測試信用卡 → 完成付款
7. 綠界以 ClientBackURL 導回：/orders/:id?verify=ecpay
8. 前端偵測 ?verify=ecpay → 呼叫 POST /api/orders/:id/verify-ecpay
9. 後端：呼叫 QueryTradeInfo/V5 API → 依 TradeStatus 更新訂單狀態
10. 前端：顯示付款成功/失敗
```

---

## 環境變數（新增至 .env）

```
ECPAY_MERCHANT_ID=3002607
ECPAY_HASH_KEY=pwFHCqoQZGmho4w6
ECPAY_HASH_IV=EkRm7iFT261dpevs
ECPAY_IS_STAGING=true
```

---

## 資料庫修改

**`src/database.js`** — orders 表新增一欄：

```sql
ecpay_merchant_trade_no TEXT  -- 啟動綠界付款時寫入，格式：F + Unix秒 + 8位hex，max 19 chars
```

加在 `status` 欄位之後、`created_at` 之前。  
⚠️ 修改後需刪除 `database.sqlite` 重啟讓 DB 重建。

---

## 新增/修改檔案

### 1. 新增 `src/services/ecpayService.js`

核心功能：

```javascript
// A. CheckMacValue 計算（ecpayUrlEncode: encodeURIComponent → %20→+ → ~→%7e → 轉小寫 → .NET字元還原）
function generateCheckMacValue(params, hashKey, hashIV)

// B. 驗證回傳的 CheckMacValue（timing-safe compare）
function verifyCheckMacValue(params, hashKey, hashIV)

// C. 產生 MerchantTradeDate（UTC+8，格式：yyyy/MM/dd HH:mm:ss）
function getMerchantTradeDate()

// D. 產生唯一 MerchantTradeNo（'F' + Unix秒10碼 + 8位hex = 19碼，純英數）
function generateMerchantTradeNo()

// E. 建立 ECPay AIO 付款參數（含 CheckMacValue）
function buildPaymentParams({ order, orderItems, baseUrl })
// 回傳 { action: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5', params: {...} }

// F. 查詢 ECPay 交易狀態（呼叫 QueryTradeInfo/V5）
async function queryTradeInfo(merchantTradeNo)
// 回傳解析後的物件，包含 TradeStatus（'0'=未付款, '1'=已付款）
// 需驗證回傳的 CheckMacValue
```

**buildPaymentParams 關鍵參數：**
- `ReturnURL`: `http://localhost:3001/api/ecpay/notify`（必填但本地不可達，僅做佔位）
- `ClientBackURL`: `${baseUrl}/orders/${order.id}?verify=ecpay`（付款後導回）
- `ItemName`: 從 orderItems 拼接，每項 `${name} x${qty}`，用 `#` 分隔，截至 200 字元
- `TradeDesc`: `花卉電商訂單`（避免特殊字元，不要用 ecpayUrlEncode）
- `EncryptType`: `1`

**queryTradeInfo 關鍵實作：**
- TimeStamp 必須是 Unix 秒（`Math.floor(Date.now() / 1000).toString()`）
- 請求：POST form-urlencoded 到 `https://payment-stage.ecpay.com.tw/Cashier/QueryTradeInfo/V5`
- 回應：URL-encoded 字串（用 `new URLSearchParams(text)` 解析）
- 必須驗證回傳的 CheckMacValue（timing-safe compare）

### 2. 修改 `src/routes/orderRoutes.js`

新增兩個端點：

**`POST /api/orders/:id/ecpay-checkout`**
- Auth: JWT
- 驗證：訂單存在、屬於目前使用者、status = `'pending'`
- 每次呼叫都重新產生 `ecpay_merchant_trade_no`（允許付款失敗後重試）
- DB: `UPDATE orders SET ecpay_merchant_trade_no = ? WHERE id = ?`
- 查 order_items：`SELECT * FROM order_items WHERE order_id = ?`
- 呼叫 `ecpayService.buildPaymentParams()`
- 回傳：`{ data: { action, params }, error: null, message: '...' }`

**`POST /api/orders/:id/verify-ecpay`**
- Auth: JWT
- 驗證：訂單存在、屬於目前使用者、`ecpay_merchant_trade_no` 不為 null
- 呼叫 `ecpayService.queryTradeInfo(merchantTradeNo)`
- TradeStatus 映射：
  - `'1'` → UPDATE orders SET status = 'paid'
  - `'0'` → 維持 pending（尚未付款）
  - 其他 → UPDATE orders SET status = 'failed'
- 回傳：`{ data: { order, tradeStatus }, error: null, message: '...' }`

### 3. 新增 `src/routes/ecpayRoutes.js`

**`POST /api/ecpay/notify`**（ReturnURL handler，本地不會被呼叫，實作以備未來使用）
- 接收 urlencoded body
- 驗證 CheckMacValue（timing-safe）
- 若 `RtnCode === '1'` → UPDATE orders SET status = 'paid' WHERE ecpay_merchant_trade_no = MerchantTradeNo
- 必須回傳純文字 `1|OK`（HTTP 200）

### 4. 修改 `app.js`

```javascript
const ecpayRoutes = require('./src/routes/ecpayRoutes');
app.use('/api/ecpay', ecpayRoutes);
```

### 5. 修改 `views/pages/order-detail.ejs`

- 移除「付款成功」/「付款失敗」模擬按鈕
- 新增「前往綠界付款」按鈕（status = pending 時顯示）：
  ```html
  <button id="ecpay-btn">前往綠界付款（信用卡）</button>
  ```
- 新增付款驗證狀態提示區：
  ```html
  <div id="verify-status" style="display:none">正在確認付款結果...</div>
  ```

### 6. 修改 `public/js/pages/order-detail.js`

移除 `handlePaySuccess` / `handlePayFail`，新增：

```javascript
// 頁面載入時：偵測 ?verify=ecpay → 自動呼叫驗證
async function autoVerifyIfNeeded() {
  if (!new URLSearchParams(location.search).has('verify')) return;
  // 顯示 loading → 呼叫 POST /api/orders/:id/verify-ecpay
  // 成功後清掉 URL param（history.replaceState）並重新渲染訂單狀態
}

// 點擊「前往綠界付款」按鈕
async function handleEcpayPayment() {
  // 呼叫 POST /api/orders/:id/ecpay-checkout
  // 取得 { action, params }
  // 動態建立 <form method="POST" action="..."> 並 append 所有 hidden inputs
  // form.submit()  ← 瀏覽器導向綠界付款頁
}
```

---

## 測試信用卡（測試環境）

| 資訊 | 值 |
|------|---|
| 卡號 | 4311-9522-2222-2222 |
| 有效期 | 任意未來日期 |
| CVV | 222 |
| 3D 驗證碼 | 1234 |

---

## 驗證步驟（E2E）

1. 刪除 `database.sqlite`，`npm run dev:server` 重啟（讓 DB 帶新欄位重建）
2. 登入 → 加商品到購物車 → 進結帳頁 → 送出訂單 → 進入訂單詳情頁
3. 點擊「前往綠界付款」→ 確認瀏覽器導向 `payment-stage.ecpay.com.tw`
4. 輸入測試信用卡 → 3DS 驗證碼 `1234` → 付款
5. 確認瀏覽器導回 `http://localhost:3001/orders/:id?verify=ecpay`
6. 確認頁面顯示「正在確認付款結果...」→ 接著顯示「已付款」badge
7. 後端 log 確認 QueryTradeInfo 回傳 `TradeStatus=1`
8. DB 確認 orders.status = 'paid', ecpay_merchant_trade_no 有值

---

## 注意事項

- `ecpayUrlEncode` 用於 CheckMacValue 計算，**不可**用 `aesUrlEncode`（兩者 URL encode 邏輯不同）
- `RtnCode` 和 `TradeStatus` 都是字串型別（Form POST 傳來的），需用 `=== '1'` 比較
- CheckMacValue 驗證必須用 `crypto.timingSafeEqual`，禁止 `===`
- `MerchantTradeDate` 必須是 UTC+8 時區
- `ItemName` 超過 400 字元會被截斷導致掉單，安全上限 200 字元
- `MerchantTradeNo` 永久唯一，每次付款嘗試都重新產生新的
- 不要在程式碼中硬編碼 HashKey/HashIV，從 `process.env` 讀取

---

## API 整合測試計畫（新增）

### 新增 `tests/ecpay.test.js`（測試序列第 7 個）

**修改 `vitest.config.js`**：在 `sequence.files` 陣列末尾加入 `'tests/ecpay.test.js'`

#### 測試策略

| 端點 | 是否需要 mock | 原因 |
|------|:---:|------|
| `POST /api/orders/:id/ecpay-checkout` | 否 | 純本地計算，不呼叫外部 API |
| `POST /api/orders/:id/verify-ecpay` | **是** | 呼叫真實 ECPay QueryTradeInfo，需 `vi.spyOn` mock |
| `POST /api/ecpay/order-result` | 否 | 只做 DB 查詢 + redirect |

#### Mock 方式

`vi.spyOn` on CommonJS module（利用 Node.js module cache 共享同一物件）：

```javascript
const ecpayService = require('../src/services/ecpayService');

// 在需要 mock 的 test 之前：
vi.spyOn(ecpayService, 'queryTradeInfo').mockResolvedValue({ TradeStatus: '1' });

// afterEach：
vi.restoreAllMocks();
```

#### 測試案例

**`ecpay-checkout` 群組**（共用一個 `beforeAll` 建立的訂單）：
- ✅ 成功：回傳含 CheckMacValue 的 ECPay 參數（`/^[0-9A-F]{64}$/`）
- ✅ 成功：`params.action` 指向 `payment-stage.ecpay.com.tw`
- ✅ 成功：`params.OrderResultURL` 包含 `/api/ecpay/order-result`
- ❌ 404：訂單不存在
- ❌ 401：未登入

**`verify-ecpay` 群組**（每個 it 需要獨立的 `pending` 訂單，在 `beforeEach` 建立）：
- ✅ `TradeStatus='1'` → 訂單狀態變 `paid`，`tradeStatus` 回傳 `'1'`
- ✅ `TradeStatus='0'` → 維持 `pending`，`message` 為 `'尚未付款'`
- ✅ 其他 TradeStatus（如 `'10200047'`）→ 訂單狀態變 `failed`
- ❌ 400：`ecpay_merchant_trade_no` 為 null（未發起付款）
- ❌ 404：訂單不存在

**`order-result` 群組**（POST form-urlencoded，supertest 跟隨 redirect）：
- ✅ 有效 `MerchantTradeNo` → 302 導向 `/orders/:id?verify=ecpay`
- ✅ 無效 `MerchantTradeNo` → 302 導向 `/orders`

#### 訂單狀態管理

`verify-ecpay` 的每個測試會改變訂單狀態，需要獨立的 `pending` 訂單：
- `beforeEach` 流程：加商品入購物車 → `POST /api/orders` → `POST /api/orders/:id/ecpay-checkout`（設置 trade no）
- 各 test 用自己的 orderId，避免狀態污染

#### 注意事項

- `vi` 在 `globals: true` 設定下為全域，不需額外 `require('vitest')`
- `afterEach(() => vi.restoreAllMocks())` 確保 spy 不跨 test 污染
- `ecpay-checkout` 回傳的 `params` 全為字串（`TotalAmount` 是 `'1680'` 而非 `1680`）
- 測試 redirect 時 supertest 用 `.redirects(1)` 或直接檢查 `res.status === 302` + `res.headers.location`
