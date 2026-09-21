const NewJoinerService = require('../services/NewJoinerService');
const response = require('../utils/response');
const getPagination = require('../utils/pagination');

class NewJoinerController {
  static async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      const result = await NewJoinerService.create(data, userId);
      return response(res, true, 201, 'New Joiner created successfully.', result);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to create new joiner onboarding', null, err.message);
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      await NewJoinerService.update(req.params.id, data, userId);
      return response(res, true, 200, 'New Joiner onboarding updated successfully.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update new joiner onboarding', null, err.message);
    }
  }

  static async delete(req, res) {
    try {
      await NewJoinerService.delete(req.params.id);
      return response(res, true, 200, 'New Joiner onboarding deleted successfully.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to delete new joiner onboarding', null, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const joiner = await NewJoinerService.getById(req.params.id);
      if (!joiner) {
        return response(res, false, 404, 'New Joiner onboarding not found');
      }
      return response(res, true, 200, 'New Joiner onboarding retrieved successfully', joiner);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to retrieve new joiner onboarding', null, err.message);
    }
  }

  static async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || '',
        department_id: req.query.department_id || null,
        status: req.query.status || null
      };

      const result = await NewJoinerService.list(filters, pagination);
      return response(res, true, 200, 'New Joiners onboarding list retrieved successfully', {
        joiners: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch new joiners onboarding list', null, err.message);
    }
  }

  static async getDashboard(req, res) {
    try {
      const stats = await NewJoinerService.getDashboardStats();
      return response(res, true, 200, 'Onboarding dashboard stats retrieved successfully', stats);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to retrieve onboarding stats', null, err.message);
    }
  }
}

module.exports = NewJoinerController;
