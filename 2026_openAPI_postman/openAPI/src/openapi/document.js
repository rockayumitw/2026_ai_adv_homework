// 由 registry 產生完整的 OpenAPI 文件物件。
// 教學重點：
//   - 文件不是「手寫」出來的，而是「跑程式」從 registry 衍生出來的。
//   - require('./paths') 會在載入時把所有端點註冊進 registry，
//     因此呼叫 buildOpenApiDocument() 前，registry 已包含全部路由與 schema。
const { OpenApiGeneratorV3 } = require('@asteasolutions/zod-to-openapi');
const { registry } = require('./registry');
const config = require('../config');
const pkg = require('../../package.json');

// 載入端點定義（自我註冊到 registry）。
// 註：commit 1 階段尚無 paths/，此時產生的文件只有 securitySchemes、paths 為空，但仍是合法的 OpenAPI 文件。
require('./paths');

function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Todo List RESTful API',
      version: pkg.version,
      description:
        '教學用 Todo List API。本文件由程式碼中的 zod schema 衍生，' +
        '與 request 驗證共用同一份 schema，確保文件與實作一致。',
    },
    servers: [
      { url: `http://localhost:${config.port}`, description: '本機開發伺服器' },
    ],
  });
}

module.exports = { buildOpenApiDocument };
