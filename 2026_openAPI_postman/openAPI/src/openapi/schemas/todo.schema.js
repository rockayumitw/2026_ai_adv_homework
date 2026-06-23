// Todo 相關 schema：資料本體、建立 / 更新輸入，以及回應包裝。
const { z } = require('../zod');

// Todo 資料本體（對應 store 內的結構）。
const Todo = z
  .object({
    id: z.number().int().openapi({ example: 1 }),
    userId: z.number().int().openapi({ example: 1 }),
    title: z.string().openapi({ example: '買牛奶' }),
    completed: z.boolean().openapi({ example: false }),
    createdAt: z.string().openapi({ example: '2026-06-09T00:00:00.000Z' }),
    updatedAt: z.string().openapi({ example: '2026-06-09T00:00:00.000Z' }),
  })
  .openapi('Todo');

// 建立 Todo 的輸入：title 必填（去頭尾空白後非空）；completed 可選。
const CreateTodoBody = z
  .object({
    title: z.string().trim().min(1).openapi({ example: '買牛奶' }),
    completed: z.boolean().optional().openapi({ example: false }),
  })
  .openapi('CreateTodoBody');

// 更新 Todo 的「欄位形狀」：title / completed 皆可選；供 OpenAPI 文件元件使用。
const UpdateTodoBody = z
  .object({
    title: z.string().trim().min(1).optional().openapi({ example: '買牛奶與麵包' }),
    completed: z.boolean().optional().openapi({ example: true }),
  })
  .openapi('UpdateTodoBody');

// 驗證用版本：額外要求「至少提供一個欄位」。
// 註：這條跨欄位規則無法表達在 JSON Schema / OpenAPI，故只用於 request 驗證，
//     文件元件採用上面的 UpdateTodoBody。
const UpdateTodoInput = UpdateTodoBody.refine(
  (data) => data.title !== undefined || data.completed !== undefined,
  { message: '請至少提供 title 或 completed' }
);

// 回應包裝。
const TodoResponse = z.object({ todo: Todo }).openapi('TodoResponse');
const TodoListResponse = z
  .object({ todos: z.array(Todo) })
  .openapi('TodoListResponse');

module.exports = {
  Todo,
  CreateTodoBody,
  UpdateTodoBody,
  UpdateTodoInput,
  TodoResponse,
  TodoListResponse,
};
