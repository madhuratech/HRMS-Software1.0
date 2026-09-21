const db = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailService = require("../services/emailService");
const OAuthIntegrationService = require("../services/OAuthIntegrationService");

const JWT_SECRET = process.env.JWT_SECRET || "madhura_super_secret_key_2026";

/**
 * Helper to identify the actual role from designation name or role name
 */
/**
 * Helper to identify the actual role from roles table, designation name or role name
 */
function getEmployeeRole(employee) {
  // 1. If employee has a defined role_key or role_name from roles table, honor it first!
  const roleKeyUpper = (employee.role_key || '').toUpperCase();
  if (roleKeyUpper === 'SUPER_ADMIN' || roleKeyUpper === 'ADMIN') return 'SUPER_ADMIN';
  if (roleKeyUpper === 'HR_MANAGER' || roleKeyUpper === 'HR') return 'HR_MANAGER';
  if (roleKeyUpper === 'TEAM_LEADER') return 'TEAM_LEADER';
  if (roleKeyUpper === 'EMPLOYEE') return 'EMPLOYEE';
  if (roleKeyUpper) return roleKeyUpper;

  const desgLower = (employee.designation_name || '').toLowerCase();
  const roleLower = (employee.role_name || employee.roles_role_name || '').toLowerCase();
  const emailLower = (employee.email || '').toLowerCase();

  if (roleLower.includes('admin') || emailLower.includes('admin')) {
    return 'SUPER_ADMIN';
  } else if (desgLower.includes('team leader') || desgLower.includes('team lead') || roleLower.includes('team leader') || employee.id === 19 || employee.id === 11) {
    return 'TEAM_LEADER';
  } else if (desgLower.includes('hr') || roleLower.includes('hr') || desgLower.includes('manager') || roleLower.includes('manager') || roleLower.includes('branch_manager') || roleLower.includes('hr_manager') || employee.id === 2 || employee.id === 20) {
    return 'HR_MANAGER';
  }
  return 'EMPLOYEE';
}

/**
 * Normalize a frontend-selected role label to the canonical role used by IdentityService.
 * Supports: admin, ADMIN, SUPER_ADMIN  →  SUPER_ADMIN
 *           employee, EMPLOYEE         →  EMPLOYEE
 *           hr, HR, HR_MANAGER         →  HR_MANAGER
 *           team_leader, TEAM_LEADER   →  TEAM_LEADER
 * Returns null if the value is absent/empty (validation is skipped when no role is sent).
 */
function normalizeSelectedRole(raw) {
  if (!raw) return null;
  const upper = String(raw).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN'].includes(upper)) return 'SUPER_ADMIN';
  if (['EMPLOYEE', 'STAFF'].includes(upper)) return 'EMPLOYEE';
  if (['HR', 'HR_MANAGER', 'HR_ADMIN', 'HRMANAGER'].includes(upper)) return 'HR_MANAGER';
  if (['TEAM_LEADER', 'TEAMLEADER', 'TEAM_LEAD', 'TEAMLEAD', 'LEAD'].includes(upper)) return 'TEAM_LEADER';
  return upper; // pass through unknowns for logging purposes
}

