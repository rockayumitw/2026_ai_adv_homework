const { z } = require('../zod');

const TodoSchema = z.object({
  id:        z.number().int().positive(),
  userId:    z.number().int().positive(),
  title:     z.string(),
  completed: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('Todo');

const CreateTodoBodySchema = z.object({
  title:     z.string().min(1).openapi({ example: '閱讀文件' }),
  completed: z.boolean().optional().openapi({ example: false }),
}).openapi('CreateTodoBody');

const UpdateTodoBodySchema = z.object({
  title:     z.string().min(1).optional(),
  completed: z.boolean().optional(),
}).openapi('UpdateTodoBody');

const TodoListResponseSchema = z.object({
  todos: z.array(TodoSchema),
}).openapi('TodoListResponse');

const TodoResponseSchema = z.object({
  todo: TodoSchema,
}).openapi('TodoResponse');

module.exports = {
  TodoSchema,
  CreateTodoBodySchema,
  UpdateTodoBodySchema,
  TodoListResponseSchema,
  TodoResponseSchema,
};
