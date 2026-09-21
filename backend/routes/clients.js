const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/ClientController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');

// Active list for dropdowns (accessible to all authenticated users)
router.get('/active/list', authenticateJWT, ClientController.activeList);

// CRUD routes
router.get('/',    authenticateJWT, checkPermission('clients', 'client_management', 'view'),   ClientController.list);
router.post('/',   authenticateJWT, checkPermission('clients', 'client_management', 'create'), ClientController.create);

router.get('/:id',          authenticateJWT, checkPermission('clients', 'client_management', 'view'),   ClientController.getById);
router.put('/:id',          authenticateJWT, checkPermission('clients', 'client_management', 'edit'),   ClientController.update);
router.delete('/:id',       authenticateJWT, checkPermission('clients', 'client_management', 'delete'), ClientController.delete);
router.get('/:id/projects', authenticateJWT, checkPermission('clients', 'client_projects',    'view'),   ClientController.clientProjects);
router.get('/:id/activity', authenticateJWT, checkPermission('clients', 'client_management', 'view'),   ClientController.clientActivity);

module.exports = router;
