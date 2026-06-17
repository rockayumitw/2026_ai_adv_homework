# 測試規範

## 測試框架

**Vitest 2 + Supertest**，設定在 `vitest.config.js`。

## 測試檔案與執行順序

測試**不可並行**（`fileParallelism: false`），因為共用同一個 SQLite 資料庫，執行順序固定如下：

| 順序 | 檔案 | 涵蓋功能 |
|------|------|---------|
| 1 | `tests/auth.test.js` | 註冊、登入、個人資料 |
| 2 | `tests/products.test.js` | 商品列表、詳情 |
| 3 | `tests/cart.test.js` | 購物車 CRUD（JWT + session） |
| 4 | `tests/orders.test.js` | 建立訂單、列表、詳情、付款模擬 |
| 5 | `tests/adminProducts.test.js` | 管理員商品 CRUD |
| 6 | `tests/adminOrders.test.js` | 管理員訂單查看/更新 |

## 執行測試

```bash
npm test          # 執行所有測試
```

Vitest 不支援只跑單一測試檔案時保持 hook（`hookTimeout: 10000ms`），若需單獨測試請用：

```bash
npx vitest run tests/cart.test.js
```

## 測試輔助函式（tests/setup.js）

```javascript
const { app, request, getAdminToken, registerUser } = require('./setup');
```

| 函式 | 說明 |
|------|------|
| `app` | Express app 實例 |
| `request` | supertest 包裝的 app，可直接呼叫 `.get/.post...` |
| `getAdminToken()` | 以種子管理員帳號登入，回傳 JWT token string |
| `registerUser(overrides)` | 建立新測試使用者，回傳 `{ token, user }`。可傳 `{ email, password, name }` 覆蓋預設值 |

## 撰寫新測試

```javascript
const { request, getAdminToken, registerUser } = require('./setup');

describe('Feature Name', () => {
  let token;

  beforeAll(async () => {
    const { token: t } = await registerUser();
    token = t;
  });

  it('should do something', async () => {
    const res = await request
      .post('/api/example')
      .set('Authorization', `Bearer ${token}`)
      .send({ key: 'value' });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toBeDefined();
  });
});
```

## 已知陷阱

**bcrypt rounds 差異**：`src/database.js` 的 `seedAdminUser()` 在 `NODE_ENV=test` 時使用 rounds=1（加速測試），生產環境使用 rounds=10。Vitest 執行時 `NODE_ENV` 會被設為 `test`，因此如果手動啟動 server 後 DB 裡的 admin 密碼是以 rounds=10 雜湊的，用測試跑出的 token 不會有問題，但若刪除 DB 重建、且環境不是 test，種子密碼雜湊會不同（仍可登入，只是速度差異）。

**DB 狀態殘留**：測試不會在測試結束後清除資料（無 `afterAll` cleanup），因此測試之間若有資料相依性，執行順序至關重要。不要任意調換 `vitest.config.js` 中的 `sequence.files` 順序。
