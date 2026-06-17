# Changelog

## [Unreleased]

## [1.1.0] — 2026-05-26

### Added
- 綠界 ECPay AIO 金流串接（信用卡，測試環境）
- `POST /api/orders/:id/ecpay-checkout`：產生 CheckMacValue 付款參數，回傳給前端動態 form submit
- `POST /api/orders/:id/verify-ecpay`：主動呼叫 QueryTradeInfo/V5 API 驗證付款結果
- `POST /api/ecpay/order-result`：綠界付款後瀏覽器導回處理（302 redirect 觸發前端驗證）
- `POST /api/ecpay/notify`：綠界 Server-to-Server 通知端點（本地環境備用）
- `src/services/ecpayService.js`：封裝 CheckMacValue 計算、QueryTradeInfo 查詢
- orders 表新增 `ecpay_merchant_trade_no` 欄位
- ECPay 整合測試（`tests/ecpay.test.js`，13 個測試案例）

### Changed
- 訂單詳情頁移除付款模擬按鈕，改為「前往綠界付款」按鈕

## [1.0.0] — 2026-05-25

### Added
- 使用者認證：註冊、登入、個人資料（JWT HS256）
- 商品列表與詳情（分頁）
- 購物車（雙模式認證：JWT + session）
- 訂單建立（transaction：建立訂單、扣庫存、清購物車）
- 付款模擬（success/fail）
- 管理員後台：商品 CRUD
- 管理員後台：訂單管理
- EJS 前台頁面（首頁、商品詳情、購物車、結帳、訂單）
- EJS 後台頁面（商品管理、訂單管理）
- OpenAPI/Swagger 文件
- Vitest 測試套件（6 個測試檔案）
- AI 輔助開發文件結構（CLAUDE.md、docs/、rules、hooks、agents）
