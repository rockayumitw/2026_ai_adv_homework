const { OpenApiGeneratorV3 } = require('@asteasolutions/zod-to-openapi');
const registry = require('./registry');

require('./paths/index'); // 觸發所有端點的 registerPath

function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Todo List RESTful API',
      version: '1.0.0',
      description: '含 JWT 認證的 Todo List RESTful API。\n\n使用方式：先呼叫 `/api/auth/login` 取得 token，點右上角 **Authorize** 按鈕貼入後即可測試受保護的端點。',
    },
    servers: [{ url: 'http://localhost:3000', description: '本機開發' }],
  });
}

module.exports = { buildOpenApiDocument };
