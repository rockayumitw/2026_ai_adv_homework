// 共用 schema：錯誤回應、訊息回應、路徑參數。
const { z } = require('../zod');

// 統一的錯誤回應格式（對應 errorHandler 與 validate middleware）。
const ErrorResponse = z
  .object({
    message: z.string().openapi({ example: '輸入驗證失敗' }),
    // 僅在「輸入驗證失敗」時出現：逐欄位列出錯誤。
    errors: z
      .array(
        z.object({
          path: z.string().openapi({ example: 'title' }),
          message: z.string().openapi({ example: 'title 為必填' }),
        })
      )
      .optional(),
  })
  .openapi('ErrorResponse');

// 只含訊息的回應（例如登出）。
const MessageResponse = z
  .object({ message: z.string().openapi({ example: '已登出' }) })
  .openapi('MessageResponse');

// 路徑參數 :id —— 字串會被 coerce 成正整數；非數字會驗證失敗回 400。
const IdParam = z.object({
  id: z.coerce.number().int().positive().openapi({ example: 1 }),
});

module.exports = { ErrorResponse, MessageResponse, IdParam };
