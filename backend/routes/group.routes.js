const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const validateSchema = require('../middlewares/validate');
const { CreateGroupSchema, UpdateGroupSchema } = require('../schemas/group.schema');

router.get('/', groupController.getGroups);
router.get('/:id', groupController.getGroupById);
router.post('/', validateSchema(CreateGroupSchema), groupController.createGroup);
router.put('/:id', validateSchema(UpdateGroupSchema), groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

module.exports = router;
