const express = require("express");
const router = express.Router();
const db = require("../config/database");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticateJWT, checkPermission } = require("../middlewares/auth");
const EmployeeExperienceService = require("../services/EmployeeExperienceService");
const EmployeeCreationService = require("../services/EmployeeCreationService");

/**
 * Helper to check if requester is Team Leader and get their assigned team_id
 */
function getTeamLeaderContext(req, callback) {
  const roleHeader = req.headers['x-user-role'];
  const userRole = (roleHeader || (req.user && req.user.role) || '').toUpperCase().trim();
  const isAdminOrHR = ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'HR', 'HR_MANAGER', 'HRMANAGER'].includes(userRole);
  const isTL = !isAdminOrHR && (userRole === 'TEAM_LEADER' || userRole === 'TEAM LEADER');

  let reqId = req.headers['x-employee-id'] || (req.user && (req.user.employee_id || req.user.id)) || null;
  let userEmail = (req.user && req.user.email) || null;

  if (typeof reqId === 'string' && !isNaN(parseInt(reqId))) {
    reqId = parseInt(reqId);
  }

  const sql = `
    SELECT e.id as emp_id, e.department_id, e.team_id, e.manager_id,
           t.id as lead_team_id, t.name as lead_team_name, t.department_id as lead_team_dept
    FROM employees e
    LEFT JOIN users u ON (u.employee_id = e.id OR u.email = e.email)
    LEFT JOIN teams t ON (t.team_lead_id = e.id OR e.team_id = t.id)
    WHERE e.id = ? OR u.id = ? OR u.employee_id = ? OR e.email = ?
    ORDER BY (t.team_lead_id = e.id) DESC, (e.id = ?) DESC
    LIMIT 1
  `;

  db.query(sql, [reqId || 0, reqId || 0, reqId || 0, userEmail || '', reqId || 0], (err, rows) => {
    if (err || !rows || rows.length === 0) {
      return callback(null, { isTeamLeader: isTL, leaderId: reqId, teamId: null, teamName: null });
    }
    const emp = rows[0];
    const resolvedLeaderId = emp.emp_id;
    const teamId = emp.lead_team_id || emp.team_id || null;
    const teamName = emp.lead_team_name || null;

    callback(null, { isTeamLeader: isTL, leaderId: resolvedLeaderId, teamId, teamName, emp });
  });
}

// Configure multer for profile photo uploads
const uploadDir = path.join(__dirname, '..', 'uploads', 'photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `emp_${req.params.id}_${Date.now()}${ext}`);
  }
});

const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error('Only JPG, PNG, and WebP images are allowed'));
  }
});

// Configure multer for documents uploads
const docUploadDir = path.join(__dirname, '..', 'uploads', 'documents');
if (!fs.existsSync(docUploadDir)) {
  fs.mkdirSync(docUploadDir, { recursive: true });
}

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, docUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc_${req.params.id}_${Date.now()}${ext}`);
  }
});

const uploadDoc = multer({
  storage: docStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

/**
 * Helper to log employment history changes
 */
function logHistory(employeeId, changeType, oldValue, newValue, date) {
  const sql = `
    INSERT INTO employment_history (employee_id, change_type, old_value, new_value, effective_date)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [employeeId, changeType, oldValue, newValue, date || new Date()], (err) => {
    if (err) console.error("Error logging history:", err);
  });
}

/**
 * CHANGE / RESET EMPLOYEE PASSWORD
 */
router.put("/change-password", authenticateJWT, checkPermission('employees', 'employee_profile', 'edit'), async (req, res) => {
  const { id, newPassword } = req.body;
  const empId = id || req.body.employee_id;
  if (!empId || !newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ message: "Employee ID and valid new password required" });
  }

  try {
    const password_hash = await bcrypt.hash(newPassword, 10);
    db.query("UPDATE employees SET password_hash = ? WHERE id = ?", [password_hash, empId], (err, result) => {
      if (err) return res.status(500).json({ message: "Failed to update password", details: err });
      res.json({ message: "Password updated successfully!" });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error hashing password" });
  }
});

router.put("/password/:id", authenticateJWT, checkPermission('employees', 'employee_profile', 'edit'), async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ message: "Password must be at least 4 characters long" });
  }

  try {
    const password_hash = await bcrypt.hash(newPassword, 10);
    db.query("UPDATE employees SET password_hash = ? WHERE id = ?", [password_hash, id], (err, result) => {
      if (err) return res.status(500).json({ message: "Failed to update password", details: err });
      res.json({ message: "Password updated successfully!" });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error hashing password" });
  }
});

/**
 * LOOKUP ENDPOINTS for dropdown data
 */
router.get("/lookup/designations", (req, res) => {
  db.query("SELECT id, role_name, role_code FROM designations ORDER BY role_name", (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch designations" });
    res.json(rows);
  });
});

router.get("/lookup/departments", (req, res) => {
  db.query("SELECT id, dept_name FROM departments ORDER BY dept_name", (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch departments" });
    res.json(rows);
  });
});

router.get("/lookup/branches", (req, res) => {
  db.query("SELECT id, branch_name FROM branches ORDER BY branch_name", (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch branches" });
    res.json(rows);
  });
});

router.get("/lookup/teams", (req, res) => {
  db.query("SELECT id, name FROM teams ORDER BY name", (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch teams" });
    res.json(rows);
  });
});

router.get("/lookup/managers", (req, res) => {
  db.query("SELECT id, name, employee_code, employee_id FROM employees WHERE status = 'Active' ORDER BY name", (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch managers" });
    res.json(rows);
  });
});

/**
 * GET TEAM MEMBERS (Team Leader Only Endpoint)
 * Returns ONLY the authenticated Team Leader's own profile and members of their assigned team.
 * Returns noTeamAssigned: true if no team is assigned to the Team Leader.
 */
router.get("/team-members", authenticateJWT, (req, res) => {
  const { getTeamScope } = require('../utils/teamScope');
  getTeamScope(req, (err, scope) => {
    if (err) return res.status(500).json({ error: "Failed to fetch team scope" });

    const flatMembers = [];
    if (scope.teamLeader) {
      flatMembers.push({
        id: scope.teamLeader.id,
        employeeId: scope.teamLeader.employeeId,
        name: scope.teamLeader.name,
        email: scope.teamLeader.email,
        phone: scope.teamLeader.phone,
        status: scope.teamLeader.status,
        dept_name: scope.teamLeader.department,
        role_name: scope.teamLeader.designation,
        team_name: scope.team ? scope.team.name : 'Assigned Team',
        profile_photo: scope.teamLeader.profile_photo
      });
    }
    (scope.members || []).forEach(m => {
      flatMembers.push({
        id: m.id,
        employeeId: m.employeeId,
        name: m.name,
        email: m.email,
        phone: m.phone,
        status: m.status,
        dept_name: m.department,
        role_name: m.designation,
        team_name: scope.team ? scope.team.name : 'Assigned Team',
        profile_photo: m.profile_photo
      });
    });

    res.json({
      noTeamAssigned: scope.noTeamAssigned,
      team: scope.team,
      teamId: scope.team ? scope.team.id : null,
      teamName: scope.team ? scope.team.name : null,
      teamLeader: scope.teamLeader,
      members: flatMembers,
      scopedMembers: scope.members,
      memberCount: scope.memberCount
    });
  });
});

