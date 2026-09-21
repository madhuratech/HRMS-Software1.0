const Performance = require('../models/Performance');
const PerformanceScopeService = require('./PerformanceScopeService');

class KpiService {
  static async create(data, userId) {
    const kpiName = data.kpi_name || data.title || 'KPI Target';
    const sql = `
      INSERT INTO kpis (
        kra_id, kpi_name, title, department_id, measurement_type, weightage, target_value, description, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.kra_id || null, kpiName, kpiName, data.department_id || null, data.measurement_type || 'Percentage',
      data.weightage !== undefined && data.weightage !== null && data.weightage !== '' ? Number(data.weightage) : null,
      data.target_value, data.description || null, data.status || 'Active', userId, userId
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
    const kpiName = data.kpi_name || data.title || 'KPI Target';
    const sql = `
      UPDATE kpis SET
        kra_id = ?, kpi_name = ?, title = ?, department_id = ?, measurement_type = ?, weightage = ?, target_value = ?,
        description = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.kra_id || null, kpiName, kpiName, data.department_id || null, data.measurement_type || 'Percentage',
      data.weightage !== undefined && data.weightage !== null && data.weightage !== '' ? Number(data.weightage) : null,
      data.target_value, data.description || null, data.status, userId, id
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
      await Performance.query('DELETE FROM kpis WHERE id = ?', [id]);
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
              k.kra_id,
              COALESCE(kr.kra_title, kr.title, 'General KRA') as kra_title,
              kr.goal_id,
              COALESCE(g.goal_title, g.title, 'General Goal') as goal_title,
              COALESCE(k.kpi_name, k.title, 'KPI Target') as kpi_name,
              COALESCE(k.title, k.kpi_name, 'KPI Target') as title,
              k.department_id,
              COALESCE(d.dept_name, 'General') as department_name,
              COALESCE(k.measurement_type, 'Percentage') as measurement_type,
              k.weightage,
              k.target_value,
              k.achieved_value,
              k.description,
              COALESCE(k.status, 'Active') as status,
              k.created_at
       FROM kpis k
       LEFT JOIN kras kr ON k.kra_id = kr.id
       LEFT JOIN goals g ON kr.goal_id = g.id
       LEFT JOIN departments d ON k.department_id = d.id
       WHERE k.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters = {}, pagination = null, scope = null) {
    let sql = `
      SELECT k.id,
             k.kra_id,
             COALESCE(kr.kra_title, kr.title, 'General KRA') as kra_title,
             kr.goal_id,
             COALESCE(g.goal_title, g.title, 'General Goal') as goal_title,
             COALESCE(k.kpi_name, k.title, 'KPI Target') as kpi_name,
             COALESCE(k.title, k.kpi_name, 'KPI Target') as title,
             k.department_id,
             COALESCE(d.dept_name, 'General') as department_name,
             COALESCE(k.measurement_type, 'Percentage') as measurement_type,
             k.weightage,
             k.target_value,
             k.achieved_value,
             k.description,
             COALESCE(k.status, 'Active') as status,
             k.created_at
      FROM kpis k
      LEFT JOIN kras kr ON k.kra_id = kr.id
      LEFT JOIN goals g ON kr.goal_id = g.id
      LEFT JOIN departments d ON k.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      sql += ` AND (k.kpi_name LIKE ? OR k.title LIKE ? OR k.status LIKE ? OR kr.kra_title LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }
    if (filters.department_id) {
      sql += ` AND k.department_id = ?`;
      params.push(filters.department_id);
    }
    if (filters.kra_id) {
      sql += ` AND k.kra_id = ?`;
      params.push(filters.kra_id);
    }

    if (scope) {
      if (scope.isUnrestricted) {
        if (scope.requestedEmployeeId) {
          sql += ` AND (k.employee_id = ? OR kr.employee_id = ? OR g.employee_id = ?)`;
          params.push(scope.requestedEmployeeId, scope.requestedEmployeeId, scope.requestedEmployeeId);
        }
      } else if (scope.isBlocked || !scope.allowedEmployeeIds || scope.allowedEmployeeIds.length === 0) {
        sql += ` AND 1=0`;
      } else {
        const ph = scope.allowedEmployeeIds.map(() => '?').join(', ');
        sql += ` AND (k.employee_id IN (${ph}) OR kr.employee_id IN (${ph}) OR g.employee_id IN (${ph}))`;
        params.push(...scope.allowedEmployeeIds, ...scope.allowedEmployeeIds, ...scope.allowedEmployeeIds);
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
      FROM kpis k
      LEFT JOIN kras kr ON k.kra_id = kr.id
      LEFT JOIN goals g ON kr.goal_id = g.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      const term = `%${filters.search}%`;
      countSql += ` AND (k.kpi_name LIKE ? OR k.title LIKE ? OR k.status LIKE ? OR kr.kra_title LIKE ?)`;
      countParams.push(term, term, term, term);
    }
    if (filters.department_id) {
      countSql += ` AND k.department_id = ?`;
      countParams.push(filters.department_id);
    }
    if (filters.kra_id) {
      countSql += ` AND k.kra_id = ?`;
      countParams.push(filters.kra_id);
    }

    if (scope) {
      if (scope.isUnrestricted) {
        if (scope.requestedEmployeeId) {
          countSql += ` AND (k.employee_id = ? OR kr.employee_id = ? OR g.employee_id = ?)`;
          countParams.push(scope.requestedEmployeeId, scope.requestedEmployeeId, scope.requestedEmployeeId);
        }
      } else if (scope.isBlocked || !scope.allowedEmployeeIds || scope.allowedEmployeeIds.length === 0) {
        countSql += ` AND 1=0`;
      } else {
        const ph = scope.allowedEmployeeIds.map(() => '?').join(', ');
        countSql += ` AND (k.employee_id IN (${ph}) OR kr.employee_id IN (${ph}) OR g.employee_id IN (${ph}))`;
        countParams.push(...scope.allowedEmployeeIds, ...scope.allowedEmployeeIds, ...scope.allowedEmployeeIds);
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
          whereClause = ` LEFT JOIN kras kr ON k.kra_id = kr.id LEFT JOIN goals g ON kr.goal_id = g.id WHERE (k.employee_id = ? OR kr.employee_id = ? OR g.employee_id = ?)`;
          whereParams.push(scope.requestedEmployeeId, scope.requestedEmployeeId, scope.requestedEmployeeId);
        }
      } else if (scope.isBlocked || !scope.allowedEmployeeIds || scope.allowedEmployeeIds.length === 0) {
        whereClause = ` WHERE 1=0`;
      } else {
        const ph = scope.allowedEmployeeIds.map(() => '?').join(', ');
        whereClause = ` LEFT JOIN kras kr ON k.kra_id = kr.id LEFT JOIN goals g ON kr.goal_id = g.id WHERE (k.employee_id IN (${ph}) OR kr.employee_id IN (${ph}) OR g.employee_id IN (${ph}))`;
        whereParams.push(...scope.allowedEmployeeIds, ...scope.allowedEmployeeIds, ...scope.allowedEmployeeIds);
      }
    }

    const totalSql = `SELECT COUNT(*) as count FROM kpis k ${whereClause}`;
    const activeSql = whereClause ? `${totalSql} AND k.status = 'Active'` : `SELECT COUNT(*) as count FROM kpis WHERE status = 'Active'`;
    const inactiveSql = whereClause ? `${totalSql} AND k.status = 'Inactive'` : `SELECT COUNT(*) as count FROM kpis WHERE status = 'Inactive'`;

    const total = await Performance.query(totalSql, whereParams);
    const active = await Performance.query(activeSql, whereParams);
    const inactive = await Performance.query(inactiveSql, whereParams);

    const totalVal = total[0].count || 0;
    const activeVal = active[0].count || 0;
    const inactiveVal = inactive[0].count || 0;

    const rate = totalVal > 0 ? Math.round((activeVal / totalVal) * 100) : 0;

    const deptSummary = await Performance.query(`
      SELECT d.dept_name as name, COUNT(k.id) as count
      FROM departments d
      JOIN kpis k ON k.department_id = d.id
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

module.exports = KpiService;
