const express = require('express');
const router = express.Router();
const MilestoneController = require('../controllers/MilestoneController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateMilestone } = require('../validators/milestoneValidator');

router.get('/', authenticateJWT, checkPermission('projects', 'milestones', 'view'), MilestoneController.list);
router.get('/dashboard', authenticateJWT, checkPermission('projects', 'milestones', 'view'), MilestoneController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('projects', 'milestones', 'view'), MilestoneController.getById);

router.post('/', authenticateJWT, checkPermission('projects', 'milestones', 'create'), validationMiddleware(validateMilestone), MilestoneController.create);
router.put('/:id', authenticateJWT, checkPermission('projects', 'milestones', 'edit'), validationMiddleware(validateMilestone), MilestoneController.update);
router.put('/:id/complete', authenticateJWT, checkPermission('projects', 'milestones', 'edit'), MilestoneController.complete);
router.delete('/:id', authenticateJWT, checkPermission('projects', 'milestones', 'delete'), MilestoneController.delete);

module.exports = router;