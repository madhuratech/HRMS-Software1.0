const GoalService = require('../services/GoalService');
const KpiService = require('../services/KpiService');
const KraService = require('../services/KraService');
const AppraisalService = require('../services/AppraisalService');
const ReviewService = require('../services/ReviewService');
const FeedbackService = require('../services/FeedbackService');
const PromotionService = require('../services/PromotionService');
const PerformanceScopeService = require('../services/PerformanceScopeService');

const response = require('../utils/response');
const getPagination = require('../utils/pagination');

// 1. GOALS
const GoalController = {
  async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const result = await GoalService.create(req.body, userId);
      return response(res, true, 201, 'Goal created successfully.', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to create goal', null, e.message);
    }
  },
  async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      await GoalService.update(req.params.id, req.body, userId);
      return response(res, true, 200, 'Goal updated successfully.');
    } catch (e) {
      return response(res, false, 500, 'Failed to update goal', null, e.message);
    }
  },
  async delete(req, res) {
    try {
      await GoalService.delete(req.params.id);
      return response(res, true, 200, 'Goal deleted successfully.');
    } catch (e) {
      return response(res, false, 500, 'Failed to delete goal', null, e.message);
    }
  },
  async getById(req, res) {
    try {
      const result = await GoalService.getById(req.params.id);
      if (!result) return response(res, false, 404, 'Goal not found');
      return response(res, true, 200, 'Goal retrieved successfully', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve goal', null, e.message);
    }
  },
  async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || '',
        branch_id: req.query.department_id || req.query.branch_id || null
      };
      const scope = await PerformanceScopeService.getScope(req);
      const result = await GoalService.list(filters, pagination, scope);
      return response(res, true, 200, 'Goals list retrieved successfully', {
        goals: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve goals list', null, e.message);
    }
  },
  async getDashboard(req, res) {
    try {
      const scope = await PerformanceScopeService.getScope(req);
      const stats = await GoalService.getDashboardStats(scope);
      return response(res, true, 200, 'Goal stats retrieved successfully', stats);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve goal stats', null, e.message);
    }
  }
};

// 2. KPIs
const KpiController = {
  async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const result = await KpiService.create(req.body, userId);
      return response(res, true, 201, 'KPI created successfully.', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to create KPI', null, e.message);
    }
  },
  async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      await KpiService.update(req.params.id, req.body, userId);
      return response(res, true, 200, 'KPI updated successfully.');
    } catch (e) {
      return response(res, false, 500, 'Failed to update KPI', null, e.message);
    }
  },
  async delete(req, res) {
    try {
      await KpiService.delete(req.params.id);
      return response(res, true, 200, 'KPI deleted successfully.');
    } catch (e) {
      return response(res, false, 500, 'Failed to delete KPI', null, e.message);
    }
  },
  async getById(req, res) {
    try {
      const result = await KpiService.getById(req.params.id);
      if (!result) return response(res, false, 404, 'KPI not found');
      return response(res, true, 200, 'KPI retrieved successfully', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve KPI', null, e.message);
    }
  },
  async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || '',
        department_id: req.query.department_id || null,
        kra_id: req.query.kra_id || null
      };
      const scope = await PerformanceScopeService.getScope(req);
      const result = await KpiService.list(filters, pagination, scope);
      return response(res, true, 200, 'KPIs list retrieved successfully', {
        kpis: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve KPIs list', null, e.message);
    }
  },
  async getDashboard(req, res) {
    try {
      const scope = await PerformanceScopeService.getScope(req);
      const stats = await KpiService.getDashboardStats(scope);
      return response(res, true, 200, 'KPI stats retrieved successfully', stats);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve KPI stats', null, e.message);
    }
  }
};

