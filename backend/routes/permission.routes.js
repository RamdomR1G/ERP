const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');

router.get('/', permissionController.getPermissions);
router.post('/', permissionController.createPermission); // Opcional por si en un futuro la UI crea permisos

module.exports = router;
