const ReportService = require('../services/ReportService');
const response = require('../utils/response');

class ReportController {
  static async getEmployeeReport(req, res) {
    try {
      const data = await ReportService.getEmployeeReport(req.query);
      return response(res, true, 200, 'Employee report generated successfully.', data);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to generate employee report.', null, err.message);
    }
  }

  static async getAttendanceReport(req, res) {
    try {
      const data = await ReportService.getAttendanceReport(req.query);
      return response(res, true, 200, 'Attendance report generated successfully.', data);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to generate attendance report.', null, err.message);
    }
  }

  static async getLeaveReport(req, res) {
    try {
      const data = await ReportService.getLeaveReport(req.query);
      return response(res, true, 200, 'Leave report generated successfully.', data);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to generate leave report.', null, err.message);
    }
  }

  static async getPayrollReport(req, res) {
    try {
      const data = await ReportService.getPayrollReport(req.query);
      return response(res, true, 200, 'Payroll report generated successfully.', data);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to generate payroll report.', null, err.message);
    }
  }

  static async getRecruitmentReport(req, res) {
    try {
      const data = await ReportService.getRecruitmentReport(req.query);
      return response(res, true, 200, 'Recruitment report generated successfully.', data);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to generate recruitment report.', null, err.message);
    }
  }

  static async getPerformanceReport(req, res) {
    try {
      const data = await ReportService.getPerformanceReport(req.query);
      return response(res, true, 200, 'Performance report generated successfully.', data);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to generate performance report.', null, err.message);
    }
  }

  static async getProjectReport(req, res) {
    try {
      const data = await ReportService.getProjectReport(req.query);
      return response(res, true, 200, 'Project report generated successfully.', data);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to generate project report.', null, err.message);
    }
  }
}

module.exports = ReportController;