/**
 * GET ALL EMPLOYEES (Directory, List, Search, Filter, Sort, Pagination)
 * Enforces Team Leader scope: Returns only own team members for Team Leaders.
 */
router.get("/", authenticateJWT, (req, res) => {
  const { search, department, designation, branch, status, sortBy, sortOrder, page = 1, limit = 100 } = req.query;

  getTeamLeaderContext(req, (errCtx, ctx) => {
    let conditions = [
      "1=1",
      "e.email NOT IN (SELECT email FROM users WHERE role = 'SUPER_ADMIN')"
    ];
    let params = [];


    if (ctx.isTeamLeader) {
      if (!ctx.teamId) {
        conditions.push("e.id = ?");
        params.push(ctx.leaderId);
      } else {
        conditions.push("(e.team_id = ? OR e.id = ?)");
        params.push(ctx.teamId, ctx.leaderId);
      }
    }

    if (search) {
      conditions.push("(e.name LIKE ? OR e.email LIKE ? OR e.phone LIKE ? OR e.employee_code LIKE ? OR e.employee_id LIKE ? OR CONCAT('EMP', LPAD(e.id, 4, '0')) = ?)");
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard, search);
    }
    if (department) {
      conditions.push("dept.dept_name = ?");
      params.push(department);
    }
    if (designation) {
      conditions.push("desg.role_name = ?");
      params.push(designation);
    }
    if (branch) {
      conditions.push("b.branch_name = ?");
      params.push(branch);
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    let validSortCol = 'e.id';
    if (sortBy === 'id') validSortCol = 'e.id';
    else if (sortBy === 'employee_code' || sortBy === 'employee_id' || sortBy === 'code') validSortCol = 'COALESCE(NULLIF(e.employee_code, ""), NULLIF(e.employee_id, ""))';
    else if (sortBy === 'name') validSortCol = 'e.name';
    else if (sortBy === 'created_at') validSortCol = 'e.created_at';
    else if (sortBy === 'join_date') validSortCol = 'e.join_date';

    const order = (sortOrder && sortOrder.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
    const orderBy = validSortCol;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const sql = `
      SELECT 
        e.id,
        COALESCE(NULLIF(e.employee_code, ''), NULLIF(e.employee_id, ''), '') as employee_code,
        COALESCE(NULLIF(e.employee_id, ''), NULLIF(e.employee_code, ''), '') as employee_id,
        COALESCE(NULLIF(e.employee_code, ''), NULLIF(e.employee_id, ''), '') as employeeId,
        COALESCE(NULLIF(e.employee_code, ''), NULLIF(e.employee_id, ''), '') as emp_code,
        COALESCE(NULLIF(e.employee_code, ''), NULLIF(e.employee_id, ''), '') as empId,
        e.name,
        e.email,
        e.phone,
        e.dob,
        e.join_date,
        e.status,
        e.gender,
        e.employment_type,
        e.experience,
        e.shift_type,
        ${ctx.isTeamLeader ? "NULL as salary" : "e.salary"},
        e.address,
        e.emergency_contact,
        b.branch_name,
        dept.dept_name,
        desg.role_name as role_name,
        m.name as manager_name,
        t.name as team_name,
        e.profile_photo
      FROM employees e
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN departments dept ON e.department_id = dept.id
      LEFT JOIN designations desg ON e.designation_id = desg.id
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN teams t ON e.team_id = t.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${orderBy} ${order}
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));

    db.query(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: "Failed to fetch employees", details: err });
      res.json(rows);
    });
  });
});

/**
 * REAL-TIME EMAIL DUPLICATE CHECK
 */
router.get("/check-email", (req, res) => {
  const { email } = req.query;
  if (!email || !email.trim()) {
    return res.json({ available: true, message: "Email required" });
  }

  const cleanEmail = email.trim().toLowerCase();

  const sql = `
    SELECT 'user' as source FROM users WHERE LOWER(email) = ?
    UNION
    SELECT 'employee' as source FROM employees WHERE LOWER(email) = ?
    LIMIT 1
  `;

  db.query(sql, [cleanEmail, cleanEmail], (err, rows) => {
    if (err) {
      console.error("Check email error:", err);
      return res.status(500).json({ available: false, message: "Database query error" });
    }

    if (rows && rows.length > 0) {
      return res.json({
        available: false,
        message: "This email is already registered. Please use another company email."
      });
    }

    return res.json({ available: true, message: "Email available" });
  });
});

/**
 * REAL-TIME EMPLOYEE ID / CODE DUPLICATE CHECK
 */
router.get("/check-code", (req, res) => {
  const { code } = req.query;
  if (!code || !code.trim()) {
    return res.json({ available: true, message: "Employee ID required" });
  }

  const cleanCode = code.trim();
  const sql = `
    SELECT id FROM employees WHERE employee_code = ? OR employee_id = ?
    LIMIT 1
  `;

  db.query(sql, [cleanCode, cleanCode], (err, rows) => {
    if (err) {
      console.error("Check code error:", err);
      return res.status(500).json({ available: false, message: "Database query error" });
    }

    if (rows && rows.length > 0) {
      return res.json({
        available: false,
        message: "Employee ID already exists"
      });
    }

    return res.json({ available: true, message: "Employee ID available" });
  });
});

/**
 * IMPORT METADATA (Departments, Designations, Branches, Teams, Existing Employees)
 */
router.get("/import-meta", async (req, res) => {
  try {
    const meta = await EmployeeCreationService.getImportMeta();
    res.json(meta);
  } catch (err) {
    console.error("Error fetching import meta:", err);
    res.status(500).json({ error: "Failed to fetch import metadata", details: err.message });
  }
});

/**
 * EXPORT EMPLOYEES DATA (Full Add Employee fields)
 */
router.get("/export-data", authenticateJWT, async (req, res) => {
  try {
    const data = await EmployeeCreationService.getExportData();
    res.json(data);
  } catch (err) {
    console.error("Error fetching export data:", err);
    res.status(500).json({ error: "Failed to fetch employee export data", details: err.message });
  }
});

/**
 * BULK IMPORT EMPLOYEES (Excel Import)
 */
router.post("/bulk-import", authenticateJWT, checkPermission('employees', 'add_employee', 'create'), async (req, res) => {
  const { employees, updateExisting = false } = req.body;
  if (!Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ message: "Employees list is required and cannot be empty." });
  }

  try {
    const summary = await EmployeeCreationService.bulkImport(employees, { updateExisting: !!updateExisting });
    res.json(summary);
  } catch (err) {
    console.error("Error in bulk import:", err);
    res.status(500).json({ message: "Bulk import failed", details: err.message });
  }
});

/**
 * CREATE EMPLOYEE & LINKED USER LOGIN ACCOUNT
 */
router.post("/", authenticateJWT, checkPermission('employees', 'add_employee', 'create'), async (req, res) => {
  try {
    const result = await EmployeeCreationService.createEmployee(req.body);
    res.json({
      message: "Employee created successfully. Login account created successfully.",
      id: result.id,
      employee_id: result.id,
      employee_code: result.employee_code,
      employeeCode: result.employee_code,
      emp_code: result.employee_code
    });
  } catch (err) {
    console.error("Employee creation error:", err);
    const msg = err.message || "Employee creation failed";
    if (msg.includes("already registered") || msg.includes("already in use") || msg.includes("required")) {
      return res.status(400).json({ message: msg });
    }
    return res.status(500).json({ message: "Employee creation failed", details: msg });
  }
});


/**
 * UPDATE EMPLOYEE PROFILE
 */
router.post("/change-password", async (req, res) => {
  const { id, newPassword } = req.body;
  const empId = id || req.body.employee_id;
  if (!empId || !newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ message: "Employee ID and valid new password required" });
  }

  try {
    const password_hash = await bcrypt.hash(newPassword, 10);
    db.query("UPDATE employees SET password_hash = ? WHERE id = ?", [password_hash, empId], (err, result) => {
      if (err) return res.status(500).json({ message: "Failed to update password", details: err });
      res.json({ message: "Password updated successfully!" });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error hashing password" });
  }
});

router.put("/:id", authenticateJWT, (req, res, next) => {
  const { id } = req.params;
  const targetId = parseInt(id);
  if (isNaN(targetId)) return next();

  getTeamLeaderContext(req, async (errCtx, ctx) => {
    if (ctx.isTeamLeader && targetId !== ctx.leaderId) {
      return res.status(403).json({
        error: "Access denied. Team Leaders are not permitted to edit employee master profile details.",
        code: "EDIT_FORBIDDEN"
      });
    }

    const {
      name,
      firstName,
      lastName,
      employee_code,
      employee_id,
      employeeCode,
      email,
      phone,
      dob,
      joinDate,
      gender,
      maritalStatus,
      bloodGroup,
      employmentType,
      experience,
      shiftType,
      salary,
      address,
      emergencyContact,
      bankDetails,
      bankName,
      accountNumber,
      ifscCode,
      branch,
      branchId,
      department,
      departmentId,
      designation,
      designationId,
      managerName,
      managerId,
      teamName,
      teamId,
      experienceType,
      totalExperienceYears,
      totalExperienceMonths,
      relevantExperienceYears,
      relevantExperienceMonths,
      password,
      loginPassword
    } = req.body;

    let finalName = name;
    if (!finalName && (firstName || lastName)) {
      finalName = `${firstName || ''} ${lastName || ''}`.trim();
    }

    const finalCode = (employee_code || employee_id || employeeCode || '').trim();
    if (finalCode) {
      try {
        const dupCode = await new Promise((resolve) => {
          db.query(
            "SELECT id FROM employees WHERE (employee_code = ? OR employee_id = ?) AND id != ?",
            [finalCode, finalCode, targetId],
            (err, rows) => resolve(rows || [])
          );
        });
        if (dupCode.length > 0) {
          return res.status(400).json({ error: `Employee ID "${finalCode}" already exists.` });
        }
      } catch (codeErr) {
        console.error("Code duplicate check error:", codeErr);
      }
    }

    // Duplicate email check
    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      try {
        const dupes = await new Promise((resolve, reject) => {
          const checkSql = `
            SELECT id FROM employees WHERE LOWER(email) = ? AND id != ?
            UNION
            SELECT id FROM users WHERE LOWER(email) = ? AND employee_id != ?
          `;
          db.query(checkSql, [cleanEmail, targetId, cleanEmail, targetId], (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          });
        });
        if (dupes.length > 0) {
          return res.status(400).json({ error: `Email "${cleanEmail}" is already registered by another employee.` });
        }
      } catch (checkErr) {
        console.error("Email duplicate check error:", checkErr);
      }
    }

    // Resolve bank details
    let finalBankDetails = bankDetails;
    if (!finalBankDetails && (bankName !== undefined || accountNumber !== undefined || ifscCode !== undefined)) {
      finalBankDetails = JSON.stringify({
        bankName: bankName || '',
        accountNumber: accountNumber || '',
        ifscCode: ifscCode || ''
      });
    } else if (typeof finalBankDetails === 'object' && finalBankDetails !== null) {
      finalBankDetails = JSON.stringify(finalBankDetails);
    }

    const safeInt = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = parseInt(val, 10);
      return isNaN(num) ? null : num;
    };

    const safeFloat = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    const finalShiftType = shiftType !== undefined ? shiftType : (req.body.shift_type !== undefined ? req.body.shift_type : 'Regular Shift');
    const finalExperience = experience !== undefined ? experience : (req.body.total_experience !== undefined ? req.body.total_experience : null);
    const finalJoinDate = joinDate !== undefined ? (joinDate || null) : (req.body.join_date !== undefined ? (req.body.join_date || null) : null);
    const finalDob = dob !== undefined ? (dob || null) : null;
    const finalSalary = salary !== undefined ? (safeFloat(salary) ?? 0) : 0;

    const bId = safeInt(branchId);
    const dId = safeInt(departmentId);
    const desgId = safeInt(designationId);
    const mId = safeInt(managerId);
    const tId = safeInt(teamId);

    const bName = (branch && typeof branch === 'string' && branch.trim()) ? branch.trim() : null;
    const dName = (department && typeof department === 'string' && department.trim()) ? department.trim() : null;
    const desgName = (designation && typeof designation === 'string' && designation.trim()) ? designation.trim() : null;
    const mName = (managerName && typeof managerName === 'string' && managerName.trim()) ? managerName.trim() : null;
    const tName = (teamName && typeof teamName === 'string' && teamName.trim()) ? teamName.trim() : null;

    const sql = `
      UPDATE employees
      SET 
        name = COALESCE(NULLIF(?, ''), name), 
        employee_code = COALESCE(NULLIF(?, ''), employee_code),
        employee_id = COALESCE(NULLIF(?, ''), employee_id),
        email = COALESCE(NULLIF(?, ''), email), 
        phone = COALESCE(NULLIF(?, ''), phone), 
        dob = ?, 
        join_date = ?,
        gender = ?, 
        marital_status = ?,
        blood_group = ?,
        employment_type = ?, 
        experience = ?,
        shift_type = ?,
        salary = ?, 
        address = ?, 
        emergency_contact = ?, 
        bank_details = ?,
        branch_id = COALESCE(
          (SELECT id FROM branches WHERE id = ? OR branch_name = ? LIMIT 1),
          branch_id
        ),
        department_id = COALESCE(
          (SELECT id FROM departments WHERE id = ? OR dept_name = ? LIMIT 1),
          department_id
        ),
        designation_id = COALESCE(
          (SELECT id FROM designations WHERE id = ? OR role_name = ? OR role_code = ? LIMIT 1),
          designation_id
        ),
        manager_id = COALESCE(
          (SELECT id FROM (SELECT id FROM employees WHERE id = ? OR name = ? LIMIT 1) as temp),
          manager_id
        ),
        team_id = COALESCE(
          (SELECT id FROM teams WHERE id = ? OR name = ? LIMIT 1),
          team_id
        ),
        experience_type = COALESCE(?, experience_type),
        total_experience_years = COALESCE(?, total_experience_years),
        total_experience_months = COALESCE(?, total_experience_months),
        relevant_experience_years = COALESCE(?, relevant_experience_years),
        relevant_experience_months = COALESCE(?, relevant_experience_months)
      WHERE id = ?
    `;

    db.query(sql, [
      finalName !== undefined ? finalName : null,
      finalCode || null,
      finalCode || null,
      email !== undefined ? email : null,
      phone !== undefined ? phone : null,
      finalDob,
      finalJoinDate,
      gender !== undefined ? gender : null,
      maritalStatus !== undefined ? maritalStatus : null,
      bloodGroup !== undefined ? bloodGroup : null,
      employmentType !== undefined ? employmentType : null,
      finalExperience !== undefined ? finalExperience : null,
      finalShiftType !== undefined ? finalShiftType : null,
      finalSalary !== undefined ? finalSalary : null,
      address !== undefined ? address : null,
      emergencyContact !== undefined ? emergencyContact : null,
      finalBankDetails !== undefined ? finalBankDetails : null,
      bId, bName,
      dId, dName,
      desgId, desgName, desgName,
      mId, mName,
      tId, tName,
      experienceType !== undefined ? experienceType : null,
      safeInt(totalExperienceYears),
      safeInt(totalExperienceMonths),
      safeInt(relevantExperienceYears),
      safeInt(relevantExperienceMonths),
      targetId
    ], async (err, result) => {
      if (err) {
        console.error("Employee update error:", err);
        return res.status(500).json({ error: "Failed to update employee details", details: err });
      }

      // Update users table linked record
      if (finalName || email) {
        await new Promise(res => {
          db.query(
            "UPDATE users SET full_name = COALESCE(NULLIF(?, ''), full_name), email = COALESCE(NULLIF(?, ''), email) WHERE employee_id = ? OR email = ?",
            [finalName || null, email || null, targetId, email || ''],
            (uErr) => {
              if (uErr) console.error("Error updating users record:", uErr);
              res();
            }
          );
        });
      }

      // Update password if provided
      const passToSet = password || loginPassword;
      if (passToSet && typeof passToSet === 'string' && passToSet.trim().length >= 4) {
        try {
          const password_hash = bcrypt.hashSync(passToSet.trim(), 10);
          await new Promise(res => db.query("UPDATE employees SET password_hash = ? WHERE id = ?", [password_hash, targetId], res));

          const existingUser = await new Promise(res => {
            db.query("SELECT id FROM users WHERE employee_id = ? OR email = ?", [targetId, email || ''], (e, r) => res(r && r[0]));
          });

          if (existingUser) {
            await new Promise(res => db.query("UPDATE users SET password_hash = ? WHERE id = ?", [password_hash, existingUser.id], res));
          } else if (email) {
            await new Promise(res => {
              db.query(
                "INSERT INTO users (employee_id, full_name, email, password_hash, role, email_verified, email_verified_at, account_status) VALUES (?, ?, ?, ?, 'EMPLOYEE', 1, NOW(), 'Active')",
                [targetId, finalName || 'Employee', email, password_hash],
                (e) => res()
              );
            });
          }
        } catch (passErr) {
          console.error("Error updating password in PUT /:id:", passErr);
        }
      }

      logHistory(targetId, "Profile Update", "Previous values", `Updated profile fields for ${finalName || 'employee'}`, new Date());

      // Trigger Notification
      const NotificationService = require("../services/NotificationService");
      const updaterName = req.user?.name || "System";
      NotificationService.triggerEmployeeProfileUpdate(targetId, updaterName)
        .catch(e => console.error("Error triggering employee profile update notification:", e));

      res.json({ message: "Employee profile updated successfully" });
    });
  });
});

/**
 * GET ME PROFILE (Returns profile for authenticated user)
 */
router.get("/me/profile", authenticateJWT, (req, res) => {
  getTeamLeaderContext(req, (errCtx, ctx) => {
    renderEmployeeProfileResponse(ctx.leaderId, false, res);
  });
});

router.get("/me", authenticateJWT, (req, res) => {
  getTeamLeaderContext(req, (errCtx, ctx) => {
    renderEmployeeProfileResponse(ctx.leaderId, false, res);
  });
});

/**
 * GET EMPLOYEE PROFILE DETAILS (Job, Personal, Attendance / Leave Summary)
 * Enforces Team Leader scope: TL can view self or own team members ONLY.
 */
router.get("/:id/profile", authenticateJWT, (req, res) => {
  if (req.params.id === 'me') {
    return getTeamLeaderContext(req, (errCtx, ctx) => {
      renderEmployeeProfileResponse(ctx.leaderId, false, res);
    });
  }

  const targetId = parseInt(req.params.id);

  getTeamLeaderContext(req, (errCtx, ctx) => {
    const leaderId = (ctx && ctx.leaderId) ? ctx.leaderId : (req.user ? req.user.id : null);
    const reqUserId = req.user ? req.user.id : null;

    const isSelf = targetId === leaderId || targetId === reqUserId || (ctx && targetId === ctx.leaderId) || isNaN(targetId);

    if (ctx.isTeamLeader && !isSelf) {
      const teamId = ctx.teamId;
      if (!teamId) {
        return res.status(403).json({
          error: "Access denied. You have no team assigned and cannot access other employee profiles.",
          code: "NO_TEAM_ASSIGNED"
        });
      }

      const sqlCheck = "SELECT id, team_id FROM employees WHERE (id = ? OR email = (SELECT email FROM users WHERE id = ? LIMIT 1)) AND team_id = ?";
      return db.query(sqlCheck, [targetId, targetId, teamId], (vErr, vRows) => {
        if (vErr || !vRows || vRows.length === 0) {
          return res.status(403).json({
            error: "Access denied. You are authorized to view profiles of your own team members ONLY.",
            code: "TEAM_ACCESS_RESTRICTED"
          });
        }
        return renderEmployeeProfileResponse(targetId, true, res);
      });
    }

    renderEmployeeProfileResponse(targetId, false, res);
  });
});

/**
 * GET EMPLOYEE BY ID (Maps to profile fetch with same authorization checks)
 */
router.get("/:id", authenticateJWT, (req, res, next) => {
  if (req.params.id === 'me') {
    return getTeamLeaderContext(req, (errCtx, ctx) => {
      renderEmployeeProfileResponse((ctx && ctx.leaderId) || (req.user && req.user.id), false, res);
    });
  }

  const targetId = parseInt(req.params.id, 10);
  if (isNaN(targetId)) {
    return next();
  }

  getTeamLeaderContext(req, (errCtx, ctx) => {
    if (!ctx) {
      return renderEmployeeProfileResponse(targetId, false, res);
    }
    const leaderId = ctx.leaderId;
    const reqUserId = req.user ? req.user.id : null;
    const isSelf = targetId === leaderId || targetId === reqUserId || targetId === ctx.leaderId;

    if (ctx.isTeamLeader && !isSelf) {
      const teamId = ctx.teamId;
      if (!teamId) {
        return res.status(403).json({
          error: "Access denied. You have no team assigned and cannot access other employee profiles.",
          code: "NO_TEAM_ASSIGNED"
        });
      }

      const sqlCheck = "SELECT id, team_id FROM employees WHERE (id = ? OR email = (SELECT email FROM users WHERE id = ? LIMIT 1)) AND team_id = ?";
      return db.query(sqlCheck, [targetId, targetId, teamId], (vErr, vRows) => {
        if (vErr || !vRows || vRows.length === 0) {
          return res.status(403).json({
            error: "Access denied. You are authorized to view profiles of your own team members ONLY.",
            code: "TEAM_ACCESS_RESTRICTED"
          });
        }
        return renderEmployeeProfileResponse(targetId, true, res);
      });
    }

    renderEmployeeProfileResponse(targetId, false, res);
  });
});

function renderEmployeeProfileResponse(targetId, isTeamMemberView, res) {
  if (!targetId || isNaN(parseInt(targetId, 10))) {
    return res.status(400).json({ error: "Invalid employee ID specified" });
  }
  const cleanTargetId = parseInt(targetId, 10);

  const sql = `
    SELECT 
      e.*,
      b.branch_name,
      dept.dept_name,
      desg.role_name as role_name,
      m.name as manager_name,
      t.name as team_name
    FROM employees e
    LEFT JOIN users u ON u.email = e.email
    LEFT JOIN branches b ON e.branch_id = b.id
    LEFT JOIN departments dept ON e.department_id = dept.id
    LEFT JOIN designations desg ON e.designation_id = desg.id
    LEFT JOIN employees m ON e.manager_id = m.id
    LEFT JOIN teams t ON e.team_id = t.id
    WHERE e.id = ? OR u.id = ? OR e.email = (SELECT email FROM users WHERE id = ? LIMIT 1)
    ORDER BY (e.id = ?) DESC
    LIMIT 1
  `;

  db.query(sql, [cleanTargetId, cleanTargetId, cleanTargetId, cleanTargetId], (err, results) => {
    if (err) {
      console.error("renderEmployeeProfileResponse DB error:", err);
      return res.status(500).json({ error: "Failed to fetch profile", details: err.message });
    }

    if (results.length === 0) {
      const fallbackSql = `
        SELECT 
          e.*,
          b.branch_name,
          dept.dept_name,
          desg.role_name as role_name,
          m.name as manager_name,
          t.name as team_name
        FROM employees e
        LEFT JOIN branches b ON e.branch_id = b.id
        LEFT JOIN departments dept ON e.department_id = dept.id
        LEFT JOIN designations desg ON e.designation_id = desg.id
        LEFT JOIN employees m ON e.manager_id = m.id
        LEFT JOIN teams t ON e.team_id = t.id
        ORDER BY e.id ASC
        LIMIT 1
      `;
      return db.query(fallbackSql, (fbErr, fbResults) => {
        if (fbErr || !fbResults || fbResults.length === 0) {
          return res.status(404).json({ error: "Employee profile not found." });
        }
        return sendProfileObj(fbResults[0]);
      });
    }

    sendProfileObj(results[0]);

    function sendProfileObj(emp) {
      const empCode = emp.employee_id || emp.employee_code || '';
      let parsedBank = {};
      try {
        if (emp.bank_details) {
          if (typeof emp.bank_details === 'string' && emp.bank_details.trim().startsWith('{')) {
            parsedBank = JSON.parse(emp.bank_details);
          } else {
            parsedBank = { bankName: emp.bank_details };
          }
        }
      } catch (e) {
        parsedBank = { bankName: emp.bank_details };
      }

      const profile = {
        id: emp.id,
        employee_id: empCode,
        employee_code: empCode,
        employeeCode: empCode,
        employeeId: empCode,
        empId: empCode,
        emp_code: empCode,
        name: emp.name,
        firstName: emp.first_name || (emp.name ? emp.name.split(' ')[0] : ''),
        lastName: emp.last_name || (emp.name ? emp.name.split(' ').slice(1).join(' ') : ''),
        email: emp.email,
        phone: emp.phone,
        dob: emp.dob,
        joinDate: emp.join_date,
        status: emp.status,
        gender: emp.gender,
        maritalStatus: emp.marital_status || '',
        bloodGroup: emp.blood_group || '',
        employmentType: emp.employment_type,
        experience: emp.experience || '',
        shiftType: emp.shift_type || 'Regular Shift',
        candidateId: emp.candidate_id || null,
        experienceType: emp.experience_type || (emp.total_experience_years > 0 || emp.total_experience_months > 0 ? 'Experienced' : 'Fresher'),
        totalExperienceYears: emp.total_experience_years || 0,
        totalExperienceMonths: emp.total_experience_months || 0,
        relevantExperienceYears: emp.relevant_experience_years || 0,
        relevantExperienceMonths: emp.relevant_experience_months || 0,
        salary: isTeamMemberView ? null : emp.salary,
        bankDetails: isTeamMemberView ? null : emp.bank_details,
        bankName: parsedBank.bankName || parsedBank.bank_name || '',
        accountNumber: parsedBank.accountNumber || parsedBank.account_number || '',
        ifscCode: parsedBank.ifscCode || parsedBank.ifsc_code || '',
        emergencyContact: emp.emergency_contact,
        address: emp.address,
        branchId: emp.branch_id || null,
        branchName: emp.branch_name,
        departmentId: emp.department_id || null,
        deptName: emp.dept_name,
        designationId: emp.designation_id || null,
        roleName: emp.role_name,
        managerId: emp.manager_id || null,
        managerName: emp.manager_name,
        teamId: emp.team_id || null,
        teamName: emp.team_name,
        profilePhoto: emp.profile_photo || null,
        attendanceSummary: {
          present: 20,
          absent: 1,
          late: 2,
          halfDay: 0
        },
        leaveSummary: {
          total: 15,
          taken: 5,
          remaining: 10
        },
        performanceSummary: {
          rating: "4.5 / 5",
          lastReview: "June 2026",
          status: "Exceeds Expectations"
        }
      };

      res.json(profile);
    }
  });
}

/**
 * GET EMPLOYEE HISTORY TIMELINE
 */
router.get("/:id/history", (req, res) => {
  const sql = "SELECT * FROM employment_history WHERE employee_id = ? ORDER BY effective_date DESC, created_at DESC";
  db.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch timeline", details: err });
    res.json(rows);
  });
});

/**
 * GET PROMOTIONS
 */
router.get("/promotions", (req, res) => {
  const sql = `
    SELECT 
      p.*,
      e.name as employee_name,
      e.profile_photo as profile_photo,
      COALESCE(e.employee_code, e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as employee_code,
      COALESCE(e.employee_code, e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as employeeId,
      COALESCE(d1.role_name, p.current_designation) as old_designation,
      COALESCE(d2.role_name, p.promoted_designation) as new_designation,
      approver.name as approved_by_name
    FROM promotions p
    JOIN employees e ON p.employee_id = e.id
    LEFT JOIN designations d1 ON p.old_designation_id = d1.id
    LEFT JOIN designations d2 ON p.new_designation_id = d2.id
    LEFT JOIN employees approver ON p.approved_by = approver.id
    ORDER BY p.created_at DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch promotions", details: err });
    res.json(rows);
  });
});

/**
 * SUBMIT PROMOTION REQUEST
 */
router.post("/promotions", authenticateJWT, checkPermission('employees', 'promotions', 'create'), (req, res) => {
  const { employeeId, newDesignationId, newDesignationName, effectiveDate, reason } = req.body;
  const targetEmpId = parseInt(employeeId, 10);
  if (!targetEmpId || (!newDesignationName && !newDesignationId)) {
    return res.status(400).json({ error: "Valid employeeId and designation are required" });
  }

  const effDate = effectiveDate || new Date().toISOString().split('T')[0];

  const proceedWithDesg = (resolvedDesgId, resolvedDesgName) => {
    const getOldDesgSql = `
      SELECT e.designation_id, e.department_id, d.dept_name, desg.role_name as old_desg_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations desg ON e.designation_id = desg.id
      WHERE e.id = ?
    `;
    db.query(getOldDesgSql, [targetEmpId], (err2, empRows) => {
      const emp = (empRows && empRows.length > 0) ? empRows[0] : {};
      const oldDesgId = emp.designation_id || null;
      const oldDesgName = emp.old_desg_name || null;
      const curDeptName = emp.dept_name || null;

      const insertPromoSql = `
        INSERT INTO promotions (
          employee_id, old_designation_id, new_designation_id, effective_date, status,
          current_department, current_designation, promoted_department, promoted_designation,
          promotion_date, promotion_reason, created_by
        )
        VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?)
      `;
      const userId = (req.user && req.user.id) || 1;
      const params = [
        targetEmpId, oldDesgId, resolvedDesgId, effDate,
        curDeptName, oldDesgName, curDeptName, resolvedDesgName,
        effDate, reason || `Promotion to ${resolvedDesgName}`, userId
      ];

      db.query(insertPromoSql, params, (err3, result) => {
        if (err3) {
          console.error("Promotion insert error:", err3);
          return res.status(500).json({ error: "Failed to submit promotion request", details: err3.message });
        }
        res.json({ message: "Promotion request submitted successfully", id: result.insertId });
      });
    });
  };

  if (newDesignationId && !isNaN(parseInt(newDesignationId, 10))) {
    db.query("SELECT id, role_name FROM designations WHERE id = ? LIMIT 1", [parseInt(newDesignationId, 10)], (dErr, dRows) => {
      if (!dErr && dRows && dRows.length > 0) {
        return proceedWithDesg(dRows[0].id, dRows[0].role_name);
      }
      findByName();
    });
  } else {
    findByName();
  }

  function findByName() {
    const rawName = String(newDesignationName || '').trim();
    const findDesgSql = "SELECT id, role_name FROM designations WHERE role_name = ? OR role_code = ? LIMIT 1";
    db.query(findDesgSql, [rawName, rawName], (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error", details: err });

      if (rows && rows.length > 0) {
        proceedWithDesg(rows[0].id, rows[0].role_name);
      } else {
        const baseCode = rawName.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 30) || 'DESG';
        const uniqueCode = `${baseCode}_${Date.now().toString().slice(-4)}`;
        db.query(
          "INSERT INTO designations (role_code, role_name, status, createdDate) VALUES (?, ?, 'Active', DATE_FORMAT(NOW(), '%d %b %Y'))",
          [uniqueCode, rawName],
          (errIns, resIns) => {
            if (errIns) {
              db.query("SELECT id, role_name FROM designations LIMIT 1", (fbErr, fbRows) => {
                if (!fbErr && fbRows && fbRows.length > 0) {
                  proceedWithDesg(fbRows[0].id, fbRows[0].role_name);
                } else {
                  return res.status(500).json({ error: "Failed to create designation", details: errIns });
                }
              });
              return;
            }
            proceedWithDesg(resIns.insertId, rawName);
          }
        );
      }
    });
  }
});

/**
 * APPROVE PROMOTION
 */
router.put("/promotions/:id/approve", authenticateJWT, checkPermission('employees', 'promotions', 'edit'), (req, res) => {
  const { id } = req.params;
  const { approverId = 1 } = req.body; // Default fallback to Admin

  // Fetch promotion details first
  db.query("SELECT * FROM promotions WHERE id = ?", [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: "Promotion not found" });
    const promo = results[0];

    // Begin updates: 1. Update promotion status
    db.query("UPDATE promotions SET status = 'Approved', approved_by = ? WHERE id = ?", [approverId, id], (upErr) => {
      if (upErr) return res.status(500).json({ error: "Approval failed", details: upErr });

      // 2. Update employee designation
      db.query("UPDATE employees SET designation_id = ? WHERE id = ?", [promo.new_designation_id, promo.employee_id], (empErr) => {
        if (empErr) console.error("Failed to update employee designation:", empErr);

        // Fetch designation names to log in history
        db.query("SELECT role_name FROM designations WHERE id IN (?, ?)", [promo.old_designation_id, promo.new_designation_id], (desgErr, desgRows) => {
          const oldName = desgRows.find(d => d.id === promo.old_designation_id)?.role_name || "Staff";
          const newName = desgRows.find(d => d.id === promo.new_designation_id)?.role_name || "Manager";
          logHistory(promo.employee_id, "Promotion", oldName, newName, promo.effective_date);
        });

        res.json({ message: "Promotion approved successfully" });
      });
    });
  });
});

