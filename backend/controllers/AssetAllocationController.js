const AssetAllocationService = require('../services/AssetAllocationService');
const response = require('../utils/response');
const getPagination = require('../utils/pagination');

class AssetAllocationController {
  static async allocate(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      const result = await AssetAllocationService.allocate(data, userId);
      return response(res, true, 201, 'Asset allocated successfully.', result);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to allocate asset', null, err.message);
    }
  }

  static async returnAsset(req, res) {
    try {
      const userId = req.user?.id || 1;
      await AssetAllocationService.returnAsset(req.params.id, userId);
      return response(res, true, 200, 'Asset returned successfully.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to return asset', null, err.message);
    }
  }

  static async delete(req, res) {
    try {
      await AssetAllocationService.delete(req.params.id);
      return response(res, true, 200, 'Asset allocation deleted successfully.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to delete asset allocation', null, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const allocation = await AssetAllocationService.getById(req.params.id);
      if (!allocation) {
        return response(res, false, 404, 'Asset allocation not found');
      }
      return response(res, true, 200, 'Asset allocation retrieved successfully', allocation);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to retrieve asset allocation', null, err.message);
    }
  }

  static async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || ''
      };

      const result = await AssetAllocationService.list(filters, pagination);
      return response(res, true, 200, 'Asset allocations list retrieved successfully', {
        allocations: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch asset allocations', null, err.message);
    }
  }

  static async getAvailableAssets(req, res) {
    try {
      const assets = await AssetAllocationService.getAvailableAssets();
      return response(res, true, 200, 'Available assets retrieved successfully', assets);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch available assets', null, err.message);
    }
  }

  static async getDashboard(req, res) {
    try {
      const stats = await AssetAllocationService.getDashboardStats();
      return response(res, true, 200, 'Asset allocation dashboard stats retrieved successfully', stats);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch dashboard stats', null, err.message);
    }
  }
}

module.exports = AssetAllocationController;
