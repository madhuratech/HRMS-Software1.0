const express = require('express');
const router = express.Router();
const ProbationController = require('../controllers/ProbationController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateProbation } = require('../validators/probationValidator');

router.get('/', authenticateJWT, checkPermission('onboarding', 'probation', 'view'), ProbationController.list);
router.get('/dashboard', authenticateJWT, checkPermission('onboarding', 'probation', 'view'), ProbationController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('onboarding', 'probation', 'view'), ProbationController.getById);

router.post('/', authenticateJWT, checkPermission('onboarding', 'probation', 'create'), validationMiddleware(validateProbation), ProbationController.create);
router.put('/:id', authenticateJWT, checkPermission('onboarding', 'probation', 'edit'), validationMiddleware(validateProbation), ProbationController.update);
router.put('/:id/extend', authenticateJWT, checkPermission('onboarding', 'probation', 'edit'), ProbationController.extend);
router.put('/:id/complete', authenticateJWT, checkPermission('onboarding', 'probation', 'edit'), ProbationController.complete);
router.delete('/:id', authenticateJWT, checkPermission('onboarding', 'probation', 'delete'), ProbationController.delete);

module.exports = router;
