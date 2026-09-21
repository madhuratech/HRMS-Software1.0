const Performance = require('../models/Performance');
const PerformanceScopeService = require('./PerformanceScopeService');

class FeedbackService {
  static async create(data, userId) {
    const sql = `
      INSERT INTO feedbacks (
        employee_id, department_id, feedback_type, rating, subject, comments, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.employee_id, data.department_id, data.feedback_type, data.rating || 5,
      data.subject || null, data.comments, userId, userId
    ];
    await Performance.beginTransaction();
    try {
      const result = await Performance.query(sql, params);
      await Performance.commit();
      return { id: result.insertId };
    } catch (e) {
      await Performance.rollback();
      throw e;
    }
  }

  static async update(id, data, userId) {
    const sql = `
      UPDATE feedbacks SET
        department_id = ?, feedback_type = ?, rating = ?, subject = ?,
        comments = ?, updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.department_id, data.feedback_type, data.rating || 5, data.subject || null,
      data.comments, userId, id
    ];
    await Performance.beginTransaction();
    try {
      await Performance.query(sql, params);
      await Performance.commit();
      return true;
    } catch (e) {
      await Performance.rollback();
      throw e;
    }
  }

  static async delete(id) {
    await Performance.beginTransaction();
    try {
      await Performance.query('DELETE FROM feedbacks WHERE id = ?', [id]);
      await Performance.commit();
      return true;
    } catch (e) {
      await Performance.rollback();
      throw e;
    }
  }

  static async getById(id) {
    const rows = await Performance.query(
      `SELECT f.*, e.name as employee_name, d.dept_name as department_name
       FROM feedbacks f
       LEFT JOIN employees e ON f.employee_id = e.id
       LEFT JOIN departments d ON f.department_id = d.id
       WHERE f.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters, pagination, scope = null) {
    let sql = `
      SELECT f.*, e.name as employee_name, d.dept_name as department_name
      FROM feedbacks f
      LEFT JOIN employees e ON f.employee_id = e.id
      LEFT JOIN departments d ON f.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      sql += ` AND (e.name LIKE ? OR f.feedback_type LIKE ? OR f.comments LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }
    if (filters.department_id) {
      sql += ` AND f.department_id = ?`;
      params.push(filters.department_id);
    }
    if (filters.employee_id) {
      sql += ` AND f.employee_id = ?`;
      params.push(filters.employee_id);
    }

    if (scope) {
      const scopeFilter = PerformanceScopeService.getSqlFilter('f.employee_id', scope);
      sql += scopeFilter.sqlFragment;
      params.push(...scopeFilter.params);
    }

    sql += ` ORDER BY f.created_at DESC`;

    if (pagination) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pagination.limit, pagination.offset);
    }

    const rows = await Performance.query(sql, params);

    let countSql = `
      SELECT COUNT(*) as count
      FROM feedbacks f
      LEFT JOIN employees e ON f.employee_id = e.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      countSql += ` AND (e.name LIKE ? OR f.feedback_type LIKE ? OR f.comments LIKE ?)`;
      const term = `%${filters.search}%`;
      countParams.push(term, term, term);
    }
    if (filters.department_id) {
      countSql += ` AND f.department_id = ?`;
      countParams.push(filters.department_id);
    }
    if (filters.employee_id) {
      countSql += ` AND f.employee_id = ?`;
      countParams.push(filters.employee_id);
    }
    if (scope) {
      const scopeFilter = PerformanceScopeService.getSqlFilter('f.employee_id', scope);
      countSql += scopeFilter.sqlFragment;
      countParams.push(...scopeFilter.params);
    }

    const totalRes = await Performance.query(countSql, countParams);

    return { rows, total: totalRes[0].count };
  }

  static async getDashboardStats(scope = null) {
    const scopeFilter = scope ? PerformanceScopeService.getSqlFilter('employee_id', scope) : { sqlFragment: '', params: [] };

    const total = await Performance.query(`SELECT COUNT(*) as count FROM feedbacks WHERE 1=1 ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const positive = await Performance.query(`SELECT COUNT(*) as count FROM feedbacks WHERE rating >= 4 ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const negative = await Performance.query(`SELECT COUNT(*) as count FROM feedbacks WHERE rating <= 2 ${scopeFilter.sqlFragment}`, scopeFilter.params);

    const totalVal = total[0].count || 0;
    const positiveVal = positive[0].count || 0;
    const negativeVal = negative[0].count || 0;
    const neutralVal = totalVal - (positiveVal + negativeVal);

    const rate = totalVal > 0 ? Math.round((positiveVal / totalVal) * 100) : 0;

    return {
      total: totalVal,
      positive: positiveVal,
      negative: negativeVal,
      neutral: neutralVal,
      rate: `${rate}%`,
      chartData: [
        { name: 'Positive', value: positiveVal, color: '#10B981' },
        { name: 'Neutral', value: neutralVal, color: '#F59E0B' },
        { name: 'Improvement', value: negativeVal, color: '#EF4444' }
      ]
    };
  }
}

module.exports = FeedbackService;
