// 認證相關 schema：註冊 / 登入的輸入，以及對外的使用者與認證回應。
const { z } = require('../zod');

// 註冊輸入：name、email、password 皆必填；密碼至少 6 碼。
const RegisterBody = z
  .object({
    name: z.string().min(1).openapi({ example: 'Demo User' }),
    email: z.email().openapi({ example: 'demo@example.com' }),
    password: z.string().min(6).openapi({ example: 'demo1234', description: '至少 6 碼' }),
  })
  .openapi('RegisterBody');

// 登入輸入：只要求 email 格式與密碼非空（密碼長度交給比對結果決定）。
const LoginBody = z
  .object({
    email: z.email().openapi({ example: 'demo@example.com' }),
    password: z.string().min(1).openapi({ example: 'demo1234' }),
  })
  .openapi('LoginBody');

// 對外回傳的使用者資料（不含 passwordHash）。
const PublicUser = z
  .object({
    id: z.number().int().openapi({ example: 1 }),
    name: z.string().openapi({ example: 'Demo User' }),
    email: z.email().openapi({ example: 'demo@example.com' }),
    createdAt: z.string().openapi({ example: '2026-06-09T00:00:00.000Z' }),
  })
  .openapi('PublicUser');

// 註冊 / 登入成功的回應：使用者資料 + JWT。
const AuthResponse = z
  .object({
    user: PublicUser,
    token: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
  })
  .openapi('AuthResponse');

module.exports = { RegisterBody, LoginBody, PublicUser, AuthResponse };
