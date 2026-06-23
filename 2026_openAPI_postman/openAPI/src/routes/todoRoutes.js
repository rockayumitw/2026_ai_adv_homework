// /api/todos 路由（整個 router 都需要登入）
const express = require('express');
const todoController = require('../controllers/todoController');
const { apiAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { IdParam } = require('../openapi/schemas/common.schema');
const { CreateTodoBody, UpdateTodoInput } = require('../openapi/schemas/todo.schema');

const router = express.Router();

// 套用在此 router 的所有路由上
router.use(apiAuth);

router.get('/', todoController.list);
router.post('/', validate({ body: CreateTodoBody }), todoController.create);
router.get('/:id', validate({ params: IdParam }), todoController.getOne);
router.put('/:id', validate({ params: IdParam, body: UpdateTodoInput }), todoController.update);
router.delete('/:id', validate({ params: IdParam }), todoController.remove);

module.exports = router;
