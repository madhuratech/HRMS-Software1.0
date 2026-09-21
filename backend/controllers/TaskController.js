const TaskService = require('../services/TaskService');
const DataScopeService = require('../services/DataScopeService');
const response = require('../utils/response');
const getPagination = require('../utils/pagination');

class TaskController {
  static async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      const newTask = await TaskService.create(data, userId);

      if (data.assignee_id) {
        const NotificationService = require('../services/NotificationService');
        NotificationService.triggerTaskAssignment(
          newTask.id,
          data.title,
          data.assignee_id,
          data.due_date
        ).catch(e => console.error("Error triggering task assignment notification:", e));
      }

      return response(res, true, 212, 'Task created successfully', newTask);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to create task', null, err.message);
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      await TaskService.update(req.params.id, data, userId);
      return response(res, true, 200, 'Task updated successfully');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update task', null, err.message);
    }
  }

  static async updateStatus(req, res) {
    try {
      const userId = req.user?.id || 1;
      const { status } = req.body;
      if (!status) {
        return response(res, false, 400, 'Status is required');
      }
      await TaskService.updateStatus(req.params.id, status, userId);
      return response(res, true, 200, 'Task status updated successfully');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update task status', null, err.message);
    }
  }

  static async delete(req, res) {
    try {
      await TaskService.delete(req.params.id);
      return response(res, true, 200, 'Task deleted successfully');
    } catch (err) {
      return response(res, false, 500, 'Failed to delete task', null, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const task = await TaskService.getById(req.params.id);
      if (!task) {
        return response(res, false, 404, 'Task not found');
      }
      return response(res, true, 200, 'Task retrieved successfully', task);
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch task details', null, err.message);
    }
  }

  static async list(req, res) {
    try {
      const scopeData = await DataScopeService.getScope(req);
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || '',
        project_id: req.query.project_id || null,
        status: req.query.status || null,
        priority: req.query.priority || null,
        assignee_id: req.query.assignee_id || null,
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
        sortBy: req.query.sortBy || 'newest',
        scopeData
      };

      const result = await TaskService.list(filters, pagination);
      return response(res, true, 200, 'Tasks list retrieved successfully', {
        tasks: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch tasks list', null, err.message);
    }
  }

  static async getDashboard(req, res) {
    try {
      const scopeData = await DataScopeService.getScope(req);
      const stats = await TaskService.getDashboard(scopeData);
      return response(res, true, 200, 'Task statistics retrieved successfully', stats);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve task stats', null, err.message);
    }
  }
}

module.exports = TaskController;