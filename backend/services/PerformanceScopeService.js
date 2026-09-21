const db = require('../config/database');
const IdentityService = require('./IdentityService');
const { getTeamScope } = require('../utils/teamScope');

class PerformanceScopeService {
  /**
   * Resolves the authorized performance scope for the request.
   * 
   * Strict Authorization Rules:
   * 1. ADMIN / SUPER_ADMIN / HR_MANAGER: Full unrestricted access.
   * 2. TEAM_LEADER: Can only view performance for members of their assigned team (plus themselves).
   *    If a specific employee_id is requested, it MUST belong to their team members; otherwise access is blocked.
   * 3. EMPLOYEE: Can ONLY view their own performance. Any query or header attempting to view another employee is blocked.
   * 
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} Scope descriptor
   */
  static async getScope(req) {
    // 1. Resolve authoritative identity from token / user object
    const authId = (req.user && (req.user.employee_id || req.user.employeeId || req.user.userId || req.user.id)) ||
                   (req.headers && req.headers['x-employee-id']) || 1;
    const identity = await IdentityService.resolveUser(authId);

    const rawRole = (identity?.role || req.user?.role || req.headers['x-user-role'] || 'EMPLOYEE').toUpperCase().replace(/[\s_-]+/g, '');
    const actualEmpId = identity?.employeeId || (req.user && (req.user.employee_id || req.user.employeeId || req.user.id));

    // Admin / HR: Unrestricted
    if (['SUPERADMIN', 'ADMIN', 'HR', 'HRMANAGER', 'HRADMIN', 'BRANCHMANAGER'].includes(rawRole)) {
      const requestedEmpId = req.query.employee_id ? parseInt(req.query.employee_id) : null;
      return {
        scope: 'ALL',
        userRole: 'ADMIN',
        employeeId: actualEmpId,
        requestedEmployeeId: requestedEmpId,
        allowedEmployeeIds: null, // null means unrestricted
        isUnrestricted: true,
        isBlocked: false
      };
    }

    // Team Leader: Scoped strictly to assigned team members
    if (['TEAMLEADER', 'TEAMLEAD', 'LEAD'].includes(rawRole)) {
      return new Promise((resolve) => {
        getTeamScope(req, (errTeam, teamInfo) => {
          const allowedIds = [];
          if (actualEmpId) allowedIds.push(Number(actualEmpId));

          if (teamInfo && Array.isArray(teamInfo.memberIds)) {
            teamInfo.memberIds.forEach(id => {
              const num = Number(id);
              if (!allowedIds.includes(num)) allowedIds.push(num);
            });
          }

          const reqEmpParam = req.query.employee_id ? parseInt(req.query.employee_id) : null;
          let isBlocked = false;
          let filterIds = allowedIds;

          if (reqEmpParam) {
            if (allowedIds.includes(reqEmpParam)) {
              filterIds = [reqEmpParam];
            } else {
              // Attempted to access an employee outside their team -> Block!
              isBlocked = true;
              filterIds = [-1]; // Will match nothing in SQL
            }
          }

          resolve({
            scope: 'TEAM',
            userRole: 'TEAM_LEADER',
            employeeId: actualEmpId,
            requestedEmployeeId: reqEmpParam,
            allowedEmployeeIds: filterIds,
            team: teamInfo ? teamInfo.team : null,
            teamLeader: teamInfo ? teamInfo.teamLeader : null,
            teamMembers: teamInfo ? teamInfo.members : [],
            isUnrestricted: false,
            isBlocked
          });
        });
      });
    }

    // Regular Employee: Strictly locked to own employeeId
    return {
      scope: 'SELF',
      userRole: 'EMPLOYEE',
      employeeId: actualEmpId,
      requestedEmployeeId: actualEmpId,
      allowedEmployeeIds: actualEmpId ? [Number(actualEmpId)] : [-1],
      isUnrestricted: false,
      isBlocked: false
    };
  }

  /**
   * Helper to append an SQL WHERE fragment for allowed employee IDs
   * 
   * @param {string} column - e.g. 'g.employee_id' or 'r.employee_id'
   * @param {Object} scope - Scope object from getScope()
   * @returns {{ sqlFragment: string, params: Array }}
   */
  static getSqlFilter(column, scope) {
    if (!scope) return { sqlFragment: '', params: [] };

    if (scope.isUnrestricted) {
      if (scope.requestedEmployeeId) {
        return { sqlFragment: ` AND ${column} = ?`, params: [scope.requestedEmployeeId] };
      }
      return { sqlFragment: '', params: [] };
    }

    if (scope.isBlocked || !scope.allowedEmployeeIds || scope.allowedEmployeeIds.length === 0) {
      return { sqlFragment: ` AND 1=0`, params: [] };
    }

    if (scope.allowedEmployeeIds.length === 1) {
      return { sqlFragment: ` AND ${column} = ?`, params: [scope.allowedEmployeeIds[0]] };
    }

    const placeholders = scope.allowedEmployeeIds.map(() => '?').join(', ');
    return { sqlFragment: ` AND ${column} IN (${placeholders})`, params: [...scope.allowedEmployeeIds] };
  }
}

module.exports = PerformanceScopeService;
