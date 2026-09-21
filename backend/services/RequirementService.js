const Requirement = require('../models/Requirement');

class RequirementService {
  static generateCode() {
    return 'REQ-' + Date.now().toString().slice(-6) + Math.floor(1000 + Math.random() * 9000);
  }

  static async create(data, userId) {
    const code = this.generateCode();
    const sql = `
      INSERT INTO requirements (
        requirement_code, job_title, department_id, designation_id, employment_type,
        vacancies, priority, experience_from, experience_to, salary_from, salary_to,
        location, hiring_manager, requested_by, opening_date, closing_date,
        status, company_id, branch_id, job_description, skills,
        created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      code, data.job_title, data.department_id, data.designation_id, data.employment_type,
      data.vacancies, data.priority || 'Medium', data.experience_from, data.experience_to, data.salary_from || null, data.salary_to || null,
      data.location || null, data.hiring_manager || null, data.requested_by || null, data.opening_date, data.closing_date,
      data.status || 'Open', data.company_id || null, data.branch_id || null, data.job_description || null, data.skills || null,
      userId, userId
    ];

    await Requirement.beginTransaction();
    try {
      const result = await Requirement.query(sql, params);
      const reqId = result.insertId;

      // Write Audit Log if table exists
      try {
        await Requirement.query(
          `INSERT INTO requirement_audit_logs (requirement_id, action, status_to, performed_by, remarks) VALUES (?, 'CREATED', ?, ?, 'Requirement Created')`,
          [reqId, data.status || 'Open', userId]
        );
      } catch (e) {
        console.error('Failed to log audit:', e.message);
      }

      await Requirement.commit();
      return { id: reqId, code };
    } catch (error) {
      await Requirement.rollback();
      throw error;
    }
  }

  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Requirement not found');

    const sql = `
      UPDATE requirements SET
        job_title = ?, department_id = ?, designation_id = ?, employment_type = ?,
        vacancies = ?, priority = ?, experience_from = ?, experience_to = ?, salary_from = ?, salary_to = ?,
        location = ?, hiring_manager = ?, requested_by = ?, opening_date = ?, closing_date = ?,
        status = ?, company_id = ?, branch_id = ?, job_description = ?, skills = ?,
        updated_by = ?
      WHERE id = ?
    `;

    const params = [
      data.job_title, data.department_id, data.designation_id, data.employment_type,
      data.vacancies, data.priority || 'Medium', data.experience_from, data.experience_to, data.salary_from, data.salary_to,
      data.location, data.hiring_manager, data.requested_by, data.opening_date, data.closing_date,
      data.status, data.company_id, data.branch_id, data.job_description, data.skills,
      userId, id
    ];

    await Requirement.beginTransaction();
    try {
      await Requirement.query(sql, params);

      // Audit status change if different
      if (existing.status !== data.status) {
        try {
          await Requirement.query(
            `INSERT INTO requirement_audit_logs (requirement_id, action, status_from, status_to, performed_by, remarks) VALUES (?, 'UPDATED', ?, ?, ?, 'Status Updated')`,
            [id, existing.status, data.status, userId]
          );
        } catch (e) {
          console.error('Failed to log audit:', e.message);
        }
      }

      await Requirement.commit();
      return true;
    } catch (error) {
      await Requirement.rollback();
      throw error;
    }
  }

  static async softDelete(id, userId) {
    await Requirement.beginTransaction();
    try {
      await Requirement.query(
        `UPDATE requirements SET deleted_at = NOW(), deleted_by = ?, status = 'Closed' WHERE id = ?`,
        [userId, id]
      );
      try {
        await Requirement.query(
          `INSERT INTO requirement_audit_logs (requirement_id, action, performed_by, remarks) VALUES (?, 'DELETED', ?, 'Soft Deleted')`,
          [id, userId]
        );
      } catch (e) {}
      await Requirement.commit();
      return true;
    } catch (error) {
      await Requirement.rollback();
      throw error;
    }
  }

  static async restore(id, userId) {
    await Requirement.beginTransaction();
    try {
      await Requirement.query(
        `UPDATE requirements SET deleted_at = NULL, deleted_by = NULL, status = 'Open' WHERE id = ?`,
        [id]
      );
      try {
        await Requirement.query(
          `INSERT INTO requirement_audit_logs (requirement_id, action, performed_by, remarks) VALUES (?, 'RESTORED', ?, 'Restored')`,
          [id, userId]
        );
      } catch (e) {}
      await Requirement.commit();
      return true;
    } catch (error) {
      await Requirement.rollback();
      throw error;
    }
  }

  static async getById(id) {
    const rows = await Requirement.query(
      `SELECT r.*,
              d.dept_name as department_name,
              des.role_name as designation_name,
              hm.name as hiring_manager_name,
              rb.name as requested_by_name
       FROM requirements r
       LEFT JOIN departments d ON r.department_id = d.id
       LEFT JOIN designations des ON r.designation_id = des.id
       LEFT JOIN employees hm ON r.hiring_manager = hm.id
       LEFT JOIN employees rb ON r.requested_by = rb.id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters, pagination) {
    let sql = `
      SELECT r.*,
             d.dept_name as department_name,
             des.role_name as designation_name,
             hm.name as hiring_manager_name,
             rb.name as requested_by_name
      FROM requirements r
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN designations des ON r.designation_id = des.id
      LEFT JOIN employees hm ON r.hiring_manager = hm.id
      LEFT JOIN employees rb ON r.requested_by = rb.id
      WHERE (r.deleted_at IS NULL)
    `;
    const params = [];

    // Search
    if (filters.search) {
      sql += ` AND (r.requirement_code LIKE ? OR r.job_title LIKE ? OR r.location LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    // Filters
    if (filters.department_id) {
      sql += ` AND r.department_id = ?`;
      params.push(filters.department_id);
    }
    if (filters.designation_id) {
      sql += ` AND r.designation_id = ?`;
      params.push(filters.designation_id);
    }
    if (filters.status) {
      sql += ` AND r.status = ?`;
      params.push(filters.status);
    }
    if (filters.priority) {
      sql += ` AND r.priority = ?`;
      params.push(filters.priority);
    }
    if (filters.employment_type) {
      sql += ` AND r.employment_type = ?`;
      params.push(filters.employment_type);
    }
    if (filters.branch_id) {
      sql += ` AND r.branch_id = ?`;
      params.push(filters.branch_id);
    }
    if (filters.company_id) {
      sql += ` AND r.company_id = ?`;
      params.push(filters.company_id);
    }
    if (filters.opening_date) {
      sql += ` AND r.opening_date >= ?`;
      params.push(filters.opening_date);
    }
    if (filters.closing_date) {
      sql += ` AND r.closing_date <= ?`;
      params.push(filters.closing_date);
    }

    // Sorting
    const sortFieldMap = {
      'newest': 'r.created_at DESC',
      'oldest': 'r.created_at ASC',
      'job_title': 'r.job_title ASC',
      'priority': 'r.priority DESC',
      'opening_date': 'r.opening_date ASC',
      'closing_date': 'r.closing_date ASC',
      'status': 'r.status ASC'
    };
    const order = sortFieldMap[filters.sortBy] || 'r.created_at DESC';
    sql += ` ORDER BY ${order}`;

    // Pagination
    sql += ` LIMIT ? OFFSET ?`;
    params.push(pagination.limit, pagination.offset);

    const rows = await Requirement.query(sql, params);
    const totalResult = await Requirement.query(`SELECT COUNT(*) as count FROM requirements`);
    return {
      rows,
      total: totalResult[0].count
    };
  }

  static async updateStatus(id, status, approvalStatus, remarks, userId) {
    await Requirement.beginTransaction();
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Requirement not found');

      // Map status values that are not in the database status enum
      let dbStatus = status;
      if (status === 'Approved') dbStatus = 'Open';
      else if (status === 'Rejected') dbStatus = 'Cancelled';

      await Requirement.query(
        `UPDATE requirements SET status = ?, updated_by = ? WHERE id = ?`,
        [dbStatus, userId, id]
      );

      // Audit status change
      try {
        await Requirement.query(
          `INSERT INTO requirement_audit_logs (requirement_id, action, status_from, status_to, performed_by, remarks) VALUES (?, 'STATUS_UPDATE', ?, ?, ?, ?)`,
          [id, existing.status, status, userId, remarks || 'Status Updated']
        );
      } catch (e) {}

      await Requirement.commit();
      return true;
    } catch (error) {
      await Requirement.rollback();
      throw error;
    }
  }

  static async duplicate(id, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Requirement not found');

    const copyData = {
      ...existing,
      requirement_code: this.generateCode(),
      job_title: `${existing.job_title} (Copy)`,
      status: 'Draft'
    };
    return await this.create(copyData, userId);
  }

  static async getDashboardStats() {
    const queries = {
      total: `SELECT COUNT(*) as count FROM requirements`,
      open: `SELECT COUNT(*) as count FROM requirements WHERE status = 'Open'`,
      closed: `SELECT COUNT(*) as count FROM requirements WHERE status = 'Closed'`,
      pendingApproval: `SELECT 0 as count`,
      approved: `SELECT 0 as count`,
      rejected: `SELECT 0 as count`,
      critical: `SELECT COUNT(*) as count FROM requirements WHERE priority = 'Critical'`,
      todayOpenings: `SELECT COUNT(*) as count FROM requirements WHERE opening_date = CURDATE()`,
      monthOpenings: `SELECT COUNT(*) as count FROM requirements WHERE MONTH(opening_date) = MONTH(CURDATE()) AND YEAR(opening_date) = YEAR(CURDATE())`,
      deptWise: `SELECT d.dept_name as department_name, COUNT(r.id) as count FROM requirements r JOIN departments d ON r.department_id = d.id GROUP BY d.dept_name`,
      desigWise: `SELECT des.role_name as designation_name, COUNT(r.id) as count FROM requirements r JOIN designations des ON r.designation_id = des.id GROUP BY des.role_name`,
      monthlyTrend: `SELECT MONTHNAME(opening_date) as month, COUNT(id) as count FROM requirements GROUP BY MONTHNAME(opening_date), MONTH(opening_date) ORDER BY MONTH(opening_date)`,
      statusChart: `SELECT status, COUNT(*) as count FROM requirements GROUP BY status`,
      priorityChart: `SELECT priority, COUNT(*) as count FROM requirements GROUP BY priority`,
      hiringManagerStats: `SELECT hm.name as manager_name, COUNT(r.id) as count FROM requirements r JOIN employees hm ON r.hiring_manager = hm.id GROUP BY hm.name`
    };

    const results = {};
    for (const [key, sql] of Object.entries(queries)) {
      results[key] = await Requirement.query(sql);
    }
    return results;
  }
}

module.exports = RequirementService;
