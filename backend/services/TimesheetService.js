const Timesheet = require('../models/Timesheet');

class TimesheetService {
  static async create(data, userId) {
    const sql = `
      INSERT INTO timesheets (employee_id, project_id, log_date, hours, billable, status, task_description, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.employee_id, data.project_id, data.log_date || null,
      parseFloat(data.hours), data.billable || 'Billable', data.status || 'Pending',
      data.task_description || null, userId, userId
    ];
    const result = await Timesheet.query(sql, params);
    return { id: result.insertId };
  }

  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Timesheet not found');

    const sql = `
      UPDATE timesheets SET employee_id = ?, project_id = ?, log_date = ?, hours = ?,
        billable = ?, status = ?, task_description = ?, updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.employee_id, data.project_id, data.log_date || null,
      parseFloat(data.hours), data.billable || 'Billable', data.status || existing.status,
      data.task_description || null, userId, id
    ];
    await Timesheet.query(sql, params);
    return true;
  }

  static async delete(id) {
    const result = await Timesheet.query(`DELETE FROM timesheets WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  static baseSql() {
    return `
      SELECT ts.*, e.name as employee_name, p.project_name as project_name
      FROM timesheets ts
      LEFT JOIN employees e ON ts.employee_id = e.id
      LEFT JOIN projects p ON ts.project_id = p.id
    `;
  }

  static async getById(id) {
    const rows = await Timesheet.query(`${this.baseSql()} WHERE ts.id = ?`, [id]);
    return rows[0] || null;
  }

  static async list(filters, pagination) {
    let sql = `${this.baseSql()} WHERE 1=1`;
    const params = [];

    if (filters.search) {
      sql += ` AND (e.name LIKE ? OR p.project_name LIKE ? OR ts.task_description LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    if (filters.employee_id) {
      sql += ` AND ts.employee_id = ?`;
      params.push(filters.employee_id);
    }

    if (filters.project_id) {
      sql += ` AND ts.project_id = ?`;
      params.push(filters.project_id);
    }

    if (filters.status) {
      sql += ` AND ts.status = ?`;
      params.push(filters.status);
    }

    if (filters.date) {
      sql += ` AND ts.log_date = ?`;
      params.push(filters.date);
    }

    if (filters.week_start && filters.week_end) {
      sql += ` AND ts.log_date >= ? AND ts.log_date <= ?`;
      params.push(filters.week_start, filters.week_end);
    }

    if (filters.month) {
      sql += ` AND DATE_FORMAT(ts.log_date, '%Y-%m') = ?`;
      params.push(filters.month);
    }

    sql += ` ORDER BY ts.log_date DESC, ts.created_at DESC`;

    const countSql = `SELECT COUNT(*) as count FROM (${sql}) as sub`;
    const totalResult = await Timesheet.query(countSql, params);

    sql += ` LIMIT ? OFFSET ?`;
    const rows = await Timesheet.query(sql, [...params, pagination.limit, pagination.offset]);

    return {
      rows: rows.map(r => ({ ...r, hours: parseFloat(r.hours) })),
      total: totalResult[0].count
    };
  }

  static async getSummary(filters = {}) {
    let where = ' WHERE 1=1';
    const params = [];

    if (filters.employee_id) {
      where += ` AND ts.employee_id = ?`;
      params.push(filters.employee_id);
    }
    if (filters.project_id) {
      where += ` AND ts.project_id = ?`;
      params.push(filters.project_id);
    }
    if (filters.month) {
      where += ` AND DATE_FORMAT(ts.log_date, '%Y-%m') = ?`;
      params.push(filters.month);
    }
    if (filters.week_start && filters.week_end) {
      where += ` AND ts.log_date >= ? AND ts.log_date <= ?`;
      params.push(filters.week_start, filters.week_end);
    }

    const rows = await Timesheet.query(
      `SELECT ts.billable, ts.status, COALESCE(SUM(ts.hours), 0) as total, COUNT(*) as cnt
       FROM timesheets ts ${where}
       GROUP BY ts.billable, ts.status`,
      params
    );

    let totalHours = 0, billableHours = 0, nonBillableHours = 0, pendingCount = 0;
    rows.forEach(r => {
      const h = parseFloat(r.total) || 0;
      totalHours += h;
      if (r.billable === 'Billable') billableHours += h;
      if (r.billable === 'Non-Billable') nonBillableHours += h;
      if (r.status === 'Pending') pendingCount += r.cnt;
    });

    const employeeTotals = await Timesheet.query(
      `SELECT e.name as employee_name, COALESCE(SUM(ts.hours), 0) as total
       FROM timesheets ts LEFT JOIN employees e ON ts.employee_id = e.id ${where}
       GROUP BY ts.employee_id, e.name`,
      params
    );

    const projectTotals = await Timesheet.query(
      `SELECT p.project_name as project_name, COALESCE(SUM(ts.hours), 0) as total
       FROM timesheets ts LEFT JOIN projects p ON ts.project_id = p.id ${where}
       GROUP BY ts.project_id, p.project_name`,
      params
    );

    return {
      totalHours,
      billableHours,
      nonBillableHours,
      pendingCount,
      employeeTotals,
      projectTotals
    };
  }
}

module.exports = TimesheetService;