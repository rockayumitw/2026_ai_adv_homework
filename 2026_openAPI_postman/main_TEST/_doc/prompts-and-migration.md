# 提示詞 & main_TEST 遷移指南

本文件包含兩個部分：
1. **可直接貼給 AI 的提示詞**，用來從頭建立 openAPI 資料夾那樣的架構
2. **main_TEST 遷移步驟**，把現有設定改成和 openAPI 資料夾一致

---

## Part 1：提示詞（可直接複製貼給 AI）

### 提示詞 A：整合 OpenAPI 文件（核心架構）

> 適用情境：從一個已有的 Express + JWT + Zod API 開始，加入 OpenAPI 文件功能

```
我有一個 Express + JWT 的 RESTful API，已經有以下 routes：
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me（需要 JWT）
- GET    /api/todos（需要 JWT）
- POST   /api/todos（需要 JWT）
- GET    /api/todos/:id（需要 JWT）
- PUT    /api/todos/:id（需要 JWT）
- DELETE /api/todos/:id（需要 JWT）

請幫我整合 OpenAPI 3.0.0 文件，要求如下：

【套件】
- @asteasolutions/zod-to-openapi
- @apidevtools/swagger-parser
- swagger-ui-express

【檔案結構】要建立以下新檔案：
src/openapi/
├── zod.js              ← 只做一件事：extendZodWithOpenApi(z)，export 給 server.js 最頂部呼叫
├── registry.js         ← 只建立 OpenAPIRegistry + 註冊 bearerAuth / cookieAuth security scheme，export registry
├── document.js         ← export function buildOpenApiDocument()，呼叫 OpenApiGeneratorV3（3.0.0）產生 document object
├── paths/
│   ├── index.js        ← require 所有 paths 檔案（觸發 registerPath），不 export 任何東西
│   ├── auth.paths.js   ← 只有 Auth 的 4 個端點，require registry 直接呼叫 registry.registerPath()
│   └── todos.paths.js  ← 只有 Todos 的 5 個端點，同上
└── schemas/
    ├── auth.schemas.js   ← Auth 相關的 Zod schema，都加 .openapi({ example: ... })
    ├── todo.schemas.js   ← Todo 相關的 Zod schema，同上
    └── common.schemas.js ← ErrorResponse、MessageResponse 共用 schema

【schemas 注意事項】
- 使用 OpenAPI 3.0.0，所以 schema 裡不能用 z.union() 對應的 oneOf 語法，用 z.string().optional() 等基本型別
- 所有 schema 要加 .openapi({ example: '...' }) 讓 Swagger UI 有範例值

【document.js 注意事項】
- 使用 OpenApiGeneratorV3（不是 V31）
- buildOpenApiDocument() 要 require paths/index.js（這樣所有路徑才會被 registerPath）
- server info: title、version、description、servers

【Swagger UI 掛載位置】
- GET /openapi.json → 回傳 buildOpenApiDocument() 的結果（即時產生）
- GET /api-docs     → swagger-ui-express 的互動介面

【server.js 修改】
- 最頂部（所有 require 之前）呼叫 extendZodWithOpenApi(z)

【scripts/ 要建立】
scripts/
├── generate-openapi.js   ← 呼叫 buildOpenApiDocument()，用 SwaggerParser.validate() 驗證後輸出 openapi.json；驗證失敗要 exit(1)
└── validate-openapi.js   ← 只驗證現有的 openapi.json，不重新生成

【package.json scripts 新增】
"openapi:generate": "node scripts/generate-openapi.js",
"openapi:validate": "node scripts/validate-openapi.js"

【安全機制說明】
- BearerAuth：Swagger UI 用，Authorization: Bearer <token>
- CookieAuth：瀏覽器用，httpOnly cookie，Swagger UI 無法模擬，只是文件記錄用

【不需要做的事】
- 不需要 request validation middleware（Zod schema 只用於文件，不用於驗證 request）
- 不需要修改任何既有的 controller 或 route 檔案
```

---

### 提示詞 B：加入 Postman Collection 自動生成

> 在完成提示詞 A 之後，繼續加這段