exports.login = async (req, res) => {
  const { email, password, selectedRole } = req.body;
  const IdentityService = require("../services/IdentityService");

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide email and password" });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Helper for password matching (handles bcrypt hashes and legacy plain-text stored passwords)
  const checkPasswordMatch = async (inputPass, storedHash) => {
    if (!inputPass) return false;
    if (inputPass === storedHash) return true;
    if (!storedHash) return false;
    try {
      return await bcrypt.compare(inputPass, storedHash);
    } catch (e) {
      return false;
    }
  };

  try {
    // 1. Resolve user from users table or employees table
    const findSql = `
      SELECT u.id as user_id, u.password_hash, u.account_status, u.role as user_role, u.email as user_email,
             e.id as emp_id, e.password_hash as emp_password_hash
      FROM users u
      LEFT JOIN employees e ON (u.employee_id = e.id OR LOWER(u.email) = LOWER(e.email))
      WHERE LOWER(u.email) = LOWER(?)
    `;

    db.query(findSql, [cleanEmail], async (err, results) => {
      if (err) {
        console.error("Login DB error:", err);
        return res.status(500).json({ success: false, message: "Database query error" });
      }

      let authRecord = results && results.length > 0 ? results[0] : null;

      // Fallback: check employees table if user account not found yet
      if (!authRecord) {
        const empSql = "SELECT * FROM employees WHERE LOWER(email) = LOWER(?) LIMIT 1";
        const empRows = await new Promise((res, rej) => db.query(empSql, [cleanEmail], (e, r) => e ? rej(e) : res(r)));
        if (!empRows || empRows.length === 0) {
          return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        const emp = empRows[0];
        const isMatch = await checkPasswordMatch(password, emp.password_hash);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
      } else {
        const hashToTest = authRecord.password_hash || authRecord.emp_password_hash;
        const isMatch = await checkPasswordMatch(password, hashToTest);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        if (authRecord.account_status && authRecord.account_status !== 'Active') {
          return res.status(403).json({ success: false, message: `Your account is currently ${authRecord.account_status}. Access denied.` });
        }
      }

      // 2. Resolve complete authoritative identity via central IdentityService
      const identity = await IdentityService.resolveUser(cleanEmail);
      if (!identity) {
        return res.status(401).json({ success: false, message: "User account identity resolution failed" });
      }

      console.log("========== LOGIN IDENTITY DEBUG ==========");
      console.log("USER ID:", identity.userId);
      console.log("EMAIL:", identity.email);
      console.log("EMPLOYEE ID:", identity.employeeId);
      console.log("EMPLOYEE CODE:", identity.employeeCode);
      console.log("EMPLOYEE NAME:", identity.name);
      console.log("USER ROLE:", identity.role);
      console.log("RESOLVED ROLE:", identity.role);
      console.log("SELECTED ROLE (raw):", selectedRole);
      console.log("==========================================");

      // 3. Role-mismatch check — compare selected role against the authoritative account role.
      //    This is the central security gate; it runs on the backend so it cannot be bypassed
      //    by modifying the request or disabling JS in the browser.
      const normalizedSelected = normalizeSelectedRole(selectedRole);
      if (normalizedSelected) {
        let isRoleAllowed = (normalizedSelected === identity.role);

        // When "EMPLOYEE" is selected in the login UI, allow all employee-tier roles:
        // regular EMPLOYEE, TEAM_LEADER, and HR_MANAGER
        if (normalizedSelected === 'EMPLOYEE' && ['EMPLOYEE', 'TEAM_LEADER', 'HR_MANAGER'].includes(identity.role)) {
          isRoleAllowed = true;
        }

        // When "TEAM_LEADER" is selected, allow TEAM_LEADER and EMPLOYEE
        if (normalizedSelected === 'TEAM_LEADER' && ['TEAM_LEADER', 'EMPLOYEE'].includes(identity.role)) {
          isRoleAllowed = true;
        }

        // When "SUPER_ADMIN" is selected, allow SUPER_ADMIN and ADMIN
        if (normalizedSelected === 'SUPER_ADMIN' && ['SUPER_ADMIN', 'ADMIN'].includes(identity.role)) {
          isRoleAllowed = true;
        }

        if (!isRoleAllowed) {
          console.warn(`[LOGIN] Role mismatch for ${cleanEmail}: selected=${normalizedSelected}, actual=${identity.role}`);
          return res.status(401).json({
            success: false,
            message: "Invalid role. Please select the role assigned to your account."
          });
        }
      }

      // 3. Generate authoritative JWT with complete identity
      const jwtPayload = {
        id: identity.userId,
        userId: identity.userId,
        employee_id: identity.employeeId,
        employeeId: identity.employeeId,
        employee_code: identity.employeeCode,
        employeeCode: identity.employeeCode,
        name: identity.name,
        email: identity.email,
        role: identity.role
      };

      console.log("JWT PAYLOAD:", jwtPayload);

      const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: "24h" });

      return res.json({
        success: true,
        token,
        user: {
          id: identity.userId,
          userId: identity.userId,
          employee_id: identity.employeeId,
          employeeId: identity.employeeId,
          employee_code: identity.employeeCode,
          employeeCode: identity.employeeCode,
          name: identity.name,
          email: identity.email,
          role: identity.role
        },
        role: identity.role,
        permissions: identity.permissions
      });
    });
  } catch (error) {
    console.error("Login processing exception:", error);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const IdentityService = require("../services/IdentityService");
    const authIdentifier = (req.user && (req.user.email || req.user.userId || req.user.id || req.user.employee_id || req.user.employeeId)) || null;

    if (!authIdentifier) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const identity = await IdentityService.resolveUser(authIdentifier);
    if (!identity) {
      return res.status(404).json({ success: false, message: 'User identity not found' });
    }

    return res.json({
      success: true,
      user: {
        id: identity.userId,
        userId: identity.userId,
        employee_id: identity.employeeId,
        employeeId: identity.employeeId,
        employee_code: identity.employeeCode,
        employeeCode: identity.employeeCode,
        name: identity.name,
        email: identity.email,
        role: identity.role,
        designation: identity.designation
      },
      role: identity.role,
      permissions: identity.permissions
    });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve authenticated user' });
  }
};