/**
 * GET TRANSFERS
 */
router.get("/transfers", (req, res) => {
  const sql = `
    SELECT 
      t.*,
      e.name as employee_name,
      e.profile_photo as profile_photo,
      COALESCE(e.employee_code, e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as employee_code,
      COALESCE(e.employee_code, e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as employeeId,
      approver.name as approved_by_name
    FROM transfers t
    JOIN employees e ON t.employee_id = e.id
    LEFT JOIN employees approver ON t.approved_by = approver.id
    ORDER BY t.created_at DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch transfers", details: err });
    res.json(rows);
  });
});

/**
 * SUBMIT TRANSFER REQUEST
 */
router.post("/transfers", authenticateJWT, checkPermission('employees', 'transfers', 'create'), async (req, res) => {
  const { employeeId, transferType, newValueId, newValueName, effectiveDate } = req.body;
  const targetEmpId = parseInt(employeeId, 10);
  if (!targetEmpId) {
    return res.status(400).json({ error: "Valid employeeId is required" });
  }

  const effDate = effectiveDate || new Date().toISOString().split('T')[0];
  const type = transferType || 'Department';

  try {
    const [empRows] = await new Promise((resolve, reject) => {
      db.query("SELECT department_id, branch_id, manager_id FROM employees WHERE id = ?", [targetEmpId], (err, rows) => {
        if (err) return reject(err);
        resolve([rows]);
      });
    });
    const emp = empRows && empRows[0] ? empRows[0] : {};
    let oldValueId = null;
    if (type === 'Branch') oldValueId = emp.branch_id || null;
    else if (type === 'Department') oldValueId = emp.department_id || null;
    else oldValueId = emp.manager_id || null;

    let resolvedNewId = null;

    if (newValueId && !isNaN(parseInt(newValueId, 10))) {
      resolvedNewId = parseInt(newValueId, 10);
    }

    if (!resolvedNewId && type === 'Department') {
      const targetName = String(newValueName || '').trim();
      const rows = await new Promise((resolve) => {
        db.query(
          "SELECT id FROM departments WHERE dept_name = ? OR dept_name LIKE ? ORDER BY id ASC LIMIT 1",
          [targetName, `%${targetName}%`],
          (err, r) => resolve(r || [])
        );
      });
      if (rows.length > 0) {
        resolvedNewId = rows[0].id;
      } else {
        const allDepts = await new Promise(r => db.query("SELECT id FROM departments LIMIT 1", (e, dRows) => r(dRows || [])));
        if (allDepts.length > 0) {
          resolvedNewId = allDepts[0].id;
        } else {
          const createDept = await new Promise(r => db.query("INSERT INTO departments (dept_name, status) VALUES (?, 'Active')", [targetName || 'General'], (e, dRes) => r(dRes)));
          resolvedNewId = createDept ? createDept.insertId : 1;
        }
      }
    } else if (!resolvedNewId && type === 'Branch') {
      const targetName = String(newValueName || '').trim();
      const rows = await new Promise((resolve) => {
        db.query("SELECT id FROM branches WHERE branch_name = ? OR branch_name LIKE ? LIMIT 1", [targetName, `%${targetName}%`], (err, r) => resolve(r || []));
      });
      if (rows.length > 0) {
        resolvedNewId = rows[0].id;
      } else {
        const bName = targetName || 'Main Branch';
        const createBranch = await new Promise(r => db.query("INSERT INTO branches (branch_name, status) VALUES (?, 'Active')", [bName], (e, bRes) => r(bRes)));
        resolvedNewId = createBranch ? createBranch.insertId : 1;
      }
    } else if (!resolvedNewId && type === 'Manager') {
      const targetName = String(newValueName || '').trim();
      const rows = await new Promise((resolve) => {
        db.query("SELECT id FROM employees WHERE name = ? OR name LIKE ? LIMIT 1", [targetName, `%${targetName}%`], (err, r) => resolve(r || []));
      });
      if (rows.length > 0) {
        resolvedNewId = rows[0].id;
      } else {
        resolvedNewId = 1;
      }
    }

    if (!resolvedNewId) {
      return res.status(400).json({ error: `Could not resolve a valid target ${type} ID` });
    }

    const insertSql = `
      INSERT INTO transfers (employee_id, transfer_type, old_value_id, new_value_id, effective_date, status)
      VALUES (?, ?, ?, ?, ?, 'Pending')
    `;
    db.query(insertSql, [targetEmpId, type, oldValueId, resolvedNewId, effDate], (err, result) => {
      if (err) {
        console.error("Transfer insert error:", err);
        return res.status(500).json({ error: "Failed to submit transfer request", details: err.message });
      }
      res.json({ message: "Transfer request submitted", id: result.insertId });
    });
  } catch (ex) {
    console.error("Transfer error:", ex);
    res.status(500).json({ error: "Internal server error processing transfer", details: ex.message });
  }
});

/**
 * APPROVE TRANSFER
 */
router.put("/transfers/:id/approve", authenticateJWT, checkPermission('employees', 'transfers', 'edit'), (req, res) => {
  const { id } = req.params;
  const { approverId = 1 } = req.body;

  db.query("SELECT * FROM transfers WHERE id = ?", [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: "Transfer not found" });
    const xfer = results[0];

    db.query("UPDATE transfers SET status = 'Approved', approved_by = ? WHERE id = ?", [approverId, id], (upErr) => {
      if (upErr) return res.status(500).json({ error: "Approval failed" });

      let updateField = "";
      if (xfer.transfer_type === "Branch") updateField = "branch_id";
      else if (xfer.transfer_type === "Department") updateField = "department_id";
      else updateField = "manager_id";

      db.query(`UPDATE employees SET ${updateField} = ? WHERE id = ?`, [xfer.new_value_id, xfer.employee_id], (empErr) => {
        if (empErr) console.error("Employee update failed:", empErr);
        logHistory(xfer.employee_id, `${xfer.transfer_type} Transfer`, `Old ID: ${xfer.old_value_id}`, `New ID: ${xfer.new_value_id}`, xfer.effective_date);
        res.json({ message: "Transfer approved successfully" });
      });
    });
  });
});

/**
 * GET EXITS
 */
router.get("/exits", (req, res) => {
  const sql = `
    SELECT 
      ex.*,
      e.name as employee_name,
      e.profile_photo as profile_photo,
      COALESCE(e.employee_code, e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as employee_code,
      COALESCE(e.employee_code, e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as employeeId
    FROM exit_management ex
    JOIN employees e ON ex.employee_id = e.id
    ORDER BY ex.created_at DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch exits", details: err });
    res.json(rows);
  });
});

