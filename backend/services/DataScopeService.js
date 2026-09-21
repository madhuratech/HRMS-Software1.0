const db = require('../config/database');
const { getTeamScope } = require('../utils/teamScope');

class DataScopeService {
  /**
   * Resolves the authorized data scope and allowed employee IDs for the authenticated user.
   * 
   * @param {Object} req - Express request object containing req.user
   * @returns {Promise<Object>} Data scope result
   */
  static getScope(req) {
    return new Promise((resolve, reject) => {
      let role = (req.headers && req.headers['x-user-role']) || (req.user && (req.user.role || (req.user.user && req.user.user.role))) || 'EMPLOYEE';
      const normRole = String(role).toUpperCase().replace(/_/g, ' ');

      // 1. Admin & HR Roles: Full Access (Scope: ALL)
      if (
        normRole.includes('SUPER') ||
        normRole === 'SUPER ADMIN' ||
        normRole === 'SUPERADMIN' ||
        normRole === 'ADMIN' ||
        normRole === 'HR MANAGER' ||
        normRole === 'HR' ||
        normRole === 'BRANCH MANAGER' ||
        normRole === 'SALES MANAGER' ||
        normRole === 'MANAGER'
      ) {
        return resolve({
          scope: 'ALL',
          userRole: normRole,
          employeeId: req.user ? (req.user.employee_id || req.user.id) : null,
          allowedEmployeeIds: null, // null means unrestricted
          isUnrestricted: true
        });
      }

      // 2. Resolve Authenticated Employee ID
      let reqEmpId = req.headers['x-employee-id'] || (req.user && (req.user.employee_id || req.user.id));
      const reqEmail = (req.user && req.user.email) || null;

      if (typeof reqEmpId === 'string' && !isNaN(parseInt(reqEmpId))) {
        reqEmpId = parseInt(reqEmpId);
      }

      // Helper to lookup actual employee DB ID
      const findEmpSql = `
        SELECT e.id FROM employees e
        LEFT JOIN users u ON (u.employee_id = e.id OR u.email = e.email)
        WHERE e.id = ? OR u.id = ? OR u.employee_id = ? OR e.email = ?
        ORDER BY (e.id = ?) DESC LIMIT 1
      `;

      db.query(findEmpSql, [reqEmpId || 0, reqEmpId || 0, reqEmpId || 0, reqEmail || '', reqEmpId || 0], (errEmp, empRows) => {
        if (errEmp || !empRows || empRows.length === 0) {
          // Fallback if employee record not found
          const fallbackId = reqEmpId || (req.user && req.user.id) || 0;
          return resolve({
            scope: normRole === 'TEAM LEADER' ? 'TEAM' : 'SELF',
            userRole: normRole,
            employeeId: fallbackId,
            allowedEmployeeIds: fallbackId ? [fallbackId] : [],
            isUnrestricted: false
          });
        }

        const actualEmpId = empRows[0].id;

        // 3. Team Leader Scope (Scope: TEAM)
        if (normRole === 'TEAM LEADER') {
          getTeamScope(req, (errTeam, teamInfo) => {
            let allowedIds = [actualEmpId];
            if (teamInfo && Array.isArray(teamInfo.memberIds)) {
              teamInfo.memberIds.forEach(id => {
                if (!allowedIds.includes(id)) allowedIds.push(id);
              });
            }

            return resolve({
              scope: 'TEAM',
              userRole: normRole,
              employeeId: actualEmpId,
              team: teamInfo ? teamInfo.team : null,
              teamMembers: teamInfo ? teamInfo.members : [],
              allowedEmployeeIds: allowedIds,
              isUnrestricted: false
            });
          });
          return;
        }

        // 4. Regular Employee Scope (Scope: SELF)
        return resolve({
          scope: 'SELF',
          userRole: normRole,
          employeeId: actualEmpId,
          allowedEmployeeIds: [actualEmpId],
          isUnrestricted: false
        });
      });
    });
  }
}

module.exports = DataScopeService;
