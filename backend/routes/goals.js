const express = require('express');
const router = express.Router();
const { GoalController } = require('../controllers/PerformanceController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateGoal } = require('../validators/goalValidator');

router.get('/', authenticateJWT, checkPermission('performance', 'goals', 'view'), GoalController.list);
router.get('/dashboard', authenticateJWT, checkPermission('performance', 'goals', 'view'), GoalController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('performance', 'goals', 'view'), GoalController.getById);

router.post('/', authenticateJWT, checkPermission('performance', 'goals', 'create'), validationMiddleware(validateGoal), GoalController.create);
router.put('/:id', authenticateJWT, checkPermission('performance', 'goals', 'edit'), validationMiddleware(validateGoal), GoalController.update);
router.delete('/:id', authenticateJWT, checkPermission('performance', 'goals', 'delete'), GoalController.delete);

module.exports = router;
