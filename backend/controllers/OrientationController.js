const OrientationService = require('../services/OrientationService');
const response = require('../utils/response');
const getPagination = require('../utils/pagination');

class OrientationController {
  static async schedule(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      const result = await OrientationService.create(data, userId);
      return response(res, true, 201, 'Orientation scheduled successfully.', result);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to schedule orientation session', null, err.message);
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      await OrientationService.update(req.params.id, data, userId);
      return response(res, true, 200, 'Orientation session updated successfully.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update orientation session', null, err.message);
    }
  }

  static async delete(req, res) {
    try {
      await OrientationService.delete(req.params.id);
      return response(res, true, 200, 'Orientation session deleted successfully.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to delete orientation session', null, err.message);
    }
  }

  static async complete(req, res) {
    try {
      const userId = req.user?.id || 1;
      await OrientationService.complete(req.params.id, userId);
      return response(res, true, 200, 'Orientation session marked as completed.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to complete orientation session', null, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const orientation = await OrientationService.getById(req.params.id);
      if (!orientation) {
        return response(res, false, 404, 'Orientation session not found');
      }
      return response(res, true, 200, 'Orientation session retrieved successfully', orientation);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to retrieve orientation session', null, err.message);
    }
  }

  static async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || ''
      };

      const result = await OrientationService.list(filters, pagination);
      return response(res, true, 200, 'Orientations list retrieved successfully', {
        orientations: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch orientations schedule', null, err.message);
    }
  }

  static async getEligibleJoiners(req, res) {
    try {
      const joiners = await OrientationService.getEligibleJoiners();
      return response(res, true, 200, 'Eligible joiners retrieved successfully', joiners);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to retrieve eligible joiners', null, err.message);
    }
  }

  static async getDashboard(req, res) {
    try {
      const stats = await OrientationService.getDashboardStats();
      return response(res, true, 200, 'Orientation dashboard stats retrieved successfully', stats);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch dashboard stats', null, err.message);
    }
  }
}

module.exports = OrientationController;
