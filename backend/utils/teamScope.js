const db = require('../config/database');

/**
 * Resolves Team Leader & Team Member scope for the authenticated user based on database relationships.
 * 
 * Business Rules:
 * 1. team.team_lead_id determines WHO IS THE TEAM LEADER of the managed team.
 * 2. employee.manager_id / reportsTo determines WHO the employee reports to as a manager.
 * 3. A Team Leader's team shows the team where team.team_lead_id = employee.id.
 * 4. Team Members are employees matching team_id AND department_id, excluding the Team Leader.
 */
function getTeamScope(req, callback) {
  let reqEmpId = req.headers['x-employee-id'] || (req.user && (req.user.employee_id || req.user.id));
  let reqUserEmail = (req.user && req.user.email) || null;

  if (typeof reqEmpId === 'string' && !isNaN(parseInt(reqEmpId))) {
    reqEmpId = parseInt(reqEmpId);
  }

  if (!reqEmpId && !reqUserEmail) {
    return callback(null, {
      noTeamAssigned: true,
      message: "No authenticated user context found",
      team: null,
      teamLeader: null,
      members: [],
      memberIds: [],
      memberCount: 0
    });
  }

  // Step 1: Resolve authenticated employee record (handling userId vs employeeId & email link)
  const sqlEmp = `
    SELECT e.id, e.name, e.email, e.phone, e.status, e.join_date, e.department_id, e.team_id, e.designation_id, e.manager_id,
           dept.dept_name, desg.role_name, e.profile_photo
    FROM employees e
    LEFT JOIN users u ON (u.employee_id = e.id OR u.email = e.email)
    LEFT JOIN departments dept ON e.department_id = dept.id
    LEFT JOIN designations desg ON e.designation_id = desg.id
    WHERE e.id = ? OR u.id = ? OR u.employee_id = ? OR e.email = ?
    ORDER BY (e.id = ?) DESC
    LIMIT 1
  `;

  db.query(sqlEmp, [reqEmpId || 0, reqEmpId || 0, reqEmpId || 0, reqUserEmail || '', reqEmpId || 0], (errEmp, empRows) => {
    if (errEmp || !empRows || empRows.length === 0) {
      return callback(null, {
        noTeamAssigned: true,
        message: "Employee record not found",
        team: null,
        teamLeader: null,
        members: [],
        memberIds: [],
        memberCount: 0
      });
    }

    const currentEmp = empRows[0];
    const actualEmpId = currentEmp.id;

    // Step 2: Get Team record where team_lead_id = actualEmpId OR team.id = currentEmp.team_id
    const sqlTeam = `
      SELECT t.id, t.name as team_name, t.department_id, t.team_lead_id,
             dept.dept_name
      FROM teams t
      LEFT JOIN departments dept ON t.department_id = dept.id
      WHERE t.team_lead_id = ? OR t.id = ?
      ORDER BY (t.team_lead_id = ?) DESC
      LIMIT 1
    `;

    db.query(sqlTeam, [actualEmpId, currentEmp.team_id || 0, actualEmpId], (errTeam, teamRows) => {
      const teamRecord = (teamRows && teamRows.length > 0) ? teamRows[0] : null;

      if (!teamRecord && !currentEmp.team_id) {
        return callback(null, {
          noTeamAssigned: true,
          message: "No team assigned. Please contact HR/Admin to assign you to a team.",
          team: null,
          teamLeader: null,
          members: [],
          memberIds: [],
          memberCount: 0
        });
      }

      const activeTeamId = teamRecord ? teamRecord.id : currentEmp.team_id;
      const activeDeptId = (teamRecord && teamRecord.department_id) ? teamRecord.department_id : currentEmp.department_id;
      const teamLeaderId = teamRecord ? teamRecord.team_lead_id : actualEmpId;
      const teamName = teamRecord ? teamRecord.team_name : (currentEmp.dept_name ? `${currentEmp.dept_name} Team` : 'Assigned Team');
      const deptName = (teamRecord && teamRecord.dept_name) ? teamRecord.dept_name : (currentEmp.dept_name || 'Software Development');

      // Step 3: Get Team Leader Object from teamLeaderId
      const fetchTeamLeader = (cb) => {
        const targetLeaderId = teamLeaderId || actualEmpId;

        const sqlLeader = `
          SELECT e.id, e.name, e.email, e.phone, e.status, e.profile_photo,
                 dept.dept_name, desg.role_name
          FROM employees e
          LEFT JOIN departments dept ON e.department_id = dept.id
          LEFT JOIN designations desg ON e.designation_id = desg.id
          WHERE e.id = ?
          LIMIT 1
        `;

        db.query(sqlLeader, [targetLeaderId], (errL, leaderRows) => {
          if (errL || !leaderRows || leaderRows.length === 0) return cb(null, null);
          const l = leaderRows[0];
          cb(null, {
            id: l.id,
            employeeId: `EMP${String(l.id).padStart(4, '0')}`,
            name: l.name,
            email: l.email,
            phone: l.phone,
            status: l.status,
            designation: l.role_name || 'Team Leader',
            department: l.dept_name || deptName,
            profile_photo: l.profile_photo
          });
        });
      };

      fetchTeamLeader((errTL, teamLeaderObj) => {
        const leaderIdToExclude = teamLeaderObj ? teamLeaderObj.id : actualEmpId;

        // Step 4: Get Team Members matching teamId AND departmentId, excluding teamLeaderId
        const sqlMembers = `
          SELECT e.id, e.name, e.email, e.phone, e.status, e.join_date,
                 dept.dept_name, desg.role_name, e.profile_photo
          FROM employees e
          LEFT JOIN departments dept ON e.department_id = dept.id
          LEFT JOIN designations desg ON e.designation_id = desg.id
          WHERE e.team_id = ?
            AND e.department_id = ?
            AND e.id != ?
          ORDER BY e.name ASC
        `;

        db.query(sqlMembers, [activeTeamId, activeDeptId, leaderIdToExclude], (errM, memberRows) => {
          const membersList = (memberRows || []).map(m => ({
            id: m.id,
            employeeId: `EMP${String(m.id).padStart(4, '0')}`,
            name: m.name,
            email: m.email,
            phone: m.phone,
            status: m.status,
            join_date: m.join_date,
            designation: m.role_name || 'Team Member',
            department: m.dept_name || deptName,
            profile_photo: m.profile_photo
          }));

          const memberIds = membersList.map(m => m.id);

          callback(null, {
            noTeamAssigned: false,
            team: {
              id: activeTeamId,
              name: teamName,
              department: deptName
            },
            teamLeader: teamLeaderObj,
            members: membersList,
            memberIds: memberIds,
            memberCount: membersList.length
          });
        });
      });
    });
  });
}

module.exports = {
  getTeamScope
};
