const ExpenseService = require('../services/ExpenseService');
const response = require('../utils/response');

class ExpenseController {
  // ─── EXPENSE CATEGORIES ───
  static async createCategory(req, res) {
    try {
      const userId = req.user?.id || 1;
      const result = await ExpenseService.createCategory(req.body, userId);
      return response(res, true, 201, 'Category created successfully.', result);
    } catch (err) {
      return response(res, false, 500, 'Failed to create category.', null, err.message);
    }
  }

  static async updateCategory(req, res) {
    try {
      const userId = req.user?.id || 1;
      await ExpenseService.updateCategory(req.params.id, req.body, userId);
      return response(res, true, 200, 'Category updated successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to update category.', null, err.message);
    }
  }

  static async deleteCategory(req, res) {
    try {
      await ExpenseService.deleteCategory(req.params.id);
      return response(res, true, 200, 'Category deleted successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to delete category.', null, err.message);
    }
  }

  static async listCategories(req, res) {
    try {
      const categories = await ExpenseService.listCategories(req.query);
      return response(res, true, 200, 'Categories retrieved successfully.', categories);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve categories.', null, err.message);
    }
  }

  // ─── EXPENSE CLAIMS ───
  static async createClaim(req, res) {
    try {
      const userId = req.user?.id || 1;
      const result = await ExpenseService.createClaim(req.body, userId);
      try {
        const empId = req.user?.employeeId || req.user?.employee_id || userId;
        const NotificationService = require('../services/NotificationService');
        NotificationService.triggerExpenseSubmitted(result.id || 1, empId, req.body.title || req.body.description || 'Expense Claim', req.body.amount)
          .catch(e => console.error("Expense notification error:", e));
      } catch (e) { }
      return response(res, true, 201, 'Expense claim submitted successfully.', result);
    } catch (err) {
      return response(res, false, 500, 'Failed to submit expense claim.', null, err.message);
    }
  }

  static async updateClaim(req, res) {
    try {
      const userId = req.user?.id || 1;
      await ExpenseService.updateClaim(req.params.id, req.body, userId);
      return response(res, true, 200, 'Expense claim updated successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to update expense claim.', null, err.message);
    }
  }

  static async deleteClaim(req, res) {
    try {
      await ExpenseService.deleteClaim(req.params.id);
      return response(res, true, 200, 'Expense claim deleted successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to delete expense claim.', null, err.message);
    }
  }

  static async listClaims(req, res) {
    try {
      const claims = await ExpenseService.listClaims(req.query);
      return response(res, true, 200, 'Expense claims retrieved successfully.', claims);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve claims.', null, err.message);
    }
  }

  static async approveClaim(req, res) {
    try {
      const userId = req.user?.id || 1;
      const { status } = req.body;
      await ExpenseService.approveClaim(req.params.id, status, userId);
      try {
        const NotificationService = require('../services/NotificationService');
        NotificationService.triggerExpenseStatusUpdate(req.params.id, userId, 'Expense Claim', status)
          .catch(e => console.error("Expense status notification error:", e));
      } catch (e) { }
      return response(res, true, 200, `Expense claim ${status.toLowerCase()} successfully.`);
    } catch (err) {
      return response(res, false, 500, 'Failed to update claim status.', null, err.message);
    }
  }

  // ─── REIMBURSEMENTS ───
  static async listReimbursements(req, res) {
    try {
      const reimbursements = await ExpenseService.listReimbursements(req.query);
      return response(res, true, 200, 'Reimbursements retrieved successfully.', reimbursements);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve reimbursements.', null, err.message);
    }
  }

  static async processReimbursement(req, res) {
    try {
      const userId = req.user?.id || 1;
      await ExpenseService.processReimbursement(req.params.id, req.body, userId);
      return response(res, true, 200, 'Reimbursement payment processed successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to process payment.', null, err.message);
    }
  }

  // ─── META & DASHBOARD & REPORTS ───
  static async getMeta(req, res) {
    try {
      const meta = await ExpenseService.getMeta();
      return response(res, true, 200, 'Metadata retrieved successfully.', meta);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve metadata.', null, err.message);
    }
  }

  static async getDashboard(req, res) {
    try {
      const dashboard = await ExpenseService.getDashboard();
      return response(res, true, 200, 'Dashboard statistics retrieved successfully.', dashboard);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve dashboard statistics.', null, err.message);
    }
  }

  static async getReports(req, res) {
    try {
      const reports = await ExpenseService.getReports(req.query);
      return response(res, true, 200, 'Expense reports generated successfully.', reports);
    } catch (err) {
      return response(res, false, 500, 'Failed to generate reports.', null, err.message);
    }
  }
}

module.exports = ExpenseController;
