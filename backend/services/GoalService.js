const Performance = require('../models/Performance');
const PerformanceScopeService = require('./PerformanceScopeService');

class GoalService {
  static async create(data, userId) {
    const titleVal = data.goal_title || data.title;
    const progressVal = data.completion_percentage !== undefined ? data.completion_percentage : (data.progress !== undefined ? data.progress : 0);
    const targetDateVal = data.target_date || data.due_date || data.targetDate || null;
    const startDateVal = data.start_date || data.startDate || null;
    const descVal = data.goal_description || data.description || null;
    const deptId = data.department_id || data.departmentId || null;

    const sql = `
      INSERT INTO goals (
        employee_id, department_id, goal_title, title, goal_category, goal_description, description, priority,
        start_date, target_date, due_date, completion_percentage, progress, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.employee_id, deptId, titleVal, titleVal, data.goal_category || 'General', descVal, descVal,
      data.priority || 'Medium', startDateVal, targetDateVal, targetDateVal, progressVal, progressVal,
      data.status || 'Not Started', userId, userId
    ];
    const result = await Performance.query(sql, params);
    return { id: result.insertId };
  }

  static async update(id, data, userId) {
    const titleVal = data.goal_title || data.title;
    const progressVal = data.completion_percentage !== undefined ? data.completion_percentage : (data.progress !== undefined ? data.progress : null);
    const targetDateVal = data.target_date || data.due_date || data.targetDate || null;
    const startDateVal = data.start_date || data.startDate || null;
    const descVal = data.goal_description || data.description || null;
    const deptId = data.department_id || data.departmentId || null;

    const sql = `
      UPDATE goals SET
        goal_title = COALESCE(?, goal_title),
        title = COALESCE(?, title),
        department_id = COALESCE(?, department_id),
        goal_category = COALESCE(?, goal_category),
        goal_description = COALESCE(?, goal_description),
        description = COALESCE(?, description),
        priority = COALESCE(?, priority),
        start_date = COALESCE(?, start_date),
        target_date = COALESCE(?, target_date),
        due_date = COALESCE(?, due_date),
        completion_percentage = COALESCE(?, completion_percentage),
        progress = COALESCE(?, progress),
        status = COALESCE(?, status),
        updated_by = ?
      WHERE id = ?
    `;
    const params = [
      titleVal, titleVal, deptId, data.goal_category, descVal, descVal, data.priority,
      startDateVal, targetDateVal, targetDateVal, progressVal, progressVal, data.status, userId, id
    ];
    await Performance.query(sql, params);
    return true;
  }

  static async delete(id) {
    await Performance.query('DELETE FROM goals WHERE id = ?', [id]);
    return true;
  }

  static async getById(id) {
    const rows = await Performance.query(
      `SELECT g.*, e.name as employee_name, COALESCE(dept.dept_name, b.branch_name, 'General') as department_name
       FROM goals g
       LEFT JOIN employees e ON g.employee_id = e.id
       LEFT JOIN departments dept ON (COALESCE(g.department_id, e.department_id) = dept.id)
       LEFT JOIN branches b ON e.branch_id = b.id
       WHERE g.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters, pagination, scope = null) {
    let sql = `
      SELECT g.*, e.name as employee_name, COALESCE(dept.dept_name, b.branch_name, 'General') as department_name
      FROM goals g
      LEFT JOIN employees e ON g.employee_id = e.id
      LEFT JOIN departments dept ON (COALESCE(g.department_id, e.department_id) = dept.id)
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE 1=1
    `;
    const params = [];
    let term = null;

    if (filters.search) {
      term = `%${filters.search}%`;
      sql += ` AND (e.name LIKE ? OR g.goal_title LIKE ? OR g.status LIKE ?)`;
      params.push(term, term, term);
    }
    if (filters.branch_id) {
      sql += ` AND (e.department_id = ? OR g.department_id = ? OR e.branch_id = ? OR dept.dept_name = ? OR b.branch_name = ?)`;
      params.push(filters.branch_id, filters.branch_id, filters.branch_id, filters.branch_id, filters.branch_id);
    }

    if (scope) {
      const scopeFilter = PerformanceScopeService.getSqlFilter('g.employee_id', scope);
      sql += scopeFilter.sqlFragment;
      params.push(...scopeFilter.params);
    }

    sql += ` ORDER BY g.created_at DESC`;

    if (pagination) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pagination.limit, pagination.offset);
    }

    const rows = await Performance.query(sql, params);

    let countSql = `
      SELECT COUNT(*) as count
      FROM goals g
      LEFT JOIN employees e ON g.employee_id = e.id
      LEFT JOIN departments dept ON (COALESCE(g.department_id, e.department_id) = dept.id)
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE 1=1
    `;
    const countParams = [];
    if (term) {
      countSql += ` AND (e.name LIKE ? OR g.goal_title LIKE ? OR g.status LIKE ?)`;
      countParams.push(term, term, term);
    }
    if (filters.branch_id) {
      countSql += ` AND (e.department_id = ? OR g.department_id = ? OR e.branch_id = ? OR dept.dept_name = ? OR b.branch_name = ?)`;
      countParams.push(filters.branch_id, filters.branch_id, filters.branch_id, filters.branch_id, filters.branch_id);
    }
    if (scope) {
      const scopeFilter = PerformanceScopeService.getSqlFilter('g.employee_id', scope);
      countSql += scopeFilter.sqlFragment;
      countParams.push(...scopeFilter.params);
    }

    const totalRes = await Performance.query(countSql, countParams);

    return { rows, total: totalRes[0].count };
  }

  static async getDashboardStats(scope = null) {
    const scopeFilter = scope ? PerformanceScopeService.getSqlFilter('employee_id', scope) : { sqlFragment: '', params: [] };

    const total = await Performance.query(`SELECT COUNT(*) as count FROM goals WHERE 1=1 ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const completed = await Performance.query(`SELECT COUNT(*) as count FROM goals WHERE status = 'Completed' ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const inProgress = await Performance.query(`SELECT COUNT(*) as count FROM goals WHERE status = 'On Track' ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const pending = await Performance.query(`SELECT COUNT(*) as count FROM goals WHERE status = 'Not Started' ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const overdue = await Performance.query(`SELECT COUNT(*) as count FROM goals WHERE status != 'Completed' AND target_date < CURDATE() ${scopeFilter.sqlFragment}`, scopeFilter.params);

    const totalVal = total[0].count || 0;
    const completedVal = completed[0].count || 0;
    const inProgressVal = inProgress[0].count || 0;
    const pendingVal = pending[0].count || 0;
    const overdueVal = overdue[0].count || 0;

    const rate = totalVal > 0 ? Math.round((completedVal / totalVal) * 100) : 0;

    // Use branches instead of departments (employees link to branch_id)
    const deptScopeFilter = scope ? PerformanceScopeService.getSqlFilter('g.employee_id', scope) : { sqlFragment: '', params: [] };
    const deptSummary = await Performance.query(`
      SELECT b.branch_name as name, COUNT(g.id) as goals
      FROM branches b
      JOIN employees e ON e.branch_id = b.id
      JOIN goals g ON g.employee_id = e.id
      WHERE 1=1 ${deptScopeFilter.sqlFragment}
      GROUP BY b.id, b.branch_name
      LIMIT 6
    `, deptScopeFilter.params);

    return {
      total: totalVal,
      completed: completedVal,
      inProgress: inProgressVal,
      pending: pendingVal,
      overdue: overdueVal,
      rate: `${rate}%`,
      chartData: [
        { name: 'On Track', value: inProgressVal, color: '#2563EB' },
        { name: 'At Risk', value: overdueVal, color: '#F59E0B' },
        { name: 'Not Started', value: pendingVal, color: '#CBD5E1' },
        { name: 'Completed', value: completedVal, color: '#22C55E' }
      ],
      deptData: deptSummary
    };
  }
  static async getGoalsByEmployee(employeeId) {
    return await Performance.query(
      `SELECT g.*, COALESCE(d.dept_name, 'General') as department_name
       FROM goals g
       LEFT JOIN departments d ON g.department_id = d.id
       WHERE g.employee_id = ? AND g.status != 'Cancelled'
       ORDER BY g.created_at DESC`,
      [employeeId]
    );
  }

  static async getGoalHierarchy(goalId) {
    const goalRows = await Performance.query(
      `SELECT g.*, e.name as employee_name, COALESCE(d.dept_name, 'General') as department_name
       FROM goals g
       LEFT JOIN employees e ON g.employee_id = e.id
       LEFT JOIN departments d ON g.department_id = d.id
       WHERE g.id = ?`,
      [goalId]
    );
    if (!goalRows || goalRows.length === 0) return null;
    const goal = goalRows[0];

    const kras = await Performance.query(
      `SELECT k.*, COALESCE(d.dept_name, 'General') as department_name
       FROM kras k
       LEFT JOIN departments d ON k.department_id = d.id
       WHERE k.goal_id = ? AND k.status = 'Active'
       ORDER BY k.id ASC`,
      [goalId]
    );

    for (const kra of kras) {
      const kpis = await Performance.query(
        `SELECT kp.*, COALESCE(d.dept_name, 'General') as department_name
         FROM kpis kp
         LEFT JOIN departments d ON kp.department_id = d.id
         WHERE kp.kra_id = ? AND kp.status = 'Active'
         ORDER BY kp.id ASC`,
        [kra.id]
      );
      kra.kpis = kpis || [];
    }

    goal.kras = kras;
    return goal;
  }
}

module.exports = GoalService;