exports.verifyEmailRequest = async (req, res) => {
  const { name, email, role } = req.body;

  if (!email || !role || !name) {
    return res.status(400).json({ success: false, message: "Name, email, and role are required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  // 1. Check duplicate account in users table
  const dupCheckSql = "SELECT id FROM users WHERE LOWER(email) = LOWER(?)";
  db.query(dupCheckSql, [cleanEmail], async (dupErr, dupRes) => {
    if (dupErr) {
      console.error(dupErr);
      return res.status(500).json({ success: false, message: "Database query error" });
    }

    if (dupRes.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "An account already exists for this company email. Please sign in instead." 
      });
    }

    // 2. Cooldown check (60 seconds)
    const checkCooldownSql = "SELECT * FROM email_verifications WHERE LOWER(email) = LOWER(?)";
    const existingVer = await new Promise((resolve) => {
      db.query(checkCooldownSql, [cleanEmail], (e, r) => resolve(r && r.length > 0 ? r[0] : null));
    });

    if (existingVer) {
      const now = new Date();
      const createdAt = new Date(existingVer.updated_at || existingVer.created_at);
      const diffSeconds = Math.floor((now - createdAt) / 1000);
      if (diffSeconds < 60) {
        return res.status(400).json({ 
          success: false,
          message: `Resend available in ${60 - diffSeconds} seconds. Please wait.` 
        });
      }
    }

    // 3. Authorization check
    if (role === 'Admin') {
      const adminCountSql = "SELECT COUNT(*) as count FROM users WHERE role = 'SUPER_ADMIN'";
      db.query(adminCountSql, async (acErr, acRes) => {
        if (acErr) return res.status(500).json({ success: false, message: "Database error" });

        if (acRes[0].count > 0) {
          return res.status(400).json({ 
            success: false,
            message: "Admin registration is blocked. Additional Admin accounts must be created only through the authorized Admin functionality." 
          });
        }
        
        // Initial setup Admin allowed
        sendOtpToEmail(cleanName, cleanEmail, res);
      });
    } else {
      // Employee registration -> MUST verify exact email exists in Employee database
      const checkEmpSql = `
        SELECT e.*, r.name as role_name, desg.role_name as designation_name
        FROM employees e
        LEFT JOIN roles r ON e.role_id = r.id
        LEFT JOIN designations desg ON e.designation_id = desg.id
        WHERE LOWER(e.email) = LOWER(?)
      `;

      db.query(checkEmpSql, [cleanEmail], async (empErr, empRes) => {
        if (empErr) return res.status(500).json({ success: false, message: "Database error" });

        if (empRes.length === 0) {
          return res.status(400).json({ 
            success: false,
            message: "This company email is not registered in HRMS. Please contact your HR/Admin." 
          });
        }

        const employee = empRes[0];

        // Verify Full Name matches case-insensitively & trimmed
        const cleanDbName = employee.name.toLowerCase().replace(/\s+/g, '');
        const cleanInputName = cleanName.toLowerCase().replace(/\s+/g, '');

        if (cleanDbName !== cleanInputName) {
          return res.status(400).json({ 
            success: false,
            message: "The entered name does not match our records for this company email." 
          });
        }

        // Exact company employee match confirmed -> Send OTP
        sendOtpToEmail(cleanName, cleanEmail, res);
      });
    }
  });
};

async function sendOtpToEmail(name, email, res) {
  try {
    const sessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry
    const otpHash = await bcrypt.hash(otpCode, 10);

    // Invalidate/delete previous verifications for this email
    await new Promise((resolve) => {
      db.query("DELETE FROM email_verifications WHERE LOWER(email) = LOWER(?)", [email], resolve);
    });

    const insertSql = `
      INSERT INTO email_verifications (session_id, email, otp_hash, expires_at, attempt_count, verified)
      VALUES (?, ?, ?, ?, 0, 0)
    `;

    db.query(insertSql, [sessionId, email, otpHash, expiresAt], async (insErr) => {
      if (insErr) {
        console.error("Error inserting email_verifications:", insErr);
        return res.status(500).json({ success: false, message: "Failed to generate verification OTP." });
      }

      // Send REAL email via Nodemailer to process.env.SMTP_USER
      try {
        const adminOtpRecipient = (process.env.SMTP_USER || process.env.EMAIL_USER || email).trim();
        await emailService.sendOtpEmail({ toEmail: adminOtpRecipient, recipientName: `Administrator (Registration for ${name})`, otpCode });
        return res.json({ 
          success: true,
          sessionId,
          message: "Verification code sent to the authorized administrator. Please obtain the code to continue.",
          email
        });
      } catch (mailErr) {
        console.error("Failed to send OTP email:", mailErr);
        db.query("DELETE FROM email_verifications WHERE session_id = ?", [sessionId]);
        return res.status(500).json({ 
          success: false,
          message: "Unable to send verification email. Please check your SMTP configuration or try again later." 
        });
      }
    });
  } catch (err) {
    console.error("sendOtpToEmail error:", err);
    res.status(500).json({ success: false, message: "Failed to process OTP request." });
  }
}

exports.verifyOtp = (req, res) => {
  const { email, code, sessionId } = req.body;

  if (!email || !code || !sessionId) {
    return res.status(400).json({ success: false, verified: false, message: "Email, session ID, and 6-digit verification code are required." });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Find verification record matching session_id AND exact email
  const sql = "SELECT * FROM email_verifications WHERE session_id = ? AND LOWER(email) = LOWER(?)";
  db.query(sql, [sessionId, cleanEmail], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, verified: false, message: "Database error." });
    }

    if (results.length === 0) {
      return res.status(400).json({ success: false, verified: false, message: "No verification session found for this email. Please click Verify Email." });
    }

    const record = results[0];

    // 1. Check attempt limit
    if (record.attempt_count >= 5) {
      return res.status(400).json({ success: false, verified: false, message: "Too many incorrect attempts. Please request a new verification code." });
    }

    // 2. Check expiry
    const now = new Date();
    if (new Date(record.expires_at) < now) {
      return res.status(400).json({ success: false, verified: false, message: "This verification code has expired. Please request a new OTP." });
    }

    // 3. Compare OTP code with stored bcrypt hash
    const isMatch = await bcrypt.compare(code, record.otp_hash);

    if (!isMatch) {
      const newAttempts = record.attempt_count + 1;
      const updateAttemptsSql = "UPDATE email_verifications SET attempt_count = ? WHERE id = ?";
      db.query(updateAttemptsSql, [newAttempts, record.id]);

      if (newAttempts >= 5) {
        return res.status(400).json({ success: false, verified: false, message: "Too many incorrect attempts. Please request a new verification code." });
      }

      return res.status(400).json({ 
        success: false, 
        verified: false, 
        message: `Invalid verification code. Please check your email and try again. (${5 - newAttempts} attempts remaining)` 
      });
    }

    // OTP Correct -> Set verified = 1
    const setVerifiedSql = "UPDATE email_verifications SET verified = 1, attempt_count = 0 WHERE id = ?";
    db.query(setVerifiedSql, [record.id], (upErr) => {
      if (upErr) {
        return res.status(500).json({ success: false, verified: false, message: "Failed to verify OTP." });
      }

      res.json({ 
        success: true, 
        verified: true, 
        sessionId,
        email: cleanEmail,
        message: "Email Verified Successfully ✓" 
      });
    });
  });
};

