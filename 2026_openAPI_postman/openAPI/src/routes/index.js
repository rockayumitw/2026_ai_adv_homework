// 路由匯整：把 API 與頁面路由掛到 app 上。
const authRoutes = require('./authRoutes');
const todoRoutes = require('./todoRoutes');
const docsRoutes = require('./docsRoutes');
const pageRoutes = require('./pageRoutes');

function registerRoutes(app) {
  // RESTful API
  app.use('/api/auth', authRoutes);
  app.use('/api/todos', todoRoutes);

  // API 文件（/openapi.json，後續再加 Swagger UI）；放在頁面路由之前。
  app.use('/', docsRoutes);

  // EJS 頁面
  app.use('/', pageRoutes);
}

module.exports = registerRoutes;