```
現在幫我加入 Postman Collection 的自動生成功能。

【套件】
npm install openapi-to-postmanv2

【新增檔案】
scripts/generate-postman.js

【generate-postman.js 的邏輯】
1. 讀取 openapi.json（先確保已執行 openapi:generate）
2. 用 openapi-to-postmanv2 的 Converter.convert() 轉換
   - folderStrategy: 'Tags'（Auth / Todos 分資料夾）
   - requestParametersResolution: 'Example'
   - exampleParametersResolution: 'Example'
3. 轉換後修改登入 request 的 body，把 email/password 換成 {{email}}/{{password}}
   （baseUrl 和 Bearer token 由 OpenAPI security 自動帶入，不需手動處理）
4. 輸出到 postman/collection.json

【同時建立】
postman/environment.json，內容：
- baseUrl: http://localhost:3000
- email: demo@example.com
- password: demo1234（type: secret）
- bearerToken: 空字串（type: secret）

【package.json scripts 新增】
"postman:generate": "node scripts/generate-postman.js"

【注意】
- collection 每次重新生成，所以環境變數的替換邏輯必須寫在腳本裡，不能手動改 collection.json
- openapi-to-postmanv2 是 callback 介面，請包成 Promise
```

---

## Part 2：main_TEST 要怎麼改才能跟 openAPI 資料夾一樣

### 現在 main_TEST 的結構 vs 目標結構

```
現在（main_TEST）                    目標（openAPI 資料夾架構）
─────────────────────────────────    ───────────────────────────────────
src/schemas/authSchemas.js       →   src/openapi/schemas/auth.schemas.js
src/schemas/todoSchemas.js       →   src/openapi/schemas/todo.schemas.js
src/schemas/commonSchemas.js     →   src/openapi/schemas/common.schemas.js
src/openapi/registry.js          →   src/openapi/registry.js（只留 security schemes）
                                 →   src/openapi/paths/auth.paths.js  ← 新增
                                 →   src/openapi/paths/todos.paths.js ← 新增
                                 →   src/openapi/paths/index.js       ← 新增
src/openapi/generator.js         →   src/openapi/document.js（改名 + 改內容）
                                 →   src/openapi/zod.js               ← 新增（可選）
（無）                           →   scripts/generate-openapi.js      ← 新增
（無）                           →   scripts/validate-openapi.js      ← 新增
```

---

### 步驟 1：移動 schemas 資料夾

把 `src/schemas/` 底下的 3 個檔案移到 `src/openapi/schemas/`，同時改命名風格：

| 原路徑 | 新路徑 |
|--------|--------|
| `src/schemas/authSchemas.js` | `src/openapi/schemas/auth.schemas.js` |
| `src/schemas/todoSchemas.js` | `src/openapi/schemas/todo.schemas.js` |
| `src/schemas/commonSchemas.js` | `src/openapi/schemas/common.schemas.js` |

移動後要更新所有 import 路徑（`registry.js` 和使用這些 schema 的 route/middleware 檔案）。

---

### 步驟 2：拆分 registry.js

現在的 `src/openapi/registry.js` 混合了兩件事：security schemes + 所有路徑定義。
目標是把路徑定義移出去。

**改後的 `src/openapi/registry.js`（只留 security schemes）：**

```js
const { OpenAPIRegistry } = require('@asteasolutions/zod-to-openapi');

const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: '貼上 /api/auth/login 回傳的 token 值',
});

registry.registerComponent('securitySchemes', 'CookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'token',
  description: '瀏覽器自動附加的 httpOnly cookie（Swagger UI 請改用 BearerAuth）',
});

module.exports = registry;
```

---

### 步驟 3：建立 paths/ 資料夾

**`src/openapi/paths/auth.paths.js`（把 registry.js 裡的 Auth 端點搬過來）：**

```js
const registry = require('../registry');
const { RegisterBodySchema, LoginBodySchema, AuthResponseSchema, MeResponseSchema } = require('../schemas/auth.schemas');
const { ErrorSchema, MessageSchema } = require('../schemas/common.schemas');

const AUTH_REQUIRED = [{ BearerAuth: [] }];
const json = (schema) => ({ content: { 'application/json': { schema } } });
const jsonErr = { content: { 'application/json': { schema: ErrorSchema } } };

registry.registerPath({
  method: 'post', path: '/api/auth/register', tags: ['Auth'], summary: '註冊新帳號',
  request: { body: { required: true, ...json(RegisterBodySchema) } },
  responses: {
    201: { description: '建立成功', ...json(AuthResponseSchema) },
    400: { description: '輸入驗證失敗', ...jsonErr },
    409: { description: 'Email 已被使用', ...jsonErr },
  },
});

registry.registerPath({
  method: 'post', path: '/api/auth/login', tags: ['Auth'], summary: '登入',
  request: { body: { required: true, ...json(LoginBodySchema) } },
  responses: {
    200: { description: '登入成功', ...json(AuthResponseSchema) },
    400: { description: '輸入驗證失敗', ...jsonErr },
    401: { description: '帳號或密碼錯誤', ...jsonErr },
  },
});

registry.registerPath({
  method: 'post', path: '/api/auth/logout', tags: ['Auth'], summary: '登出',
  responses: { 200: { description: '已登出', ...json(MessageSchema) } },
});

registry.registerPath({
  method: 'get', path: '/api/auth/me', tags: ['Auth'], summary: '取得目前登入使用者',
  security: AUTH_REQUIRED,
  responses: {
    200: { description: '目前使用者', ...json(MeResponseSchema) },
    401: { description: '未登入', ...jsonErr },
  },
});
```

