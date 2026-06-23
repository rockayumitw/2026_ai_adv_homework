// 註冊 /api/auth/* 端點到 OpenAPI registry。
// require 此檔即會自我註冊（在 paths/index.js 集中載入）。
const { z } = require('../zod');
const { registry, AUTH_REQUIRED } = require('../registry');
const { RegisterBody, LoginBody, AuthResponse, PublicUser } = require('../schemas/auth.schema');
const { ErrorResponse, MessageResponse } = require('../schemas/common.schema');

const TAG = 'Auth';
// 包裝 application/json 內容
const json = (schema) => ({ content: { 'application/json': { schema } } });

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: [TAG],
  summary: '註冊新帳號',
  description: '建立帳號，回傳使用者資料與 JWT，並把 token 設為 httpOnly cookie。',
  request: { body: json(RegisterBody) },
  responses: {
    201: { description: '註冊成功', ...json(AuthResponse) },
    400: { description: '輸入驗證失敗', ...json(ErrorResponse) },
    409: { description: 'email 已被註冊', ...json(ErrorResponse) },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: [TAG],
  summary: '登入',
  description: '驗證帳號密碼，回傳使用者資料與 JWT，並把 token 設為 httpOnly cookie。',
  request: { body: json(LoginBody) },
  responses: {
    200: { description: '登入成功', ...json(AuthResponse) },
    400: { description: '輸入驗證失敗', ...json(ErrorResponse) },
    401: { description: 'email 或密碼錯誤', ...json(ErrorResponse) },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: [TAG],
  summary: '登出',
  description: '清除存放 JWT 的 httpOnly cookie。',
  responses: {
    200: { description: '已登出', ...json(MessageResponse) },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: [TAG],
  summary: '取得目前登入的使用者',
  security: AUTH_REQUIRED,
  responses: {
    200: { description: '目前使用者', ...json(z.object({ user: PublicUser })) },
    401: { description: '未授權', ...json(ErrorResponse) },
  },
});
