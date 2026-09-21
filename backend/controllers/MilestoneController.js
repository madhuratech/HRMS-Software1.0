const MilestoneService = require('../services/MilestoneService');
const response = require('../utils/response');
const getPagination = require('../utils/pagination');

class MilestoneController {
  static async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      const newMilestone = await MilestoneService.create(data, userId);
      return response(res, true, 212, 'Milestone created successfully', newMilestone);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to create milestone', null, err.message);
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      await MilestoneService.update(req.params.id, data, userId);
      return response(res, true, 200, 'Milestone updated successfully');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update milestone', null, err.message);
    }
  }

  static async complete(req, res) {
    try {
      const userId = req.user?.id || 1;
      await MilestoneService.complete(req.params.id, userId);
      return response(res, true, 200, 'Milestone completed successfully');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to complete milestone', null, err.message);
    }
  }

  static async delete(req, res) {
    try {
      await MilestoneService.delete(req.params.id);
      return response(res, true, 200, 'Milestone deleted successfully');
    } catch (err) {
      return response(res, false, 500, 'Failed to delete milestone', null, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const milestone = await MilestoneService.getById(req.params.id);
      if (!milestone) {
        return response(res, false, 404, 'Milestone not found');
      }
      return response(res, true, 200, 'Milestone retrieved successfully', milestone);
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch milestone details', null, err.message);
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

      const result = await MilestoneService.list(filters, pagination);
      return response(res, true, 200, 'Milestones list retrieved successfully', {
        milestones: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch milestones list', null, err.message);
    }
  }

  static async getDashboard(req, res) {
    try {
      const stats = await MilestoneService.getDashboard();
      return response(res, true, 200, 'Milestone statistics retrieved successfully', stats);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve milestone stats', null, err.message);
    }
  }
}

module.exports = MilestoneController;