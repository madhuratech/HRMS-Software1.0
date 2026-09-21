const db = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Helper to get the fixed Admin OTP recipient email from environment variable SMTP_USER
const getSmtpAdminEmail = () => {
  return (process.env.SMTP_USER || process.env.EMAIL_USER || process.env.CONTACT_TO_EMAIL || 'iamstk1996@gmail.com').trim().toLowerCase();
};

// Ensure isolated pending registrations table exists
const initPendingTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS admin_pending_registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      attempt_count INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  db.query(sql, (err) => {
    if (err) console.error("Error creating admin_pending_registrations table:", err);
  });
};

initPendingTable();

/**
 * Step 1: Submit Admin/Manager Registration details & Send OTP to fixed SMTP_USER
 */
exports.sendOtp = async (req, res) => {
  try {
    const { fullName, email, role, password, confirmPassword } = req.body;

    // Basic Input Validation
    if (!fullName || !email || !role || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields (Full Name, Login Email, Role, Password, Confirm Password) are required." });
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase(); // Login Email for the new account
    const cleanRole = role.trim();
    const adminOtpRecipient = getSmtpAdminEmail(); // Fixed OTP recipient (SMTP_USER)

    // Validate Role option
    if (cleanRole !== 'Admin' && cleanRole !== 'Manager') {
      return res.status(400).json({ success: false, message: "Role must be either 'Admin' or 'Manager'." });
    }

    // Email format validation for login email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "Please enter a valid Login Email address." });
    }

    // Passwords match validation
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    // Check duplicate login email in users table
    const checkUserSql = "SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1";
    const existingUsers = await new Promise((resolve, reject) => {
      db.query(checkUserSql, [cleanEmail], (err, rows) => err ? reject(err) : resolve(rows));
    });

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: "An account already exists for this Login Email." });
    }

    // Check duplicate login email in employees table
    const checkEmpSql = "SELECT id FROM employees WHERE LOWER(email) = LOWER(?) LIMIT 1";
    const existingEmps = await new Promise((resolve, reject) => {
      db.query(checkEmpSql, [cleanEmail], (err, rows) => err ? reject(err) : resolve(rows));
    });

    if (existingEmps && existingEmps.length > 0) {
      return res.status(400).json({ success: false, message: "This email address is already registered in the employee database." });
    }

    // Check Cooldown (60 seconds)
    const checkCooldownSql = "SELECT updated_at, created_at FROM admin_pending_registrations WHERE LOWER(email) = LOWER(?) ORDER BY id DESC LIMIT 1";
    const pendingRec = await new Promise((resolve) => {
      db.query(checkCooldownSql, [cleanEmail], (err, rows) => resolve(rows && rows.length > 0 ? rows[0] : null));
    });

    if (pendingRec) {
      const lastTime = new Date(pendingRec.updated_at || pendingRec.created_at);
      const diffSec = Math.floor((new Date() - lastTime) / 1000);
      if (diffSec < 60) {
        return res.status(400).json({ success: false, message: `OTP already sent. Resend available in ${60 - diffSec} seconds.` });
      }
    }

    // Generate 6-digit OTP code and session ID
    const sessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiry as required

    const passwordHash = await bcrypt.hash(password, 10);
    const otpHash = await bcrypt.hash(otpCode, 10);

    // Delete existing pending record for login email
    await new Promise((resolve) => {
      db.query("DELETE FROM admin_pending_registrations WHERE LOWER(email) = LOWER(?)", [cleanEmail], resolve);
    });

    // Save pending record
    const insertSql = `
      INSERT INTO admin_pending_registrations (session_id, full_name, email, role, password_hash, otp_hash, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await new Promise((resolve, reject) => {
      db.query(insertSql, [sessionId, cleanName, cleanEmail, cleanRole, passwordHash, otpHash, expiresAt], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // Send OTP email ALWAYS to SMTP_USER (fixed OTP recipient)
    try {
      await emailService.sendOtpEmail({
        toEmail: adminOtpRecipient,
        recipientName: `Administrator (Registration OTP for ${cleanName})`,
        otpCode
      });
    } catch (mailErr) {
      // If email sending fails, delete pending registration and reject immediately
      await new Promise((resolve) => {
        db.query("DELETE FROM admin_pending_registrations WHERE session_id = ?", [sessionId], resolve);
      });
      console.error("[ADMIN REGISTER CONTROLLER sendOtp MAIL ERROR]:", mailErr.message);
      return res.status(500).json({
        success: false,
        message: `SMTP Authentication or delivery failed: ${mailErr.message}. Please verify SMTP credentials in backend configuration.`
      });
    }

    return res.json({
      success: true,
      sessionId,
      email: cleanEmail,
      message: "Verification OTP has been sent to the authorized administrator. Please obtain the 6-digit code to continue.",
      cooldownSeconds: 60,
      expirySeconds: 300
    });

  } catch (error) {
    console.error("[ADMIN REGISTER CONTROLLER sendOtp ERROR]:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to process registration request." });
  }
};

/**
 * Step 2: Resend OTP to fixed SMTP_USER
 */
exports.resendOtp = async (req, res) => {
  try {
    const { sessionId, email } = req.body;

    if (!sessionId || !email) {
      return res.status(400).json({ success: false, message: "Session ID and Login Email are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminOtpRecipient = getSmtpAdminEmail();

    // Find pending record
    const findSql = "SELECT * FROM admin_pending_registrations WHERE session_id = ? AND LOWER(email) = LOWER(?)";
    const pendingRec = await new Promise((resolve, reject) => {
      db.query(findSql, [sessionId, cleanEmail], (err, rows) => err ? reject(err) : resolve(rows && rows.length > 0 ? rows[0] : null));
    });

    if (!pendingRec) {
      return res.status(400).json({ success: false, message: "No registration session found. Please start registration again." });
    }

    // Cooldown Check (60 seconds)
    const lastTime = new Date(pendingRec.updated_at || pendingRec.created_at);
    const diffSec = Math.floor((new Date() - lastTime) / 1000);
    if (diffSec < 60) {
      return res.status(400).json({ success: false, message: `Please wait ${60 - diffSec} seconds before requesting a new OTP.` });
    }

    // Generate new OTP
    const newOtpCode = crypto.randomInt(100000, 1000000).toString();
    const newOtpHash = await bcrypt.hash(newOtpCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiry

    // Send email to fixed SMTP_USER first before updating database
    try {
      await emailService.sendOtpEmail({
        toEmail: adminOtpRecipient,
        recipientName: `Administrator (Registration OTP for ${pendingRec.full_name})`,
        otpCode: newOtpCode
      });
    } catch (mailErr) {
      console.error("[ADMIN REGISTER CONTROLLER resendOtp MAIL ERROR]:", mailErr.message);
      return res.status(500).json({
        success: false,
        message: `SMTP Error: Failed to resend OTP email (${mailErr.message}).`
      });
    }

    const updateSql = `
      UPDATE admin_pending_registrations
      SET otp_hash = ?, expires_at = ?, attempt_count = 0, updated_at = NOW()
      WHERE id = ?
    `;

    await new Promise((resolve, reject) => {
      db.query(updateSql, [newOtpHash, expiresAt, pendingRec.id], (err, result) => err ? reject(err) : resolve(result));
    });

    return res.json({
      success: true,
      sessionId,
      email: cleanEmail,
      message: "A new 6-digit OTP code has been dispatched to the administrator.",
      cooldownSeconds: 60,
      expirySeconds: 300
    });

  } catch (error) {
    console.error("[ADMIN REGISTER CONTROLLER resendOtp ERROR]:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to resend OTP code." });
  }
};

/**
 * Step 3: Verify OTP & Create Admin/Manager Account
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { sessionId, email, otp } = req.body;

    if (!sessionId || !email || !otp) {
      return res.status(400).json({ success: false, message: "Session ID, Login Email, and 6-digit OTP are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (cleanOtp.length < 6) {
      return res.status(400).json({ success: false, message: "Please enter the complete 6-digit verification code." });
    }

    // Find pending record
    const findSql = "SELECT * FROM admin_pending_registrations WHERE session_id = ? AND LOWER(email) = LOWER(?)";
    const pendingRec = await new Promise((resolve, reject) => {
      db.query(findSql, [sessionId, cleanEmail], (err, rows) => err ? reject(err) : resolve(rows && rows.length > 0 ? rows[0] : null));
    });

    if (!pendingRec) {
      return res.status(400).json({ success: false, message: "Invalid or expired registration session." });
    }

    // Attempt Limit Check (max 5 failed attempts)
    if (pendingRec.attempt_count >= 5) {
      return res.status(400).json({ success: false, message: "Maximum verification attempts exceeded. Please request a new OTP code." });
    }

    // 5-Minute Expiry Check
    if (new Date(pendingRec.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: "Verification OTP has expired (5-minute limit). Please request a new OTP code." });
    }

    // Server-side bcrypt compare of OTP
    const isMatch = await bcrypt.compare(cleanOtp, pendingRec.otp_hash);
    if (!isMatch) {
      const newAttempts = pendingRec.attempt_count + 1;
      db.query("UPDATE admin_pending_registrations SET attempt_count = ? WHERE id = ?", [newAttempts, pendingRec.id]);
      return res.status(400).json({
        success: false,
        message: `Invalid 6-digit OTP code. (${5 - newAttempts} attempts remaining)`
      });
    }

    // Map role to canonical role key
    // Admin -> SUPER_ADMIN, Manager -> HR_MANAGER
    const targetRole = pendingRec.role === 'Admin' ? 'SUPER_ADMIN' : 'HR_MANAGER';

    // Duplicate Check again just before creating user
    const checkDupSql = "SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1";
    const dupUsers = await new Promise((resolve, reject) => {
      db.query(checkDupSql, [cleanEmail], (err, rows) => err ? reject(err) : resolve(rows));
    });

    if (dupUsers && dupUsers.length > 0) {
      return res.status(400).json({ success: false, message: "An account already exists for this Login Email." });
    }

    // Create User Account in DB
    const insertUserSql = `
      INSERT INTO users (full_name, email, password_hash, role, email_verified, email_verified_at, account_status, created_at)
      VALUES (?, ?, ?, ?, 1, NOW(), 'Active', NOW())
    `;

    await new Promise((resolve, reject) => {
      db.query(insertUserSql, [pendingRec.full_name, cleanEmail, pendingRec.password_hash, targetRole], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // Remove pending registration record
    db.query("DELETE FROM admin_pending_registrations WHERE id = ?", [pendingRec.id]);

    return res.json({
      success: true,
      message: "Registration Successful ✓ Account created successfully.",
      redirect: "/login"
    });

  } catch (error) {
    console.error("[ADMIN REGISTER CONTROLLER verifyOtp ERROR]:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create account." });
  }
};