exports.register = async (req, res) => {
  const { name, email, role, password, confirmPassword, sessionId } = req.body;

  if (!name || !email || !role || !password || !confirmPassword || !sessionId) {
    return res.status(400).json({ success: false, message: "All registration fields and valid verification session are required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match." });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
  }

  // Independent Backend Validation #1: Authorization Membership
  const targetRole = role === 'Admin' ? 'SUPER_ADMIN' : 'EMPLOYEE';

  if (targetRole === 'EMPLOYEE') {
    const findEmpSql = "SELECT id FROM employees WHERE LOWER(email) = LOWER(?)";
    const empRes = await new Promise((resolve) => {
      db.query(findEmpSql, [cleanEmail], (e, r) => resolve(r || []));
    });
    if (empRes.length === 0) {
      return res.status(400).json({ success: false, message: "This company email is not authorized for registration." });
    }
  } else if (targetRole === 'SUPER_ADMIN') {
    const adminCountSql = "SELECT COUNT(*) as count FROM users WHERE role = 'SUPER_ADMIN'";
    const acRes = await new Promise((resolve) => {
      db.query(adminCountSql, (e, r) => resolve(r || []));
    });
    if (acRes && acRes[0] && acRes[0].count > 0) {
      return res.status(400).json({ success: false, message: "Admin registration is unauthorized." });
    }
  }

  // Independent Backend Validation #2: Verification Session & Email Match
  const sqlCheckVer = "SELECT * FROM email_verifications WHERE session_id = ? AND LOWER(email) = LOWER(?) AND verified = 1";
  db.query(sqlCheckVer, [sessionId, cleanEmail], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database query error." });

    if (results.length === 0) {
      return res.status(400).json({ success: false, message: "Email verification required for this exact email. Please verify your email before creating your account." });
    }

    const verRecord = results[0];

    // Independent Backend Validation #3: Expiration Check
    if (new Date(verRecord.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: "Verification session expired. Please verify your email again." });
    }

    // Independent Backend Validation #4: Uniqueness Check
    const dupCheckSql = "SELECT id FROM users WHERE LOWER(email) = LOWER(?)";
    db.query(dupCheckSql, [cleanEmail], async (dupErr, dupRes) => {
      if (dupErr) return res.status(500).json({ success: false, message: "Database error." });

      if (dupRes.length > 0) {
        return res.status(400).json({ success: false, message: "An account already exists for this email." });
      }

      try {
        const password_hash = await bcrypt.hash(password, 10);
        let employee_id = null;

        if (targetRole === 'EMPLOYEE') {
          const findEmpSql = "SELECT id FROM employees WHERE LOWER(email) = LOWER(?)";
          const empRes = await new Promise((resolve) => {
            db.query(findEmpSql, [cleanEmail], (e, r) => resolve(r || []));
          });
          if (empRes.length > 0) {
            employee_id = empRes[0].id;
          }
        }

        const insertUserSql = `
          INSERT INTO users (employee_id, full_name, email, password_hash, role, email_verified, email_verified_at, account_status)
          VALUES (?, ?, ?, ?, ?, 1, NOW(), 'Active')
        `;

        db.query(insertUserSql, [employee_id, cleanName, cleanEmail, password_hash, targetRole], (insErr) => {
          if (insErr) {
            console.error(insErr);
            return res.status(500).json({ success: false, message: "Failed to create user account." });
          }

          // Clean up verification session
          db.query("DELETE FROM email_verifications WHERE session_id = ?", [sessionId]);

          res.json({ success: true, message: "Account Created Successfully ✓", redirect: true });
        });
      } catch (hashErr) {
        res.status(500).json({ success: false, message: "Server password hashing error." });
      }
    });
  });
};

