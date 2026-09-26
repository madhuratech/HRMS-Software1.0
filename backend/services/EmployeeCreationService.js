const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { getNextEmployeeCode } = require('../utils/employeeCodeGenerator');
const EmployeeExperienceService = require('./EmployeeExperienceService');

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function logHistory(employeeId, changeType, oldValue, newValue, date) {
  const sql = `
    INSERT INTO employment_history (employee_id, change_type, old_value, new_value, effective_date)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [employeeId, changeType, oldValue, newValue, date || new Date()], (err) => {
    if (err) console.error("Error logging history in EmployeeCreationService:", err);
  });
}

class EmployeeCreationService {
  /**
   * Helper to normalize raw values
   */
  static normalizeEmployeeData(input = {}) {
    const firstName = String(input.firstName || input.first_name || '').trim();
    const lastName = String(input.lastName || input.last_name || '').trim();
    let name = String(input.name || input.fullName || input.full_name || '').trim();

    if (!name && (firstName || lastName)) {
      name = `${firstName} ${lastName}`.trim();
    } else if (name && (!firstName && !lastName)) {
      const parts = name.split(/\s+/);
      // assign if needed
    }

    const email = String(input.email || input.mail_id || input.mailId || input.loginEmail || '').trim().toLowerCase();
    const phone = String(input.phone || input.contactNo || input.contact_no || input.mobile || '').trim();
    const dob = input.dob || input.dateOfBirth || input.date_of_birth || null;
    const joinDate = input.joinDate || input.join_date || input.dateOfJoining || input.date_of_joining || new Date().toISOString().split('T')[0];
    const gender = String(input.gender || 'Other').trim();
    const shiftType = String(input.shiftType || input.shift_type || input.employeeShiftType || 'Regular Shift').trim();
    const employmentType = String(input.employmentType || input.employment_type || 'Full-time').trim();
    const maritalStatus = String(input.maritalStatus || input.marital_status || '').trim();
    const bloodGroup = String(input.bloodGroup || input.blood_group || '').trim();

    const department = String(input.department || input.dept || '').trim();
    const designation = String(input.designation || input.role || input.position || '').trim();
    const branch = String(input.branch || '').trim();
    const teamName = String(input.teamName || input.team_name || input.team || '').trim();
    const managerName = String(input.managerName || input.manager_name || input.reportingManager || input.reporting_manager || '').trim();

    const salary = parseFloat(input.salary || input.monthlySalary || input.monthly_salary || 60000) || 0;
    const address = String(input.address || input.completeAddress || '').trim();
    const emergencyContact = String(input.emergencyContact || input.emergency_contact || input.emergencyContactNo || '').trim();

    let bankDetails = input.bankDetails || input.bank_details;
    if (typeof bankDetails !== 'string') {
      bankDetails = JSON.stringify({
        bankName: input.bankName || input.bank_name || '',
        accountNumber: input.accountNumber || input.account_number || '',
        ifscCode: input.ifscCode || input.ifsc_code || ''
      });
    }

    const experience = input.experience || null;
    const experienceType = input.experienceType || input.experience_type || (input.totalExpYears > 0 || input.total_experience_years > 0 ? 'Experienced' : 'Fresher');
    const totalExpYears = parseInt(input.totalExpYears || input.total_experience_years || 0, 10) || 0;
    const totalExpMonths = parseInt(input.totalExpMonths || input.total_experience_months || 0, 10) || 0;
    const relevantExpYears = parseInt(input.relevantExpYears || input.relevant_experience_years || totalExpYears, 10) || 0;
    const relevantExpMonths = parseInt(input.relevantExpMonths || input.relevant_experience_months || totalExpMonths, 10) || 0;

    const employeeCode = String(input.employeeCode || input.employee_code || input.employeeId || input.employee_id || '').trim();
    const password = input.password || 'Employee@2026';

    return {
      name,
      firstName,
      lastName,
      email,
      phone,
      dob,
      joinDate,
      gender,
      shiftType,
      employmentType,
      maritalStatus,
      bloodGroup,
      department,
      designation,
      branch,
      teamName,
      managerName,
      salary,
      address,
      emergencyContact,
      bankDetails,
      experience,
      experienceType,
      totalExpYears,
      totalExpMonths,
      relevantExpYears,
      relevantExpMonths,
      employeeCode,
      password,
      previousExperiences: input.previousExperiences || input.previous_experiences || []
    };
  }

  /**
   * Validate a single employee object against the Add Employee form validation rules
   */
  static async validateEmployee(rawInput, { isUpdate = false, existingId = null } = {}) {
    const data = this.normalizeEmployeeData(rawInput);
    const missingFields = [];
    const errors = [];
    const warnings = [];

    // Required fields per Add Employee form:
    // 0. Employee ID / Code (must be manually entered)
    if (!data.employeeCode || !String(data.employeeCode).trim()) {
      missingFields.push('Employee ID');
      errors.push('Employee ID is required.');
    } else {
      const codeToCheck = String(data.employeeCode).trim();
      try {
        const dupCodes = await queryAsync(
          "SELECT id FROM employees WHERE employee_code = ? OR employee_id = ?",
          [codeToCheck, codeToCheck]
        );
        if (dupCodes && dupCodes.length > 0) {
          const isSelf = isUpdate && existingId && dupCodes.every(r => r.id == existingId);
          if (!isSelf) {
            errors.push(`Employee ID "${codeToCheck}" already exists.`);
          }
        }
      } catch (e) {
        console.error("Error checking employee code duplicate:", e);
      }
    }

    // 1. Name
    if (!data.name) {
      missingFields.push('Name');
      errors.push('Employee name is required.');
    }

    // 2. Date of Birth
    if (!data.dob) {
      warnings.push('Date of Birth not specified.');
    }

    // 3. Gender (defaults to Other if not specified)
    if (!data.gender) {
      data.gender = 'Other';
    }

    // 4. Shift Type
    if (!data.shiftType) {
      missingFields.push('Shift Type');
      errors.push('Shift Type is required.');
    }

    // 5. Email
    if (!data.email) {
      missingFields.push('Email');
      errors.push('Login Email is required.');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Invalid email format.');
      } else {
        // Duplicate email check
        try {
          const dupRows = await queryAsync(
            "SELECT id FROM employees WHERE LOWER(email) = ?",
            [data.email]
          );

          if (dupRows && dupRows.length > 0) {
            const isSelf = isUpdate && existingId && dupRows.every(r => r.id == existingId);
            if (!isSelf) {
              errors.push(`Email "${data.email}" is already registered.`);
            }
          }
        } catch (e) {
          console.error("Error checking email duplicate:", e);
        }
      }
    }

    // 6. Phone
    if (!data.phone) {
      missingFields.push('Phone');
      errors.push('Contact No / Phone is required.');
    }

    // Optional validation / warnings:
    if (!data.department) {
      warnings.push('Department not specified (will default to General).');
    }
    if (!data.designation) {
      warnings.push('Designation not specified (will default to Employee).');
    }

    return {
      valid: errors.length === 0,
      normalizedData: data,
      missingFields,
      errors,
      warnings
    };
  }

  /**
   * Create an employee (Used by both single Add Employee form and Excel import)
   */
  static async createEmployee(rawInput) {
    const data = this.normalizeEmployeeData(rawInput);

    if (!data.name) throw new Error("Employee name is required.");
    if (!data.email) throw new Error("Login email is required.");
    if (!data.shiftType) throw new Error("Shift type is required.");

    // Check email uniqueness against existing employees
    const existingEmp = await queryAsync(
      "SELECT id FROM employees WHERE LOWER(email) = ? LIMIT 1",
      [data.email]
    );

    if (existingEmp && existingEmp.length > 0) {
      throw new Error(`Email "${data.email}" is already registered. Please use another email.`);
    }

    // Password hash
    const defaultPassword = data.password || "Employee@2026";
    const password_hash = await bcrypt.hash(defaultPassword, 10);

    // Require manual Employee ID / Code
    const finalCode = String(data.employeeCode || '').trim();
    if (!finalCode) {
      throw new Error("Employee ID is required.");
    }

    const existingCode = await queryAsync(
      "SELECT id FROM employees WHERE employee_code = ? OR employee_id = ? LIMIT 1",
      [finalCode, finalCode]
    );
    if (existingCode && existingCode.length > 0) {
      throw new Error(`Employee ID "${finalCode}" already exists.`);
    }

    // Experience parsing
    const parsedExp = EmployeeExperienceService.parseExperienceString(data.experience);
    const finalExpType = data.experienceType || parsedExp.type || 'Fresher';
    const finalTotYrs = data.totalExpYears !== undefined ? data.totalExpYears : (parsedExp.totalYears || 0);
    const finalTotMos = data.totalExpMonths !== undefined ? data.totalExpMonths : (parsedExp.totalMonths || 0);
    const finalRelYrs = data.relevantExpYears !== undefined ? data.relevantExpYears : (parsedExp.relevantYears || finalTotYrs);
    const finalRelMos = data.relevantExpMonths !== undefined ? data.relevantExpMonths : (parsedExp.relevantMonths || finalTotMos);
    const finalExperienceStr = data.experience || (finalTotMos > 0 ? `${finalTotYrs} Years ${finalTotMos} Months` : `${finalTotYrs} Years`);

    const insertEmpSql = `
      INSERT INTO employees
      (name, email, employee_code, employee_id, phone, dob, join_date, gender, employment_type, experience, experience_type, total_experience_years, total_experience_months, relevant_experience_years, relevant_experience_months, shift_type, salary, address, emergency_contact, bank_details, password_hash, branch_id, department_id, designation_id, manager_id, team_id)
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        (SELECT IF(? REGEXP '^[0-9]+$', ?, (SELECT id FROM branches WHERE branch_name = ? LIMIT 1))),
        (SELECT IF(? REGEXP '^[0-9]+$', ?, (SELECT id FROM departments WHERE dept_name = ? LIMIT 1))),
        (SELECT IF(? REGEXP '^[0-9]+$', ?, (SELECT id FROM designations WHERE role_name = ? OR role_code = ? LIMIT 1))),
        (SELECT IF(? REGEXP '^[0-9]+$', ?, (SELECT id FROM (SELECT id FROM employees WHERE name = ? LIMIT 1) as temp))),
        (SELECT IF(? REGEXP '^[0-9]+$', ?, (SELECT id FROM teams WHERE name = ? LIMIT 1)))
      )
    `;

    const empResult = await queryAsync(insertEmpSql, [
      data.name, data.email, finalCode, finalCode, data.phone, data.dob || null, data.joinDate || null,
      data.gender, data.employmentType || 'Full-time', finalExperienceStr, finalExpType,
      finalTotYrs, finalTotMos, finalRelYrs, finalRelMos, data.shiftType, data.salary || 0,
      data.address, data.emergencyContact, data.bankDetails, password_hash,
      data.branch, data.branch, data.branch,
      data.department, data.department, data.department,
      data.designation, data.designation, data.designation, data.designation,
      data.managerName, data.managerName, data.managerName,
      data.teamName, data.teamName, data.teamName
    ]);

    const newEmpId = empResult.insertId;

    // Previous experiences
    if (Array.isArray(data.previousExperiences) && data.previousExperiences.length > 0) {
      try {
        for (const exp of data.previousExperiences) {
          if (exp && exp.company_name) {
            await EmployeeExperienceService.create(newEmpId, exp, null);
          }
        }
        await EmployeeExperienceService.recalculateAndUpdateSummary(newEmpId);
      } catch (prevExpErr) {
        console.error("Error creating previous experiences:", prevExpErr);
      }
    }

    // Role mapping
    let targetRole = 'EMPLOYEE';
    const desgLower = (data.designation || '').toLowerCase();
    if (desgLower.includes('admin')) {
      targetRole = 'SUPER_ADMIN';
    } else if (desgLower.includes('team leader') || desgLower.includes('team lead')) {
      targetRole = 'TEAM_LEADER';
    } else if (desgLower.includes('hr') || desgLower.includes('manager') || desgLower.includes('human resources')) {
      targetRole = 'HR_MANAGER';
    }

    // Insert or Link user login account
    try {
      const existingUser = await queryAsync(
        "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
        [data.email]
      );

      if (existingUser && existingUser.length > 0) {
        await queryAsync(
          "UPDATE users SET employee_id = ?, full_name = ?, password_hash = ?, role = ?, account_status = 'Active', email_verified = 1 WHERE id = ?",
          [newEmpId, data.name, password_hash, targetRole, existingUser[0].id]
        );
      } else {
        const insertUserSql = `
          INSERT INTO users (employee_id, full_name, email, password_hash, role, email_verified, email_verified_at, account_status)
          VALUES (?, ?, ?, ?, ?, 1, NOW(), 'Active')
        `;
        await queryAsync(insertUserSql, [newEmpId, data.name, data.email, password_hash, targetRole]);
      }
    } catch (userErr) {
      console.error("User creation failed, rolling back employee insert:", userErr);
      await queryAsync("DELETE FROM employees WHERE id = ?", [newEmpId]);
      throw new Error(`Failed to create employee login account: ${userErr.message}`);
    }

    // Log history
    logHistory(newEmpId, "Joining", null, `Joined as ${data.designation || 'Employee'} in ${data.department || 'General'}`, data.joinDate);

    return {
      id: newEmpId,
      employee_id: finalCode,
      employee_code: finalCode,
      employeeCode: finalCode,
      name: data.name,
      email: data.email,
      message: "Employee and login account created successfully."
    };
  }

  /**
   * Update an existing employee (Used when Excel import contains existing employee code and Admin confirms update)
   */
  static async updateEmployee(existingId, rawInput) {
    const data = this.normalizeEmployeeData(rawInput);
    if (!existingId) throw new Error("Employee ID is required for update.");

    // Check that employee exists
    const empRows = await queryAsync("SELECT id, name, email, employee_code, employee_id FROM employees WHERE id = ?", [existingId]);
    if (!empRows || empRows.length === 0) {
      throw new Error(`Employee with ID ${existingId} not found.`);
    }
    const currentEmp = empRows[0];

    // Check duplicate email if email was changed
    if (data.email && data.email !== currentEmp.email) {
      const dupRows = await queryAsync(`
        SELECT 'user' as source, id FROM users WHERE LOWER(email) = ? AND employee_id != ?
        UNION
        SELECT 'employee' as source, id FROM employees WHERE LOWER(email) = ? AND id != ?
      `, [data.email, existingId, data.email, existingId]);

      if (dupRows && dupRows.length > 0) {
        throw new Error(`Email "${data.email}" is already in use by another account.`);
      }
    }

    const updateSql = `
      UPDATE employees
      SET 
        name = COALESCE(NULLIF(?, ''), name),
        email = COALESCE(NULLIF(?, ''), email),
        phone = COALESCE(NULLIF(?, ''), phone),
        dob = COALESCE(?, dob),
        join_date = COALESCE(?, join_date),
        gender = COALESCE(NULLIF(?, ''), gender),
        employment_type = COALESCE(NULLIF(?, ''), employment_type),
        shift_type = COALESCE(NULLIF(?, ''), shift_type),
        salary = COALESCE(?, salary),
        address = COALESCE(NULLIF(?, ''), address),
        emergency_contact = COALESCE(NULLIF(?, ''), emergency_contact),
        bank_details = COALESCE(NULLIF(?, ''), bank_details),
        branch_id = COALESCE((SELECT id FROM branches WHERE branch_name = ? LIMIT 1), branch_id),
        department_id = COALESCE((SELECT id FROM departments WHERE dept_name = ? LIMIT 1), department_id),
        designation_id = COALESCE((SELECT id FROM designations WHERE role_name = ? OR role_code = ? LIMIT 1), designation_id),
        manager_id = COALESCE((SELECT id FROM (SELECT id FROM employees WHERE name = ? LIMIT 1) as temp), manager_id),
        team_id = COALESCE((SELECT id FROM teams WHERE name = ? LIMIT 1), team_id)
      WHERE id = ?
    `;

    await queryAsync(updateSql, [
      data.name, data.email, data.phone, data.dob || null, data.joinDate || null,
      data.gender, data.employmentType, data.shiftType, data.salary,
      data.address, data.emergencyContact, data.bankDetails,
      data.branch, data.department, data.designation, data.designation,
      data.managerName, data.teamName, existingId
    ]);

    // Update users table linked record
    if (data.name || data.email) {
      await queryAsync(
        "UPDATE users SET full_name = COALESCE(NULLIF(?, ''), full_name), email = COALESCE(NULLIF(?, ''), email) WHERE employee_id = ?",
        [data.name, data.email, existingId]
      );
    }

    const empCode = currentEmp.employee_code || currentEmp.employee_id;
    logHistory(existingId, "Profile Update (Excel)", "Previous record", `Updated profile via Excel for ${data.name || currentEmp.name}`, new Date());

    return {
      id: existingId,
      employee_id: empCode,
      employee_code: empCode,
      name: data.name || currentEmp.name,
      email: data.email || currentEmp.email,
      message: "Employee updated successfully."
    };
  }

  /**
   * Bulk import employees
   */
  static async bulkImport(employeesList = [], { updateExisting = false } = {}) {
    const results = [];
    const created = [];
    const updated = [];
    const skipped = [];
    const failed = [];

    // Pre-fetch all existing employee codes and emails to avoid N queries
    const existingEmployees = await queryAsync(`
      SELECT id, email, employee_code, employee_id, name FROM employees
    `);
    const codeMap = new Map();
    const emailMap = new Map();

    existingEmployees.forEach(e => {
      const code1 = (e.employee_code || '').trim().toUpperCase();
      const code2 = (e.employee_id || '').trim().toUpperCase();
      if (code1) codeMap.set(code1, e);
      if (code2) codeMap.set(code2, e);
      if (e.email) emailMap.set(e.email.trim().toLowerCase(), e);
    });

    for (let index = 0; index < employeesList.length; index++) {
      const item = employeesList[index];
      const rowNum = index + 1;

      try {
        const normalized = this.normalizeEmployeeData(item);
        const codeKey = (normalized.employeeCode || '').trim().toUpperCase();
        const emailKey = (normalized.email || '').trim().toLowerCase();

        // Check if employee already exists by code or email
        let existingMatch = null;
        if (codeKey && codeMap.has(codeKey)) {
          existingMatch = codeMap.get(codeKey);
        } else if (emailKey && emailMap.has(emailKey)) {
          existingMatch = emailMap.get(emailKey);
        }

        if (existingMatch) {
          // If updateExisting is allowed or row specifically requested update
          if (updateExisting || item._action === 'update' || item.update_existing === true) {
            const updateRes = await this.updateEmployee(existingMatch.id, normalized);
            updated.push({ rowNum, id: existingMatch.id, employee_code: existingMatch.employee_code || existingMatch.employee_id, name: normalized.name });
            results.push({ rowNum, status: 'Updated', employee_code: existingMatch.employee_code, name: normalized.name });
          } else {
            skipped.push({ rowNum, reason: `Employee code (${existingMatch.employee_code || codeKey}) or email already exists.`, name: normalized.name });
            results.push({ rowNum, status: 'Skipped', reason: 'Existing employee not marked for update' });
          }
        } else {
          // New employee creation
          const validation = await this.validateEmployee(normalized, { isUpdate: false });
          if (!validation.valid) {
            failed.push({ rowNum, errors: validation.errors, name: normalized.name });
            results.push({ rowNum, status: 'Failed', errors: validation.errors });
            continue;
          }

          const createRes = await this.createEmployee(normalized);
          created.push(createRes);
          // Add to local map so subsequent rows won't conflict
          if (createRes.employee_code) {
            codeMap.set(createRes.employee_code.trim().toUpperCase(), createRes);
          }
          if (createRes.email) {
            emailMap.set(createRes.email.trim().toLowerCase(), createRes);
          }
          results.push({ rowNum, status: 'Created', employee_code: createRes.employee_code, name: createRes.name });
        }
      } catch (err) {
        console.error(`Error processing import row #${rowNum}:`, err);
        failed.push({ rowNum, errors: [err.message || 'Server error processing row'], name: item.name || 'Unknown' });
        results.push({ rowNum, status: 'Failed', errors: [err.message] });
      }
    }

    return {
      success: true,
      total: employeesList.length,
      createdCount: created.length,
      updatedCount: updated.length,
      skippedCount: skipped.length,
      failedCount: failed.length,
      created,
      updated,
      skipped,
      failed,
      results
    };
  }

  /**
   * Get metadata for client-side auto-mapping and validation
   */
  static async getImportMeta() {
    const [departments, designations, branches, teams, existingList] = await Promise.all([
      queryAsync("SELECT id, dept_name FROM departments WHERE status != 'Inactive' OR status IS NULL ORDER BY dept_name"),
      queryAsync("SELECT id, role_name, role_code FROM designations WHERE status != 'Inactive' OR status IS NULL ORDER BY role_name"),
      queryAsync("SELECT id, branch_name FROM branches ORDER BY branch_name"),
      queryAsync("SELECT id, name FROM teams ORDER BY name"),
      queryAsync("SELECT id, name, email, employee_code, employee_id FROM employees")
    ]);

    return {
      departments: departments.map(d => d.dept_name),
      designations: designations.map(d => d.role_name),
      branches: branches.map(b => b.branch_name),
      teams: teams.map(t => t.name),
      existingEmployees: existingList.map(e => ({
        id: e.id,
        name: e.name,
        email: e.email,
        employee_code: e.employee_code || e.employee_id
      }))
    };
  }

  /**
   * Get export dataset with all Add Employee fields
   */
  static async getExportData() {
    const sql = `
      SELECT 
        e.id,
        COALESCE(e.employee_code, e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as employee_code,
        e.name,
        e.email,
        e.phone,
        e.dob,
        e.gender,
        e.join_date,
        e.employment_type,
        e.shift_type,
        e.salary,
        e.experience,
        e.experience_type,
        e.total_experience_years,
        e.total_experience_months,
        e.relevant_experience_years,
        e.relevant_experience_months,
        e.status,
        e.address,
        e.emergency_contact,
        e.bank_details,
        dept.dept_name as department,
        desg.role_name as designation,
        b.branch_name as branch,
        t.name as team_name,
        m.name as manager_name
      FROM employees e
      LEFT JOIN departments dept ON e.department_id = dept.id
      LEFT JOIN designations desg ON e.designation_id = desg.id
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN teams t ON e.team_id = t.id
      LEFT JOIN employees m ON e.manager_id = m.id
      ORDER BY e.id ASC
    `;

    const rows = await queryAsync(sql);

    return rows.map(r => {
      let bankObj = {};
      try {
        if (r.bank_details) {
          bankObj = typeof r.bank_details === 'string' ? JSON.parse(r.bank_details) : r.bank_details;
        }
      } catch (e) {
        bankObj = {};
      }

      // Split name into first and last name if possible
      const nameParts = (r.name || '').trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        id: r.id,
        employee_code: r.employee_code,
        name: r.name,
        first_name: firstName,
        last_name: lastName,
        email: r.email,
        phone: r.phone || '',
        dob: r.dob ? new Date(r.dob).toISOString().split('T')[0] : '',
        gender: r.gender || '',
        shift_type: r.shift_type || 'Regular Shift',
        employment_type: r.employment_type || 'Full-time',
        department: r.department || '',
        designation: r.designation || '',
        branch: r.branch || '',
        team: r.team_name || '',
        manager: r.manager_name || '',
        join_date: r.join_date ? new Date(r.join_date).toISOString().split('T')[0] : '',
        salary: r.salary || 0,
        experience: r.experience || '',
        experience_type: r.experience_type || 'Fresher',
        total_exp_years: r.total_experience_years || 0,
        total_exp_months: r.total_experience_months || 0,
        relevant_exp_years: r.relevant_experience_years || 0,
        relevant_exp_months: r.relevant_experience_months || 0,
        bank_name: bankObj.bankName || '',
        account_number: bankObj.accountNumber || '',
        ifsc_code: bankObj.ifscCode || '',
        emergency_contact: r.emergency_contact || '',
        address: r.address || '',
        status: r.status || 'Active'
      };
    });
  }
}

module.exports = EmployeeCreationService;
