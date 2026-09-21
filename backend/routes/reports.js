const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const { authenticateJWT } = require('../middlewares/auth');

router.get('/employee', authenticateJWT, ReportController.getEmployeeReport);
router.get('/attendance', authenticateJWT, ReportController.getAttendanceReport);
router.get('/leave', authenticateJWT, ReportController.getLeaveReport);
router.get('/payroll', authenticateJWT, ReportController.getPayrollReport);
router.get('/recruitment', authenticateJWT, ReportController.getRecruitmentReport);
router.get('/performance', authenticateJWT, ReportController.getPerformanceReport);
router.get('/project', authenticateJWT, ReportController.getProjectReport);

module.exports = router;
