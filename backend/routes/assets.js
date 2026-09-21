const express = require('express');
const router = express.Router();
const AssetAllocationController = require('../controllers/AssetAllocationController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateAssetAllocation } = require('../validators/assetAllocationValidator');

router.get('/', authenticateJWT, checkPermission('onboarding', 'asset_allocation', 'view'), AssetAllocationController.list);
router.get('/dashboard', authenticateJWT, checkPermission('onboarding', 'asset_allocation', 'view'), AssetAllocationController.getDashboard);
router.get('/available', authenticateJWT, checkPermission('onboarding', 'asset_allocation', 'view'), AssetAllocationController.getAvailableAssets);
router.get('/:id', authenticateJWT, checkPermission('onboarding', 'asset_allocation', 'view'), AssetAllocationController.getById);

router.post('/', authenticateJWT, checkPermission('onboarding', 'asset_allocation', 'create'), validationMiddleware(validateAssetAllocation), AssetAllocationController.allocate);
router.put('/:id/return', authenticateJWT, checkPermission('onboarding', 'asset_allocation', 'edit'), AssetAllocationController.returnAsset);
router.delete('/:id', authenticateJWT, checkPermission('onboarding', 'asset_allocation', 'delete'), AssetAllocationController.delete);

module.exports = router;
