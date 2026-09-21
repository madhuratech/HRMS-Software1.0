const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/TaskController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateTask } = require('../validators/taskValidator');

router.get('/', authenticateJWT, checkPermission('projects', 'tasks', 'view'), TaskController.list);
router.get('/dashboard', authenticateJWT, checkPermission('projects', 'tasks', 'view'), TaskController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('projects', 'tasks', 'view'), TaskController.getById);

router.post('/', authenticateJWT, checkPermission('projects', 'tasks', 'create'), validationMiddleware(validateTask), TaskController.create);
router.put('/:id', authenticateJWT, checkPermission('projects', 'tasks', 'edit'), validationMiddleware(validateTask), TaskController.update);
router.put('/:id/status', authenticateJWT, checkPermission('projects', 'tasks', 'edit'), TaskController.updateStatus);
router.delete('/:id', authenticateJWT, checkPermission('projects', 'tasks', 'delete'), TaskController.delete);

module.exports = router;