const NewJoiner = require('../models/NewJoiner');

class NewJoinerService {
  static async syncToEmployees(data) {
    if (!data || !data.employee_name) return;
    const name = data.employee_name.trim();
    const db = require('../config/database');

    try {
      const existing = await new Promise((resolve) => {
        db.query('SELECT id FROM employees WHERE LOWER(name) = LOWER(?)', [name], (err, rows) => resolve(rows || []));
      });

      let desgId = null;
      if (data.designation) {
        const desgRow = await new Promise((resolve) => {
          db.query('SELECT id FROM designations WHERE LOWER(role_name) = LOWER(?) OR LOWER(role_code) = LOWER(?) LIMIT 1', [data.designation, data.designation], (err, rows) => resolve(rows || []));
        });
        if (desgRow.length > 0) {
          desgId = desgRow[0].id;
        } else {
          const newDesg = await new Promise((resolve) => {
            db.query('INSERT INTO designations (role_name, role_code, status) VALUES (?, ?, "Active")', [data.designation, data.designation.toUpperCase().slice(0, 10)], (err, res) => {
              if (err) resolve(null);
              else resolve(res ? res.insertId : null);
            });
          });
          desgId = newDesg;
        }
      }

      if (existing.length === 0) {
        const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@madhuratech.com`;
        const sql = `
          INSERT INTO employees (name, email, department_id, designation_id, join_date, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'Active', NOW())
        `;
        await new Promise((resolve) => {
          db.query(sql, [name, email, data.department_id || null, desgId, data.joining_date || new Date()], () => resolve());
        });
      } else {
        const sql = `
          UPDATE employees SET department_id = COALESCE(?, department_id), designation_id = COALESCE(?, designation_id), join_date = COALESCE(?, join_date)
          WHERE id = ?
        `;
        await new Promise((resolve) => {
          db.query(sql, [data.department_id || null, desgId, data.joining_date || null, existing[0].id], () => resolve());
        });
      }
    } catch (e) {
      console.error('Error syncing new joiner to employees table:', e.message);
    }
  }

  static async create(data, userId) {
    const sql = `
      INSERT INTO new_joiners (
        employee_name, department_id, designation, joining_date,
        reporting_manager, checklist, buddy, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.employee_name, data.department_id, data.designation, data.joining_date,
      data.reporting_manager, data.checklist, data.buddy || null, data.status || 'In Progress',
      userId, userId
    ];

    await NewJoiner.beginTransaction();
    try {
      const result = await NewJoiner.query(sql, params);
      await NewJoiner.commit();
      await this.syncToEmployees(data);
      return { id: result.insertId };
    } catch (error) {
      await NewJoiner.rollback();
      throw error;
    }
  }

  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('New Joiner onboarding record not found');

    const sql = `
      UPDATE new_joiners SET
        employee_name = ?, department_id = ?, designation = ?, joining_date = ?,
        reporting_manager = ?, checklist = ?, buddy = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;

    const params = [
      data.employee_name, data.department_id, data.designation, data.joining_date,
      data.reporting_manager, data.checklist, data.buddy || null, data.status,
      userId, id
    ];

    await NewJoiner.beginTransaction();
    try {
      await NewJoiner.query(sql, params);
      await NewJoiner.commit();
      await this.syncToEmployees(data);
      return true;
    } catch (error) {
      await NewJoiner.rollback();
      throw error;
    }
  }

  static async delete(id) {
    await NewJoiner.beginTransaction();
    try {
      await NewJoiner.query('DELETE FROM new_joiners WHERE id = ?', [id]);
      await NewJoiner.commit();
      return true;
    } catch (error) {
      await NewJoiner.rollback();
      throw error;
    }
  }

  static async getById(id) {
    const rows = await NewJoiner.query(
      `SELECT n.*, d.dept_name as department_name
       FROM new_joiners n
       LEFT JOIN departments d ON n.department_id = d.id
       WHERE n.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters, pagination) {
    let sql = `
      SELECT n.*, d.dept_name as department_name
      FROM new_joiners n
      LEFT JOIN departments d ON n.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    // Search
    if (filters.search) {
      sql += ` AND (n.employee_name LIKE ? OR n.designation LIKE ? OR n.reporting_manager LIKE ? OR n.status LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    // Filters
    if (filters.department_id) {
      sql += ` AND n.department_id = ?`;
      params.push(filters.department_id);
    }
    if (filters.status) {
      sql += ` AND n.status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY n.created_at DESC`;

    if (pagination) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pagination.limit, pagination.offset);
    }

    const rows = await NewJoiner.query(sql, params);

    // Count
    let countSql = `
      SELECT COUNT(*) as count
      FROM new_joiners n
      LEFT JOIN departments d ON n.department_id = d.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      countSql += ` AND (n.employee_name LIKE ? OR n.designation LIKE ? OR n.reporting_manager LIKE ? OR n.status LIKE ?)`;
      countParams.push(term, term, term, term);
    }
    if (filters.department_id) {
      countSql += ` AND n.department_id = ?`;
      countParams.push(filters.department_id);
    }
    if (filters.status) {
      countSql += ` AND n.status = ?`;
      countParams.push(filters.status);
    }

    const totalResult = await NewJoiner.query(countSql, countParams);
    return {
      rows,
      total: totalResult[0].count
    };
  }

  static async getDashboardStats() {
    // 1. KPI stats
    const totalCount = await NewJoiner.query(`SELECT COUNT(*) as count FROM new_joiners`);
    const weekCount = await NewJoiner.query(`SELECT COUNT(*) as count FROM new_joiners WHERE YEARWEEK(joining_date, 1) = YEARWEEK(CURDATE(), 1)`);
    const pendingCount = await NewJoiner.query(`SELECT COUNT(*) as count FROM new_joiners WHERE status = 'Pending'`);
    const inProgressCount = await NewJoiner.query(`SELECT COUNT(*) as count FROM new_joiners WHERE status = 'In Progress'`);
    const completedCount = await NewJoiner.query(`SELECT COUNT(*) as count FROM new_joiners WHERE status = 'Completed'`);

    const total = totalCount[0].count || 0;
    const completed = completedCount[0].count || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 2. Department-wise count
    const deptSummary = await NewJoiner.query(`
      SELECT d.dept_name as name, COUNT(n.id) as count
      FROM departments d
      JOIN new_joiners n ON n.department_id = d.id
      GROUP BY d.dept_name
      ORDER BY count DESC
      LIMIT 6
    `);

    return {
      total,
      joinedThisWeek: weekCount[0].count || 0,
      pending: pendingCount[0].count || 0,
      inProgress: inProgressCount[0].count || 0,
      completed,
      completionRate: `${completionRate}%`,
      chartData: [
        { name: 'Completed', value: completed, color: '#10B981' },
        { name: 'In Progress', value: inProgressCount[0].count || 0, color: '#2952E3' },
        { name: 'Pending', value: pendingCount[0].count || 0, color: '#F59E0B' }
      ],
      deptData: deptSummary
    };
  }
}

module.exports = NewJoinerService;
