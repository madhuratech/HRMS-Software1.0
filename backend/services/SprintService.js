const Sprint = require('../models/Sprint');

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', statuses: ['Backlog'] },
  { id: 'todo', label: 'To Do', statuses: ['To Do'] },
  { id: 'inprogress', label: 'In Progress', statuses: ['In Progress'] },
  { id: 'testing', label: 'Testing', statuses: ['Testing', 'Review'] },
  { id: 'done', label: 'Done', statuses: ['Done', 'Completed'] }
];

class SprintService {
  static async create(data, userId) {
    const sql = `
      INSERT INTO sprints (name, goal, project_id, start_date, end_date, status, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.name.trim(), data.goal || null, data.project_id || null,
      data.start_date || null, data.end_date || null,
      data.status || 'Planning', userId, userId
    ];
    const result = await Sprint.query(sql, params);
    return { id: result.insertId };
  }

  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Sprint not found');

    const sql = `
      UPDATE sprints SET name = ?, goal = ?, project_id = ?, start_date = ?, end_date = ?,
        status = ?, updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.name.trim(), data.goal || null, data.project_id || null,
      data.start_date || null, data.end_date || null,
      data.status || existing.status, userId, id
    ];
    await Sprint.query(sql, params);
    return true;
  }

  static async updateStatus(id, status, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Sprint not found');
    await Sprint.query(`UPDATE sprints SET status = ?, updated_by = ? WHERE id = ?`, [status, userId, id]);
    return true;
  }

  static async delete(id) {
    const result = await Sprint.query(`DELETE FROM sprints WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  static baseSql() {
    return `
      SELECT s.*, p.project_name as project_name
      FROM sprints s
      LEFT JOIN projects p ON s.project_id = p.id
    `;
  }

  static async getById(id) {
    const rows = await Sprint.query(`${this.baseSql()} WHERE s.id = ?`, [id]);
    return rows[0] || null;
  }

  static async list(filters, pagination) {
    let sql = `${this.baseSql()} WHERE 1=1`;
    const params = [];

    if (filters.search) {
      sql += ` AND (s.name LIKE ? OR p.project_name LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term);
    }

    if (filters.project_id) {
      sql += ` AND s.project_id = ?`;
      params.push(filters.project_id);
    }

    if (filters.status) {
      sql += ` AND s.status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY s.created_at DESC`;

    const countSql = `SELECT COUNT(*) as count FROM (${sql}) as sub`;
    const totalResult = await Sprint.query(countSql, params);

    sql += ` LIMIT ? OFFSET ?`;
    const rows = await Sprint.query(sql, [...params, pagination.limit, pagination.offset]);

    return {
      rows,
      total: totalResult[0].count
    };
  }

  static async getBoard() {
    const active = await Sprint.query(`SELECT * FROM sprints WHERE status = 'Active' ORDER BY created_at DESC LIMIT 1`);
    const sprint = active[0] || null;

    let tasks = [];
    if (sprint) {
      tasks = await Sprint.query(`
        SELECT t.*, p.project_name as project_name, e.name as assignee_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN employees e ON t.assignee_id = e.id
        WHERE t.project_id = ? OR t.project_id IS NULL
        ORDER BY t.created_at DESC
      `, [sprint.project_id || 0]);
    } else {
      tasks = await Sprint.query(`
        SELECT t.*, p.project_name as project_name, e.name as assignee_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN employees e ON t.assignee_id = e.id
        ORDER BY t.created_at DESC
      `);
    }

    const initials = (name) => {
      if (!name) return '';
      return name.split(' ').map(x => x[0]).join('').substring(0, 2).toUpperCase();
    };

    const cardsByColumn = {};
    COLUMNS.forEach(col => { cardsByColumn[col.id] = []; });

    tasks.forEach(t => {
      const column = COLUMNS.find(col => col.statuses.includes(t.status)) || COLUMNS[1];
      cardsByColumn[column.id].push({
        id: t.id,
        title: t.title,
        project: t.project_name || '',
        project_id: t.project_id,
        assignee: t.assignee_name ? initials(t.assignee_name) : '',
        assignee_id: t.assignee_id,
        due: t.due_date ? t.due_date : '',
        priority: t.priority,
        label: t.label || 'Feature',
        status: t.status
      });
    });

    const progress = this.getProgress(sprint, tasks);

    return {
      sprint: sprint ? {
        id: sprint.id,
        name: sprint.name,
        goal: sprint.goal,
        project_id: sprint.project_id,
        project_name: sprint.project_name,
        start_date: sprint.start_date,
        end_date: sprint.end_date,
        status: sprint.status
      } : null,
      columns: COLUMNS.map(col => ({
        ...col,
        count: cardsByColumn[col.id].length
      })),
      cards: cardsByColumn,
      progress
    };
  }

  static getProgress(sprint, tasks) {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
    return {
      total,
      done,
      pending: total - done,
      pct: total > 0 ? Math.round((done / total) * 100) : 0
    };
  }

  static async getDashboard() {
    const total = (await Sprint.query(`SELECT COUNT(*) as c FROM sprints`))[0].c;
    const active = (await Sprint.query(`SELECT COUNT(*) as c FROM sprints WHERE status = 'Active'`))[0].c;
    const completed = (await Sprint.query(`SELECT COUNT(*) as c FROM sprints WHERE status = 'Completed'`))[0].c;
    const planning = (await Sprint.query(`SELECT COUNT(*) as c FROM sprints WHERE status = 'Planning'`))[0].c;
    const board = await this.getBoard();

    return {
      totalSprints: total,
      activeSprints: active,
      completedSprints: completed,
      planningSprints: planning,
      progress: board.progress
    };
  }
}

module.exports = SprintService;