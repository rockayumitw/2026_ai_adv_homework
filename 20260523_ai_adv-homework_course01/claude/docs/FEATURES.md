# 功能清單

## 認證（Authentication）

**狀態：完成**

### 註冊（POST /api/auth/register）

請求 body（必填）：`email`、`password`、`name`。

`email` 若已存在回 409 DUPLICATE_EMAIL。密碼以 bcrypt 雜湊後存入 `users.password_hash`。成功後產生 JWT（含 `userId`、`email`、`role`），回傳 `{ token, user: { id, email, name, role } }`。

### 登入（POST /api/auth/login）

請求 body（必填）：`email`、`password`。

`email` 不存在或密碼不符均回 401 INVALID_CREDENTIALS（不區分兩種情況以防列舉帳號）。成功回傳 `{ token, user }`。

### 個人資料（GET /api/auth/profile）

需 JWT。回傳 `{ id, email, name, role, created_at }`，不含密碼欄位。

---

## 商品（Products）

**狀態：完成**

### 商品列表（GET /api/products）

公開端點，支援分頁查詢參數：
- `page`（預設 1）
- `limit`（預設 10）

回傳 `{ products: [...], pagination: { total, page, limit, totalPages } }`。

### 商品詳情（GET /api/products/:id）

公開端點。商品不存在回 404。

---

## 購物車（Cart）

**狀態：完成**

### 雙模式認證

購物車支援兩種識別方式：

1. **已登入**：Authorization Bearer JWT，購物車綁定 `user_id`
2. **匿名**：`X-Session-Id` 自訂標頭，購物車綁定 `session_id`

判斷優先順序：Authorization header 存在時強制驗 JWT。若 token 無效直接回 401，**不會 fallback 至 session**。只有 Authorization header 完全不存在時才使用 session_id。

### 加入購物車（POST /api/cart）

請求 body（必填）：`productId`。選填：`quantity`（預設 1，必須為正整數）。

若商品已在購物車，**累加** quantity（不是取代）。累加或新增前均檢查 `quantity <= product.stock`，超過回 400 STOCK_INSUFFICIENT。

### 修改數量（PATCH /api/cart/:itemId）

請求 body（必填）：`quantity`（直接設定新數量，非增量）。同樣檢查庫存。

### 查看購物車（GET /api/cart）

回傳 `{ items: [...], total }` 其中 `total` 為各 item `price × quantity` 的加總（整數，新台幣）。

---

## 訂單（Orders）

**狀態：完成**

### 建立訂單（POST /api/orders）

需 JWT。請求 body（必填）：`recipientName`、`recipientEmail`、`recipientAddress`。

前置驗證：
1. `recipientEmail` 格式驗證（regex）
2. 購物車不可為空（400 CART_EMPTY）
3. 所有商品庫存充足（400 STOCK_INSUFFICIENT，回傳不足商品名稱列表）

以 **SQLite transaction** 執行：
1. INSERT orders（產生 `ORD-YYYYMMDD-XXXXX` 格式的 order_no）
2. INSERT order_items（複製商品名稱、價格到 order_items，保留歷史快照）
3. UPDATE products 扣減庫存
4. DELETE cart_items 清空購物車

全部成功才提交，任一失敗全部回滾。

### 付款模擬（PATCH /api/orders/:id/pay）

請求 body（必填）：`action`（`"success"` 或 `"fail"`）。

只有 `status = 'pending'` 的訂單可付款，否則回 400 INVALID_STATUS。
- `action: 'success'` → status 變為 `'paid'`
- `action: 'fail'` → status 變為 `'failed'`

---

## ECPay 綠界金流（ECPay AIO）

**狀態：完成**

串接綠界 ECPay AIO（全方位金流）信用卡付款，使用測試環境 `payment-stage.ecpay.com.tw`。

### 發起付款（POST /api/orders/:id/ecpay-checkout）

需 JWT。驗證訂單存在且屬於目前使用者、status = `'pending'`。

每次呼叫重新產生 `ecpay_merchant_trade_no`（允許付款失敗後重試），寫入 orders 表。回傳 `{ data: { action, params } }`，前端動態建立 form submit 至綠界付款頁。

### 驗證付款（POST /api/orders/:id/verify-ecpay）

需 JWT。驗證訂單存在、屬於目前使用者、且已有 `ecpay_merchant_trade_no`（否則 400 VALIDATION_ERROR）。

主動呼叫 ECPay QueryTradeInfo/V5 API，依 `TradeStatus` 更新訂單：
- `'1'` → `'paid'`
- `'0'` → 維持 `'pending'`，message `'尚未付款'`
- 其他 → `'failed'`

回傳 `{ data: { order, tradeStatus } }`。

### 付款導回（POST /api/ecpay/order-result）

綠界付款後瀏覽器以 Form POST 導回。依 `MerchantTradeNo` 查訂單，302 redirect 至 `/orders/:id?verify=ecpay`（存在）或 `/orders`（不存在）。

### Server Notify（POST /api/ecpay/notify）

綠界 ReturnURL server-to-server 通知。本地開發無法被外部呼叫，實作以備正式環境使用。驗證 CheckMacValue，`RtnCode='1'` 時更新訂單為 `'paid'`，必須回傳純文字 `1|OK`。

---

## 管理員：商品管理（Admin Products）

**狀態：完成**

需 JWT + admin role。所有端點掛載 `authMiddleware` + `adminMiddleware`。

### 新增商品（POST /api/admin/products）

必填：`name`、`price`（正整數）。選填：`description`、`stock`（預設 0）、`image_url`。

### 更新商品（PATCH /api/admin/products/:id）

支援部分更新（partial update），只傳要修改的欄位。自動更新 `updated_at`。

### 刪除商品（DELETE /api/admin/products/:id）

硬刪除。若商品不存在回 404。

---

## 管理員：訂單管理（Admin Orders）

**狀態：完成**

需 JWT + admin role。

### 訂單列表（GET /api/admin/orders）

可選查詢參數：`status`（篩選訂單狀態）。回傳所有使用者的訂單，DESC 排序。

### 更新訂單（PATCH /api/admin/orders/:id）

可更新 `status`（`pending`、`paid`、`failed`）。

---

## 前台頁面

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | 首頁 | 商品列表 |
| `/products/:id` | 商品詳情 | 加入購物車 |
| `/cart` | 購物車 | 管理購物車 |
| `/checkout` | 結帳 | 填寫收件資訊 |
| `/login` | 登入 | 登入/切換帳號 |
| `/orders` | 訂單列表 | 個人訂單歷史 |
| `/orders/:id` | 訂單詳情 | 付款模擬 |

## 後台頁面

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/admin/products` | 商品管理 | 新增/編輯/刪除商品 |
| `/admin/orders` | 訂單管理 | 查看/更新訂單狀態 |
