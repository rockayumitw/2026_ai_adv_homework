# OpenAPI 文件整合說明

## 使用技術

| 套件 | 用途 |
|------|------|
| `zod` | 定義 request/response 的 schema 與驗證規則 |
| `@asteasolutions/zod-to-openapi` | 從 Zod schema 自動產生 OpenAPI 3.1.0 規格 |
| `@apidevtools/swagger-parser` | 在伺服器啟動時驗證產生的規格是否合法 |
| `swagger-ui-express` | 在 `/api-docs` 提供互動式 Swagger UI 頁面 |

## 新增的檔案結構

```
src/
├── schemas/
│   ├── commonSchemas.js    共用 schema：ErrorSchema / MessageSchema
│   ├── authSchemas.js      認證相關 Zod schema（RegisterBody、LoginBody、AuthResponse 等）
│   └── todoSchemas.js      Todo CRUD Zod schema（Todo、CreateTodoBody、TodoResponse 等）
└── openapi/
    ├── registry.js         所有 API 路徑的 OpenAPI 路徑註冊（安全機制 + 9 個端點）
    └── generator.js        呼叫 OpenApiGeneratorV31 產生最終 OpenAPI document
```

修改的檔案：`src/server.js`（頂部加 extendZodWithOpenApi）、`src/app.js`（掛載 Swagger UI）

## 架構說明

```
server.js
  └── extendZodWithOpenApi(z)     ← 必須在所有 require 前執行（prototype 擴充）
schemas/
  └── .openapi() 呼叫             ← 讓 Zod schema 帶有 OpenAPI metadata
openapi/registry.js
  └── 所有路由的 registerPath()   ← BearerAuth 安全機制 + 9 個 API 端點
openapi/generator.js
  └── OpenApiGeneratorV31         ← 產生 OpenAPI 3.1.0 document object
app.js
  └── SwaggerParser.validate()    ← 非阻塞驗證（只記 log）
  └── swaggerUi.setup(spec)       ← 掛載到 /api-docs
```

## API 端點文件

### Auth（`/api/auth`）

| 方法 | 路徑 | 說明 | 需要認證 |
|------|------|------|---------|
| POST | `/api/auth/register` | 註冊新帳號 | 否 |
| POST | `/api/auth/login` | 登入，取得 JWT token | 否 |
| POST | `/api/auth/logout` | 登出（清除 cookie） | 否 |
| GET | `/api/auth/me` | 取得目前登入使用者 | 是 |

### Todos（`/api/todos`）— 全部需要認證

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/todos` | 列出所有待辦事項 |
| POST | `/api/todos` | 新增待辦事項 |
| GET | `/api/todos/:id` | 取得單一待辦事項 |
| PUT | `/api/todos/:id` | 更新待辦事項 |
| DELETE | `/api/todos/:id` | 刪除待辦事項 |

## 使用方式

1. 啟動伺服器：`npm start`
2. 開啟 `http://localhost:3000/api-docs`
3. 點右上角 **Authorize** 按鈕
4. 先呼叫 `POST /api/auth/login`，取得回傳的 `token` 值
5. 貼入 Authorize 對話框的 **BearerAuth** 欄位，點 Authorize
6. 即可測試所有受保護的端點

## 安全機制說明

- **BearerAuth**：`Authorization: Bearer <token>` header，Swagger UI 使用此方式
- **CookieAuth**：httpOnly cookie `token`，瀏覽器前端自動附加（Swagger UI 無法模擬）

## 關鍵實作細節

- `extendZodWithOpenApi(z)` 必須在 `server.js` 最頂部執行，早於所有 `require()`
- 錯誤回應 schema 使用 `{ message }` 欄位，與 controller 實際回傳一致
- Todo schema 含 `updatedAt`（store.js 確實有此欄位）
- OpenAPI 路徑參數用 `{id}` 格式（非 Express 的 `:id`）
- `swagger-parser` 驗證為非阻塞，規格問題只記錄 log，不影響 API 服務
