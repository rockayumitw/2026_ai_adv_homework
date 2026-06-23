// 文件相關路由。
// 教學重點：
//   - /openapi.json：機器可讀的 OpenAPI 規格，由 registry 即時產生，永遠與 zod schema 同步。
//   - /api-docs   ：人類可讀的 Swagger UI 互動文件，讀的就是同一份規格。
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { buildOpenApiDocument } = require('../openapi/document');

const router = express.Router();

// registry 為靜態內容，啟動時產生一次即可。
const openApiDocument = buildOpenApiDocument();

// 機器可讀的 OpenAPI 規格（給 Postman / 任何工具讀取）。
router.get('/openapi.json', (req, res) => {
  res.json(openApiDocument);
});

// 人類可讀的 Swagger UI 互動文件。
router.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'Todo List API 文件',
  })
);

module.exports = router;