// 3. KRAs
const KraController = {
  async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const result = await KraService.create(req.body, userId);
      return response(res, true, 201, 'KRA created successfully.', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to create KRA', null, e.message);
    }
  },
  async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      await KraService.update(req.params.id, req.body, userId);
      return response(res, true, 200, 'KRA updated successfully.');
    } catch (e) {
      return response(res, false, 500, 'Failed to update KRA', null, e.message);
    }
  },
  async delete(req, res) {
    try {
      await KraService.delete(req.params.id);
      return response(res, true, 200, 'KRA deleted successfully.');
    } catch (e) {
      return response(res, false, 500, 'Failed to delete KRA', null, e.message);
    }
  },
  async getById(req, res) {
    try {
      const result = await KraService.getById(req.params.id);
      if (!result) return response(res, false, 404, 'KRA not found');
      return response(res, true, 200, 'KRA retrieved successfully', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve KRA', null, e.message);
    }
  },
  async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || '',
        department_id: req.query.department_id || null,
        goal_id: req.query.goal_id || null
      };
      const scope = await PerformanceScopeService.getScope(req);
      const result = await KraService.list(filters, pagination, scope);
      return response(res, true, 200, 'KRAs list retrieved successfully', {
        kras: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve KRAs list', null, e.message);
    }
  },
  async getDashboard(req, res) {
    try {
      const scope = await PerformanceScopeService.getScope(req);
      const stats = await KraService.getDashboardStats(scope);
      return response(res, true, 200, 'KRA stats retrieved successfully', stats);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve KRA stats', null, e.message);
    }
  }
};

// 4. APPRAISALS
const AppraisalController = {
  async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const result = await AppraisalService.create(req.body, userId);
      return response(res, true, 201, 'Appraisal created successfully.', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to create appraisal', null, e.message);
    }
  },
  async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      await AppraisalService.update(req.params.id, req.body, userId);
      return response(res, true, 200, 'Appraisal updated successfully.');
    } catch (e) {
      return response(res, false, 500, 'Failed to update appraisal', null, e.message);
    }
  },
  async delete(req, res) {
    try {
      await AppraisalService.delete(req.params.id);
      return response(res, true, 200, 'Appraisal deleted successfully.');
    } catch (e) {
      return response(res, false, 500, 'Failed to delete appraisal', null, e.message);
    }
  },
  async getById(req, res) {
    try {
      const result = await AppraisalService.getById(req.params.id);
      if (!result) return response(res, false, 404, 'Appraisal not found');
      return response(res, true, 200, 'Appraisal retrieved successfully', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve appraisal', null, e.message);
    }
  },
  async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = { search: req.query.search || '', department_id: req.query.department_id || null };
      const scope = await PerformanceScopeService.getScope(req);
      const result = await AppraisalService.list(filters, pagination, scope);
      return response(res, true, 200, 'Appraisals list retrieved successfully', {
        appraisals: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve appraisals list', null, e.message);
    }
  },
  async getDashboard(req, res) {
    try {
      const scope = await PerformanceScopeService.getScope(req);
      const stats = await AppraisalService.getDashboardStats(scope);
      return response(res, true, 200, 'Appraisal stats retrieved successfully', stats);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve appraisal stats', null, e.message);
    }
  }
};

