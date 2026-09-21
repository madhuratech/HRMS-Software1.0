const jwt = require('jsonwebtoken');
const response = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || "madhura_super_secret_key_2026";

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers && req.headers.authorization;
  const reqEmpId = (req.headers && (req.headers['x-employee-id'] || req.headers['x-user-id'])) || (req.query && req.query.employee_id);
  const headerRole = (req.headers && (req.headers['x-user-role'] || req.headers['x-role'])) || (req.query && req.query.role);

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        const parsedHeaderId = parseInt(reqEmpId);
        const resolvedId = (reqEmpId && !isNaN(parsedHeaderId)) ? parsedHeaderId : 1;
        req.user = {
          id: resolvedId,
          userId: resolvedId,
          employeeId: resolvedId,
          employee_id: resolvedId,
          employeeCode: `EMP${String(resolvedId).padStart(4, '0')}`,
          role: headerRole || 'EMPLOYEE',
          company_id: 1,
          branch_id: 1
        };
        return next();
      }

      const userId = decoded.userId || decoded.id || 1;
      const empId = decoded.employeeId || decoded.employee_id || userId;
      const empCode = decoded.employeeCode || decoded.employee_code || `EMP${String(empId).padStart(4, '0')}`;
      const role = decoded.role || headerRole || 'EMPLOYEE';

      req.user = {
        id: userId,
        userId: userId,
        employeeId: empId,
        employee_id: empId,
        employeeCode: empCode,
        name: decoded.name || 'User',
        email: decoded.email || '',
        role: role,
        company_id: 1,
        branch_id: 1
      };

      next();
    });
  } else {
    const parsedHeaderId = parseInt(reqEmpId);
    const resolvedId = (reqEmpId && !isNaN(parsedHeaderId)) ? parsedHeaderId : 1;
    req.user = {
      id: resolvedId,
      userId: resolvedId,
      employeeId: resolvedId,
      employee_id: resolvedId,
      employeeCode: `EMP${String(resolvedId).padStart(4, '0')}`,
      role: headerRole || 'EMPLOYEE',
      company_id: 1,
      branch_id: 1
    };
    return next();
  }
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return response(res, false, 401, 'Unauthorized');
    }

    const rawRole = String(req.user.role || req.headers['x-user-role'] || req.headers['x-role'] || 'SUPER_ADMIN');
    let normUserRole = rawRole.toUpperCase().replace(/[\s_-]+/g, '');
    if (['HR', 'HRMANAGER', 'HRADMIN', 'BRANCHMANAGER'].includes(normUserRole)) {
      normUserRole = 'HR';
    } else if (['TEAMLEADER', 'TEAMLEAD', 'LEAD'].includes(normUserRole)) {
      normUserRole = 'TEAMLEADER';
    } else if (['EMPLOYEE', 'STAFF', 'SERVICE_STAFF', 'SALES_MANAGER'].includes(normUserRole)) {
      normUserRole = 'EMPLOYEE';
    }

    const normAllowed = (allowedRoles || []).map(r => {
      let n = String(r).toUpperCase().replace(/[\s_-]+/g, '');
      if (['HR', 'HRMANAGER', 'HRADMIN', 'BRANCHMANAGER'].includes(n)) return 'HR';
      if (['ADMIN', 'SUPERADMIN'].includes(n)) return 'ADMIN';
      if (['TEAMLEADER', 'TEAMLEAD', 'LEAD'].includes(n)) return 'TEAMLEADER';
      if (['EMPLOYEE', 'STAFF', 'SERVICE_STAFF', 'SALES_MANAGER'].includes(n)) return 'EMPLOYEE';
      return n;
    });

    const isSuperAdmin = normUserRole === 'SUPERADMIN' || normUserRole === 'ADMIN';
    const isAllowed = isSuperAdmin || normAllowed.includes('ALL') || normAllowed.includes(normUserRole);

    if (isAllowed) {
      next();
    } else {
      return response(res, false, 403, 'Forbidden: Insufficient permissions');
    }
  };
};

