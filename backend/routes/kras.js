const express = require('express');
const router = express.Router();
const { KraController } = require('../controllers/PerformanceController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateKra } = require('../validators/performanceValidators');

router.get('/', authenticateJWT, checkPermission('performance', 'kras', 'view'), KraController.list);
router.get('/dashboard', authenticateJWT, checkPermission('performance', 'kras', 'view'), KraController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('performance', 'kras', 'view'), KraController.getById);

router.post('/', authenticateJWT, checkPermission('performance', 'kras', 'create'), validationMiddleware(validateKra), KraController.create);
router.put('/:id', authenticateJWT, checkPermission('performance', 'kras', 'edit'), validationMiddleware(validateKra), KraController.update);
router.delete('/:id', authenticateJWT, checkPermission('performance', 'kras', 'delete'), KraController.delete);

module.exports = router;
