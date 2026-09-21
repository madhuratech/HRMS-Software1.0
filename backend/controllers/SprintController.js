const SprintService = require('../services/SprintService');
const response = require('../utils/response');
const getPagination = require('../utils/pagination');

class SprintController {
  static async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      const newSprint = await SprintService.create(data, userId);
      return response(res, true, 212, 'Sprint created successfully', newSprint);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to create sprint', null, err.message);
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      await SprintService.update(req.params.id, data, userId);
      return response(res, true, 200, 'Sprint updated successfully');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update sprint', null, err.message);
    }
  }

  static async updateStatus(req, res) {
    try {
      const userId = req.user?.id || 1;
      const { status } = req.body;
      if (!status) {
        return response(res, false, 400, 'Status is required');
      }
      await SprintService.updateStatus(req.params.id, status, userId);
      return response(res, true, 200, 'Sprint status updated successfully');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update sprint status', null, err.message);
    }
  }

  static async delete(req, res) {
    try {
      await SprintService.delete(req.params.id);
      return response(res, true, 200, 'Sprint deleted successfully');
    } catch (err) {
      return response(res, false, 500, 'Failed to delete sprint', null, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const sprint = await SprintService.getById(req.params.id);
      if (!sprint) {
        return response(res, false, 404, 'Sprint not found');
      }
      return response(res, true, 200, 'Sprint retrieved successfully', sprint);
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch sprint details', null, err.message);
    }
  }

  static async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || '',
        project_id: req.query.project_id || null,
        status: req.query.status || null
      };

      const result = await SprintService.list(filters, pagination);
      return response(res, true, 200, 'Sprints list retrieved successfully', {
        sprints: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch sprints list', null, err.message);
    }
  }

  static async getBoard(req, res) {
    try {
      const board = await SprintService.getBoard();
      return response(res, true, 200, 'Sprint board retrieved successfully', board);
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch sprint board', null, err.message);
    }
  }

  static async getDashboard(req, res) {
    try {
      const stats = await SprintService.getDashboard();
      return response(res, true, 200, 'Sprint statistics retrieved successfully', stats);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve sprint stats', null, err.message);
    }
  }
}

module.exports = SprintController;