const registry = require('../registry');
const { RegisterBodySchema, LoginBodySchema, AuthResponseSchema, MeResponseSchema } = require('../schemas/auth.schemas');
const { ErrorSchema, MessageSchema } = require('../schemas/common.schemas');

const json    = (schema) => ({ content: { 'application/json': { schema } } });
const jsonErr = { content: { 'application/json': { schema: ErrorSchema } } };

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: '註冊新帳號',
  request: { body: { required: true, ...json(RegisterBodySchema) } },
  responses: {
    201: { description: '建立成功', ...json(AuthResponseSchema) },
    409: { description: 'Email 已被使用', ...jsonErr },
    400: { description: '輸入驗證失敗', ...jsonErr },
    500: { description: 'Server Error', ...jsonErr },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: '登入',
  request: { body: { required: true, ...json(LoginBodySchema) } },
  responses: {
    200: { description: '登入成功', ...json(AuthResponseSchema) },
    401: { description: '帳號或密碼錯誤', ...jsonErr },
    400: { description: '輸入驗證失敗', ...jsonErr },
    500: { description: 'Server Error', ...jsonErr },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Auth'],
  summary: '登出（清除 auth cookie）',
  responses: {
    200: { description: '已登出', ...json(MessageSchema) },
    500: { description: 'Server Error', ...jsonErr },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  summary: '取得目前登入使用者',
  security: [{ BearerAuth: [] }],
  responses: {
    200: { description: '目前使用者', ...json(MeResponseSchema) },
    401: { description: 'Unauthorized', ...jsonErr },
    400: { description: 'Bad Request', ...jsonErr },
    500: { description: 'Server Error', ...jsonErr },
  },
});