// 5. REVIEWS
const ReviewController = {
  async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const result = await ReviewService.create(req.body, userId);
      return response(res, true, 201, 'Review created successfully.', result);
    } catch (e) {
      return response(res, false, 400, e.message || 'Failed to create review', null, e.message);
    }
  },
  async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      await ReviewService.update(req.params.id, req.body, userId);
      return response(res, true, 200, 'Review updated successfully.');
    } catch (e) {
      return response(res, false, 400, e.message || 'Failed to update review', null, e.message);
    }
  },
  async delete(req, res) {
    try {
      await ReviewService.delete(req.params.id);
      return response(res, true, 200, 'Review deleted successfully.');
    } catch (e) {
      return response(res, false, 500, 'Failed to delete review', null, e.message);
    }
  },
  async getById(req, res) {
    try {
      const result = await ReviewService.getById(req.params.id);
      if (!result) return response(res, false, 404, 'Review not found');
      return response(res, true, 200, 'Review retrieved successfully', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve review', null, e.message);
    }
  },
  async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || '',
        department_id: req.query.department_id || null,
        employee_id: req.query.employee_id || null,
        goal_id: req.query.goal_id || null
      };
      const scope = await PerformanceScopeService.getScope(req);
      const result = await ReviewService.list(filters, pagination, scope);
      return response(res, true, 200, 'Reviews list retrieved successfully', {
        reviews: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve reviews list', null, e.message);
    }
  },
  async getEmployeeTree(req, res) {
    try {
      const { employeeId } = req.params;
      const goalId = req.query.goal_id || null;
      const scope = await PerformanceScopeService.getScope(req);
      const result = await ReviewService.getEmployeePerformanceTree(employeeId, goalId, scope);
      return response(res, true, 200, 'Employee performance hierarchy retrieved successfully', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve performance hierarchy', null, e.message);
    }
  },
  async calculatePreview(req, res) {
    try {
      const result = await ReviewService.calculatePreview(req.body);
      return response(res, true, 200, 'Performance preview calculated successfully', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to calculate performance preview', null, e.message);
    }
  },
  async getDashboard(req, res) {
    try {
      const scope = await PerformanceScopeService.getScope(req);
      const stats = await ReviewService.getDashboardStats(scope);
      return response(res, true, 200, 'Review stats retrieved successfully', stats);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve review stats', null, e.message);
    }
  }
};

// 6. FEEDBACK
const FeedbackController = {
  async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const result = await FeedbackService.create(req.body, userId);
      return response(res, true, 201, 'Feedback created successfully.', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to create feedback', null, e.message);
    }
  },
  async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      await FeedbackService.update(req.params.id, req.body, userId);
      return response(res, true, 200, 'Feedback updated successfully.');
    } catch (e) {
      return response(res, false, 500, 'Failed to update feedback', null, e.message);
    }
  },
  async delete(req, res) {
    try {
      await FeedbackService.delete(req.params.id);
      return response(res, true, 200, 'Feedback deleted successfully.');
    } catch (e) {
      return response(res, false, 500, 'Failed to delete feedback', null, e.message);
    }
  },
  async getById(req, res) {
    try {
      const result = await FeedbackService.getById(req.params.id);
      if (!result) return response(res, false, 404, 'Feedback not found');
      return response(res, true, 200, 'Feedback retrieved successfully', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve feedback', null, e.message);
    }
  },
  async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = { search: req.query.search || '', department_id: req.query.department_id || null };
      const scope = await PerformanceScopeService.getScope(req);
      const result = await FeedbackService.list(filters, pagination, scope);
      return response(res, true, 200, 'Feedback list retrieved successfully', {
        feedbacks: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve feedback list', null, e.message);
    }
  },
  async getDashboard(req, res) {
    try {
      const scope = await PerformanceScopeService.getScope(req);
      const stats = await FeedbackService.getDashboardStats(scope);
      return response(res, true, 200, 'Feedback stats retrieved successfully', stats);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve feedback stats', null, e.message);
    }
  }
};

// 7. PROMOTIONS
const PromotionController = {
  async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const result = await PromotionService.create(req.body, userId);
      return response(res, true, 201, 'Promotion created successfully.', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to create promotion', null, e.message);
    }
  },
  async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      await PromotionService.update(req.params.id, req.body, userId);
      return response(res, true, 200, 'Promotion updated successfully.');
    } catch (e) {
      return response(res, false, 500, 'Failed to update promotion', null, e.message);
    }
  },
  async delete(req, res) {
    try {
      await PromotionService.delete(req.params.id);
      return response(res, true, 200, 'Promotion deleted successfully.');
    } catch (e) {
      return response(res, false, 500, 'Failed to delete promotion', null, e.message);
    }
  },
  async getById(req, res) {
    try {
      const result = await PromotionService.getById(req.params.id);
      if (!result) return response(res, false, 404, 'Promotion not found');
      return response(res, true, 200, 'Promotion retrieved successfully', result);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve promotion', null, e.message);
    }
  },
  async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = { search: req.query.search || '' };
      const scope = await PerformanceScopeService.getScope(req);
      const result = await PromotionService.list(filters, pagination, scope);
      return response(res, true, 200, 'Promotions list retrieved successfully', {
        promotions: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve promotions list', null, e.message);
    }
  },
  async getDashboard(req, res) {
    try {
      const scope = await PerformanceScopeService.getScope(req);
      const stats = await PromotionService.getDashboardStats(scope);
      return response(res, true, 200, 'Promotion stats retrieved successfully', stats);
    } catch (e) {
      return response(res, false, 500, 'Failed to retrieve promotion stats', null, e.message);
    }
  }
};

module.exports = {
  GoalController,
  KpiController,
  KraController,
  AppraisalController,
  ReviewController,
  FeedbackController,
  PromotionController
};
