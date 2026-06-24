const { z } = require('../zod');
const registry = require('../registry');
const { CreateTodoBodySchema, UpdateTodoBodySchema, TodoListResponseSchema, TodoResponseSchema } = require('../schemas/todo.schemas');
const { ErrorSchema } = require('../schemas/common.schemas');

const json    = (schema) => ({ content: { 'application/json': { schema } } });
const jsonErr = { content: { 'application/json': { schema: ErrorSchema } } };
const AUTH    = [{ BearerAuth: [] }];
const idParam = z.object({ id: z.string().openapi({ example: '1' }) });

registry.registerPath({
  method: 'get',
  path: '/api/todos',
  tags: ['Todos'],
  summary: '列出所有待辦事項',
  security: AUTH,
  responses: {
    200: { description: '待辦清單', ...json(TodoListResponseSchema) },
    401: { description: 'Unauthorized', ...jsonErr },
    500: { description: 'Server Error', ...jsonErr },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/todos',
  tags: ['Todos'],
  summary: '新增待辦事項',
  security: AUTH,
  request: { body: { required: true, ...json(CreateTodoBodySchema) } },
  responses: {
    201: { description: '建立成功', ...json(TodoResponseSchema) },
    401: { description: 'Unauthorized', ...jsonErr },
    400: { description: '輸入驗證失敗', ...jsonErr },
    500: { description: 'Server Error', ...jsonErr },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/todos/{id}',
  tags: ['Todos'],
  summary: '取得單一待辦事項',
  security: AUTH,
  request: { params: idParam },
  responses: {
    200: { description: '待辦事項', ...json(TodoResponseSchema) },
    404: { description: '找不到', ...jsonErr },
    401: { description: 'Unauthorized', ...jsonErr },
    500: { description: 'Server Error', ...jsonErr },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/todos/{id}',
  tags: ['Todos'],
  summary: '更新待辦事項（title 和/或 completed）',
  security: AUTH,
  request: {
    params: idParam,
    body: { required: true, ...json(UpdateTodoBodySchema) },
  },
  responses: {
    200: { description: '更新成功', ...json(TodoResponseSchema) },
    404: { description: '找不到', ...jsonErr },
    401: { description: 'Unauthorized', ...jsonErr },
    500: { description: 'Server Error', ...jsonErr },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/todos/{id}',
  tags: ['Todos'],
  summary: '刪除待辦事項',
  security: AUTH,
  request: { params: idParam },
  responses: {
    204: { description: '刪除成功' },
    404: { description: '找不到', ...jsonErr },
    401: { description: 'Unauthorized', ...jsonErr },
    500: { description: 'Server Error', ...jsonErr },
  },
});
