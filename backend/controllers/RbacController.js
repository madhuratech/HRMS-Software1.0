const response = require('../utils/response');

function getRbacService() {
  try {
    delete require.cache[require.resolve('../services/RbacService')];
  } catch (e) {}
  return require('../services/RbacService');
}

const RbacController = {
  async getModules(req, res) {
    try {
      const RbacService = getRbacService();
      const modules = RbacService.getModules();
      return response(res, true, 200, 'Modules retrieved successfully', modules);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve modules', null, e.message);
    }
  },

  async getRoles(req, res) {
    try {
      const RbacService = getRbacService();
      const roles = await RbacService.getRoles();
      return response(res, true, 200, 'Roles retrieved successfully', roles);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve roles', null, e.message);
    }
  },

  async getRolePermissions(req, res) {
    try {
      const { roleKey } = req.params;
      const RbacService = getRbacService();
      const matrix = await RbacService.getRolePermissions(roleKey);
      return response(res, true, 200, 'Role permissions retrieved successfully', matrix);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve role permissions', null, e.message);
    }
  },

  async createRole(req, res) {
    try {
      const RbacService = getRbacService();
      const result = await RbacService.createRole(req.body);
      return response(res, true, 201, 'Role created successfully', result);
    } catch (e) {
      return response(res, false, 400, e.message || 'Failed to create role', null, e.message);
    }
  },

  async updateRolePermissions(req, res) {
    try {
      const { roleKey } = req.params;
      const { permissions, roleInfo } = req.body;
      const RbacService = getRbacService();
      await RbacService.updateRolePermissions(roleKey, permissions, roleInfo);

      // Notify all users under this role of permission changes
      const db = require('../config/database');
      db.query(
        `SELECT e.id FROM employees e JOIN roles r ON e.role_id = r.id WHERE UPPER(r.role_key) = ?`,
        [(roleKey || '').toUpperCase()],
        (err, rows) => {
          if (!err && rows && rows.length > 0) {
            const NotificationService = require('../services/NotificationService');
            rows.forEach(user => {
              NotificationService.triggerPermissionUpdate(user.id, 'user roles')
                .catch(e => console.error("Error triggering permission update notification:", e));
            });
          }
        }
      );

      return response(res, true, 200, 'Role permissions updated successfully');
    } catch (e) {
      return response(res, false, 500, 'Failed to update role permissions', null, e.message);
    }
  },

  async deleteRole(req, res) {
    try {
      const { roleKey } = req.params;
      const RbacService = getRbacService();
      await RbacService.deleteRole(roleKey);
      return response(res, true, 200, 'Role deleted successfully');
    } catch (e) {
      return response(res, false, 400, e.message || 'Failed to delete role', null, e.message);
    }
  },

  async getUserPermissions(req, res) {
    try {
      const roleNameOrKey = req.query?.role || req.headers['x-user-role'] || req.headers['x-role'] || req.user?.role || 'EMPLOYEE';
      const RbacService = getRbacService();
      const perms = await RbacService.getUserPermissions(roleNameOrKey);
      return res.status(200).json({
        success: true,
        message: 'User permissions retrieved successfully',
        permissions: perms,
        data: perms
      });
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve user permissions', null, e.message);
    }
  }
};

module.exports = RbacController;
