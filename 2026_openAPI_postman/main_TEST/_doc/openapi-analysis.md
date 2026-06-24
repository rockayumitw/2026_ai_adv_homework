# openAPI 資料夾分析報告

## 1. 專案五階段演進架構

`2026_openAPI_postman/` 是一個教學用的漸進式專案，共有 5 個平行資料夾，每個代表一個演進階段：

```
2026_openAPI_postman/
├── main/            ← 第 1 階段：基礎 Express API（無 OpenAPI 文件）
├── main_TEST/       ← 第 2 階段：整合 OpenAPI（Claude 建立的版本）
├── openAPI/         ← 第 3 階段：完整 OpenAPI 3.0.0 + 輸出 openapi.json
├── postman/         ← 第 4 階段：加入 Postman Collection 自動生成
└── postman-runner/  ← 第 5 階段：加入 Collection Runner 自動化測試
```

每個階段都在前一階段基礎上增加功能，最終實現「Zod schema → openapi.json → Postman Collection → 自動化測試」的完整 pipeline。

---

## 2. openapi.json 是怎麼建立的

### 核心工具

| 套件 | 版本 | 用途 |
|------|------|------|
| `@asteasolutions/zod-to-openapi` | ^8.5.0 | 把 Zod schema 轉成 OpenAPI 3.0.0 規格 |
| `zod` | ^4.4.3 | 定義 schema，同時用於執行時 request 驗證 |
| `@apidevtools/swagger-parser` | ^12.1.0 | 驗證產生的規格是否合法 |

### 設計核心：Single Source of Truth

openAPI 資料夾的關鍵設計原則是「單一來源」：**Zod schema 同時負責執行時的 request 驗證，以及 OpenAPI 文件的 schema 定義**。這樣就不會出現文件與實作不一致（drift）的問題。

### 檔案結構

```
src/openapi/
├── zod.js          ← extendZodWithOpenApi(z)，讓 Zod schema 支援 .openapi() 方法
├── registry.js     ← 建立 OpenAPIRegistry，註冊 bearerAuth / cookieAuth 安全機制
├── document.js     ← 呼叫 OpenApiGeneratorV3.generateDocument()，組出完整 document object
├── paths/
│   ├── index.js    ← 匯入所有路徑，觸發各 feature 的 registerPath()
│   ├── auth.paths.js    ← 4 個 Auth 端點的 OpenAPI 定義
│   └── todos.paths.js   ← 5 個 Todos 端點的 OpenAPI 定義
└── schemas/
    ├── auth.schemas.js  ← RegisterBody、LoginBody、AuthResponse 等 Zod schema
    ├── todo.schemas.js  ← Todo、CreateTodoBody、TodoResponse 等 Zod schema
    └── common.schemas.js ← ErrorResponse、MessageResponse 共用 schema
```

### 生成流程

```
server.js 頂部
  └── extendZodWithOpenApi(z)        ← 必須最早執行，擴充 Zod prototype

src/openapi/schemas/*.js
  └── z.object({...}).openapi({...}) ← Zod schema + OpenAPI metadata（example、description）

src/openapi/paths/*.js
  └── registry.registerPath({        ← 宣告每個端點的 method、path、request、responses
        method, path, tags,
        request: { body, params },
        responses: { 200: ..., 400: ... }
      })

src/openapi/document.js
  └── new OpenApiGeneratorV3(registry.definitions)
      .generateDocument(config)      ← 組出完整 OpenAPI 3.0.0 document object

scripts/generate-openapi.js          ← 執行：npm run openapi:generate
  ├── buildOpenApiDocument()         ← 取得 document object
  ├── SwaggerParser.validate(clone)  ← 驗證規格（傳入 clone 避免 $ref 被展開）
  └── fs.writeFileSync('openapi.json') ← 寫出檔案，驗證失敗則 exit(1)
```

### 生成指令

```bash
npm run openapi:generate   # 生成並驗證 openapi.json
npm run openapi:validate   # 只驗證現有的 openapi.json（適合 CI/CD）
```

### 雙重服務方式

