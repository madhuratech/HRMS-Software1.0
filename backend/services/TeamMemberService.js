const ProjectTeamMember = require('../models/ProjectTeamMember');

class TeamMemberService {
  static async assign(data, userId) {
    const existing = await ProjectTeamMember.query(
      `SELECT id FROM project_team_members WHERE project_id = ? AND employee_id = ?`,
      [data.project_id, data.employee_id]
    );
    if (existing[0]) {
      throw new Error('Employee is already assigned to this project');
    }

    const result = await ProjectTeamMember.query(
      `INSERT INTO project_team_members (project_id, employee_id, role, status, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.project_id, data.employee_id, data.role || 'Team Member', data.status || 'Active', userId, userId]
    );
    return { id: result.insertId };
  }

  static async update(id, data, userId) {
    const existing = await ProjectTeamMember.query(`SELECT * FROM project_team_members WHERE id = ?`, [id]);
    if (!existing[0]) throw new Error('Team member not found');

    await ProjectTeamMember.query(
      `UPDATE project_team_members SET project_id = ?, employee_id = ?, role = ?, status = ?, updated_by = ?
       WHERE id = ?`,
      [
        data.project_id || existing[0].project_id,
        data.employee_id || existing[0].employee_id,
        data.role || existing[0].role,
        data.status || existing[0].status,
        userId, id
      ]
    );
    return true;
  }

  static async remove(id) {
    const result = await ProjectTeamMember.query(`DELETE FROM project_team_members WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  static async list(scopeData = null) {
    let whereClause = '';
    let params = [];

    if (scopeData && !scopeData.isUnrestricted && Array.isArray(scopeData.allowedEmployeeIds)) {
      if (scopeData.allowedEmployeeIds.length === 0) return [];
      whereClause = ' WHERE ptm.employee_id IN (?) ';
      params = [scopeData.allowedEmployeeIds];
    }

    const rows = await ProjectTeamMember.query(`
      SELECT ptm.id, ptm.project_id, ptm.employee_id, ptm.role, ptm.status,
             e.name as employee_name,
             d.dept_name as department_name,
             des.role_name as designation_name,
             b.branch_name as branch_name,
             COUNT(DISTINCT ptm2.project_id) as assigned_projects,
             (SELECT COUNT(*) FROM tasks t WHERE t.assignee_id = ptm.employee_id AND t.status NOT IN ('Completed','Done')) as open_tasks
      FROM project_team_members ptm
      LEFT JOIN employees e ON ptm.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN project_team_members ptm2 ON ptm2.employee_id = ptm.employee_id
      ${whereClause}
      GROUP BY ptm.id, ptm.project_id, ptm.employee_id, ptm.role, ptm.status, e.name, d.dept_name, des.role_name, b.branch_name
      ORDER BY ptm.employee_id, ptm.created_at DESC
    `, params);

    const aggregated = [];
    const seen = new Set();
    rows.forEach(r => {
      if (!seen.has(r.employee_id)) {
        seen.add(r.employee_id);
        aggregated.push({
          id: r.id,
          employee_id: r.employee_id,
          name: r.employee_name,
          role: r.role,
          department: r.department_name,
          designation: r.designation_name,
          branch: r.branch_name,
          assignedProjects: r.assigned_projects,
          openTasks: r.open_tasks || 0,
          status: r.status,
          project_id: r.project_id
        });
      }
    });

    return aggregated;
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

    const employees = await ProjectTeamMember.query(`
      SELECT e.id, e.name,
             d.dept_name as department_name,
             des.role_name as designation_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      ${empWhere}
      ORDER BY e.name
    `, empParams);
    const projects = await ProjectTeamMember.query(`
      SELECT p.id, p.project_name as name, p.project_code
      FROM projects p ORDER BY p.project_name
    `);
    const roles = ['Project Manager', 'Developer', 'UI/UX Designer', 'QA Engineer', 'Team Member', 'Business Analyst', 'DevOps Engineer'];

    return { employees, projects, roles };
  }
}

module.exports = TeamMemberService;