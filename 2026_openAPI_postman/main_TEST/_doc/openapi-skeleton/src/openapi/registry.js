// 【直接複製，不需要修改】
// 只負責兩件事：建立 registry + 註冊 security schemes。
// 端點定義全部在 paths/ 資料夾，不要寫在這裡。
const { OpenAPIRegistry } = require('@asteasolutions/zod-to-openapi');

const registry = new OpenAPIRegistry();

// Swagger UI / Postman 用 Bearer token
registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: '貼上 login 端點回傳的 token 值',
});

// 瀏覽器用 httpOnly cookie（Swagger UI 無法模擬，僅文件記錄用）
registry.registerComponent('securitySchemes', 'CookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'token',
  description: '瀏覽器自動附加的 httpOnly cookie（Swagger UI 請改用 BearerAuth）',
});

module.exports = registry;
