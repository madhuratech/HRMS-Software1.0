const express = require('express');
const router = express.Router();
const { ReviewController } = require('../controllers/PerformanceController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateReview } = require('../validators/performanceValidators');

router.get('/', authenticateJWT, checkPermission('performance', 'reviews', 'view'), ReviewController.list);
router.get('/dashboard', authenticateJWT, checkPermission('performance', 'reviews', 'view'), ReviewController.getDashboard);
router.get('/employee-tree/:employeeId', authenticateJWT, checkPermission('performance', 'reviews', 'view'), ReviewController.getEmployeeTree);
router.post('/calculate-preview', authenticateJWT, checkPermission('performance', 'reviews', 'view'), ReviewController.calculatePreview);
router.get('/:id', authenticateJWT, checkPermission('performance', 'reviews', 'view'), ReviewController.getById);

router.post('/', authenticateJWT, checkPermission('performance', 'reviews', 'create'), validationMiddleware(validateReview), ReviewController.create);
router.put('/:id', authenticateJWT, checkPermission('performance', 'reviews', 'edit'), validationMiddleware(validateReview), ReviewController.update);
router.delete('/:id', authenticateJWT, checkPermission('performance', 'reviews', 'delete'), ReviewController.delete);

module.exports = router;
