# 紀錄

加入openAPI提示詞:
```
我要為這個專案加入 OpenAPI 文件，請協助完成整個流程。
使用技術：zod、@asteasolutions/zod-to-openapi、swagger-parser、swagger-ui-express（Swagger UI 文件頁）。
```

1. 安裝 Zod 與 zod-to-openapi，建立 registry，並註冊認證方式（Bearer / cookie）。
2. 用 Zod 定義各端點 schema，寫 validate middleware 取代手刻的 if 驗證。
補充：
使用 Zod 用來驗證輸入和輸出的格式, 取代手刻的方式
並產生出腳本 /scripts/generate-openapi.js
位於openapi > document.js 此文件也可透過ai產出
也可在 package.json 設定openAPI相關指令
3. 用 generator 產出 openapi.json，掛 /openapi.json 端點與產檔腳本。
補充備註：openAPI 相關資料可以不用 commit, 因為都可以透過指令做生成
4. 加 swagger-parser，產檔前驗證規格合法性。
5. 掛 Swagger UI 在 /api-docs，方便瀏覽與測試。 （註：Swagger UI 不需要掛載在同一個站點，也能是獨立的 HTML 頁面）
- Zod
    
    Zod 是 TypeScript / Node.js 生態裡的 schema 宣告與驗證工具。你用它寫一份 schema，它同時提供兩件事：執行期（runtime）的資料驗證，以及編譯期透過 `z.infer` 推導出來的靜態型別。所以一份 `z.object({ ... })` 既能在 API 進來的請求上做 `.parse()` 擋掉壞資料，又能讓 TypeScript 知道通過驗證後的物件長什麼樣子。
    
    它在 OpenAPI 裡扮演的核心角色，是「單一資料來源（single source of truth）」。




postman 匯入
```
請把 openapi.json 轉成 Postman Collection，並建立對應的 environment（帶 baseUrl 與帳密變數）。
使用技術：openapi-to-postmanv2、Postman environment。
```