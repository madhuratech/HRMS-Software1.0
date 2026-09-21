const InterviewScheduleService = require('../services/InterviewScheduleService');
const response = require('../utils/response');
const getPagination = require('../utils/pagination');

class InterviewScheduleController {
  static async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      const result = await InterviewScheduleService.create(data, userId);
      return response(res, true, 201, 'Interview scheduled successfully', result);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to schedule interview', null, err.message);
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      await InterviewScheduleService.update(req.params.id, data, userId);
      return response(res, true, 200, 'Interview schedule updated successfully');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update interview schedule', null, err.message);
    }
  }

  static async delete(req, res) {
    try {
      await InterviewScheduleService.delete(req.params.id);
      return response(res, true, 200, 'Interview schedule deleted successfully');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to delete interview schedule', null, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const schedule = await InterviewScheduleService.getById(req.params.id);
      if (!schedule) {
        return response(res, false, 404, 'Interview schedule not found');
      }
      return response(res, true, 200, 'Interview schedule retrieved successfully', schedule);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to retrieve interview schedule', null, err.message);
    }
  }

  static async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || '',
        candidate_id: req.query.candidate_id || null,
        interviewer_id: req.query.interviewer_id || null,
        date: req.query.date || null,
        status: req.query.status || null,
        interview_mode: req.query.interview_mode || null,
        interview_round: req.query.interview_round || null
      };

      const result = await InterviewScheduleService.list(filters, pagination);
      return response(res, true, 200, 'Interview schedules retrieved successfully', {
        schedules: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to retrieve interview schedules', null, err.message);
    }
  }

  static async updateStatus(req, res) {
    try {
      const userId = req.user?.id || 1;
      const { status, remarks } = req.body;
      await InterviewScheduleService.updateStatus(req.params.id, status, remarks, userId);
      return response(res, true, 200, `Interview status updated to ${status} successfully`);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update status', null, err.message);
    }
  }

  static async getDashboard(req, res) {
    try {
      const stats = await InterviewScheduleService.getDashboardStats();
      return response(res, true, 200, 'Dashboard stats retrieved successfully', stats);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to retrieve dashboard stats', null, err.message);
    }
  }
}

module.exports = InterviewScheduleController;
