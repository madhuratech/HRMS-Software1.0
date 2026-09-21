const ProjectService = require('../services/ProjectService');
const DataScopeService = require('../services/DataScopeService');
const response = require('../utils/response');
const getPagination = require('../utils/pagination');

class ProjectController {
  static async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      const newProject = await ProjectService.create(data, userId);
      return response(res, true, 212, 'Project created successfully', newProject);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to create project', null, err.message);
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      await ProjectService.update(req.params.id, data, userId);
      return response(res, true, 200, 'Project updated successfully');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update project', null, err.message);
    }
  }

  static async delete(req, res) {
    try {
      await ProjectService.delete(req.params.id);
      return response(res, true, 200, 'Project deleted successfully');
    } catch (err) {
      return response(res, false, 500, 'Failed to delete project', null, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const project = await ProjectService.getById(req.params.id);
      if (!project) {
        return response(res, false, 404, 'Project not found');
      }
      return response(res, true, 200, 'Project retrieved successfully', project);
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch project details', null, err.message);
    }
  }

  static async list(req, res) {
    try {
      const pagination = getPagination(req);
      const userRole = String(req.user?.role || '').toUpperCase().replace(/_/g, ' ');
      const empId = req.user?.id || req.user?.employee_id;

      const filters = {
        search: req.query.search || '',
        status: req.query.status || null,
        priority: req.query.priority || null,
        department_id: req.query.department_id || null,
        branch_id: req.query.branch_id || null,
        company_id: req.query.company_id || null,
        employee_id: req.query.employee_id || null,
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
        sortBy: req.query.sortBy || 'newest'
      };

      // Data Scoping: Employees and Team Leaders only see assigned projects
      if (userRole === 'EMPLOYEE' || userRole === 'TEAM LEADER') {
        filters.employee_id = empId;
      }

      const result = await ProjectService.list(filters, pagination);
      return response(res, true, 200, 'Projects list retrieved successfully', {
        projects: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch projects list', null, err.message);
    }
  }

  static async meta(req, res) {
    try {
      const scopeData = await DataScopeService.getScope(req);
      const meta = await ProjectService.getMeta(scopeData);
      return response(res, true, 200, 'Project meta data retrieved successfully', meta);
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch meta data', null, err.message);
    }
  }

  static async getDashboard(req, res) {
    try {
      const stats = await ProjectService.getDashboard();
      return response(res, true, 200, 'Dashboard statistics retrieved successfully', stats);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve dashboard stats', null, err.message);
    }
  }
}

module.exports = ProjectController;