/**
 * SUBMIT RESIGNATION / TERMINATION
 */
router.post("/exits", authenticateJWT, checkPermission('employees', 'exit_management', 'create'), (req, res) => {
  const { employeeId, exitType, noticeDate, exitDate, reason, clearanceChecklist } = req.body;
  const targetEmpId = parseInt(employeeId, 10);
  if (!targetEmpId) {
    return res.status(400).json({ error: "Valid employeeId is required" });
  }

  const checklistStr = clearanceChecklist ? JSON.stringify(clearanceChecklist) : null;
  const nDate = noticeDate || new Date().toISOString().split('T')[0];
  const eDate = exitDate || nDate;
  const type = exitType || 'Resignation';

  const sql = `
    INSERT INTO exit_management (employee_id, exit_type, notice_date, exit_date, reason, clearance_checklist, status)
    VALUES (?, ?, ?, ?, ?, ?, 'Pending')
  `;

  db.query(sql, [targetEmpId, type, nDate, eDate, reason || '', checklistStr], (err, result) => {
    if (err) {
      console.error("Exit insert error:", err);
      return res.status(500).json({ error: "Failed to create exit record", details: err.message });
    }

    // Auto update status in history
    logHistory(targetEmpId, "Exit Request", null, `${type} scheduled on ${eDate}`, eDate);

    res.json({ message: "Exit record saved successfully", id: result.insertId });
  });
});

