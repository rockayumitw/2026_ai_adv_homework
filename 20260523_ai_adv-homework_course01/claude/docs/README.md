# 花卉電商 (Flower E-Commerce)

Node.js/Express 全端電商應用，提供花卉商品的瀏覽、購物車、訂單管理功能，並附管理員後台。

## 技術棧

| 類別 | 技術 |
|------|------|
| 後端框架 | Express.js 4.16 |
| 資料庫 | SQLite（better-sqlite3，WAL 模式） |
| 認證 | JWT HS256 + 匿名 session |
| 密碼 | bcrypt（10 rounds） |
| 模板引擎 | EJS 5 |
| CSS | Tailwind CSS 4.2 |
| 測試 | Vitest 2 + Supertest |
| API 文件 | swagger-jsdoc（OpenAPI 3） |

## 快速開始

```bash
# 安裝依賴
npm install

# 建立 .env
echo "JWT_SECRET=your_secret_here" > .env

# 啟動開發 server（port 3001）
npm run dev:server

# 另開終端，監看 CSS
npm run dev:css
```

瀏覽器打開 `http://localhost:3001`

預設管理員帳號：`admin@hexschool.com` / `12345678`

## 常用指令

| 指令 | 說明 |
|------|------|
| `npm run dev:server` | 啟動開發 server（不建構 CSS） |
| `npm run dev:css` | Tailwind CSS watch mode |
| `npm start` | 建構 CSS 後啟動 server（生產用） |
| `npm test` | 執行所有測試 |
| `npm run openapi` | 產生 `openapi.json` |

## 環境變數

| 變數 | 說明 | 必填 |
|------|------|------|
| `JWT_SECRET` | JWT 簽名密鑰 | 必填 |
| `PORT` | 監聽埠號 | 選填，預設 3001 |
| `FRONTEND_URL` | CORS 允許的前端來源 | 選填，預設 `http://localhost:3001` |
| `ADMIN_EMAIL` | 種子管理員帳號 | 選填，預設 `admin@hexschool.com` |
| `ADMIN_PASSWORD` | 種子管理員密碼 | 選填，預設 `12345678` |

## 文件索引

| 文件 | 說明 |
|------|------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | 架構、目錄結構、API 路由表、DB schema |
| [DEVELOPMENT.md](DEVELOPMENT.md) | 開發規範、命名規則、新增功能步驟 |
| [FEATURES.md](FEATURES.md) | 功能清單與行為描述 |
| [TESTING.md](TESTING.md) | 測試規範、測試執行、撰寫指南 |
| [CHANGELOG.md](CHANGELOG.md) | 更新日誌 |
