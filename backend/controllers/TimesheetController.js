const TimesheetService = require('../services/TimesheetService');
const response = require('../utils/response');
const getPagination = require('../utils/pagination');

class TimesheetController {
  static async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      const newEntry = await TimesheetService.create(data, userId);
      return response(res, true, 212, 'Timesheet logged successfully', newEntry);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to log timesheet', null, err.message);
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      await TimesheetService.update(req.params.id, data, userId);
      return response(res, true, 200, 'Timesheet updated successfully');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update timesheet', null, err.message);
    }
  }

  static async delete(req, res) {
    try {
      await TimesheetService.delete(req.params.id);
      return response(res, true, 200, 'Timesheet deleted successfully');
    } catch (err) {
      return response(res, false, 500, 'Failed to delete timesheet', null, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const entry = await TimesheetService.getById(req.params.id);
      if (!entry) {
        return response(res, false, 404, 'Timesheet not found');
      }
      return response(res, true, 200, 'Timesheet retrieved successfully', entry);
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch timesheet details', null, err.message);
    }
  }

  static async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || '',
        employee_id: req.query.employee_id || null,
        project_id: req.query.project_id || null,
        status: req.query.status || null,
        date: req.query.date || null,
        week_start: req.query.week_start || null,
        week_end: req.query.week_end || null,
        month: req.query.month || null
      };

      const result = await TimesheetService.list(filters, pagination);
      return response(res, true, 200, 'Timesheets list retrieved successfully', {
        timesheets: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch timesheets list', null, err.message);
    }
  }

  static async getSummary(req, res) {
    try {
      const filters = {
        employee_id: req.query.employee_id || null,
        project_id: req.query.project_id || null,
        month: req.query.month || null,
        week_start: req.query.week_start || null,
        week_end: req.query.week_end || null
      };
      const summary = await TimesheetService.getSummary(filters);
      return response(res, true, 200, 'Timesheet summary retrieved successfully', summary);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve timesheet summary', null, err.message);
    }
  }
}

module.exports = TimesheetController;