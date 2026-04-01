const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const validateSchema = require('../middlewares/validate');
const { CreateUserSchema, UpdateUserSchema } = require('../schemas/user.schema');

// GET /api/users
router.get('/', userController.getUsers);

// GET /api/users/:id
router.get('/:id', userController.getUserById);

// POST /api/users
router.post('/', validateSchema(CreateUserSchema), userController.createUser);

// PUT /api/users/:id
router.put('/:id', validateSchema(UpdateUserSchema), userController.updateUser);

// DELETE /api/users/:id
router.delete('/:id', userController.deleteUser);

module.exports = router;