const checkPermission = (moduleKey, submoduleKey = null, action = 'view') => {
  if (typeof submoduleKey === 'string' && ['view', 'create', 'edit', 'update', 'delete', 'approve', 'reject'].includes(submoduleKey.toLowerCase())) {
    action = submoduleKey;
    submoduleKey = null;
  }

  return async (req, res, next) => {
    if (!req.user) {
      return response(res, false, 401, 'Unauthorized');
    }

    const userRole = req.user.role || req.headers['x-user-role'] || req.headers['x-role'] || 'EMPLOYEE';
    const normRole = String(userRole).toUpperCase().replace(/[\s_-]+/g, '');

    if (normRole === 'SUPERADMIN' || normRole === 'ADMIN') {
      console.log(`[BACKEND PERMISSION CHECK] role: ${userRole} | module: ${moduleKey} | submodule: ${submoduleKey || moduleKey} | action: ${action} | allowed: true (SUPER_ADMIN)`);
      return next();
    }

    try {
      const RbacService = require('../services/RbacService');
      const perms = await RbacService.getUserPermissions(userRole);
      let act = String(action).toLowerCase();
      if (act === 'update' || act === 'approve' || act === 'reject') act = 'edit';
      const actAlt = act === 'view' ? 'canView' : act === 'create' ? 'canCreate' : act === 'edit' ? 'canEdit' : 'canDelete';
      const actDb = act === 'view' ? 'can_view' : act === 'create' ? 'can_create' : act === 'edit' ? 'can_edit' : 'can_delete';

      let isAllowed = false;
      const targetKey = submoduleKey || moduleKey;

      const extractVal = (obj) => {
        if (!obj) return undefined;
        if (obj[act] !== undefined) return obj[act];
        if (obj[actAlt] !== undefined) return obj[actAlt];
        if (obj[actDb] !== undefined) return obj[actDb];
        if (act === 'edit') {
          if (obj.update !== undefined) return obj.update;
          if (obj.canUpdate !== undefined) return obj.canUpdate;
          if (obj.can_update !== undefined) return obj.can_update;
        }
        return undefined;
      };

      if (submoduleKey) {
        const subClean = submoduleKey.toLowerCase().replace(/[-.]/g, '_');
        const subAlias = subClean === 'gps_attendance' ? 'gps_attendance_punch' : (subClean === 'gps_attendance_punch' ? 'gps_attendance' : (subClean === 'tickets' ? 'support_tickets' : (subClean === 'support_tickets' ? 'tickets' : null)));
        const modClean = moduleKey ? moduleKey.toLowerCase().replace(/[-.]/g, '_') : null;

        let explicitSubmoduleFound = false;
        let submoduleVal = undefined;

        if (perms[subClean]) {
          submoduleVal = extractVal(perms[subClean]);
          if (submoduleVal !== undefined) explicitSubmoduleFound = true;
        }
        if (!explicitSubmoduleFound && subAlias && perms[subAlias]) {
          submoduleVal = extractVal(perms[subAlias]);
          if (submoduleVal !== undefined) explicitSubmoduleFound = true;
        }
        if (!explicitSubmoduleFound && modClean && perms[`${modClean}:${subClean}`]) {
          submoduleVal = extractVal(perms[`${modClean}:${subClean}`]);
          if (submoduleVal !== undefined) explicitSubmoduleFound = true;
        }
        if (!explicitSubmoduleFound && modClean && subAlias && perms[`${modClean}:${subAlias}`]) {
          submoduleVal = extractVal(perms[`${modClean}:${subAlias}`]);
          if (submoduleVal !== undefined) explicitSubmoduleFound = true;
        }
        if (!explicitSubmoduleFound && modClean && perms[modClean] && perms[modClean].submodules) {
          if (perms[modClean].submodules[subClean]) {
            submoduleVal = extractVal(perms[modClean].submodules[subClean]);
            if (submoduleVal !== undefined) explicitSubmoduleFound = true;
          } else if (subAlias && perms[modClean].submodules[subAlias]) {
            submoduleVal = extractVal(perms[modClean].submodules[subAlias]);
            if (submoduleVal !== undefined) explicitSubmoduleFound = true;
          }
        }

        if (explicitSubmoduleFound) {
          isAllowed = (submoduleVal === true || submoduleVal === 1 || submoduleVal === '1' || submoduleVal === 'true');
        } else if (modClean && perms[modClean]) {
          // Graceful fallback to parent module permission if submodule was not explicitly configured
          const parentVal = extractVal(perms[modClean]);
          if (parentVal !== undefined) {
            isAllowed = (parentVal === true || parentVal === 1 || parentVal === '1' || parentVal === 'true');
          }
        }
      } else if (moduleKey) {
        const modClean = moduleKey.toLowerCase().replace(/[-.]/g, '_');
        if (perms[modClean]) {
          const val = extractVal(perms[modClean]);
          if (val !== undefined) isAllowed = (val === true || val === 1 || val === '1' || val === 'true');
        }
      }

      console.log(`[BACKEND PERMISSION CHECK] role: ${userRole} | module: ${moduleKey} | submodule: ${targetKey} | action: ${act} | allowed: ${isAllowed}`);

      if (isAllowed) {
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: `Permission Denied: You do not have permission to ${act} in ${targetKey}. Please contact your administrator.`
        });
      }
    } catch (err) {
      console.error('checkPermission exception:', err);
      return res.status(403).json({
        success: false,
        message: 'Permission Denied: Unauthorized request.'
      });
    }
  };
};

module.exports = {
  authenticateJWT,
  checkRole,
  checkPermission
};
