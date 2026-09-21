const Performance = require('../models/Performance');
const PerformanceScopeService = require('./PerformanceScopeService');

class KraService {
  static async create(data, userId) {
    const kraTitle = data.kra_title || data.title || 'Key Result Area';
    const sql = `
      INSERT INTO kras (
        goal_id, kra_title, title, department_id, role_id, weightage, status, description, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.goal_id || null, kraTitle, kraTitle, data.department_id || null, data.role_id || 'All Roles',
      data.weightage !== undefined && data.weightage !== null && data.weightage !== '' ? Number(data.weightage) : null,
      data.status || 'Active', data.description || null, userId, userId
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
    const kraTitle = data.kra_title || data.title || 'Key Result Area';
    const sql = `
      UPDATE kras SET
        goal_id = ?, kra_title = ?, title = ?, department_id = ?, role_id = ?, weightage = ?,
        status = ?, description = ?, updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.goal_id || null, kraTitle, kraTitle, data.department_id || null, data.role_id || 'All Roles',
      data.weightage !== undefined && data.weightage !== null && data.weightage !== '' ? Number(data.weightage) : null,
      data.status, data.description || null, userId, id
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
      await Performance.query('DELETE FROM kras WHERE id = ?', [id]);
      await Performance.commit();
      return true;
    } catch (e) {
      await Performance.rollback();
      throw e;
    }
  }

  static async getById(id) {
    const rows = await Performance.query(
      `SELECT k.id,
              k.goal_id,
              COALESCE(g.goal_title, g.title, 'General Goal') as goal_title,
              COALESCE(k.kra_title, k.title, 'Key Result Area') as kra_title,
              COALESCE(k.title, k.kra_title, 'Key Result Area') as title,
              k.department_id,
              COALESCE(d.dept_name, 'General') as department_name,
              COALESCE(k.role_id, 'All Roles') as role_id,
              k.weightage,
              k.description,
              COALESCE(k.status, 'Active') as status,
              k.created_at
       FROM kras k
       LEFT JOIN goals g ON k.goal_id = g.id
       LEFT JOIN departments d ON k.department_id = d.id
       WHERE k.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters = {}, pagination = null, scope = null) {
    let sql = `
      SELECT k.id,
             k.goal_id,
             COALESCE(g.goal_title, g.title, 'General Goal') as goal_title,
             COALESCE(k.kra_title, k.title, 'Key Result Area') as kra_title,
             COALESCE(k.title, k.kra_title, 'Key Result Area') as title,
             k.department_id,
             COALESCE(d.dept_name, 'General') as department_name,
             COALESCE(k.role_id, 'All Roles') as role_id,
             k.weightage,
             k.description,
             COALESCE(k.status, 'Active') as status,
             k.created_at
      FROM kras k
      LEFT JOIN goals g ON k.goal_id = g.id
      LEFT JOIN departments d ON k.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      sql += ` AND (k.kra_title LIKE ? OR k.title LIKE ? OR k.role_id LIKE ? OR k.status LIKE ? OR g.goal_title LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term, term);
    }
    if (filters.department_id) {
      sql += ` AND k.department_id = ?`;
      params.push(filters.department_id);
    }
    if (filters.goal_id) {
      sql += ` AND k.goal_id = ?`;
      params.push(filters.goal_id);
    }

    if (scope) {
      if (scope.isUnrestricted) {
        if (scope.requestedEmployeeId) {
          sql += ` AND (k.employee_id = ? OR g.employee_id = ?)`;
          params.push(scope.requestedEmployeeId, scope.requestedEmployeeId);
        }
      } else if (scope.isBlocked || !scope.allowedEmployeeIds || scope.allowedEmployeeIds.length === 0) {
        sql += ` AND 1=0`;
      } else {
        const ph = scope.allowedEmployeeIds.map(() => '?').join(', ');
        sql += ` AND (k.employee_id IN (${ph}) OR g.employee_id IN (${ph}))`;
        params.push(...scope.allowedEmployeeIds, ...scope.allowedEmployeeIds);
      }
    }

    sql += ` ORDER BY k.created_at DESC`;

    if (pagination) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pagination.limit, pagination.offset);
    }

    const rows = await Performance.query(sql, params);

    let countSql = `
      SELECT COUNT(*) as count
      FROM kras k
      LEFT JOIN goals g ON k.goal_id = g.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      const term = `%${filters.search}%`;
      countSql += ` AND (k.kra_title LIKE ? OR k.title LIKE ? OR k.role_id LIKE ? OR k.status LIKE ? OR g.goal_title LIKE ?)`;
      countParams.push(term, term, term, term, term);
    }
    if (filters.department_id) {
      countSql += ` AND k.department_id = ?`;
      countParams.push(filters.department_id);
    }
    if (filters.goal_id) {
      countSql += ` AND k.goal_id = ?`;
      countParams.push(filters.goal_id);
    }

    if (scope) {
      if (scope.isUnrestricted) {
        if (scope.requestedEmployeeId) {
          countSql += ` AND (k.employee_id = ? OR g.employee_id = ?)`;
          countParams.push(scope.requestedEmployeeId, scope.requestedEmployeeId);
        }
      } else if (scope.isBlocked || !scope.allowedEmployeeIds || scope.allowedEmployeeIds.length === 0) {
        countSql += ` AND 1=0`;
      } else {
        const ph = scope.allowedEmployeeIds.map(() => '?').join(', ');
        countSql += ` AND (k.employee_id IN (${ph}) OR g.employee_id IN (${ph}))`;
        countParams.push(...scope.allowedEmployeeIds, ...scope.allowedEmployeeIds);
      }
    }

    const totalRes = await Performance.query(countSql, countParams);

    return { rows, total: totalRes[0].count };
  }

  static async getDashboardStats(scope = null) {
    let whereClause = '';
    const whereParams = [];

    if (scope) {
      if (scope.isUnrestricted) {
        if (scope.requestedEmployeeId) {
          whereClause = ` LEFT JOIN goals g ON k.goal_id = g.id WHERE (k.employee_id = ? OR g.employee_id = ?)`;
          whereParams.push(scope.requestedEmployeeId, scope.requestedEmployeeId);
        }
      } else if (scope.isBlocked || !scope.allowedEmployeeIds || scope.allowedEmployeeIds.length === 0) {
        whereClause = ` WHERE 1=0`;
      } else {
        const ph = scope.allowedEmployeeIds.map(() => '?').join(', ');
        whereClause = ` LEFT JOIN goals g ON k.goal_id = g.id WHERE (k.employee_id IN (${ph}) OR g.employee_id IN (${ph}))`;
        whereParams.push(...scope.allowedEmployeeIds, ...scope.allowedEmployeeIds);
      }
    }

    const totalSql = `SELECT COUNT(*) as count FROM kras k ${whereClause}`;
    const activeSql = whereClause ? `${totalSql} AND k.status = 'Active'` : `SELECT COUNT(*) as count FROM kras WHERE status = 'Active'`;
    const inactiveSql = whereClause ? `${totalSql} AND k.status = 'Inactive'` : `SELECT COUNT(*) as count FROM kras WHERE status = 'Inactive'`;

    const total = await Performance.query(totalSql, whereParams);
    const active = await Performance.query(activeSql, whereParams);
    const inactive = await Performance.query(inactiveSql, whereParams);

    const totalVal = total[0].count || 0;
    const activeVal = active[0].count || 0;
    const inactiveVal = inactive[0].count || 0;

    const rate = totalVal > 0 ? Math.round((activeVal / totalVal) * 100) : 0;

    const deptSummary = await Performance.query(`
      SELECT d.dept_name as name, COUNT(k.id) as kras
      FROM departments d
      JOIN kras k ON k.department_id = d.id
      ${whereClause}
      GROUP BY d.dept_name
      LIMIT 6
    `, whereParams);

    return {
      total: totalVal,
      active: activeVal,
      inactive: inactiveVal,
      rate: `${rate}%`,
      chartData: [
        { name: 'Active', value: activeVal, color: '#2563EB' },
        { name: 'Inactive', value: inactiveVal, color: '#CBD5E1' }
      ],
      deptData: deptSummary
    };
  }
}

module.exports = KraService;