```
即時端點：GET /openapi.json → 即時呼叫 buildOpenApiDocument()（給 Swagger UI 用）
實體檔案：openapi.json     → 由 scripts/generate-openapi.js 輸出（給 Postman、版控用）
```

兩者呼叫的是同一個 `buildOpenApiDocument()`，確保不會分歧。

---

## 3. Postman Collection 是怎麼建立的

### 第 4 階段（postman/ 資料夾）：基礎生成

```
openapi.json
   ↓
scripts/generate-postman.js（npm run postman:generate）
   ├── Converter.convert(openapiString, options)
   │     - folderStrategy: 'Tags'         → Auth、Todos 分資料夾
   │     - requestParametersResolution: 'Example' → 用 schema.example 填 request body
   │     - exampleParametersResolution: 'Example' → 用 example 產生範例回應
   ├── wireEnvironmentVariables()
   │     → 登入 request 的 body 改用 {{email}}/{{password}}
   │       （baseUrl 和 Bearer token 由 OpenAPI security 自動帶入，不需手動修改）
   └── fs.writeFileSync('postman/collection.json')
```

**為什麼要 `wireEnvironmentVariables()`**：Converter 產生的登入 body 是寫死的範例值。腳本把它換成 `{{email}}/{{password}}`，讓帳密由 Postman environment 管理，而不是寫死在 collection。

### 第 5 階段（postman-runner/ 資料夾）：加入自動化測試

在基礎生成之上，增加了完整的 Collection Runner 支援：

```
scripts/generate-postman.js（更進階版）
   ├── buildSpecIndex(openapi)
   │     → 從 openapi.json 建立對照表：
   │       「METHOD 路徑」 → { successCode, required fields }
   │       例：'POST api/todos' → { successCode: 201, required: ['todo'] }
   ├── Converter.convert(...)           ← 同上
   └── wireCollection(collection, specIndex)
         ├── 登入 body → {{email}}/{{password}}
         ├── 註冊 body → {{registerEmail}}（動態 email）
         │   + pre-request script：
         │       pm.variables.set("registerEmail", "user_" + Date.now() + "@example.com")
         ├── /:id 路徑變數 → {{todoId}}
         └── 每個 request 加上 test script：
               - 登入：先存 token → pm.environment.set("bearerToken", token)
               - 建 Todo：先存 id → pm.environment.set("todoId", todo.id)
               - 所有端點：
                   pm.test("狀態碼 201", () => pm.response.to.have.status(201))
                   pm.test("回應含必要欄位", () => expect(json).to.have.property("todo"))
```

### 自動測試的關鍵設計

測試內容（斷言什麼狀態碼、回應要有哪些欄位）**全部從 openapi.json 讀取**，不是手寫。因此只要 API 改了 response schema 並重新生成，測試也會自動同步更新。

---

## 4. openAPI 資料夾 vs Claude (main_TEST) 的差異

### 差異對照表

| 面向 | openAPI 資料夾 | Claude 建立（main_TEST） |
|------|---------------|-------------------------|
| **OpenAPI 版本** | 3.0.0 | 3.1.0 |
| **Generator class** | `OpenApiGeneratorV3` | `OpenApiGeneratorV31` |
| **Schema 位置** | `src/openapi/schemas/` | `src/schemas/`（在 openapi/ 外層） |
| **路徑註冊** | 拆成獨立檔案：`paths/auth.paths.js`、`paths/todos.paths.js` | 集中在單一 `openapi/registry.js` |
| **Document 建立** | 獨立的 `src/openapi/document.js` | `src/openapi/generator.js` |
| **驗證時機** | **寫檔前（阻塞式）**，驗證失敗 → exit 1 | **伺服器啟動時（非阻塞）**，只記 log |
| **openapi.json 輸出** | 有，`scripts/generate-openapi.js` | 無（只有 `/openapi.json` 即時端點） |
| **Postman 支援** | 有（`openapi-to-postmanv2` 自動生成） | 無 |
| **自動化測試注入** | 有（postman-runner 階段） | 無 |

### 最關鍵的架構差異

**路徑定義的分拆方式**：

