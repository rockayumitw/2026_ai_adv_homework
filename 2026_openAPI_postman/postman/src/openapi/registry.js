// OpenAPI 註冊中心（OpenAPIRegistry）。
// 教學重點：
//   - schema 與「路由 ↔ schema 的對應」都集中註冊在這裡（路由部分在 paths/ 內）。
//   - 由於「request 驗證用的 zod schema」與「這裡產生文件用的 schema」是同一份，
//     文件不會與實作 drift —— 這正是 schema-first（zod 衍生）相對手寫文件的核心優勢。
//   - 本檔負責建立 registry 與 securitySchemes 基礎；各端點的路由在 src/openapi/paths/ 註冊。
const { OpenAPIRegistry } = require('@asteasolutions/zod-to-openapi');
const config = require('../config');

const registry = new OpenAPIRegistry();

// 安全機制：本 API 同時支援兩種帶 token 的方式
//   1. Authorization: Bearer <JWT>  → 方便 Swagger UI / Postman 測試
//   2. httpOnly cookie              → 給瀏覽器頁面使用（cookie 名稱由設定決定）
const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

const cookieAuth = registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: config.cookieName,
});

// 給需要登入的路由引用：代表「Bearer 或 cookie 擇一即可」
const AUTH_REQUIRED = [{ [bearerAuth.name]: [] }, { [cookieAuth.name]: [] }];

module.exports = { registry, AUTH_REQUIRED };
