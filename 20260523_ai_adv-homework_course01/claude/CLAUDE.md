# CLAUDE.md

## 專案概述

花卉電商（Flower E-Commerce）— Node.js/Express REST API + EJS 前端，使用 SQLite + JWT 認證 + Tailwind CSS。

## 常用指令

```bash
npm run dev:server    # 啟動開發伺服器（port 3001）
npm run dev:css       # 監看 Tailwind CSS 變更
npm start             # 建構 CSS 後啟動 server
npm test              # 執行所有測試（Vitest）
npm run openapi       # 產生 OpenAPI JSON 文件
```

## 關鍵規則

- 所有 API 回應必須使用統一格式：`{ data, error, message }`，`error` 為 null 或大寫錯誤碼字串
- 購物車支援雙模式認證：JWT（已登入）或 `X-Session-Id` 標頭（匿名），若 Bearer token 無效則直接回 401，不 fallback
- 訂單建立使用 SQLite transaction，包含：新增訂單、新增訂單商品、扣減庫存、清空購物車
- `order_items` 中的 `product_name` 和 `product_price` 為非正規化欄位，記錄下單時的商品資訊
- 功能開發請使用 `docs/plans/` 記錄計畫；完成後移至 `docs/plans/archive/`

## 詳細文件

- @docs/README.md — 專案介紹與快速開始
- @docs/ARCHITECTURE.md — 架構、目錄結構、資料流
- @docs/DEVELOPMENT.md — 開發規範、命名規則
- @docs/FEATURES.md — 功能清單與行為描述
- @docs/TESTING.md — 測試規範與指南
- @docs/CHANGELOG.md — 更新日誌

## 必要遵守項目

- 資料庫查詢一律使用 prepared statements（`db.prepare(...).run/get/all`），禁止字串拼接 SQL
- JWT secret 只能從 `process.env.JWT_SECRET` 取得，禁止硬編碼
- bcrypt salt rounds：生產環境 10，測試環境（`NODE_ENV=test`）1，由 `seedAdminUser()` 自動處理
- 不可直接 commit `.env`、`database.sqlite*` 或 `*.lock` 檔案
- 管理員 API 需同時套用 `authMiddleware` 和 `adminMiddleware`
