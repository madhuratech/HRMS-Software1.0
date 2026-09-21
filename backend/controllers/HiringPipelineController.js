const HiringPipelineService = require('../services/HiringPipelineService');
const response = require('../utils/response');

class HiringPipelineController {
  static async createSource(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      const result = await HiringPipelineService.createSource(data, userId);
      return response(res, true, 201, 'Recruitment source created successfully.', result);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to create recruitment source', null, err.message);
    }
  }

  static async getSources(req, res) {
    try {
      const result = await HiringPipelineService.listSources();
      return response(res, true, 200, 'Recruitment sources retrieved successfully', result);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch recruitment sources', null, err.message);
    }
  }

  static async getStats(req, res) {
    try {
      const stats = await HiringPipelineService.getPipelineStats();
      return response(res, true, 200, 'Hiring pipeline statistics retrieved successfully', stats);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch pipeline stats', null, err.message);
    }
  }
}

module.exports = HiringPipelineController;