/**
 * APPROVE / SETTLE EXIT
 */
router.put("/exits/:id/settle", authenticateJWT, checkPermission('employees', 'exit_management', 'edit'), (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM exit_management WHERE id = ?", [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: "Exit record not found" });
    const ext = results[0];

    db.query("UPDATE exit_management SET status = 'Settled' WHERE id = ?", [id], (upErr) => {
      if (upErr) return res.status(500).json({ error: "Settle exit failed" });

      db.query("UPDATE employees SET status = 'Terminated' WHERE id = ?", [ext.employee_id], (empErr) => {
        if (empErr) console.error("Employee deactivate failed:", empErr);
        logHistory(ext.employee_id, "Separation", "Active", "Terminated", ext.exit_date);
        res.json({ message: "Exit settled and employee deactivated" });
      });
    });
  });
});

/**
 * GET EMPLOYEE DOCUMENTS
 */
router.get("/:id/documents", (req, res) => {
  const sql = `
    SELECT 
      id, 
      employee_id, 
      document_type as doc_type, 
      document_name as file_name, 
      file as file_path, 
      created_at as uploaded_at, 
      status 
    FROM employee_documents 
    WHERE employee_id = ? 
    ORDER BY created_at DESC
  `;
  db.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch documents", details: err });
    res.json(rows);
  });
});

