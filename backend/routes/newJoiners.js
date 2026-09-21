const express = require('express');
const router = express.Router();
const NewJoinersController = require('../controllers/NewJoinerController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateNewJoiner } = require('../validators/newJoinerValidator');

router.get('/', authenticateJWT, checkPermission('onboarding', 'new_joiners', 'view'), NewJoinersController.list);
router.get('/dashboard', authenticateJWT, checkPermission('onboarding', 'new_joiners', 'view'), NewJoinersController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('onboarding', 'new_joiners', 'view'), NewJoinersController.getById);

router.post('/', authenticateJWT, checkPermission('onboarding', 'new_joiners', 'create'), validationMiddleware(validateNewJoiner), NewJoinersController.create);
router.put('/:id', authenticateJWT, checkPermission('onboarding', 'new_joiners', 'edit'), validationMiddleware(validateNewJoiner), NewJoinersController.update);
router.delete('/:id', authenticateJWT, checkPermission('onboarding', 'new_joiners', 'delete'), NewJoinersController.delete);

module.exports = router;
