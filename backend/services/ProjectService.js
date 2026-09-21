const Project = require('../models/Project');

class ProjectService {
  static generateCode() {
    return 'PRJ-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);
  }

  static parseBudget(budget) {
    if (budget === undefined || budget === null || budget === '') return null;
    const cleaned = String(budget).replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  static parseTeamMembers(teamMembers) {
    if (Array.isArray(teamMembers)) {
      return teamMembers.map(Number).filter(n => !isNaN(n));
    }
    if (typeof teamMembers === 'string' && teamMembers.trim() !== '') {
      return teamMembers.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    }
    return [];
  }

  static async create(data, userId) {
    const code = data.project_code || this.generateCode();
    const sql = `
      INSERT INTO projects (
        project_name, project_code, client, project_manager_id, start_date, end_date,
        budget, priority, status, description, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.project_name.trim(), code, data.client || null, data.project_manager_id,
      data.start_date || null, data.end_date || null,
      this.parseBudget(data.budget), data.priority || 'Medium', data.status || 'In Progress',
      data.description || null, userId, userId
    ];

    const result = await Project.query(sql, params);
    const projectId = result.insertId;

    const teamMembers = this.parseTeamMembers(data.team_members);
    for (const employeeId of teamMembers) {
      await Project.query(
        `INSERT INTO project_team_members (project_id, employee_id, role, status, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)`,
        [projectId, employeeId, 'Team Member', 'Active', userId, userId]
      );
    }

    return { id: projectId, project_code: code };
  }

  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Project not found');

    const sql = `
      UPDATE projects SET
        project_name = ?, project_code = ?, client = ?, project_manager_id = ?,
        start_date = ?, end_date = ?, budget = ?, priority = ?, status = ?,
        description = ?, updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.project_name.trim(), data.project_code || existing.project_code, data.client || null,
      data.project_manager_id, data.start_date || null, data.end_date || null,
      this.parseBudget(data.budget), data.priority || 'Medium', data.status || 'In Progress',
      data.description || null, userId, id
    ];

    await Project.query(sql, params);

    if (data.team_members !== undefined && data.team_members !== null) {
      await Project.query(`DELETE FROM project_team_members WHERE project_id = ?`, [id]);
      const teamMembers = this.parseTeamMembers(data.team_members);
      for (const employeeId of teamMembers) {
        await Project.query(
          `INSERT INTO project_team_members (project_id, employee_id, role, status, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, employeeId, 'Team Member', 'Active', userId, userId]
        );
      }
    }

    return true;
  }

  static async delete(id) {
    await Project.query(`DELETE FROM project_team_members WHERE project_id = ?`, [id]);
    await Project.query(`DELETE FROM tasks WHERE project_id = ?`, [id]);
    await Project.query(`DELETE FROM timesheets WHERE project_id = ?`, [id]);
    await Project.query(`DELETE FROM milestones WHERE project_id = ?`, [id]);
    await Project.query(`DELETE FROM sprints WHERE project_id = ?`, [id]);
    const result = await Project.query(`DELETE FROM projects WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  static getByIdSql() {
    return `
      SELECT p.*,
             e.name as project_manager_name,
             d.dept_name as department_name,
             b.branch_name as branch_name,
             des.role_name as designation_name,
             (SELECT IFNULL(ROUND(COUNT(CASE WHEN t.status IN ('Completed','Done') THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 0)
                FROM tasks t WHERE t.project_id = p.id) as pct
      FROM projects p
      LEFT JOIN employees e ON p.project_manager_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN designations des ON e.designation_id = des.id
    `;
  }

  static async getById(id) {
    const rows = await Project.query(`${this.getByIdSql()} WHERE p.id = ?`, [id]);
    const project = rows[0] || null;
    if (project) {
      const teamRows = await Project.query(
        `SELECT ptm.employee_id, e.name as employee_name, d.dept_name as department_name
         FROM project_team_members ptm
         LEFT JOIN employees e ON ptm.employee_id = e.id
         LEFT JOIN departments d ON e.department_id = d.id
         WHERE ptm.project_id = ?`,
        [id]
      );
      project.team_members = teamRows;
    }
    return project;
  }

  static async list(filters, pagination) {
    let sql = `${this.getByIdSql()} WHERE 1=1`;
    const params = [];

    if (filters.search) {
      sql += ` AND (p.project_name LIKE ? OR p.project_code LIKE ? OR p.client LIKE ? OR e.name LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    if (filters.status) {
      const allowed = ['Not Started', 'Planning', 'In Progress', 'On Hold', 'Overdue', 'Completed'];
      const mapped = allowed.includes(filters.status) ? filters.status : filters.status;
      sql += ` AND (p.status = ? OR (p.end_date < CURDATE() AND p.status NOT IN ('Completed') AND ? = 'Overdue'))`;
      params.push(mapped, filters.status);
    }

    if (filters.priority) {
      sql += ` AND p.priority = ?`;
      params.push(filters.priority);
    }

    if (filters.department_id) {
      sql += ` AND e.department_id = ?`;
      params.push(filters.department_id);
    }

    if (filters.branch_id) {
      sql += ` AND e.branch_id = ?`;
      params.push(filters.branch_id);
    }

    if (filters.company_id) {
      sql += ` AND 1=1`;
    }

    if (filters.employee_id) {
      sql += ` AND (p.project_manager_id = ? OR EXISTS (SELECT 1 FROM project_team_members ptm WHERE ptm.project_id = p.id AND ptm.employee_id = ?))`;
      params.push(filters.employee_id, filters.employee_id);
    }

    if (filters.start_date) {
      sql += ` AND p.start_date >= ?`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      sql += ` AND p.end_date <= ?`;
      params.push(filters.end_date);
    }

    const sortFieldMap = {
      'newest': 'p.created_at DESC',
      'oldest': 'p.created_at ASC',
      'project_name': 'p.project_name ASC',
      'status': 'p.status ASC',
      'priority': 'p.priority DESC',
      'start_date': 'p.start_date ASC',
      'end_date': 'p.end_date ASC'
    };
    const order = sortFieldMap[filters.sortBy] || 'p.created_at DESC';
    sql += ` ORDER BY ${order}`;

    const countSql = `SELECT COUNT(*) as count FROM (${sql}) as sub`;
    const totalResult = await Project.query(countSql, params);

    sql += ` LIMIT ? OFFSET ?`;
    const rowsParams = [...params, pagination.limit, pagination.offset];
    const rows = await Project.query(sql, rowsParams);
    const mapped = rows.map(r => ({ ...r, pct: r.pct ? parseInt(r.pct) : 0 }));

    return {
      rows: mapped,
      total: totalResult[0].count
    };
  }

  static async getMeta(scopeData = null) {
    let empWhere = '';
    let empParams = [];
    if (scopeData && !scopeData.isUnrestricted && Array.isArray(scopeData.allowedEmployeeIds)) {
      if (scopeData.allowedEmployeeIds.length === 0) {
        empWhere = ' WHERE 1 = 0 ';
      } else {
        empWhere = ' WHERE e.id IN (?) ';
        empParams = [scopeData.allowedEmployeeIds];
      }
    }

    const employees = await Project.query(`
      SELECT e.id, e.name, e.department_id, e.branch_id, e.designation_id, e.team_id,
             d.dept_name as department_name,
             b.branch_name as branch_name,
             des.role_name as designation_name,
             r.role_key, r.role_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN designations des ON e.designation_id = des.id
      LEFT JOIN roles r ON e.role_id = r.id
      ${empWhere}
      ORDER BY e.name
    `, empParams);
    const departments = await Project.query(`SELECT id, dept_name as name FROM departments ORDER BY dept_name`);
    const branches = await Project.query(`SELECT id, branch_name as name FROM branches ORDER BY branch_name`);
    const designations = await Project.query(`SELECT id, role_name as name FROM designations ORDER BY role_name`);
    const companies = await Project.query(`SELECT id, company_name as name FROM company_profile`);
    const projects = await Project.query(`SELECT id, project_name as name, project_code FROM projects ORDER BY project_name`);
    const statuses = ['Not Started', 'Planning', 'In Progress', 'On Hold', 'Overdue', 'Completed'];
    const priorities = ['High', 'Medium', 'Low'];

    return {
      employees,
      departments,
      branches,
      designations,
      companies,
      projects,
      statuses,
      priorities
    };
  }

  static async getDashboard() {
    const q = (sql, params = []) => Project.query(sql, params);

    const totalProjects = (await q(`SELECT COUNT(*) as c FROM projects`))[0].c;
    const statusRows = await q(`SELECT status, COUNT(*) as c FROM projects GROUP BY status`);
    const statusMap = {};
    statusRows.forEach(r => { statusMap[r.status] = r.c; });

    const inProgress = statusMap['In Progress'] || 0;
    const completed = statusMap['Completed'] || 0;
    const onHold = statusMap['On Hold'] || 0;
    const notStarted = (statusMap['Not Started'] || 0) + (statusMap['Planning'] || 0);
    const delayed = (await q(`SELECT COUNT(*) as c FROM projects WHERE end_date < CURDATE() AND status NOT IN ('Completed')`))[0].c;

    const totalTasks = (await q(`SELECT COUNT(*) as c FROM tasks`))[0].c;
    const taskStatusRows = await q(`SELECT status, COUNT(*) as c FROM tasks GROUP BY status`);
    const taskMap = {};
    taskStatusRows.forEach(r => { taskMap[r.status] = r.c; });
    const completedTasks = (taskMap['Completed'] || 0) + (taskMap['Done'] || 0);
    const todoTasks = (taskMap['To Do'] || 0) + (taskMap['Backlog'] || 0);
    const inProgressTasks = taskMap['In Progress'] || 0;
    const reviewTasks = (taskMap['Review'] || 0) + (taskMap['Testing'] || 0);

    const teamMembers = (await q(`SELECT COUNT(DISTINCT employee_id) as c FROM project_team_members`))[0].c;

    const activeSprints = (await q(`SELECT COUNT(*) as c FROM sprints WHERE status = 'Active'`))[0].c;
    const completedSprints = (await q(`SELECT COUNT(*) as c FROM sprints WHERE status = 'Completed'`))[0].c;
    const totalSprints = (await q(`SELECT COUNT(*) as c FROM sprints`))[0].c;
    const sprintProgress = totalSprints > 0 ? Math.round((completedSprints / totalSprints) * 100) : 0;

    const timesheetRows = await q(`SELECT billable, status, COALESCE(SUM(hours),0) as total FROM timesheets GROUP BY billable, status`);
    let totalHours = 0, billableHours = 0, nonBillableHours = 0, pendingTimesheets = 0;
    timesheetRows.forEach(r => {
      const h = parseFloat(r.total) || 0;
      totalHours += h;
      if (r.billable === 'Billable') billableHours += h;
      if (r.billable === 'Non-Billable') nonBillableHours += h;
      if (r.status === 'Pending') pendingTimesheets += h;
    });

    const milestoneRows = await q(`SELECT status, COUNT(*) as c FROM milestones GROUP BY status`);
    const milestoneMap = {};
    milestoneRows.forEach(r => { milestoneMap[r.status] = r.c; });
    const totalMilestones = milestoneRows.reduce((s, r) => s + r.c, 0);

    const statusPie = statusRows.map(r => ({
      name: r.status,
      value: r.c,
      color: this.statusColor(r.status)
    }));

    const monthMap = {};
    const trendRows = await q(`
      SELECT MONTH(start_date) as m, YEAR(start_date) as y, status, COUNT(*) as c
      FROM projects WHERE start_date IS NOT NULL
      GROUP BY MONTH(start_date), YEAR(start_date), status
    `);
    trendRows.forEach(r => {
      const key = `${r.y}-${String(r.m).padStart(2, '0')}`;
      if (!monthMap[key]) {
        monthMap[key] = { month: `${r.y}-${String(r.m).padStart(2, '0')}`, InProgress: 0, Completed: 0, Overdue: 0, count: 0 };
      }
      if (r.status === 'In Progress') monthMap[key].InProgress += r.c;
      if (r.status === 'Completed') monthMap[key].Completed += r.c;
      if (r.status === 'Overdue' || (r.status !== 'Completed')) monthMap[key].Overdue += r.c;
      monthMap[key].count += r.c;
    });
    const monthlyTrend = Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map(m => ({ ...m, month: this.monthLabel(m.month) }));

    const topProjects = await q(`
      SELECT p.id, p.project_name as name,
             IFNULL(ROUND(COUNT(CASE WHEN t.status IN ('Completed','Done') THEN 1 END) * 100.0 / NULLIF(COUNT(t.id), 0)), 0) as pct
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      GROUP BY p.id, p.project_name, p.created_at
      ORDER BY pct DESC, p.created_at DESC
      LIMIT 5
    `);
    const topProjectsMapped = topProjects.map(r => ({ id: r.id, name: r.name, pct: r.pct ? parseInt(r.pct) : 0 }));

    const recentProjects = await q(`
      ${this.getByIdSql()}
      ORDER BY p.created_at DESC
      LIMIT 8
    `);
    const recentProjectsMapped = recentProjects.map(r => ({
      id: r.id,
      name: r.project_name,
      code: r.project_code,
      manager: r.project_manager_name,
      department_name: r.department_name,
      start: r.start_date,
      end: r.end_date,
      pct: r.pct ? parseInt(r.pct) : 0,
      status: r.end_date && r.end_date < new Date().toISOString().slice(0, 10) && r.status !== 'Completed' ? 'Overdue' : r.status,
      priority: r.priority
    }));

    return {
      totalProjects,
      inProgress,
      completed,
      onHold,
      notStarted,
      pendingProjects: notStarted,
      delayed,
      totalTasks,
      completedTasks,
      pendingTasks: todoTasks + inProgressTasks,
      todoTasks,
      inProgressTasks,
      reviewTasks,
      teamMembers,
      activeSprints,
      completedSprints,
      totalSprints,
      sprintProgress,
      totalHours,
      billableHours,
      nonBillableHours,
      pendingTimesheets,
      totalMilestones,
      completedMilestones: milestoneMap['Completed'] || 0,
      inProgressMilestones: milestoneMap['In Progress'] || 0,
      delayedMilestones: milestoneMap['Delayed'] || 0,
      upcomingMilestones: milestoneMap['Upcoming'] || 0,
      statusPie,
      monthlyTrend,
      topProjects: topProjectsMapped,
      recentProjects: recentProjectsMapped
    };
  }

  static statusColor(status) {
    switch (status) {
      case 'In Progress': return '#2563EB';
      case 'Completed': return '#10B981';
      case 'On Hold': return '#F59E0B';
      case 'Overdue': return '#EF4444';
      case 'Not Started': return '#6B7280';
      case 'Planning': return '#8B5CF6';
      default: return '#6B7280';
    }
  }

  static monthLabel(ym) {
    const [y, m] = ym.split('-').map(Number);
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return names[m - 1] || ym;
  }
}

module.exports = ProjectService;