/**
 * UPLOAD EMPLOYEE DOCUMENT PATH
 */
router.post("/:id/documents", authenticateJWT, checkPermission('employees', 'employee_documents', 'create'), uploadDoc.single('document'), (req, res) => {
  const docType = req.body.docType || 'Onboarding Document';
  const fileName = req.file ? req.file.originalname : (req.body.fileName || 'Untitled');
  const filePath = req.file ? `/uploads/documents/${req.file.filename}` : req.body.filePath;

  const sql = `
    INSERT INTO employee_documents (employee_id, document_type, document_name, file, status)
    VALUES (?, ?, ?, ?, 'Pending')
  `;
  db.query(sql, [req.params.id, docType, fileName, filePath || `/uploads/docs/${fileName}`], (err, result) => {
    if (err) {
      console.error("Document upload DB error:", err);
      return res.status(500).json({ error: "Failed to save document record", details: err.message, stack: err.stack });
    }
    res.json({ message: "Document uploaded successfully", id: result.insertId });
  });
});

/**
 * DELETE DOCUMENT
 */
router.delete("/documents/:docId", authenticateJWT, checkPermission('employees', 'employee_documents', 'delete'), (req, res) => {
  const sql = "DELETE FROM employee_documents WHERE id = ?";
  db.query(sql, [req.params.docId], (err) => {
    if (err) return res.status(500).json({ error: "Failed to delete document", details: err });
    res.json({ message: "Document deleted successfully" });
  });
});

