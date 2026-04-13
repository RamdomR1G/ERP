const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const validateSchema = require('../middlewares/validate');
const { LoginUserSchema, RegisterUserSchema } = require('../schemas/user.schema');

// POST /api/auth/login
router.post('/login', validateSchema(LoginUserSchema), userController.loginUser);

// POST /api/auth/register
router.post('/register', validateSchema(RegisterUserSchema), userController.createUser);

module.exports = router;
