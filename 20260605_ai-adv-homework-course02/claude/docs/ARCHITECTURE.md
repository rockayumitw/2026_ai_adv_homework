# 架構說明

## 目錄結構

```
project-root/
├── app.js                          # Express 應用設定（middleware、路由掛載）
├── server.js                       # HTTP server 入口（載入 .env、啟動 listen）
├── package.json
├── vitest.config.js               # 測試設定（sequential order）
├── swagger-config.js              # OpenAPI metadata 設定
├── generate-openapi.js            # 執行後產生 openapi.json
├── database.sqlite                # SQLite 資料庫主檔（不 commit）
├── src/
│   ├── database.js                # 初始化 DB、建表、seed admin/products
│   ├── middleware/
│   │   ├── authMiddleware.js      # 驗證 JWT Bearer token，注入 req.user
│   │   ├── adminMiddleware.js     # 確認 req.user.role === 'admin'
│   │   ├── sessionMiddleware.js   # 從 X-Session-Id header 注入 req.sessionId
│   │   └── errorHandler.js        # 全域 Express 錯誤處理
│   └── routes/
│       ├── authRoutes.js          # /api/auth — 註冊、登入、個人資料
│       ├── productRoutes.js       # /api/products — 商品列表、詳情（公開）
│       ├── cartRoutes.js          # /api/cart — 購物車 CRUD（雙模式認證）
│       ├── orderRoutes.js         # /api/orders — 訂單建立、列表、詳情、付款
│       ├── adminProductRoutes.js  # /api/admin/products — 商品管理（admin）
│       ├── adminOrderRoutes.js    # /api/admin/orders — 訂單管理（admin）
│       └── pageRoutes.js          # 頁面渲染路由
├── views/
│   ├── layouts/
│   │   ├── front.ejs              # 前台 layout（nav + footer）
│   │   └── admin.ejs              # 後台 layout（sidebar）
│   ├── partials/                  # 可復用的 EJS 片段
│   └── pages/                    # 各頁面內容
│       ├── index.ejs, product-detail.ejs, cart.ejs, checkout.ejs
│       ├── login.ejs, orders.ejs, order-detail.ejs, 404.ejs
│       └── admin/products.ejs, admin/orders.ejs
├── public/
│   ├── css/input.css              # Tailwind 來源
│   ├── css/output.css             # 編譯後的 CSS（自動產生）
│   ├── js/api.js                  # fetch wrapper
│   ├── js/auth.js                 # JWT localStorage 管理
│   ├── js/header-init.js          # header 動態渲染
│   ├── js/notification.js         # toast 通知
│   └── js/pages/                  # 各頁面專屬 JS
└── tests/
    ├── setup.js                   # 測試輔助函式
    └── *.test.js                  # 各功能測試
```

## 啟動流程

1. `server.js` 載入 `.env`，require `app.js`
2. `app.js` require `src/database.js` → 建表 + seed admin user + seed 8 款商品
3. Express 掛載 middleware（CORS → json → urlencoded → sessionMiddleware）
4. 掛載 6 個 API 路由 + pageRoutes
5. `server.js` 呼叫 `app.listen(PORT)`

## API 路由總覽

| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| POST | /api/auth/register | 無 | 建立帳號，回傳 JWT |
| POST | /api/auth/login | 無 | 登入，回傳 JWT |
| GET | /api/auth/profile | JWT | 取得目前使用者資料 |
| GET | /api/products | 無 | 商品列表（分頁：page、limit，預設 page=1 limit=10） |
| GET | /api/products/:id | 無 | 商品詳情 |
| GET | /api/cart | JWT/Session | 查看購物車（含 total 計算） |
| POST | /api/cart | JWT/Session | 加入商品（已在購物車則累加數量） |
| PATCH | /api/cart/:itemId | JWT/Session | 修改數量（直接設定，不累加） |
| DELETE | /api/cart/:itemId | JWT/Session | 移除購物車項目 |
| POST | /api/orders | JWT | 從購物車建立訂單（transaction） |
| GET | /api/orders | JWT | 目前使用者訂單列表（DESC 排序） |
| GET | /api/orders/:id | JWT | 訂單詳情（含 order_items） |
| PATCH | /api/orders/:id/pay | JWT | 模擬付款（action: success/fail） |
| GET | /api/admin/products | JWT+Admin | 管理員商品列表 |
| POST | /api/admin/products | JWT+Admin | 新增商品 |
| PATCH | /api/admin/products/:id | JWT+Admin | 更新商品 |
| DELETE | /api/admin/products/:id | JWT+Admin | 刪除商品 |
| GET | /api/admin/orders | JWT+Admin | 所有訂單列表（可篩選 status） |
| PATCH | /api/admin/orders/:id | JWT+Admin | 更新訂單狀態 |

## 統一回應格式

所有 API 回應固定結構（前端依 `error` 欄位判斷成功失敗）：

```json
{
  "data": null,
  "error": null,
  "message": "人類可讀的訊息（繁體中文）"
}
```

- `data`：成功時的資料，失敗時為 `null`
- `error`：成功時為 `null`，失敗時為大寫錯誤碼（如 `UNAUTHORIZED`、`NOT_FOUND`、`VALIDATION_ERROR`、`STOCK_INSUFFICIENT`、`CART_EMPTY`、`INVALID_STATUS`）
- `message`：繁體中文說明

## 認證與授權機制

**JWT 認證（authMiddleware.js）**：
- 從 `Authorization: Bearer <token>` 標頭取出 token
- `jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })`
- 驗證後再查 DB 確認使用者仍存在
- 注入 `req.user = { userId, email, role }`

**Admin 保護（adminMiddleware.js）**：
- 必須先過 `authMiddleware`
- 確認 `req.user.role === 'admin'`，否則回 403

**雙模式認證（cartRoutes.js dualAuth）**：
- 優先嘗試 JWT：Authorization header 存在但 token 無效 → 直接 401（不 fallback）
- JWT 不存在時使用 `req.sessionId`（由 `X-Session-Id` header 注入）
- 兩者都不存在 → 401

## 資料庫 Schema

```sql
users (
  id TEXT PRIMARY KEY,           -- UUID
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'  -- CHECK: 'user' | 'admin'
  created_at TEXT DEFAULT (datetime('now'))
)

products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,        -- 新台幣，整數，CHECK price > 0
  stock INTEGER NOT NULL DEFAULT 0,  -- CHECK stock >= 0
  image_url TEXT,
  created_at TEXT,
  updated_at TEXT
)

cart_items (
  id TEXT PRIMARY KEY,
  session_id TEXT,               -- 匿名使用者用
  user_id TEXT,                  -- FK → users.id，登入使用者用
  product_id TEXT NOT NULL,      -- FK → products.id
  quantity INTEGER NOT NULL DEFAULT 1  -- CHECK quantity > 0
)

orders (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL, -- 格式：ORD-YYYYMMDD-XXXXX
  user_id TEXT NOT NULL,         -- FK → users.id
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  total_amount INTEGER NOT NULL, -- 新台幣整數
  status TEXT NOT NULL DEFAULT 'pending',  -- CHECK: 'pending' | 'paid' | 'failed'
  created_at TEXT
)

order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,        -- FK → orders.id
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,    -- 非正規化：記錄下單當時的商品名稱
  product_price INTEGER NOT NULL, -- 非正規化：記錄下單當時的價格
  quantity INTEGER NOT NULL
)
```

## 訂單建立 Transaction

`POST /api/orders` 使用 `db.transaction()` 確保以下操作全部成功或全部回滾：
1. INSERT orders
2. INSERT order_items（逐一插入，保留下單時商品資訊）
3. UPDATE products SET stock = stock - quantity（每個商品扣庫存）
4. DELETE cart_items WHERE user_id = ?（清空購物車）
