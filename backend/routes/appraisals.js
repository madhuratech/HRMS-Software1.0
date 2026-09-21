const express = require('express');
const router = express.Router();
const { AppraisalController } = require('../controllers/PerformanceController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateAppraisal } = require('../validators/performanceValidators');

router.get('/', authenticateJWT, checkPermission('performance', 'appraisals', 'view'), AppraisalController.list);
router.get('/dashboard', authenticateJWT, checkPermission('performance', 'appraisals', 'view'), AppraisalController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('performance', 'appraisals', 'view'), AppraisalController.getById);

router.post('/', authenticateJWT, checkPermission('performance', 'appraisals', 'create'), validationMiddleware(validateAppraisal), AppraisalController.create);
router.put('/:id', authenticateJWT, checkPermission('performance', 'appraisals', 'edit'), validationMiddleware(validateAppraisal), AppraisalController.update);
router.delete('/:id', authenticateJWT, checkPermission('performance', 'appraisals', 'delete'), AppraisalController.delete);

module.exports = router;
