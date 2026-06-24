// 【複製後只需改 title / description / servers 三處】
// 負責組出完整的 OpenAPI document object。
// paths/index.js 的 require 會觸發所有端點的 registerPath（side-effect import）。
const { OpenApiGeneratorV3 } = require('@asteasolutions/zod-to-openapi');
const registry = require('./registry');

require('./paths/index'); // 觸發所有端點的 registerPath

function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      // ↓↓↓ 這三行是每個專案需要修改的地方 ↓↓↓
      title: '你的 API 名稱',
      version: '1.0.0',
      description: '你的 API 描述',
      // ↑↑↑
    },
    servers: [
      // ↓ 改成你的 server URL
      { url: 'http://localhost:3000', description: '本機開發' },
    ],
  });
}

module.exports = { buildOpenApiDocument };
