// Todo CRUD controller。所有操作都以「目前登入者」為範圍（req.user 由 apiAuth 提供）。
const store = require('../data/store');

// GET /api/todos
function list(req, res) {
  const todos = store.listTodosByUser(req.user.id);
  return res.json({ todos });
}

// GET /api/todos/:id
function getOne(req, res) {
  const todo = store.findTodo(req.user.id, req.params.id);
  if (!todo) {
    return res.status(404).json({ message: '找不到此 todo' });
  }
  return res.json({ todo });
}

// POST /api/todos
function create(req, res) {
  // req.body 已由 validate(CreateTodoBody) 驗證並轉換（title 去頭尾空白、completed 為布林或 undefined）。
  const { title, completed } = req.body;

  const todo = store.createTodo({
    userId: req.user.id,
    title,
    completed,
  });

  return res.status(201).json({ todo });
}

// PUT /api/todos/:id
function update(req, res) {
  const todo = store.findTodo(req.user.id, req.params.id);
  if (!todo) {
    return res.status(404).json({ message: '找不到此 todo' });
  }

  // req.body 已由 validate(UpdateTodoInput) 驗證：至少提供一個欄位，且 title（若有）去空白後非空。
  const { title, completed } = req.body;

  store.updateTodo(todo, { title, completed });

  return res.json({ todo });
}

// DELETE /api/todos/:id
function remove(req, res) {
  const deleted = store.deleteTodo(req.user.id, req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: '找不到此 todo' });
  }
  return res.status(204).end();
}

module.exports = { list, getOne, create, update, remove };
