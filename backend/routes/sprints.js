const express = require('express');
const router = express.Router();
const SprintController = require('../controllers/SprintController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateSprint } = require('../validators/sprintValidator');

router.get('/', authenticateJWT, checkPermission('projects', 'sprint_board', 'view'), SprintController.list);
router.get('/board', authenticateJWT, checkPermission('projects', 'sprint_board', 'view'), SprintController.getBoard);
router.get('/dashboard', authenticateJWT, checkPermission('projects', 'sprint_board', 'view'), SprintController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('projects', 'sprint_board', 'view'), SprintController.getById);

router.post('/', authenticateJWT, checkPermission('projects', 'sprint_board', 'create'), validationMiddleware(validateSprint), SprintController.create);
router.put('/:id', authenticateJWT, checkPermission('projects', 'sprint_board', 'edit'), validationMiddleware(validateSprint), SprintController.update);
router.put('/:id/status', authenticateJWT, checkPermission('projects', 'sprint_board', 'edit'), SprintController.updateStatus);
router.delete('/:id', authenticateJWT, checkPermission('projects', 'sprint_board', 'delete'), SprintController.delete);

module.exports = router;