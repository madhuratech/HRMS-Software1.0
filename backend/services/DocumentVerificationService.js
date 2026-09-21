const DocumentVerification = require('../models/DocumentVerification');

class DocumentVerificationService {
  static async create(data, userId) {
    // Check if verification already exists for this joiner
    const existing = await DocumentVerification.query(
      'SELECT id FROM document_verifications WHERE new_joiner_id = ?',
      [data.new_joiner_id]
    );

    if (existing.length > 0) {
      return { id: existing[0].id };
    }

    const sql = `
      INSERT INTO document_verifications (
        new_joiner_id, aadhaar_card, pan_card, resume, passport,
        degree_certificate, experience_certificate, relieving_letter, photo,
        bank_passbook, driving_license, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.new_joiner_id, data.aadhaar_card || null, data.pan_card || null, data.resume || null, data.passport || null,
      data.degree_certificate || null, data.experience_certificate || null, data.relieving_letter || null, data.photo || null,
      data.bank_passbook || null, data.driving_license || null, data.status || 'Pending',
      userId, userId
    ];

    await DocumentVerification.beginTransaction();
    try {
      const result = await DocumentVerification.query(sql, params);
      await DocumentVerification.commit();
      return { id: result.insertId };
    } catch (error) {
      await DocumentVerification.rollback();
      throw error;
    }
  }

  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Document Verification record not found');

    const sql = `
      UPDATE document_verifications SET
        aadhaar_card = COALESCE(?, aadhaar_card),
        pan_card = COALESCE(?, pan_card),
        resume = COALESCE(?, resume),
        passport = COALESCE(?, passport),
        degree_certificate = COALESCE(?, degree_certificate),
        experience_certificate = COALESCE(?, experience_certificate),
        relieving_letter = COALESCE(?, relieving_letter),
        photo = COALESCE(?, photo),
        bank_passbook = COALESCE(?, bank_passbook),
        driving_license = COALESCE(?, driving_license),
        status = ?,
        updated_by = ?
      WHERE id = ?
    `;

    const params = [
      data.aadhaar_card || null, data.pan_card || null, data.resume || null, data.passport || null,
      data.degree_certificate || null, data.experience_certificate || null, data.relieving_letter || null, data.photo || null,
      data.bank_passbook || null, data.driving_license || null, data.status || existing.status,
      userId, id
    ];

    await DocumentVerification.beginTransaction();
    try {
      await DocumentVerification.query(sql, params);
      await DocumentVerification.commit();
      return true;
    } catch (error) {
      await DocumentVerification.rollback();
      throw error;
    }
  }

  static async delete(id) {
    await DocumentVerification.beginTransaction();
    try {
      await DocumentVerification.query('DELETE FROM document_verifications WHERE id = ?', [id]);
      await DocumentVerification.commit();
      return true;
    } catch (error) {
      await DocumentVerification.rollback();
      throw error;
    }
  }

  static async getById(id) {
    const rows = await DocumentVerification.query(
      `SELECT dv.*, 
              nj.employee_name, nj.designation, nj.joining_date, nj.reporting_manager,
              d.dept_name as department_name,
              c.email as candidate_email, c.mobile_number as candidate_phone, c.date_of_birth
       FROM document_verifications dv
       LEFT JOIN new_joiners nj ON dv.new_joiner_id = nj.id
       LEFT JOIN departments d ON nj.department_id = d.id
       LEFT JOIN candidates c ON nj.employee_name = c.candidate_name
       WHERE dv.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters, pagination) {
    let sql = `
      SELECT dv.*, 
             nj.employee_name, nj.designation, nj.joining_date, nj.reporting_manager,
             d.dept_name as department_name
      FROM document_verifications dv
      LEFT JOIN new_joiners nj ON dv.new_joiner_id = nj.id
      LEFT JOIN departments d ON nj.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    // Search
    if (filters.search) {
      sql += ` AND (nj.employee_name LIKE ? OR nj.designation LIKE ? OR dv.status LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    // Filters
    if (filters.department_id) {
      sql += ` AND nj.department_id = ?`;
      params.push(filters.department_id);
    }
    if (filters.status) {
      sql += ` AND dv.status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY dv.created_at DESC`;

    if (pagination) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pagination.limit, pagination.offset);
    }

    const rows = await DocumentVerification.query(sql, params);

    // Count
    let countSql = `
      SELECT COUNT(*) as count
      FROM document_verifications dv
      LEFT JOIN new_joiners nj ON dv.new_joiner_id = nj.id
      LEFT JOIN departments d ON nj.department_id = d.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      countSql += ` AND (nj.employee_name LIKE ? OR nj.designation LIKE ? OR dv.status LIKE ?)`;
      countParams.push(term, term, term);
    }
    if (filters.department_id) {
      countSql += ` AND nj.department_id = ?`;
      countParams.push(filters.department_id);
    }
    if (filters.status) {
      countSql += ` AND dv.status = ?`;
      countParams.push(filters.status);
    }

    const totalResult = await DocumentVerification.query(countSql, countParams);
    return {
      rows,
      total: totalResult[0].count
    };
  }

  static async completeVerification(id, userId) {
    const verification = await this.getById(id);
    if (!verification) throw new Error('Document Verification not found');

    await DocumentVerification.beginTransaction();
    try {
      // 1. Mark verification status as Completed
      await DocumentVerification.query(
        'UPDATE document_verifications SET status = ?, updated_by = ? WHERE id = ?',
        ['Completed', userId, id]
      );

      // 2. Mark New Joiner status as Completed
      await DocumentVerification.query(
        "UPDATE new_joiners SET status = 'Completed', updated_by = ? WHERE id = ?",
        [userId, verification.new_joiner_id]
      );

      // 3. Promote to Employees table
      const empName = verification.employee_name;
      const empEmail = verification.candidate_email || `${verification.employee_name.toLowerCase().replace(/\s+/g, '')}@company.com`;
      const empPhone = verification.candidate_phone || '0000000000';
      const empDob = verification.date_of_birth || '1995-01-01';
      const empJoinDate = verification.joining_date;

      const employeeSql = `
        INSERT INTO employees (
          name, email, phone, dob, join_date, sales_target, branch_id, designation_id
        ) VALUES (
          ?, ?, ?, ?, ?, 0,
          COALESCE((SELECT id FROM branches LIMIT 1), 1),
          COALESCE((SELECT id FROM designations WHERE role_name LIKE ? OR role_code LIKE ? LIMIT 1), 1)
        )
      `;
      await DocumentVerification.query(employeeSql, [
        empName, empEmail, empPhone, empDob, empJoinDate,
        `%${verification.designation}%`, `%${verification.designation}%`
      ]);

      await DocumentVerification.commit();
      return true;
    } catch (error) {
      await DocumentVerification.rollback();
      throw error;
    }
  }

  static async getDashboardStats() {
    const pendingQuery = `SELECT COUNT(*) as count FROM document_verifications WHERE status = 'Pending'`;
    const verifiedQuery = `SELECT COUNT(*) as count FROM document_verifications WHERE status = 'Verified'`;
    const rejectedQuery = `SELECT COUNT(*) as count FROM document_verifications WHERE status = 'Rejected'`;
    const completedQuery = `SELECT COUNT(*) as count FROM document_verifications WHERE status = 'Completed'`;

    const pending = await DocumentVerification.query(pendingQuery);
    const verified = await DocumentVerification.query(verifiedQuery);
    const rejected = await DocumentVerification.query(rejectedQuery);
    const completed = await DocumentVerification.query(completedQuery);

    const total = (pending[0].count || 0) + (verified[0].count || 0) + (rejected[0].count || 0) + (completed[0].count || 0);

    return {
      pending: pending[0].count || 0,
      verified: verified[0].count || 0,
      rejected: rejected[0].count || 0,
      completed: completed[0].count || 0,
      total,
      chartData: [
        { name: 'Verified', value: verified[0].count || 0, color: '#10B981' },
        { name: 'Pending', value: pending[0].count || 0, color: '#F59E0B' },
        { name: 'Rejected', value: rejected[0].count || 0, color: '#EF4444' }
      ]
    };
  }
}

module.exports = DocumentVerificationService;
