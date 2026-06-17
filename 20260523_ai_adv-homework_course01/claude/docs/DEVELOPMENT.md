# 開發規範

## 命名規則

| 類別 | 規則 | 範例 |
|------|------|------|
| 檔案名稱 | camelCase | `authRoutes.js`、`errorHandler.js` |
| 路由函式 | 匿名函式（inline arrow） | `router.get('/', (req, res) => {...})` |
| DB 欄位 | snake_case | `password_hash`、`order_no`、`total_amount` |
| JS 變數 | camelCase | `cartItems`、`recipientEmail` |
| API 路徑 | kebab-case | `/api/admin/products`、`/api/orders/:id/pay` |
| 錯誤碼 | SCREAMING_SNAKE_CASE | `VALIDATION_ERROR`、`STOCK_INSUFFICIENT` |
| EJS 頁面 | kebab-case | `product-detail.ejs`、`order-detail.ejs` |
| 前端 JS | kebab-case | `admin-products.js`、`header-init.js` |

## 模組系統

專案使用 **CommonJS**（`require/module.exports`），但 `vitest.config.js` 使用 ES Module 語法（`import/export`）。兩者不混用。

## 新增 API 端點步驟

1. 在對應的 `src/routes/*.js` 檔案新增路由處理函式
2. 加入 `@openapi` JSDoc 註解（參考現有路由的格式）
3. 若需要新 middleware，在 `src/middleware/` 建立並在 `app.js` 掛載
4. 執行 `npm run openapi` 更新 `openapi.json`
5. 在 `tests/` 新增對應測試

## 新增資料庫 Table 步驟

1. 在 `src/database.js` 的 `initializeDatabase()` 中新增 `CREATE TABLE IF NOT EXISTS`
2. 若需要 seed data，新增對應的 `seed*()` 函式並在 `initializeDatabase()` 呼叫
3. 刪除 `database.sqlite` 後重啟 server 讓 DB 重新初始化
4. 更新 `docs/ARCHITECTURE.md` 的 Schema 區塊

## 環境變數

| 變數 | 用途 | 必填 | 預設值 |
|------|------|------|--------|
| `JWT_SECRET` | JWT 簽名密鑰 | 必填 | 無（server 啟動時會 throw） |
| `PORT` | server 監聽埠號 | 選填 | 3001 |
| `FRONTEND_URL` | CORS 允許的來源 | 選填 | `http://localhost:3001` |
| `NODE_ENV` | 環境識別 | 選填 | undefined（當值為 `test` 時 bcrypt rounds 降為 1） |
| `ADMIN_EMAIL` | 種子管理員帳號 | 選填 | `admin@hexschool.com` |
| `ADMIN_PASSWORD` | 種子管理員密碼 | 選填 | `12345678` |

## JSDoc（OpenAPI 標注）格式

所有 API 路由必須加上 `@openapi` 標注，範例：

```javascript
/**
 * @openapi
 * /api/example:
 *   get:
 *     summary: 一句話說明
 *     tags: [TagName]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 message:
 *                   type: string
 */
```

## 計畫歸檔流程

1. 功能開發前，在 `docs/plans/` 建立計畫檔案，命名格式：`YYYY-MM-DD-<feature-name>.md`
2. 計畫文件結構：
   ```markdown
   ## User Story
   身為 <角色>，我希望 <行為>，以便 <目的>。

   ## Spec
   - [ ] 規格一
   - [ ] 規格二

   ## Tasks
   - [ ] 任務一
   - [ ] 任務二
   ```
3. 功能完成後：
   - 將計畫檔案移至 `docs/plans/archive/`
   - 更新 `docs/FEATURES.md`（新增功能描述或更新完成狀態）
   - 在 `docs/CHANGELOG.md` 新增一筆記錄
