const ProjectTask = require('../models/ProjectTask');

class TaskService {
  static async create(data, userId) {
    const sql = `
      INSERT INTO tasks (
        project_id, title, description, assignee_id, start_date, due_date,
        priority, status, label, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.project_id, data.title.trim(), data.description || null, data.assignee_id,
      data.start_date || null, data.due_date || null,
      data.priority || 'Medium', data.status || 'To Do', data.label || null,
      userId, userId
    ];
    const result = await ProjectTask.query(sql, params);
    return { id: result.insertId };
  }

  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Task not found');

    const sql = `
      UPDATE tasks SET
        project_id = ?, title = ?, description = ?, assignee_id = ?,
        start_date = ?, due_date = ?, priority = ?, status = ?, label = ?,
        updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.project_id, data.title.trim(), data.description || null, data.assignee_id,
      data.start_date || null, data.due_date || null,
      data.priority || 'Medium', data.status || existing.status, data.label || existing.label,
      userId, id
    ];
    await ProjectTask.query(sql, params);
    return true;
  }

  static async updateStatus(id, status, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Task not found');
    await ProjectTask.query(`UPDATE tasks SET status = ?, updated_by = ? WHERE id = ?`, [status, userId, id]);
    return true;
  }

  static async delete(id) {
    const result = await ProjectTask.query(`DELETE FROM tasks WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  static baseSql() {
    return `
      SELECT t.*, p.project_name as project_name,
             e.name as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN employees e ON t.assignee_id = e.id
    `;
  }

  static async getById(id) {
    const rows = await ProjectTask.query(`${this.baseSql()} WHERE t.id = ?`, [id]);
    return rows[0] || null;
  }

  static async list(filters, pagination) {
    let sql = `${this.baseSql()} WHERE 1=1`;
    const params = [];

    if (filters.search) {
      sql += ` AND (t.title LIKE ? OR p.project_name LIKE ? OR e.name LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    if (filters.project_id) {
      sql += ` AND t.project_id = ?`;
      params.push(filters.project_id);
    }

    if (filters.status) {
      sql += ` AND t.status = ?`;
      params.push(filters.status);
    }

    if (filters.priority) {
      sql += ` AND t.priority = ?`;
      params.push(filters.priority);
    }

    if (filters.assignee_id) {
      sql += ` AND t.assignee_id = ?`;
      params.push(filters.assignee_id);
    }

    if (filters.scopeData && !filters.scopeData.isUnrestricted && Array.isArray(filters.scopeData.allowedEmployeeIds)) {
      if (filters.scopeData.allowedEmployeeIds.length === 0) {
        return { rows: [], total: 0 };
      }
      sql += ` AND (t.assignee_id IN (?) OR t.created_by IN (?))`;
      params.push(filters.scopeData.allowedEmployeeIds, filters.scopeData.allowedEmployeeIds);
    }

    if (filters.sprint_id) {
      sql += ` AND 1=1`;
    }

    if (filters.start_date) {
      sql += ` AND t.due_date >= ?`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      sql += ` AND t.due_date <= ?`;
      params.push(filters.end_date);
    }

    const sortFieldMap = {
      'newest': 't.created_at DESC',
      'oldest': 't.created_at ASC',
      'title': 't.title ASC',
      'due_date': 't.due_date ASC',
      'priority': 't.priority DESC',
      'status': 't.status ASC'
    };
    const order = sortFieldMap[filters.sortBy] || 't.created_at DESC';
    sql += ` ORDER BY ${order}`;

    const countSql = `SELECT COUNT(*) as count FROM (${sql}) as sub`;
    const totalResult = await ProjectTask.query(countSql, params);

    sql += ` LIMIT ? OFFSET ?`;
    const rows = await ProjectTask.query(sql, [...params, pagination.limit, pagination.offset]);

    return {
      rows,
      total: totalResult[0].count
    };
  }

  static async getDashboard(scopeData = null) {
    let whereClause = '';
    let params = [];
    if (scopeData && !scopeData.isUnrestricted && Array.isArray(scopeData.allowedEmployeeIds)) {
      if (scopeData.allowedEmployeeIds.length === 0) {
        return { totalTasks: 0, todo: 0, inProgress: 0, review: 0, completed: 0, statusMap: {} };
      }
      whereClause = ' WHERE (assignee_id IN (?) OR created_by IN (?)) ';
      params = [scopeData.allowedEmployeeIds, scopeData.allowedEmployeeIds];
    }

    const rows = await ProjectTask.query(`SELECT status, COUNT(*) as c FROM tasks ${whereClause} GROUP BY status`, params);
    const map = {};
    rows.forEach(r => { map[r.status] = r.c; });

    const total = rows.reduce((s, r) => s + r.c, 0);
    const todo = (map['To Do'] || 0) + (map['Backlog'] || 0);
    const inProgress = map['In Progress'] || 0;
    const review = (map['Review'] || 0) + (map['Testing'] || 0);
    const completed = (map['Completed'] || 0) + (map['Done'] || 0);

    return {
      totalTasks: total,
      todo,
      inProgress,
      review,
      completed,
      statusMap: map
    };
  }
}

module.exports = TaskService;