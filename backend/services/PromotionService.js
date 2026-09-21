const Performance = require('../models/Performance');
const PerformanceScopeService = require('./PerformanceScopeService');

class PromotionService {
  static async create(data, userId) {
    const sql = `
      INSERT INTO promotions (
        employee_id, current_department, current_designation, promoted_department, promoted_designation,
        promotion_date, effective_date, promotion_reason, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.employee_id, data.current_department, data.current_designation, data.promoted_department, data.promoted_designation,
      data.promotion_date, data.effective_date, data.promotion_reason || null, data.status || 'Pending',
      userId, userId
    ];
    await Performance.beginTransaction();
    try {
      const result = await Performance.query(sql, params);
      
      // If approved immediately, trigger update
      if (data.status === 'Approved') {
        await this.triggerEmployeePromotion(data.employee_id, data.promoted_department, data.promoted_designation);
      }

      await Performance.commit();
      return { id: result.insertId };
    } catch (e) {
      await Performance.rollback();
      throw e;
    }
  }

  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Promotion record not found');

    const promotedDept = data.promoted_department !== undefined ? data.promoted_department : existing.promoted_department;
    const promotedDesig = data.promoted_designation !== undefined ? data.promoted_designation : existing.promoted_designation;

    const sql = `
      UPDATE promotions SET
        current_department = ?, current_designation = ?, promoted_department = ?, promoted_designation = ?,
        promotion_date = ?, effective_date = ?, promotion_reason = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.current_department !== undefined ? data.current_department : existing.current_department,
      data.current_designation !== undefined ? data.current_designation : existing.current_designation,
      promotedDept,
      promotedDesig,
      data.promotion_date !== undefined ? data.promotion_date : existing.promotion_date,
      data.effective_date !== undefined ? data.effective_date : existing.effective_date,
      data.promotion_reason !== undefined ? data.promotion_reason : existing.promotion_reason,
      data.status !== undefined ? data.status : existing.status,
      userId, id
    ];
    await Performance.beginTransaction();
    try {
      await Performance.query(sql, params);

      // If status changed to Approved, update employee master
      if (data.status === 'Approved' && existing.status !== 'Approved') {
        await this.triggerEmployeePromotion(existing.employee_id, promotedDept, promotedDesig);
      }

      await Performance.commit();
      return true;
    } catch (e) {
      await Performance.rollback();
      throw e;
    }
  }

  static async triggerEmployeePromotion(employeeId, promotedDepartment, promotedDesignation) {
    // Dynamically update the employee's branch (department name mapping) and designation
    const sql = `
      UPDATE employees SET
        branch_id = COALESCE((SELECT id FROM branches WHERE branch_name LIKE ? LIMIT 1), branch_id),
        designation_id = COALESCE((SELECT id FROM designations WHERE role_code LIKE ? OR role_name LIKE ? LIMIT 1), designation_id)
      WHERE id = ?
    `;
    await Performance.query(sql, [
      `%${promotedDepartment}%`,
      `%${promotedDesignation}%`,
      `%${promotedDesignation}%`,
      employeeId
    ]);
  }

  static async delete(id) {
    await Performance.beginTransaction();
    try {
      await Performance.query('DELETE FROM promotions WHERE id = ?', [id]);
      await Performance.commit();
      return true;
    } catch (e) {
      await Performance.rollback();
      throw e;
    }
  }

  static async getById(id) {
    const rows = await Performance.query(
      `SELECT p.*, e.name as employee_name
       FROM promotions p
       LEFT JOIN employees e ON p.employee_id = e.id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters, pagination, scope = null) {
    let sql = `
      SELECT p.*, e.name as employee_name
      FROM promotions p
      LEFT JOIN employees e ON p.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      sql += ` AND (e.name LIKE ? OR p.promoted_designation LIKE ? OR p.status LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    if (scope) {
      const scopeFilter = PerformanceScopeService.getSqlFilter('p.employee_id', scope);
      sql += scopeFilter.sqlFragment;
      params.push(...scopeFilter.params);
    }

    sql += ` ORDER BY p.created_at DESC`;

    if (pagination) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pagination.limit, pagination.offset);
    }

    const rows = await Performance.query(sql, params);

    let countSql = `
      SELECT COUNT(*) as count
      FROM promotions p
      LEFT JOIN employees e ON p.employee_id = e.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      countSql += ` AND (e.name LIKE ? OR p.promoted_designation LIKE ? OR p.status LIKE ?)`;
      const term = `%${filters.search}%`;
      countParams.push(term, term, term);
    }

    if (scope) {
      const scopeFilter = PerformanceScopeService.getSqlFilter('p.employee_id', scope);
      countSql += scopeFilter.sqlFragment;
      countParams.push(...scopeFilter.params);
    }

    const totalRes = await Performance.query(countSql, countParams);

    return { rows, total: totalRes[0].count };
  }

  static async getDashboardStats(scope = null) {
    const scopeFilter = scope ? PerformanceScopeService.getSqlFilter('employee_id', scope) : { sqlFragment: '', params: [] };

    const total = await Performance.query(`SELECT COUNT(*) as count FROM promotions WHERE 1=1 ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const approved = await Performance.query(`SELECT COUNT(*) as count FROM promotions WHERE status = 'Approved' ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const pending = await Performance.query(`SELECT COUNT(*) as count FROM promotions WHERE status = 'Pending' ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const today = await Performance.query(`SELECT COUNT(*) as count FROM promotions WHERE promotion_date = CURDATE() ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const month = await Performance.query(`SELECT COUNT(*) as count FROM promotions WHERE MONTH(promotion_date) = MONTH(CURDATE()) AND YEAR(promotion_date) = YEAR(CURDATE()) ${scopeFilter.sqlFragment}`, scopeFilter.params);

    const totalVal = total[0].count || 0;
    const approvedVal = approved[0].count || 0;
    const pendingVal = pending[0].count || 0;

    const rate = totalVal > 0 ? Math.round((approvedVal / totalVal) * 100) : 0;

    const deptSummary = await Performance.query(`
      SELECT current_department as name, COUNT(*) as count
      FROM promotions
      WHERE 1=1 ${scopeFilter.sqlFragment}
      GROUP BY current_department
      LIMIT 6
    `, scopeFilter.params);

    return {
      total: totalVal,
      approved: approvedVal,
      pending: pendingVal,
      today: today[0].count || 0,
      month: month[0].count || 0,
      rate: `${rate}%`,
      chartData: deptSummary
    };
  }
}

module.exports = PromotionService;
