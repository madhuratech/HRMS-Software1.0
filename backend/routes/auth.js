const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateJWT } = require("../middlewares/auth");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authenticateJWT, authController.getMe);
router.post("/verify-email-request", authController.verifyEmailRequest);
router.post("/verify-otp", authController.verifyOtp);

// LinkedIn OAuth Connect, Callback & Configuration
router.get("/linkedin/connect", authController.connectLinkedIn);
router.get("/linkedin/callback", authController.linkedinCallback);
router.get("/linkedin/status", authController.getLinkedInStatus);
router.post("/linkedin/token", authController.saveLinkedInToken);
router.post("/linkedin/disconnect", authController.disconnectLinkedIn);

module.exports = router;


