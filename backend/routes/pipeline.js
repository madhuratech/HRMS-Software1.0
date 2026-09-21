const express = require('express');
const router = express.Router();
const HiringPipelineController = require('../controllers/HiringPipelineController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateRecruitmentSource } = require('../validators/recruitmentSourceValidator');

router.get('/stats', authenticateJWT, checkPermission('recruitment', 'hiring_pipeline', 'view'), HiringPipelineController.getStats);
router.get('/sources', authenticateJWT, checkPermission('recruitment', 'hiring_pipeline', 'view'), HiringPipelineController.getSources);
router.post('/sources', authenticateJWT, checkPermission('recruitment', 'hiring_pipeline', 'create'), validationMiddleware(validateRecruitmentSource), HiringPipelineController.createSource);

module.exports = router;
