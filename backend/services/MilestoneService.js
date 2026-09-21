const Milestone = require('../models/Milestone');

class MilestoneService {
  static async create(data, userId) {
    const sql = `
      INSERT INTO milestones (milestone_name, project_id, due_date, description, status, progress_pct, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.milestone_name.trim(), data.project_id, data.due_date,
      data.description || null, data.status || 'Upcoming',
      parseInt(data.progress_pct) || 0, userId, userId
    ];
    const result = await Milestone.query(sql, params);
    return { id: result.insertId };
  }

  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Milestone not found');

    const sql = `
      UPDATE milestones SET milestone_name = ?, project_id = ?, due_date = ?,
        description = ?, status = ?, progress_pct = ?, updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.milestone_name.trim(), data.project_id, data.due_date,
      data.description || null, data.status || existing.status,
      parseInt(data.progress_pct) || 0, userId, id
    ];
    await Milestone.query(sql, params);
    return true;
  }

  static async complete(id, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Milestone not found');
    await Milestone.query(
      `UPDATE milestones SET status = 'Completed', progress_pct = 100, updated_by = ? WHERE id = ?`,
      [userId, id]
    );
    return true;
  }

  static async delete(id) {
    const result = await Milestone.query(`DELETE FROM milestones WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  static baseSql() {
    return `
      SELECT m.*, p.project_name as project_name, p.project_manager_id as project_manager_id,
             e.name as owner_name, d.dept_name as department_name
      FROM milestones m
      LEFT JOIN projects p ON m.project_id = p.id
      LEFT JOIN employees e ON p.project_manager_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
    `;
  }

  static async getById(id) {
    const rows = await Milestone.query(`${this.baseSql()} WHERE m.id = ?`, [id]);
    return rows[0] || null;
  }

  static async list(filters, pagination) {
    let sql = `${this.baseSql()} WHERE 1=1`;
    const params = [];

    if (filters.search) {
      sql += ` AND (m.milestone_name LIKE ? OR p.project_name LIKE ? OR e.name LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    if (filters.project_id) {
      sql += ` AND m.project_id = ?`;
      params.push(filters.project_id);
    }

    if (filters.status) {
      sql += ` AND m.status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY m.due_date ASC`;

    const countSql = `SELECT COUNT(*) as count FROM (${sql}) as sub`;
    const totalResult = await Milestone.query(countSql, params);

    sql += ` LIMIT ? OFFSET ?`;
    const rows = await Milestone.query(sql, [...params, pagination.limit, pagination.offset]);

    return {
      rows,
      total: totalResult[0].count
    };
  }

  static async getDashboard() {
    const rows = await Milestone.query(`SELECT status, COUNT(*) as c FROM milestones GROUP BY status`);
    const map = {};
    rows.forEach(r => { map[r.status] = r.c; });

    const total = rows.reduce((s, r) => s + r.c, 0);
    const completed = map['Completed'] || 0;
    const inProgress = map['In Progress'] || 0;
    const delayed = map['Delayed'] || 0;
    const upcoming = map['Upcoming'] || 0;

    const pieData = [];
    if (completed > 0) pieData.push({ name: 'Completed', value: completed, percent: total ? ((completed / total) * 100).toFixed(1) + '%' : '0%', color: '#10B981' });
    if (inProgress > 0) pieData.push({ name: 'In Progress', value: inProgress, percent: total ? ((inProgress / total) * 100).toFixed(1) + '%' : '0%', color: '#2563EB' });
    if (delayed > 0) pieData.push({ name: 'Delayed', value: delayed, percent: total ? ((delayed / total) * 100).toFixed(1) + '%' : '0%', color: '#EF4444' });
    if (upcoming > 0) pieData.push({ name: 'Upcoming', value: upcoming, percent: total ? ((upcoming / total) * 100).toFixed(1) + '%' : '0%', color: '#6B7280' });

    const upcomingList = await Milestone.query(`
      ${this.baseSql()}
      WHERE m.status != 'Completed' AND m.due_date >= CURDATE()
      ORDER BY m.due_date ASC
      LIMIT 5
    `);

    return {
      totalMilestones: total,
      completed,
      inProgress,
      delayed,
      upcoming,
      pieData,
      upcomingList
    };
  }
}

module.exports = MilestoneService;