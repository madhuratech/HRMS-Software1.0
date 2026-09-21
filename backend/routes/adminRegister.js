const express = require('express');
const router = express.Router();
const adminRegisterController = require('../controllers/adminRegisterController');
const { authenticateJWT, checkRole } = require('../middlewares/auth');

/**
 * Admin / Manager Registration Endpoints
 * Isolated from standard employee registration
 */

// 1. Submit Registration Form & Send OTP (Requires Authenticated Admin)
router.post('/send-otp', authenticateJWT, checkRole(['ADMIN', 'SUPER_ADMIN']), adminRegisterController.sendOtp);

// 2. Resend OTP
router.post('/resend-otp', adminRegisterController.resendOtp);

// 3. Verify OTP & Finalize Account Creation
router.post('/verify-otp', adminRegisterController.verifyOtp);

module.exports = router;
