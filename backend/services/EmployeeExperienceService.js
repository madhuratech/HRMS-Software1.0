const db = require('../config/database');

class EmployeeExperienceService {
  static executeSql(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Helper to calculate duration in months between two dates
   */
  static calculateDurationMonths(startDate, endDate) {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(0, months);
  }

  /**
   * Parse experience string (e.g. "4 Years 6 Months", "5", "0-1 Years", "Fresher")
   */
  static parseExperienceString(expStr) {
    if (!expStr || typeof expStr !== 'string') {
      return { type: 'Fresher', totalYears: 0, totalMonths: 0, relevantYears: 0, relevantMonths: 0 };
    }

    const trimmed = expStr.trim();
    if (trimmed.toLowerCase().includes('fresh') || trimmed === '0' || trimmed === '0 Years') {
      return { type: 'Fresher', totalYears: 0, totalMonths: 0, relevantYears: 0, relevantMonths: 0 };
    }

    let years = 0;
    let months = 0;

    const yrsMatch = trimmed.match(/(\d+)\s*(?:years?|yrs?|y)/i);
    const mosMatch = trimmed.match(/(\d+)\s*(?:months?|mos?|m)/i);

    if (yrsMatch) {
      years = parseInt(yrsMatch[1], 10) || 0;
    }
    if (mosMatch) {
      months = parseInt(mosMatch[1], 10) || 0;
    }

    // Direct number fallback
    if (!yrsMatch && !mosMatch) {
      const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const val = parseFloat(numMatch[1]);
        years = Math.floor(val);
        months = Math.round((val - years) * 12);
      }
    }

    const type = (years === 0 && months === 0) ? 'Fresher' : 'Experienced';
    return {
      type,
      totalYears: years,
      totalMonths: months,
      relevantYears: years,
      relevantMonths: months
    };
  }