/**
 * UPLOAD PROFILE PHOTO
 */
router.post("/:id/photo", uploadPhoto.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No photo uploaded" });
  }

  const { id } = req.params;
  const photoPath = `/uploads/photos/${req.file.filename}`;

  let dataUri = photoPath;
  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const mime = req.file.mimetype || 'image/png';
    dataUri = `data:${mime};base64,${fileBuffer.toString('base64')}`;
  } catch (readErr) {
    console.warn("Could not convert uploaded photo to base64, using relative path:", readErr.message);
  }

  db.query("UPDATE employees SET profile_photo = ? WHERE id = ?", [dataUri, id], (err) => {
    if (err) return res.status(500).json({ error: "Failed to save photo", details: err });
    res.json({ message: "Photo uploaded successfully", photoUrl: dataUri });
  });
});

/**
 * DELETE PROFILE PHOTO
 */
router.delete("/:id/photo", (req, res) => {
  const { id } = req.params;

  // Get current photo path to delete file
  db.query("SELECT profile_photo FROM employees WHERE id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed" });

    if (rows.length > 0 && rows[0].profile_photo) {
      if (rows[0].profile_photo.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', rows[0].profile_photo);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    db.query("UPDATE employees SET profile_photo = NULL WHERE id = ?", [id], (err2) => {
      if (err2) return res.status(500).json({ error: "Failed to remove photo" });
      res.json({ message: "Photo removed successfully" });
    });
  });
});


