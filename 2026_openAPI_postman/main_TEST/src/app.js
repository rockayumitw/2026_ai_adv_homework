// 建立並設定 Express app（不負責啟動，方便測試與重用）。
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const registerRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { buildOpenApiDocument } = require('./openapi/document');

function createApp() {
  const app = express();

  // 檢視引擎：EJS，樣板放在 src/views
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // 解析 JSON / form 表單 / cookie
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // 靜態資源（Tailwind 產出的 CSS、前端 JS）放在專案根目錄的 public/
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // OpenAPI / Swagger UI（掛在 registerRoutes 前，避免被 notFound 攔截）
  const spec = buildOpenApiDocument();
  app.get('/openapi.json', (req, res) => res.json(spec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

  // 掛載所有路由
  registerRoutes(app);

  // 404 與錯誤處理（必須放在最後）
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
