const Probation = require('../models/Probation');

class ProbationService {
  static async create(data, userId) {
    // An employee cannot have multiple active probation records
    const activeCheck = await Probation.query(
      "SELECT id FROM probations WHERE employee_id = ? AND status IN ('Due for Review', 'Extended')",
      [data.employee_id]
    );
    if (activeCheck.length > 0) {
      throw new Error('This employee already has an active probation evaluation record');
    }

    const sql = `
      INSERT INTO probations (
        employee_id, probation_start_date, probation_end_date, reporting_manager,
        status, rating, remarks, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.employee_id, data.probation_start_date, data.probation_end_date, data.reporting_manager,
      data.status || 'Due for Review', data.rating || null, data.remarks || null,
      userId, userId
    ];

    await Probation.beginTransaction();
    try {
      const result = await Probation.query(sql, params);
      await Probation.commit();
      return { id: result.insertId };
    } catch (error) {
      await Probation.rollback();
      throw error;
    }
  }

  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Probation record not found');

    const sql = `
      UPDATE probations SET
        probation_start_date = ?, probation_end_date = ?, reporting_manager = ?,
        status = ?, rating = ?, remarks = ?, updated_by = ?
      WHERE id = ?
    `;

    const params = [
      data.probation_start_date, data.probation_end_date, data.reporting_manager,
      data.status, data.rating || null, data.remarks || null,
      userId, id
    ];

    await Probation.beginTransaction();
    try {
      await Probation.query(sql, params);
      await Probation.commit();
      return true;
    } catch (error) {
      await Probation.rollback();
      throw error;
    }
  }

  static async extend(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Probation record not found');

    await Probation.beginTransaction();
    try {
      await Probation.query(
        "UPDATE probations SET probation_end_date = ?, status = 'Extended', updated_by = ? WHERE id = ?",
        [data.probation_end_date, userId, id]
      );
      await Probation.commit();
      return true;
    } catch (error) {
      await Probation.rollback();
      throw error;
    }
  }

  static async complete(id, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Probation record not found');

    await Probation.beginTransaction();
    try {
      await Probation.query(
        "UPDATE probations SET status = 'Confirmed', updated_by = ? WHERE id = ?",
        [userId, id]
      );
      await Probation.commit();
      return true;
    } catch (error) {
      await Probation.rollback();
      throw error;
    }
  }

  static async delete(id) {
    await Probation.beginTransaction();
    try {
      await Probation.query('DELETE FROM probations WHERE id = ?', [id]);
      await Probation.commit();
      return true;
    } catch (error) {
      await Probation.rollback();
      throw error;
    }
  }

  static async getById(id) {
    const rows = await Probation.query(
      `SELECT p.*, e.name as employee_name, e.email as employee_email,
              d.dept_name as department_name
       FROM probations p
       LEFT JOIN employees e ON p.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters, pagination) {
    let sql = `
      SELECT p.*, e.name as employee_name, e.email as employee_email,
             d.dept_name as department_name
      FROM probations p
      LEFT JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    // Search
    if (filters.search) {
      sql += ` AND (e.name LIKE ? OR p.reporting_manager LIKE ? OR p.status LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY p.probation_end_date DESC`;

    if (pagination) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pagination.limit, pagination.offset);
    }

    const rows = await Probation.query(sql, params);

    // Count
    let countSql = `
      SELECT COUNT(*) as count
      FROM probations p
      LEFT JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      countSql += ` AND (e.name LIKE ? OR p.reporting_manager LIKE ? OR p.status LIKE ?)`;
      countParams.push(term, term, term);
    }

    const totalResult = await Probation.query(countSql, countParams);
    return {
      rows,
      total: totalResult[0].count
    };
  }

  static async getDashboardStats() {
    const underProbation = await Probation.query(`SELECT COUNT(*) as count FROM probations WHERE status IN ('Due for Review', 'Extended')`);
    const dueReview = await Probation.query(`SELECT COUNT(*) as count FROM probations WHERE status = 'Due for Review'`);
    const extended = await Probation.query(`SELECT COUNT(*) as count FROM probations WHERE status = 'Extended'`);
    const confirmed = await Probation.query(`SELECT COUNT(*) as count FROM probations WHERE status = 'Confirmed'`);

    // Timeline grouping by month
    const timeline = await Probation.query(`
      SELECT DATE_FORMAT(probation_end_date, '%M %Y') as month, COUNT(*) as count
      FROM probations
      GROUP BY month
      ORDER BY MIN(probation_end_date) ASC
      LIMIT 5
    `);

    const confirmedCount = confirmed[0].count || 0;
    const dueCount = dueReview[0].count || 0;
    const extendedCount = extended[0].count || 0;
    const total = confirmedCount + dueCount + extendedCount;

    return {
      underProbation: underProbation[0].count || 0,
      dueReview: dueCount,
      extended: extendedCount,
      confirmed: confirmedCount,
      total,
      timelineData: timeline,
      chartData: [
        { name: 'Confirmed', value: confirmedCount, color: '#2952E3' },
        { name: 'Due for Review', value: dueCount, color: '#10B981' },
        { name: 'Extended', value: extendedCount, color: '#EF4444' }
      ]
    };
  }
}

module.exports = ProbationService;
