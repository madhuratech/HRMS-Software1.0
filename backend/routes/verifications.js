const express = require('express');
const router = express.Router();
const DocumentVerificationController = require('../controllers/DocumentVerificationController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateDocumentVerification } = require('../validators/documentVerificationValidator');
const upload = require('../utils/fileUpload');

const uploadFields = upload.fields([
  { name: 'aadhaar_card', maxCount: 1 },
  { name: 'pan_card', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'passport', maxCount: 1 },
  { name: 'degree_certificate', maxCount: 1 },
  { name: 'experience_certificate', maxCount: 1 },
  { name: 'relieving_letter', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'bank_passbook', maxCount: 1 },
  { name: 'driving_license', maxCount: 1 }
]);

router.get('/', authenticateJWT, checkPermission('onboarding', 'document_verification', 'view'), DocumentVerificationController.list);
router.get('/stats', authenticateJWT, checkPermission('onboarding', 'document_verification', 'view'), DocumentVerificationController.getStats);
router.get('/:id', authenticateJWT, checkPermission('onboarding', 'document_verification', 'view'), DocumentVerificationController.getById);

router.post('/', authenticateJWT, checkPermission('onboarding', 'document_verification', 'create'), uploadFields, validationMiddleware(validateDocumentVerification), DocumentVerificationController.create);
router.put('/:id', authenticateJWT, checkPermission('onboarding', 'document_verification', 'edit'), uploadFields, validationMiddleware(validateDocumentVerification), DocumentVerificationController.update);
router.put('/:id/complete', authenticateJWT, checkPermission('onboarding', 'document_verification', 'edit'), DocumentVerificationController.complete);
router.delete('/:id', authenticateJWT, checkPermission('onboarding', 'document_verification', 'delete'), DocumentVerificationController.delete);

module.exports = router;