/**
 * ============================================================================
 * EMPLOYEE PREVIOUS EXPERIENCE HISTORY & SUMMARY ENDPOINTS
 * ============================================================================
 */

/**
 * Helper to check role for experience editing permissions
 */
function checkExperienceEditPermission(req, res, next) {
  const role = (req.user && req.user.role) || req.headers['x-user-role'] || 'SUPER_ADMIN';
  const normRole = String(role).toUpperCase();

  if (normRole === 'EMPLOYEE') {
    return res.status(403).json({
      error: "Access denied. Employees are not permitted to edit previous experience history directly. Please contact HR.",
      code: "EXPERIENCE_EDIT_FORBIDDEN"
    });
  }
  next();
}

/**
 * GET EMPLOYEE PREVIOUS EXPERIENCES
 * GET /app/employees/:id/previous-experiences
 */
router.get("/:id/previous-experiences", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const experiences = await EmployeeExperienceService.getByEmployeeId(id);
    const summary = await EmployeeExperienceService.getSummary(id);
    res.json({
      success: true,
      summary: summary || {
        experience_type: 'Experienced',
        total_experience_years: 0,
        total_experience_months: 0,
        relevant_experience_years: 0,
        relevant_experience_months: 0
      },
      experiences: experiences || []
    });
  } catch (err) {
    console.error('Error fetching employee previous experiences:', err);
    res.status(500).json({ error: 'Failed to fetch previous experiences', details: err.message });
  }
});

/**
 * GET EMPLOYEE EXPERIENCE SUMMARY
 * GET /app/employees/:id/experience-summary
 */
router.get("/:id/experience-summary", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const summary = await EmployeeExperienceService.getSummary(id);
    if (!summary) return res.status(404).json({ error: 'Employee not found' });
    res.json({ success: true, summary });
  } catch (err) {
    console.error('Error fetching experience summary:', err);
    res.status(500).json({ error: 'Failed to fetch experience summary', details: err.message });
  }
});

/**
 * UPDATE EMPLOYEE EXPERIENCE SUMMARY
 * PUT /app/employees/:id/experience-summary
 */
router.put("/:id/experience-summary", authenticateJWT, checkExperienceEditPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;
    const updated = await EmployeeExperienceService.updateSummary(id, req.body, userId);
    res.json({ success: true, message: 'Experience summary updated successfully', summary: updated });
  } catch (err) {
    console.error('Error updating experience summary:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to update experience summary' });
  }
});

/**
 * CREATE EMPLOYEE PREVIOUS EXPERIENCE
 * POST /app/employees/:id/previous-experiences
 */
router.post("/:id/previous-experiences", authenticateJWT, checkExperienceEditPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;
    const created = await EmployeeExperienceService.create(id, req.body, userId);
    res.status(201).json({ success: true, message: 'Previous experience record added successfully', experience: created });
  } catch (err) {
    console.error('Error adding previous experience:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to add previous experience' });
  }
});

/**
 * UPDATE EMPLOYEE PREVIOUS EXPERIENCE
 * PUT /app/employees/:id/previous-experiences/:expId
 */
router.put("/:id/previous-experiences/:expId", authenticateJWT, checkExperienceEditPermission, async (req, res) => {
  try {
    const { expId } = req.params;
    const userId = req.user?.id || 1;
    const updated = await EmployeeExperienceService.update(expId, req.body, userId);
    res.json({ success: true, message: 'Previous experience record updated successfully', experience: updated });
  } catch (err) {
    console.error('Error updating previous experience:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to update previous experience' });
  }
});

/**
 * DELETE EMPLOYEE PREVIOUS EXPERIENCE
 * DELETE /app/employees/:id/previous-experiences/:expId
 */
router.delete("/:id/previous-experiences/:expId", authenticateJWT, checkExperienceEditPermission, async (req, res) => {
  try {
    const { expId } = req.params;
    const userId = req.user?.id || 1;
    await EmployeeExperienceService.delete(expId, userId);
    res.json({ success: true, message: 'Previous experience record deleted successfully' });
  } catch (err) {
    console.error('Error deleting previous experience:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to delete previous experience' });
  }
});

module.exports = router;

