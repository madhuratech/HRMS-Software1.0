const express = require('express');
const router = express.Router();
const OfferLetterController = require('../controllers/OfferLetterController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateOfferLetter } = require('../validators/offerLetterValidator');

router.get('/', authenticateJWT, checkPermission('recruitment', 'offer_letters', 'view'), OfferLetterController.list);
router.get('/:id', authenticateJWT, checkPermission('recruitment', 'offer_letters', 'view'), OfferLetterController.getById);
router.get('/:id/download', authenticateJWT, checkPermission('recruitment', 'offer_letters', 'view'), OfferLetterController.downloadPdf);
router.post('/:id/send', authenticateJWT, checkPermission('recruitment', 'offer_letters', 'edit'), OfferLetterController.sendEmail);

router.post('/', authenticateJWT, checkPermission('recruitment', 'offer_letters', 'create'), validationMiddleware(validateOfferLetter), OfferLetterController.create);
router.put('/:id', authenticateJWT, checkPermission('recruitment', 'offer_letters', 'edit'), validationMiddleware(validateOfferLetter), OfferLetterController.update);
router.delete('/:id', authenticateJWT, checkPermission('recruitment', 'offer_letters', 'delete'), OfferLetterController.delete);

module.exports = router;