  /**
   * Get employee experience summary
   */
  static async getSummary(employeeId) {
    const rows = await this.executeSql(
      'SELECT id, candidate_id, experience, experience_type, total_experience_years, total_experience_months, relevant_experience_years, relevant_experience_months FROM employees WHERE id = ?',
      [employeeId]
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * Update employee experience summary
   */
  static async updateSummary(employeeId, data, userId) {
    const totalYears = parseInt(data.total_experience_years != null ? data.total_experience_years : 0, 10);
    const totalMonths = parseInt(data.total_experience_months != null ? data.total_experience_months : 0, 10);
    const relevantYears = parseInt(data.relevant_experience_years != null ? data.relevant_experience_years : 0, 10);
    const relevantMonths = parseInt(data.relevant_experience_months != null ? data.relevant_experience_months : 0, 10);
    const experienceType = data.experience_type || (totalYears > 0 || totalMonths > 0 ? 'Experienced' : 'Fresher');

    // Validation: Months between 0 and 11
    if (totalMonths < 0 || totalMonths > 11) {
      const err = new Error('Total experience months must be between 0 and 11');
      err.statusCode = 400;
      throw err;
    }
    if (relevantMonths < 0 || relevantMonths > 11) {
      const err = new Error('Relevant experience months must be between 0 and 11');
      err.statusCode = 400;
      throw err;
    }
    if (totalYears < 0 || relevantYears < 0) {
      const err = new Error('Experience years cannot be negative');
      err.statusCode = 400;
      throw err;
    }

    // Validation: Relevant experience cannot exceed total experience
    const totalDuration = totalYears * 12 + totalMonths;
    const relevantDuration = relevantYears * 12 + relevantMonths;
    if (relevantDuration > totalDuration) {
      const err = new Error('Relevant experience cannot exceed Total experience');
      err.statusCode = 400;
      throw err;
    }

    const expText = totalMonths > 0 ? `${totalYears} Yrs ${totalMonths} Mos` : `${totalYears} Yrs`;

    await this.executeSql(
      `UPDATE employees SET
        experience_type = ?,
        total_experience_years = ?,
        total_experience_months = ?,
        relevant_experience_years = ?,
        relevant_experience_months = ?,
        experience = ?
      WHERE id = ?`,
      [experienceType, totalYears, totalMonths, relevantYears, relevantMonths, expText, employeeId]
    );

    return this.getSummary(employeeId);
  }

  /**
   * Get all previous experiences for an employee
   */
  static async getByEmployeeId(employeeId) {
    const rows = await this.executeSql(
      'SELECT * FROM employee_previous_experiences WHERE employee_id = ? ORDER BY start_date DESC, id DESC',
      [employeeId]
    );
    return rows;
  }

  /**
   * Get single experience record by ID
   */
  static async getById(id) {
    const rows = await this.executeSql(
      'SELECT * FROM employee_previous_experiences WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create a new employee previous experience record
   */
  static async create(employeeId, data, userId) {
    // 1. Mandatory Validations
    if (!data.company_name || !String(data.company_name).trim()) {
      const err = new Error('Company Name is required');
      err.statusCode = 400;
      throw err;
    }
    if (!data.designation || !String(data.designation).trim()) {
      const err = new Error('Designation is required');
      err.statusCode = 400;
      throw err;
    }
    if (!data.start_date) {
      const err = new Error('Start Date is required');
      err.statusCode = 400;
      throw err;
    }

    const validEmploymentTypes = ['Full Time', 'Part Time', 'Contract', 'Internship', 'Freelance', 'Consultant'];
    const employmentType = data.employment_type && validEmploymentTypes.includes(data.employment_type)
      ? data.employment_type
      : 'Full Time';

    const isCurrentlyWorking = data.is_currently_working ? 1 : 0;
    const startDate = data.start_date;
    const endDate = isCurrentlyWorking ? null : (data.end_date || null);

    // Validation: Start date <= End date
    if (endDate && new Date(startDate) > new Date(endDate)) {
      const err = new Error('Start Date must be before or equal to End Date');
      err.statusCode = 400;
      throw err;
    }

    // Validation: CTC numeric
    let ctc = null;
    if (data.last_drawn_ctc != null && data.last_drawn_ctc !== '') {
      ctc = parseFloat(data.last_drawn_ctc);
      if (isNaN(ctc) || ctc < 0) {
        const err = new Error('Last drawn CTC must be a valid non-negative number');
        err.statusCode = 400;
        throw err;
      }
    }

    // Calculate duration months
    const durationMonths = data.duration_months != null
      ? parseInt(data.duration_months, 10)
      : this.calculateDurationMonths(startDate, endDate);

    const validStatuses = ['Pending', 'Verified', 'Rejected', 'Unable to Verify'];
    const verificationStatus = data.verification_status && validStatuses.includes(data.verification_status)
      ? data.verification_status
      : 'Pending';

    const insertSql = `
      INSERT INTO employee_previous_experiences (
        employee_id, candidate_experience_id, company_name, designation, department,
        employment_type, start_date, end_date, is_currently_working, duration_months,
        company_location, reason_for_leaving, job_description, last_drawn_ctc,
        reporting_manager, reference_name, reference_designation, reference_contact,
        verification_status, verification_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      employeeId,
      data.candidate_experience_id || null,
      String(data.company_name).trim(),
      String(data.designation).trim(),
      data.department ? String(data.department).trim() : null,
      employmentType,
      startDate,
      endDate,
      isCurrentlyWorking,
      durationMonths,
      data.company_location || null,
      data.reason_for_leaving || null,
      data.job_description || null,
      ctc,
      data.reporting_manager || null,
      data.reference_name || null,
      data.reference_designation || null,
      data.reference_contact || null,
      verificationStatus,
      data.verification_notes || null
    ];

    const result = await this.executeSql(insertSql, params);
    return this.getById(result.insertId);
  }

  /**
   * Update an existing employee previous experience record
   * Note: Modifies only Employee reference history; Candidate original records remain intact.
   */
  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) {
      const err = new Error('Employee previous experience record not found');
      err.statusCode = 404;
      throw err;
    }

    const companyName = data.company_name !== undefined ? String(data.company_name).trim() : existing.company_name;
    const designation = data.designation !== undefined ? String(data.designation).trim() : existing.designation;
    const startDate = data.start_date !== undefined ? data.start_date : existing.start_date;
    const isCurrentlyWorking = data.is_currently_working !== undefined ? (data.is_currently_working ? 1 : 0) : existing.is_currently_working;
    const endDate = isCurrentlyWorking ? null : (data.end_date !== undefined ? data.end_date : existing.end_date);

    if (!companyName) {
      const err = new Error('Company Name is required');
      err.statusCode = 400;
      throw err;
    }
    if (!designation) {
      const err = new Error('Designation is required');
      err.statusCode = 400;
      throw err;
    }
    if (!startDate) {
      const err = new Error('Start Date is required');
      err.statusCode = 400;
      throw err;
    }

    if (endDate && new Date(startDate) > new Date(endDate)) {
      const err = new Error('Start Date must be before or equal to End Date');
      err.statusCode = 400;
      throw err;
    }

    let ctc = existing.last_drawn_ctc;
    if (data.last_drawn_ctc !== undefined) {
      if (data.last_drawn_ctc === null || data.last_drawn_ctc === '') {
        ctc = null;
      } else {
        ctc = parseFloat(data.last_drawn_ctc);
        if (isNaN(ctc) || ctc < 0) {
          const err = new Error('Last drawn CTC must be a valid non-negative number');
          err.statusCode = 400;
          throw err;
        }
      }
    }

    const validEmploymentTypes = ['Full Time', 'Part Time', 'Contract', 'Internship', 'Freelance', 'Consultant'];
    const employmentType = data.employment_type && validEmploymentTypes.includes(data.employment_type)
      ? data.employment_type
      : existing.employment_type;

    const validStatuses = ['Pending', 'Verified', 'Rejected', 'Unable to Verify'];
    const verificationStatus = data.verification_status && validStatuses.includes(data.verification_status)
      ? data.verification_status
      : existing.verification_status;

    const durationMonths = data.duration_months !== undefined
      ? parseInt(data.duration_months, 10)
      : this.calculateDurationMonths(startDate, endDate);

    const updateSql = `
      UPDATE employee_previous_experiences SET
        company_name = ?,
        designation = ?,
        department = ?,
        employment_type = ?,
        start_date = ?,
        end_date = ?,
        is_currently_working = ?,
        duration_months = ?,
        company_location = ?,
        reason_for_leaving = ?,
        job_description = ?,
        last_drawn_ctc = ?,
        reporting_manager = ?,
        reference_name = ?,
        reference_designation = ?,
        reference_contact = ?,
        verification_status = ?,
        verification_notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      companyName,
      designation,
      data.department !== undefined ? data.department : existing.department,
      employmentType,
      startDate,
      endDate,
      isCurrentlyWorking,
      durationMonths,
      data.company_location !== undefined ? data.company_location : existing.company_location,
      data.reason_for_leaving !== undefined ? data.reason_for_leaving : existing.reason_for_leaving,
      data.job_description !== undefined ? data.job_description : existing.job_description,
      ctc,
      data.reporting_manager !== undefined ? data.reporting_manager : existing.reporting_manager,
      data.reference_name !== undefined ? data.reference_name : existing.reference_name,
      data.reference_designation !== undefined ? data.reference_designation : existing.reference_designation,
      data.reference_contact !== undefined ? data.reference_contact : existing.reference_contact,
      verificationStatus,
      data.verification_notes !== undefined ? data.verification_notes : existing.verification_notes,
      id
    ];

    await this.executeSql(updateSql, params);
    return this.getById(id);
  }

  /**
   * Delete an employee previous experience record
   */
  static async delete(id, userId) {
    const existing = await this.getById(id);
    if (!existing) {
      const err = new Error('Employee previous experience record not found');
      err.statusCode = 404;
      throw err;
    }
    await this.executeSql('DELETE FROM employee_previous_experiences WHERE id = ?', [id]);
    return true;
  }
}

module.exports = EmployeeExperienceService;
