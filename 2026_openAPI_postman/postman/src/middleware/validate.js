// 用 zod schema 驗證 request 的 middleware factory。
// 教學重點：
//   - 這裡用的 schema 與「產生 OpenAPI 文件」用的是同一份（src/openapi/schemas），
//     所以「文件描述的規則」與「實際擋下的規則」永遠一致，不會 drift。
//   - Express 5 的 req.query 是唯讀 getter、req.params 由 router 管理，
//     因此這裡只覆寫 req.body（順便取得 zod 轉換後的值，如 trim、型別轉換），
//     params / query 僅做驗證、不覆寫。
const { ZodError } = require('zod');

// 把 zod 的錯誤整理成「欄位 → 訊息」的陣列。
function formatIssues(error) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

// schemas: { body?, params?, query? }
function validate(schemas = {}) {
  const { body, params, query } = schemas;
  return (req, res, next) => {
    try {
      if (params) params.parse(req.params);
      if (query) query.parse(req.query);
      if (body) req.body = body.parse(req.body);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          message: '輸入驗證失敗',
          errors: formatIssues(err),
        });
      }
      return next(err);
    }
  };
}

module.exports = { validate };
