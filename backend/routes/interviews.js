const express = require('express');
const router = express.Router();
const InterviewScheduleController = require('../controllers/InterviewScheduleController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateInterview } = require('../validators/interviewValidator');

router.get('/', authenticateJWT, checkPermission('recruitment', 'interview_schedule', 'view'), InterviewScheduleController.list);
router.get('/dashboard', authenticateJWT, checkPermission('recruitment', 'interview_schedule', 'view'), InterviewScheduleController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('recruitment', 'interview_schedule', 'view'), InterviewScheduleController.getById);

router.post('/', authenticateJWT, checkPermission('recruitment', 'interview_schedule', 'create'), validationMiddleware(validateInterview), InterviewScheduleController.create);
router.put('/:id', authenticateJWT, checkPermission('recruitment', 'interview_schedule', 'edit'), validationMiddleware(validateInterview), InterviewScheduleController.update);
router.put('/:id/status', authenticateJWT, checkPermission('recruitment', 'interview_schedule', 'edit'), InterviewScheduleController.updateStatus);
router.delete('/:id', authenticateJWT, checkPermission('recruitment', 'interview_schedule', 'delete'), InterviewScheduleController.delete);

module.exports = router;
