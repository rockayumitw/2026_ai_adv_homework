// /api/auth 路由
const express = require('express');
const authController = require('../controllers/authController');
const { apiAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { RegisterBody, LoginBody } = require('../openapi/schemas/auth.schema');

const router = express.Router();

// validate() 以 zod schema 擋下不合法輸入（回 400）；通過後才進 controller。
router.post('/register', validate({ body: RegisterBody }), authController.register);
router.post('/login', validate({ body: LoginBody }), authController.login);
router.post('/logout', authController.logout);
router.get('/me', apiAuth, authController.me);

module.exports = router;
