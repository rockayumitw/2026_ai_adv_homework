// 【範本檔案】複製成 xxx.paths.js，填入你這個 feature 的端點。
// 複製完後記得在 paths/index.js 加一行 require('./xxx.paths')。
const registry = require('../registry');

// 從 schemas/ 引入這個 feature 的 Zod schema
const { ExampleBodySchema, ExampleResponseSchema } = require('../schemas/_feature.schemas');
const { ErrorSchema } = require('../schemas/_common.schemas');

// 常用的 helper（讓 registerPath 的語法更簡潔）
const json = (schema) => ({ content: { 'application/json': { schema } } });
const jsonErr = { content: { 'application/json': { schema: ErrorSchema } } };
const AUTH_REQUIRED = [{ BearerAuth: [] }];

// ── 範例：不需要登入的端點 ──────────────────────────────────────────────────

registry.registerPath({
  method: 'post',             // get / post / put / patch / delete
  path: '/api/feature',       // OpenAPI 路徑格式（用 {id}，不是 :id）
  tags: ['Feature'],          // Swagger UI 的分組標籤
  summary: '建立 Feature',
  request: {
    body: { required: true, ...json(ExampleBodySchema) },
  },
  responses: {
    201: { description: '建立成功', ...json(ExampleResponseSchema) },
    400: { description: '輸入驗證失敗', ...jsonErr },
  },
});

// ── 範例：需要登入的端點 ────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/feature/{id}',  // 路徑參數用 {id}
  tags: ['Feature'],
  summary: '取得單一 Feature',
  security: AUTH_REQUIRED,    // 需要登入就加這行
  request: {
    params: require('../zod').z.object({ id: require('../zod').z.string() }),
  },
  responses: {
    200: { description: '成功', ...json(ExampleResponseSchema) },
    401: { description: '未登入', ...jsonErr },
    404: { description: '找不到', ...jsonErr },
  },
});
