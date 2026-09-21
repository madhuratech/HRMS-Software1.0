const express = require('express');
const router = express.Router();
const { FeedbackController } = require('../controllers/PerformanceController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateFeedback } = require('../validators/performanceValidators');

router.get('/', authenticateJWT, checkPermission('performance', 'feedback', 'view'), FeedbackController.list);
router.get('/dashboard', authenticateJWT, checkPermission('performance', 'feedback', 'view'), FeedbackController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('performance', 'feedback', 'view'), FeedbackController.getById);

router.post('/', authenticateJWT, checkPermission('performance', 'feedback', 'create'), validationMiddleware(validateFeedback), FeedbackController.create);
router.put('/:id', authenticateJWT, checkPermission('performance', 'feedback', 'edit'), validationMiddleware(validateFeedback), FeedbackController.update);
router.delete('/:id', authenticateJWT, checkPermission('performance', 'feedback', 'delete'), FeedbackController.delete);

module.exports = router;
