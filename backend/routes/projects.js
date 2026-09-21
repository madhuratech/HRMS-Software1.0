const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/ProjectController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateProject } = require('../validators/projectValidator');

router.get('/', authenticateJWT, checkPermission('projects', 'projects_list', 'view'), ProjectController.list);
router.get('/meta', authenticateJWT, checkPermission('projects', 'projects_list', 'view'), ProjectController.meta);
router.get('/dashboard', authenticateJWT, checkPermission('projects', 'project_dashboard', 'view'), ProjectController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('projects', 'projects_list', 'view'), ProjectController.getById);

router.post('/', authenticateJWT, checkPermission('projects', 'projects_list', 'create'), validationMiddleware(validateProject), ProjectController.create);
router.put('/:id', authenticateJWT, checkPermission('projects', 'projects_list', 'edit'), validationMiddleware(validateProject), ProjectController.update);
router.delete('/:id', authenticateJWT, checkPermission('projects', 'projects_list', 'delete'), ProjectController.delete);

module.exports = router;