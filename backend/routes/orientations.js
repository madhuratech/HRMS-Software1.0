const express = require('express');
const router = express.Router();
const OrientationController = require('../controllers/OrientationController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateOrientation } = require('../validators/orientationValidator');

router.get('/', authenticateJWT, checkPermission('onboarding', 'orientation', 'view'), OrientationController.list);
router.get('/dashboard', authenticateJWT, checkPermission('onboarding', 'orientation', 'view'), OrientationController.getDashboard);
router.get('/eligible', authenticateJWT, checkPermission('onboarding', 'orientation', 'view'), OrientationController.getEligibleJoiners);
router.get('/:id', authenticateJWT, checkPermission('onboarding', 'orientation', 'view'), OrientationController.getById);

router.post('/', authenticateJWT, checkPermission('onboarding', 'orientation', 'create'), validationMiddleware(validateOrientation), OrientationController.schedule);
router.put('/:id', authenticateJWT, checkPermission('onboarding', 'orientation', 'edit'), validationMiddleware(validateOrientation), OrientationController.update);
router.put('/:id/complete', authenticateJWT, checkPermission('onboarding', 'orientation', 'edit'), OrientationController.complete);
router.delete('/:id', authenticateJWT, checkPermission('onboarding', 'orientation', 'delete'), OrientationController.delete);

module.exports = router;
