// 【範本檔案】複製成 xxx.schemas.js，填入你這個 feature 的 Zod schema。
// 每個 schema 都要加 .openapi({ example: ... })，Swagger UI 才有範例值。
const { z } = require('../zod'); // 從 zod.js 取得，確保 .openapi() 已被擴充

// ── Request body schema ──────────────────────────────────────────────────────

const ExampleBodySchema = z
  .object({
    name: z.string().min(1).openapi({ example: '範例名稱' }),
    // 加更多欄位...
  })
  .openapi('ExampleBody'); // 這個名稱會出現在 OpenAPI components/schemas 裡

// ── Response schema ──────────────────────────────────────────────────────────

const ExampleItemSchema = z
  .object({
    id: z.string().openapi({ example: '1' }),
    name: z.string().openapi({ example: '範例名稱' }),
    createdAt: z.string().openapi({ example: '2024-01-01T00:00:00.000Z' }),
  })
  .openapi('ExampleItem');

const ExampleResponseSchema = z
  .object({
    item: ExampleItemSchema,
  })
  .openapi('ExampleResponse');

const ExampleListResponseSchema = z
  .object({
    items: z.array(ExampleItemSchema),
  })
  .openapi('ExampleListResponse');

module.exports = {
  ExampleBodySchema,
  ExampleItemSchema,
  ExampleResponseSchema,
  ExampleListResponseSchema,
};
