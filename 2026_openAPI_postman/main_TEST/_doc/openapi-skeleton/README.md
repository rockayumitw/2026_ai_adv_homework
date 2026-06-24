# OpenAPI 骨架：使用說明

## 這套骨架做什麼

把這些檔案複製到你的 Express 專案後，你可以：
- 從 Zod schema 自動產生 OpenAPI 3.0.0 規格文件
- 在 `/api-docs` 看 Swagger UI 互動介面
- `npm run openapi:generate` → 輸出 `openapi.json`
- `npm run postman:generate` → 輸出 `postman/collection.json` + `postman/environment.json`

---

## 哪些檔案直接複製、哪些需要填內容

| 檔案 | 動作 |
|------|------|
| `src/openapi/zod.js` | **直接複製，不改** |
| `src/openapi/registry.js` | **直接複製，不改** |
| `src/openapi/paths/index.js` | **直接複製**，之後每加一個 feature 加一行 `require` |
| `src/openapi/schemas/_common.schemas.js` | **直接複製，不改** |
| `src/openapi/document.js` | **複製後只改 3 行**（title / description / server URL） |
| `scripts/generate-openapi.js` | **直接複製，不改** |
| `scripts/validate-openapi.js` | **直接複製，不改** |
| `scripts/generate-postman.js` | **直接複製，不改** |
| `postman/environment.json` | **複製後改** name 和預設帳密 |
| `src/openapi/schemas/_feature.schemas.js` | **範本**，複製成 `xxx.schemas.js` 填入你的欄位 |
| `src/openapi/paths/_feature.paths.js` | **範本**，複製成 `xxx.paths.js` 填入你的端點 |

---

## 步驟

### 1. 安裝套件

```bash
npm install zod @asteasolutions/zod-to-openapi @apidevtools/swagger-parser swagger-ui-express openapi-to-postmanv2
```

### 2. 複製骨架檔案

把整個骨架的 `src/openapi/`、`scripts/`、`postman/` 複製到你的專案。

### 3. 改 `document.js` 的 3 行

```js
title: '你的 API 名稱',
description: '你的 API 描述',
servers: [{ url: 'http://localhost:3000', description: '本機開發' }],
```

### 4. 修改 `server.js`（頂部加一行）

```js
require('./openapi/zod'); // ← 加在所有 require 之前
const config = require('./config');
// ...其他原本的 code 不動
```

### 5. 修改 `app.js`（加 Swagger UI）

```js
const swaggerUi = require('swagger-ui-express');
const { buildOpenApiDocument } = require('./openapi/document');

// 在 registerRoutes(app) 之前加：
const spec = buildOpenApiDocument();
app.get('/openapi.json', (req, res) => res.json(spec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
```

### 6. 更新 `package.json`

```json
"openapi:generate": "node scripts/generate-openapi.js",
"openapi:validate": "node scripts/validate-openapi.js",
"postman:generate": "node scripts/generate-postman.js"
```

### 7. 為每個 feature 建立 schemas 和 paths

對照你的 route 檔案（`authRoutes.js`、`todoRoutes.js`...）：

**schemas**：複製 `_feature.schemas.js` → 改名為 `xxx.schemas.js`，填入欄位
```js
// 每個欄位加 .openapi({ example: '...' })，Swagger UI 才有範例值
const MyBodySchema = z.object({
  name: z.string().min(1).openapi({ example: '範例' }),
}).openapi('MyBody');
```

**paths**：複製 `_feature.paths.js` → 改名為 `xxx.paths.js`，對照 route 填入端點
```js
// Express 的 /:id → OpenAPI 的 /{id}
registry.registerPath({
  method: 'get',
  path: '/api/xxx/{id}',
  ...
});
```

**index.js**：加一行 require
```js
require('./xxx.paths'); // ← 加這行
```

### 8. 執行

```bash
npm run openapi:generate   # → openapi.json
npm run postman:generate   # → postman/collection.json + postman/environment.json
```

---

## 注意事項

- schemas 和 paths 都要從 `require('../zod')` 取得 `z`，**不要** `require('zod')`，否則 `.openapi()` 會報錯
- `paths/index.js` 裡的 require 順序就是 Swagger UI 裡的顯示順序
- `postman/environment.json` 要手動改預設帳密，它不會自動生成