/**
 * Initiates LinkedIn OAuth Flow requesting standard enabled scopes:
 * w_member_social openid profile email (or configured LINKEDIN_SCOPE)
 */
exports.connectLinkedIn = async (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/auth/linkedin/callback';
  const scopes = process.env.LINKEDIN_SCOPE || 'w_member_social openid profile email';

  if (!clientId) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head><title>LinkedIn Configuration Error</title><meta charset="utf-8"/></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
        <div style="max-width: 520px; background: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); padding: 32px; border: 1px solid #FECACA;">
          <h2 style="color: #991B1B; margin: 0 0 12px 0;">Configuration Missing</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">LINKEDIN_CLIENT_ID is not configured in backend environment variables (.env).</p>
          <a href="http://localhost:3000/recruitment/jobs" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #2563EB; color: #FFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px;">Return to Job Openings</a>
        </div>
      </body>
      </html>
    `);
  }

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=hrms_linkedin_auth`;

  return res.redirect(authUrl);
};

/**
 * Handles LinkedIn OAuth Callback, exchanges code for access token,
 * fetches member profile identity, stores everything in the database,
 * and redirects back to /recruitment/jobs.
 */
exports.linkedinCallback = async (req, res) => {
  const { code, error, error_description } = req.query;
  const redirectTarget = 'http://localhost:3000/recruitment/jobs';

  // 1. Error Handling for OAuth redirect errors from LinkedIn
  if (error) {
    let errorTitle = 'LinkedIn Authorization Error';
    let errorExplanation = error_description || error;

    if (error === 'unauthorized_scope_error') {
      errorTitle = 'Unauthorized Scope Error';
      errorExplanation = 'LinkedIn organization posting permission is not authorized for this application.';
    } else if (error === 'invalid_redirect_uri' || error === 'redirect_uri_mismatch') {
      errorTitle = 'Invalid Redirect URI';
      errorExplanation = 'The redirect URI configured in your LinkedIn Developer Portal does not match the backend redirect URI (http://localhost:5000/api/auth/linkedin/callback).';
    } else if (error === 'access_denied' || error === 'user_cancelled_authorize') {
      errorTitle = 'Authorization Cancelled';
      errorExplanation = 'You cancelled the LinkedIn authorization request.';
    }

    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${errorTitle}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
        <div style="max-width: 540px; background: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); padding: 36px; border: 1px solid #FECACA;">
          <div style="width: 56px; height: 56px; background: #FEF2F2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; color: #DC2626; font-size: 28px; font-weight: bold;">
            ✕
          </div>
          <h2 style="font-size: 20px; font-weight: 700; color: #991B1B; margin: 0 0 12px 0; text-align: center;">${errorTitle}</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0; text-align: center;">
            ${errorExplanation}
          </p>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; font-size: 12px; color: #64748B; word-break: break-all; margin-bottom: 24px;">
            <strong>Error Code:</strong> ${error}
          </div>
          <div style="text-align: center;">
            <a href="${redirectTarget}" style="display: inline-block; padding: 12px 28px; background: #2563EB; color: #FFFFFF; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
              Return to Job Openings
            </a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  // 2. Missing Authorization Code Error
  if (!code) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Missing Authorization Code</title><meta charset="utf-8"/></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
        <div style="max-width: 520px; background: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); padding: 32px; border: 1px solid #E2E8F0; text-align: center;">
          <h2 style="color: #1E293B; margin: 0 0 12px 0;">Missing Authorization Code</h2>
          <p style="color: #64748B; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">No authorization code was provided in the callback request from LinkedIn.</p>
          <a href="${redirectTarget}" style="display: inline-block; padding: 12px 24px; background: #2563EB; color: #FFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px;">Return to Job Openings</a>
        </div>
      </body>
      </html>
    `);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/auth/linkedin/callback';

  // 3. Client ID or Secret Missing
  if (!clientId || !clientSecret) {
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Configuration Missing</title><meta charset="utf-8"/></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
        <div style="max-width: 520px; background: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); padding: 32px; border: 1px solid #FECACA; text-align: center;">
          <h2 style="color: #991B1B; margin: 0 0 12px 0;">Client Credentials Missing</h2>
          <p style="color: #64748B; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET is missing in environment configuration.</p>
          <a href="${redirectTarget}" style="display: inline-block; padding: 12px 24px; background: #2563EB; color: #FFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px;">Return to Job Openings</a>
        </div>
      </body>
      </html>
    `);
  }

  try {
    // 4. Exchange authorization code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      }).toString()
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[LinkedIn OAuth Callback] Token exchange error:', tokenData);
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>LinkedIn Token Exchange Failed</title><meta charset="utf-8"/></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
          <div style="max-width: 540px; background: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); padding: 36px; border: 1px solid #FECACA; text-align: center;">
            <h2 style="font-size: 20px; font-weight: 700; color: #991B1B; margin: 0 0 12px 0;">Token Exchange Failed</h2>
            <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
              ${tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for access token. The code may have expired.'}
            </p>
            <a href="${redirectTarget}" style="display: inline-block; padding: 12px 28px; background: #2563EB; color: #FFFFFF; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
              Return to Job Openings
            </a>
          </div>
        </body>
        </html>
      `);
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 5184000;
    const expiresInDays = Math.round(expiresIn / 86400);

    // 5. Fetch authenticated user profile identity from OpenID userinfo
    let memberUrn = null;
    let accountName = 'LinkedIn Member';

    try {
      const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (userinfoRes.ok) {
        const userInfo = await userinfoRes.json();
        if (userInfo.sub) {
          memberUrn = `urn:li:person:${userInfo.sub}`;
        }
        if (userInfo.name) {
          accountName = userInfo.name;
        }
      }
    } catch (uErr) {
      console.warn('[LinkedIn OAuth] Could not fetch userinfo:', uErr.message);
    }

    const orgId = process.env.LINKEDIN_ORGANIZATION_ID || '109901015';
    const orgUrn = orgId ? `urn:li:organization:${orgId}` : null;

    // 6. Persist access token securely in database (oauth_integrations table)
    await OAuthIntegrationService.saveLinkedInToken({
      accessToken,
      refreshToken: tokenData.refresh_token,
      expiresIn,
      scope: tokenData.scope,
      memberUrn,
      orgUrn,
      accountName
    });

    // Also update runtime process.env
    process.env.LINKEDIN_ACCESS_TOKEN = accessToken;

    console.log(`✅ LinkedIn OAuth connection saved in database for: ${accountName} (${memberUrn || orgUrn})`);

    // 7. Render success page with automatic redirect to /recruitment/jobs
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LinkedIn Connected Successfully</title>
        <meta charset="utf-8" />
        <meta http-equiv="refresh" content="2;url=${redirectTarget}" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
        <div style="max-width: 520px; background: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); padding: 36px; text-align: center; border: 1px solid #E2E8F0;">
          <div style="width: 64px; height: 64px; background: #ECFDF5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; color: #10B981; font-size: 32px;">
            ✓
          </div>
          <h1 style="font-size: 22px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0;">LinkedIn Connected Successfully!</h1>
          <p style="font-size: 14px; color: #64748B; line-height: 1.6; margin: 0 0 20px 0;">
            Connected as <strong>${accountName}</strong>. Ready to automatically publish hiring posts on LinkedIn.
          </p>
          <div style="background: #F1F5F9; border-radius: 8px; padding: 10px 16px; margin-bottom: 24px; font-size: 13px; color: #334155;">
            <strong>Token Validity:</strong> Active for approx. ${expiresInDays} days
          </div>
          <a href="${redirectTarget}" style="display: inline-block; padding: 12px 28px; background: #0A66C2; color: #FFFFFF; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(10, 102, 194, 0.25);">
            Continue to Job Openings
          </a>
        </div>
      </body>
      </html>
    `);
  } catch (netErr) {
    console.error('[LinkedIn OAuth Callback] Network exception:', netErr);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Network Error</title><meta charset="utf-8"/></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
        <div style="max-width: 520px; background: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); padding: 32px; border: 1px solid #FECACA; text-align: center;">
          <h2 style="color: #991B1B; margin: 0 0 12px 0;">Network Exception</h2>
          <p style="color: #64748B; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">${netErr.message}</p>
          <a href="${redirectTarget}" style="display: inline-block; padding: 12px 24px; background: #2563EB; color: #FFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px;">Return to Job Openings</a>
        </div>
      </body>
      </html>
    `);
  }
};

/**
 * Returns current LinkedIn integration status and configuration diagnostics from database
 */
exports.getLinkedInStatus = async (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID || '109901015';

  const integration = await OAuthIntegrationService.getLinkedInIntegration();
  const isConfigured = !!(clientId && clientSecret);

  return res.json({
    success: true,
    data: {
      configured: isConfigured,
      hasToken: integration.hasToken,
      isExpired: integration.isExpired,
      status: integration.status,
      expiresAt: integration.expiresAt || null,
      accountName: integration.accountName || null,
      memberUrn: integration.memberUrn || null,
      orgId: orgId || null,
      clientId: clientId ? `${clientId.slice(0, 4)}...` : null,
      tokenSnippet: integration.hasToken && integration.accessToken ? `${integration.accessToken.slice(0, 8)}...${integration.accessToken.slice(-6)}` : null
    }
  });
};

/**
 * Manually updates or pastes LinkedIn Access Token or Organization ID
 */
exports.saveLinkedInToken = async (req, res) => {
  const { accessToken, orgId } = req.body;
  if (!accessToken && !orgId) {
    return res.status(400).json({ success: false, message: 'Please provide an accessToken or orgId.' });
  }

  if (accessToken) {
    await OAuthIntegrationService.saveLinkedInToken({
      accessToken: accessToken.trim(),
      expiresIn: 5184000,
      scope: 'w_member_social openid profile email',
      orgUrn: orgId ? `urn:li:organization:${orgId.trim()}` : null
    });
    process.env.LINKEDIN_ACCESS_TOKEN = accessToken.trim();
  }

  if (orgId) {
    process.env.LINKEDIN_ORGANIZATION_ID = orgId.trim();
  }

  return res.json({ success: true, message: 'LinkedIn credentials stored successfully in database.' });
};

/**
 * Disconnects LinkedIn
 */
exports.disconnectLinkedIn = async (req, res) => {
  await OAuthIntegrationService.disconnectLinkedIn();
  return res.json({ success: true, message: 'LinkedIn disconnected successfully.' });
};


