// OpenAPI path and schema registration.
// IMPORTANT: extendZodWithOpenApi(z) must be called in server.js before this module loads.

const { OpenAPIRegistry } = require('@asteasolutions/zod-to-openapi');
const { z } = require('zod');

const {
  RegisterBodySchema,
  LoginBodySchema,
  AuthResponseSchema,
  MeResponseSchema,
} = require('../schemas/authSchemas');
const {
  CreateTodoBodySchema,
  UpdateTodoBodySchema,
  TodoListResponseSchema,
  TodoResponseSchema,
} = require('../schemas/todoSchemas');
const { ErrorSchema, MessageSchema } = require('../schemas/commonSchemas');

const registry = new OpenAPIRegistry();

// ---- Security schemes ----

registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: '貼上 /api/auth/login 或 /api/auth/register 回傳的 token 值',
});

// Documented for completeness; Swagger UI cannot send httpOnly cookies
registry.registerComponent('securitySchemes', 'CookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'token',
  description: '瀏覽器自動附加的 httpOnly cookie（Swagger UI 請改用 BearerAuth）',
});

// ---- Shared error response helpers ----

function commonErrors() {
  return {
    400: { description: 'Bad Request',  content: { 'application/json': { schema: ErrorSchema } } },
    500: { description: 'Server Error', content: { 'application/json': { schema: ErrorSchema } } },
  };
}

function authErrors() {
  return {
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorSchema } } },
    ...commonErrors(),
  };
}

// ---- Auth routes (/api/auth) ----

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: '註冊新帳號',
  request: {
    body: { required: true, content: { 'application/json': { schema: RegisterBodySchema } } },
  },
  responses: {
    201: { description: '建立成功', content: { 'application/json': { schema: AuthResponseSchema } } },
    409: { description: 'Email 已被使用', content: { 'application/json': { schema: ErrorSchema } } },
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: '登入',
  request: {
    body: { required: true, content: { 'application/json': { schema: LoginBodySchema } } },
  },
  responses: {
    200: { description: '登入成功', content: { 'application/json': { schema: AuthResponseSchema } } },
    401: { description: '帳號或密碼錯誤', content: { 'application/json': { schema: ErrorSchema } } },
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Auth'],
  summary: '登出（清除 auth cookie）',
  responses: {
    200: { description: '已登出', content: { 'application/json': { schema: MessageSchema } } },
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  summary: '取得目前登入使用者',
  security: [{ BearerAuth: [] }],
  responses: {
    200: { description: '目前使用者', content: { 'application/json': { schema: MeResponseSchema } } },
    ...authErrors(),
  },
});

// ---- Todo routes (/api/todos) — all require authentication ----

const idParam = z.object({ id: z.string().openapi({ example: '1' }) });

registry.registerPath({
  method: 'get',
  path: '/api/todos',
  tags: ['Todos'],
  summary: '列出所有待辦事項',
  security: [{ BearerAuth: [] }],
  responses: {
    200: { description: '待辦清單', content: { 'application/json': { schema: TodoListResponseSchema } } },
    ...authErrors(),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/todos',
  tags: ['Todos'],
  summary: '新增待辦事項',
  security: [{ BearerAuth: [] }],
  request: {
    body: { required: true, content: { 'application/json': { schema: CreateTodoBodySchema } } },
  },
  responses: {
    201: { description: '建立成功', content: { 'application/json': { schema: TodoResponseSchema } } },
    ...authErrors(),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/todos/{id}',
  tags: ['Todos'],
  summary: '取得單一待辦事項',
  security: [{ BearerAuth: [] }],
  request: { params: idParam },
  responses: {
    200: { description: '待辦事項', content: { 'application/json': { schema: TodoResponseSchema } } },
    404: { description: '找不到', content: { 'application/json': { schema: ErrorSchema } } },
    ...authErrors(),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/todos/{id}',
  tags: ['Todos'],
  summary: '更新待辦事項（title 和/或 completed）',
  security: [{ BearerAuth: [] }],
  request: {
    params: idParam,
    body: { required: true, content: { 'application/json': { schema: UpdateTodoBodySchema } } },
  },
  responses: {
    200: { description: '更新成功', content: { 'application/json': { schema: TodoResponseSchema } } },
    404: { description: '找不到', content: { 'application/json': { schema: ErrorSchema } } },
    ...authErrors(),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/todos/{id}',
  tags: ['Todos'],
  summary: '刪除待辦事項',
  security: [{ BearerAuth: [] }],
  request: { params: idParam },
  responses: {
    204: { description: '刪除成功' },
    404: { description: '找不到', content: { 'application/json': { schema: ErrorSchema } } },
    ...authErrors(),
  },
});

module.exports = registry;
