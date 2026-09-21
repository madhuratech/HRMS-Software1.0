const ProbationService = require('../services/ProbationService');
const response = require('../utils/response');
const getPagination = require('../utils/pagination');

class ProbationController {
  static async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      const result = await ProbationService.create(data, userId);
      return response(res, true, 201, 'Probation record created successfully.', result);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to create probation record', null, err.message);
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      await ProbationService.update(req.params.id, data, userId);
      return response(res, true, 200, 'Probation record updated successfully.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update probation record', null, err.message);
    }
  }

  static async extend(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      await ProbationService.extend(req.params.id, data, userId);
      return response(res, true, 200, 'Probation record extended successfully.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to extend probation', null, err.message);
    }
  }

  static async complete(req, res) {
    try {
      const userId = req.user?.id || 1;
      await ProbationService.complete(req.params.id, userId);
      return response(res, true, 200, 'Probation record completed successfully.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to complete probation', null, err.message);
    }
  }

  static async delete(req, res) {
    try {
      await ProbationService.delete(req.params.id);
      return response(res, true, 200, 'Probation record deleted successfully.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to delete probation record', null, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const record = await ProbationService.getById(req.params.id);
      if (!record) {
        return response(res, false, 404, 'Probation record not found');
      }
      return response(res, true, 200, 'Probation record retrieved successfully', record);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to retrieve probation record', null, err.message);
    }
  }

  static async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || ''
      };

      const result = await ProbationService.list(filters, pagination);
      return response(res, true, 200, 'Probation records list retrieved successfully', {
        probations: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch probation records', null, err.message);
    }
  }

  static async getDashboard(req, res) {
    try {
      const stats = await ProbationService.getDashboardStats();
      return response(res, true, 200, 'Probation dashboard stats retrieved successfully', stats);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch dashboard stats', null, err.message);
    }
  }
}

module.exports = ProbationController;
