// 註冊 /api/todos/* 端點到 OpenAPI registry。
// require 此檔即會自我註冊（在 paths/index.js 集中載入）。
const { registry, AUTH_REQUIRED } = require('../registry');
const { IdParam, ErrorResponse } = require('../schemas/common.schema');
const {
  CreateTodoBody,
  UpdateTodoBody,
  TodoResponse,
  TodoListResponse,
} = require('../schemas/todo.schema');

const TAG = 'Todos';
const json = (schema) => ({ content: { 'application/json': { schema } } });

// 此資源所有端點都需要登入（Bearer 或 cookie）。
registry.registerPath({
  method: 'get',
  path: '/api/todos',
  tags: [TAG],
  summary: '取得自己的所有 todo',
  security: AUTH_REQUIRED,
  responses: {
    200: { description: 'todo 列表', ...json(TodoListResponse) },
    401: { description: '未授權', ...json(ErrorResponse) },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/todos',
  tags: [TAG],
  summary: '建立 todo',
  security: AUTH_REQUIRED,
  request: { body: json(CreateTodoBody) },
  responses: {
    201: { description: '建立成功', ...json(TodoResponse) },
    400: { description: '輸入驗證失敗', ...json(ErrorResponse) },
    401: { description: '未授權', ...json(ErrorResponse) },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/todos/{id}',
  tags: [TAG],
  summary: '取得單一 todo',
  security: AUTH_REQUIRED,
  request: { params: IdParam },
  responses: {
    200: { description: 'todo', ...json(TodoResponse) },
    400: { description: 'id 不合法', ...json(ErrorResponse) },
    401: { description: '未授權', ...json(ErrorResponse) },
    404: { description: '找不到此 todo', ...json(ErrorResponse) },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/todos/{id}',
  tags: [TAG],
  summary: '更新 todo',
  description: 'title / completed 至少提供一個。',
  security: AUTH_REQUIRED,
  request: { params: IdParam, body: json(UpdateTodoBody) },
  responses: {
    200: { description: '更新成功', ...json(TodoResponse) },
    400: { description: '輸入驗證失敗', ...json(ErrorResponse) },
    401: { description: '未授權', ...json(ErrorResponse) },
    404: { description: '找不到此 todo', ...json(ErrorResponse) },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/todos/{id}',
  tags: [TAG],
  summary: '刪除 todo',
  security: AUTH_REQUIRED,
  request: { params: IdParam },
  responses: {
    204: { description: '刪除成功（無回應內容）' },
    400: { description: 'id 不合法', ...json(ErrorResponse) },
    401: { description: '未授權', ...json(ErrorResponse) },
    404: { description: '找不到此 todo', ...json(ErrorResponse) },
  },
});
