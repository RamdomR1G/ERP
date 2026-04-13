const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const authMiddleware = require('../middlewares/auth');
const validateSchema = require('../middlewares/validate');
const { CreateGroupSchema, UpdateGroupSchema } = require('../schemas/group.schema');

router.get('/', authMiddleware, groupController.getGroups);
router.get('/:id', authMiddleware, groupController.getGroupById);
router.post('/', authMiddleware, validateSchema(CreateGroupSchema), groupController.createGroup);
router.put('/:id', authMiddleware, validateSchema(UpdateGroupSchema), groupController.updateGroup);
router.delete('/:id', authMiddleware, groupController.deleteGroup);

module.exports = router;