**`src/openapi/paths/todos.paths.js`：**

```js
const { z } = require('zod');
const registry = require('../registry');
const { CreateTodoBodySchema, UpdateTodoBodySchema, TodoListResponseSchema, TodoResponseSchema } = require('../schemas/todo.schemas');
const { ErrorSchema } = require('../schemas/common.schemas');

const AUTH_REQUIRED = [{ BearerAuth: [] }];
const json = (schema) => ({ content: { 'application/json': { schema } } });
const jsonErr = { content: { 'application/json': { schema: ErrorSchema } } };
const idParam = z.object({ id: z.string().openapi({ example: '1' }) });

// （把 registry.js 裡所有 /api/todos 的 registerPath 搬過來，security 全部加 AUTH_REQUIRED）
```

**`src/openapi/paths/index.js`：**

```js
// 只要 require 就會觸發 registerPath，不需要 export 任何東西
require('./auth.paths');
require('./todos.paths');
```

---

### 步驟 4：改 generator.js → document.js

把 `src/openapi/generator.js` 的內容改成：

```js
const { OpenApiGeneratorV3 } = require('@asteasolutions/zod-to-openapi');
const registry = require('./registry');

// 觸發所有端點的 registerPath（side effect import）
require('./paths/index');

function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',         // ← 改成 3.0.0（原本是 3.1.0）
    info: {
      title: 'Todo List RESTful API',
      version: '1.0.0',
      description: 'Todo List API。文件由 Zod schema 衍生，確保文件與實作一致。',
    },
    servers: [{ url: 'http://localhost:3000', description: '本機開發' }],
  });
}

module.exports = { buildOpenApiDocument };
```

同時把檔名從 `generator.js` 改為 `document.js`，並更新 `app.js` 裡的 require 路徑。

---

### 步驟 5：新增 scripts/

建立 `scripts/generate-openapi.js`：

```js
const fs = require('fs');
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');
const { buildOpenApiDocument } = require('../src/openapi/document');

const OUTPUT = path.join(__dirname, '..', 'openapi.json');

async function main() {
  const doc = buildOpenApiDocument();
  await SwaggerParser.validate(structuredClone(doc)); // clone 避免 $ref 被展開
  fs.writeFileSync(OUTPUT, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  console.log(`✅ 規格驗證通過並已輸出：openapi.json`);
}

main().catch((err) => {
  console.error('❌ OpenAPI 規格驗證失敗：', err.message);
  process.exit(1);
});
```

建立 `scripts/validate-openapi.js`：

```js
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');

const FILE = path.join(__dirname, '..', 'openapi.json');

SwaggerParser.validate(FILE)
  .then(() => console.log('✅ openapi.json 驗證通過'))
  .catch((err) => {
    console.error('❌ 驗證失敗：', err.message);
    process.exit(1);
  });
```

---

### 步驟 6：更新 package.json

在 `scripts` 加入：

```json
"openapi:generate": "node scripts/generate-openapi.js",
"openapi:validate": "node scripts/validate-openapi.js"
```

---

### 步驟 7：更新 app.js 裡的 require 路徑

```js
// 原本
const { generateSpec } = require('./openapi/generator');
// 改成
const { buildOpenApiDocument } = require('./openapi/document');

// 使用時
const spec = buildOpenApiDocument();
```

---

### 修改摘要

| 動作 | 檔案 |
|------|------|
| 移動 + 改名 | `src/schemas/*.js` → `src/openapi/schemas/*.js` |
| 修改 | `src/openapi/registry.js`（只留 security schemes） |
| 新增 | `src/openapi/paths/index.js` |
| 新增 | `src/openapi/paths/auth.paths.js` |
| 新增 | `src/openapi/paths/todos.paths.js` |
| 改名 + 修改 | `src/openapi/generator.js` → `src/openapi/document.js`（改用 V3、改函數名） |
| 修改 | `src/app.js`（更新 require 路徑、函數名） |
| 新增 | `scripts/generate-openapi.js` |
| 新增 | `scripts/validate-openapi.js` |
| 修改 | `package.json`（加 openapi:generate、openapi:validate） |
