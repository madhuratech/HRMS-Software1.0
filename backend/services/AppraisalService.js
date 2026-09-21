const Performance = require('../models/Performance');
const PerformanceScopeService = require('./PerformanceScopeService');

class AppraisalService {
  static async create(data, userId) {
    const sql = `
      INSERT INTO appraisals (
        employee_id, current_salary, proposed_salary, effective_date,
        appraisal_percentage, remarks, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.employee_id, data.current_salary, data.proposed_salary, data.effective_date,
      data.appraisal_percentage || null, data.remarks || null, data.status || 'In Progress',
      userId, userId
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
      UPDATE appraisals SET
        current_salary = ?, proposed_salary = ?, effective_date = ?,
        appraisal_percentage = ?, remarks = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.current_salary, data.proposed_salary, data.effective_date,
      data.appraisal_percentage || null, data.remarks || null, data.status,
      userId, id
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
      await Performance.query('DELETE FROM appraisals WHERE id = ?', [id]);
      await Performance.commit();
      return true;
    } catch (e) {
      await Performance.rollback();
      throw e;
    }
  }

  static async getById(id) {
    const rows = await Performance.query(
      `SELECT a.*, e.name as employee_name, d.dept_name as department_name
       FROM appraisals a
       LEFT JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE a.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters, pagination, scope = null) {
    let sql = `
      SELECT a.*, e.name as employee_name, d.dept_name as department_name
      FROM appraisals a
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      sql += ` AND (e.name LIKE ? OR a.status LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term);
    }
    if (filters.department_id) {
      sql += ` AND e.department_id = ?`;
      params.push(filters.department_id);
    }
    if (filters.employee_id) {
      sql += ` AND a.employee_id = ?`;
      params.push(filters.employee_id);
    }

    if (scope) {
      const scopeFilter = PerformanceScopeService.getSqlFilter('a.employee_id', scope);
      sql += scopeFilter.sqlFragment;
      params.push(...scopeFilter.params);
    }

    sql += ` ORDER BY a.created_at DESC`;

    if (pagination) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pagination.limit, pagination.offset);
    }

    const rows = await Performance.query(sql, params);

    let countSql = `
      SELECT COUNT(*) as count
      FROM appraisals a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      const term = `%${filters.search}%`;
      countSql += ` AND (e.name LIKE ? OR a.status LIKE ?)`;
      countParams.push(term, term);
    }
    if (filters.department_id) {
      countSql += ` AND e.department_id = ?`;
      countParams.push(filters.department_id);
    }
    if (filters.employee_id) {
      countSql += ` AND a.employee_id = ?`;
      countParams.push(filters.employee_id);
    }
    if (scope) {
      const scopeFilter = PerformanceScopeService.getSqlFilter('a.employee_id', scope);
      countSql += scopeFilter.sqlFragment;
      countParams.push(...scopeFilter.params);
    }

    const totalRes = await Performance.query(countSql, countParams);

    return { rows, total: totalRes[0].count };
  }

  static async getDashboardStats(scope = null) {
    const scopeFilter = scope ? PerformanceScopeService.getSqlFilter('employee_id', scope) : { sqlFragment: '', params: [] };

    const total = await Performance.query(`SELECT COUNT(*) as count FROM appraisals WHERE 1=1 ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const approved = await Performance.query(`SELECT COUNT(*) as count FROM appraisals WHERE status = 'Approved' ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const pending = await Performance.query(`SELECT COUNT(*) as count FROM appraisals WHERE status = 'In Progress' ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const rejected = await Performance.query(`SELECT COUNT(*) as count FROM appraisals WHERE status = 'Rejected' ${scopeFilter.sqlFragment}`, scopeFilter.params);

    const totalVal = total[0].count || 0;
    const approvedVal = approved[0].count || 0;
    const pendingVal = pending[0].count || 0;
    const rejectedVal = rejected[0].count || 0;

    const rate = totalVal > 0 ? Math.round((approvedVal / totalVal) * 100) : 0;

    return {
      total: totalVal,
      approved: approvedVal,
      pending: pendingVal,
      rejected: rejectedVal,
      rate: `${rate}%`,
      chartData: [
        { name: 'Approved', value: approvedVal, color: '#10B981' },
        { name: 'Pending', value: pendingVal, color: '#F59E0B' },
        { name: 'Rejected', value: rejectedVal, color: '#EF4444' }
      ]
    };
  }
}

module.exports = AppraisalService;
