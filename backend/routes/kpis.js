const express = require('express');
const router = express.Router();
const { KpiController } = require('../controllers/PerformanceController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateKpi } = require('../validators/performanceValidators');

router.get('/', authenticateJWT, checkPermission('performance', 'kpis', 'view'), KpiController.list);
router.get('/dashboard', authenticateJWT, checkPermission('performance', 'kpis', 'view'), KpiController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('performance', 'kpis', 'view'), KpiController.getById);

router.post('/', authenticateJWT, checkPermission('performance', 'kpis', 'create'), validationMiddleware(validateKpi), KpiController.create);
router.put('/:id', authenticateJWT, checkPermission('performance', 'kpis', 'edit'), validationMiddleware(validateKpi), KpiController.update);
router.delete('/:id', authenticateJWT, checkPermission('performance', 'kpis', 'delete'), KpiController.delete);

module.exports = router;