openAPI 資料夾把每個 feature 的路徑定義拆成獨立檔案：
```
src/openapi/paths/
├── auth.paths.js    ← 只有 Auth 的 4 個端點
└── todos.paths.js   ← 只有 Todos 的 5 個端點
```

Claude 版本把所有端點集中在一個檔案：
```
src/openapi/
└── registry.js      ← 所有 9 個端點都在這裡
```

openAPI 資料夾的作法更符合「隨 feature 成長可持續擴展」的設計，每個 feature 只需新增一個 `xxx.paths.js` 即可。

**驗證嚴格程度**：

openAPI 資料夾的驗證是**阻塞式的**（寫檔指令失敗就停下來），確保 `openapi.json` 永遠是合法的規格。Claude 版本是**非阻塞式的**（只記 log），優先確保 API 服務可以啟動。

**版本選擇**：

openAPI 資料夾用 OpenAPI **3.0.0** 而不是 3.1.0，主要原因是：`openapi-to-postmanv2` 套件對 3.0.0 的支援比 3.1.0 更穩定，在後續轉 Postman collection 時相容性更好。

---

## 5. 推測的建立方式與提示詞策略

### 代碼風格特徵

openAPI 資料夾的代碼有幾個明顯特徵，可以推測建立方式：

1. **全程教學注解**：每個設計決策都有「教學重點：」注解，說明「為什麼這樣設計」而不只是「做了什麼」。
2. **漸進式演進**：5 個資料夾各自完整、獨立，每一步只增加一個新概念，適合逐步學習。
3. **一致的中文用語**：所有注解、錯誤訊息、API 說明都用繁體中文。
4. **刻意保持的設計原則**：Single Source of Truth、阻塞式驗證、環境變數分離，這些都是刻意選擇的設計，不是偶然。

### 推測的提示詞差異

Claude (main_TEST) 的建立方式 vs openAPI 資料夾，可能的提示詞差異：

| 決策點 | openAPI 資料夾的提示方向 | Claude 版本的預設行為 |
|--------|--------------------------|----------------------|
| OpenAPI 版本 | 明確指定「用 OpenAPI 3.0.0」 | 預設選最新版（3.1.0） |
| 路徑組織 | 「每個 feature 拆成獨立路徑檔案」 | 集中在 registry.js（架構較簡單） |
| 驗證方式 | 「生成腳本驗證失敗要 exit(1)」 | 非阻塞式，優先讓服務跑起來 |
| 輸出檔案 | 「需要 scripts 輸出 openapi.json 實體檔案」 | 只實作即時端點 |
| Postman 整合 | 「需要自動生成 Postman collection」 | 不在預設範疇內 |
| 教學注解 | 「每個設計決策加教學重點注解」 | 預設不加注解 |

### 總結

openAPI 資料夾是一個**明確設計過的教學型專案**，每個技術選擇都有教學意圖：
- 用 3.0.0 是為了後續 Postman 生成相容性
- 路徑拆檔是為了示範「可擴展」的架構
- 阻塞式驗證是為了示範「CI/CD 友善」的做法
- 漸進式 5 個資料夾是為了讓學習者可以逐步理解每個層次

Claude 版本（main_TEST）是在**沒有指定這些細節**的情況下建立的，因此採用了「夠用就好」的預設策略：集中管理、非阻塞驗證、只做即時端點、不帶教學注解。

---

## 附錄：完整技術棧對照

| 層次 | 套件 | openAPI | postman | postman-runner |
|------|------|---------|---------|----------------|
| Schema | `zod` | ✅ | ✅ | ✅ |
| OpenAPI 生成 | `@asteasolutions/zod-to-openapi` | ✅ | ✅ | ✅ |
| 規格驗證 | `@apidevtools/swagger-parser` | ✅ | ✅ | ✅ |
| Swagger UI | `swagger-ui-express` | ✅ | ✅ | ✅ |
| Postman 生成 | `openapi-to-postmanv2` | ❌ | ✅ | ✅ |
| 自動測試注入 | 自訂腳本 | ❌ | ❌ | ✅ |
