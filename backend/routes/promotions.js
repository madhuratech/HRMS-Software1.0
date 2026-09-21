const express = require('express');
const router = express.Router();
const { PromotionController } = require('../controllers/PerformanceController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validatePromotion } = require('../validators/performanceValidators');

router.get('/', authenticateJWT, checkPermission('performance', 'performance_promotions', 'view'), PromotionController.list);
router.get('/dashboard', authenticateJWT, checkPermission('performance', 'performance_promotions', 'view'), PromotionController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('performance', 'performance_promotions', 'view'), PromotionController.getById);

router.post('/', authenticateJWT, checkPermission('performance', 'performance_promotions', 'create'), validationMiddleware(validatePromotion), PromotionController.create);
router.put('/:id', authenticateJWT, checkPermission('performance', 'performance_promotions', 'edit'), validationMiddleware(validatePromotion), PromotionController.update);
router.delete('/:id', authenticateJWT, checkPermission('performance', 'performance_promotions', 'delete'), PromotionController.delete);

module.exports = router;
