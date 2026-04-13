const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const validateSchema = require('../middlewares/validate');
const { CreateUserSchema, UpdateUserSchema, LoginUserSchema } = require('../schemas/user.schema');
const authMiddleware = require('../middlewares/auth');

// POST /api/users/login
router.post('/login', validateSchema(LoginUserSchema), userController.loginUser);

// GET /api/users
router.get('/', authMiddleware, userController.getUsers);

// GET /api/users/:id
router.get('/:id', authMiddleware, userController.getUserById);

// POST /api/users
router.post('/', authMiddleware, validateSchema(CreateUserSchema), userController.createUser);

// PUT /api/users/:id
router.put('/:id', authMiddleware, validateSchema(UpdateUserSchema), userController.updateUser);

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;
