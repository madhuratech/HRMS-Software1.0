const express = require('express');
const router = express.Router();
const CandidateController = require('../controllers/CandidateController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateCandidate } = require('../validators/candidateValidator');
const upload = require('../utils/fileUpload');

// Base routes protected by authenticateJWT & checkPermission
router.get('/', authenticateJWT, checkPermission('recruitment', 'candidates', 'view'), CandidateController.list);
router.get('/dropdown', authenticateJWT, checkPermission('recruitment', 'candidates', 'view'), CandidateController.dropdown);
router.get('/:id', authenticateJWT, checkPermission('recruitment', 'candidates', 'view'), CandidateController.getById);

router.post('/', authenticateJWT, checkPermission('recruitment', 'candidates', 'create'), upload.single('resume'), validationMiddleware(validateCandidate), CandidateController.create);
router.put('/:id', authenticateJWT, checkPermission('recruitment', 'candidates', 'edit'), upload.single('resume'), validationMiddleware(validateCandidate), CandidateController.update);
router.delete('/:id', authenticateJWT, checkPermission('recruitment', 'candidates', 'delete'), CandidateController.delete);

// Dedicated Evaluation routes (Shortlist / Reject with backend validation)
router.get('/:id/ats-evaluation', authenticateJWT, checkPermission('recruitment', 'screening', 'view'), CandidateController.getAtsEvaluation);
router.post('/:id/evaluate', authenticateJWT, checkPermission('recruitment', 'screening', 'edit'), CandidateController.evaluate);
router.put('/:id/evaluate', authenticateJWT, checkPermission('recruitment', 'screening', 'edit'), CandidateController.evaluate);

// Candidate to Employee Conversion
router.post('/:id/convert-to-employee', authenticateJWT, checkPermission('recruitment', 'candidates', 'edit'), CandidateController.convertToEmployee);

// Candidate Experiences
router.get('/:id/experiences', authenticateJWT, checkPermission('recruitment', 'candidates', 'view'), CandidateController.getCandidateExperiences);
router.post('/:id/experiences', authenticateJWT, checkPermission('recruitment', 'candidates', 'edit'), CandidateController.addCandidateExperience);

module.exports = router;

