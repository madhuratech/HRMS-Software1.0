const express = require('express');
const router = express.Router();
const RbacController = require('../controllers/RbacController');
const { authenticateJWT, checkRole } = require('../middlewares/auth');

router.use(authenticateJWT);

router.get('/modules', RbacController.getModules);
router.get('/roles', RbacController.getRoles);
router.get('/permissions/:roleKey', RbacController.getRolePermissions);
router.post('/roles', checkRole(['SUPER_ADMIN', 'ADMIN']), RbacController.createRole);
router.put('/permissions/:roleKey', checkRole(['SUPER_ADMIN', 'ADMIN']), RbacController.updateRolePermissions);
router.delete('/roles/:roleKey', checkRole(['SUPER_ADMIN', 'ADMIN']), RbacController.deleteRole);
router.get('/user-permissions', RbacController.getUserPermissions);

module.exports = router;
