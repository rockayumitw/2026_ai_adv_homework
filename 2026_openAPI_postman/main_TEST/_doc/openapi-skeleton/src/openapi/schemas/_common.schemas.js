// 【直接複製，不需要修改】
// 共用的 response schema：錯誤回應和訊息回應。
// 幾乎所有 Express API 都有這兩個，直接複製即可。
const { z } = require('../zod'); // 從 zod.js 取得，確保 .openapi() 已被擴充

const ErrorSchema = z
  .object({
    message: z.string().openapi({ example: '錯誤訊息' }),
  })
  .openapi('ErrorResponse');

const MessageSchema = z
  .object({
    message: z.string().openapi({ example: '操作成功' }),
  })
  .openapi('MessageResponse');

module.exports = { ErrorSchema, MessageSchema };
