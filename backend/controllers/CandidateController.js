const CandidateService = require('../services/CandidateService');
const response = require('../utils/response');
const getPagination = require('../utils/pagination');
const path = require('path');

class CandidateController {
  static async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };

      // Handle resume upload
      if (req.file) {
        // Validate file type
        const ext = path.extname(req.file.originalname).toLowerCase();
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        if (!allowedTypes.includes(ext)) {
          return response(res, false, 400, 'Invalid file type. Only PDF, DOC, and DOCX are allowed.');
        }

        console.log("========== UPLOAD DEBUG (CANDIDATE CONTROLLER) ==========");
        console.log("req.file:", req.file);
        console.log("filename:", req.file?.filename);
        console.log("originalname:", req.file?.originalname);
        console.log("==========================================================");

        data.resume = '/uploads/' + req.file.filename;
        data.original_resume = '/uploads/' + req.file.filename;
        data.original_resume_name = req.file.originalname;
      } else {
        return response(res, false, 400, 'Resume file is required');
      }

      const result = await CandidateService.create(data, userId);
      return response(res, true, 201, 'Candidate created successfully', result);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to create candidate', null, err.message);
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };

      // Handle resume upload if any
      if (req.file) {
        // Validate file type
        const ext = path.extname(req.file.originalname).toLowerCase();
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        if (!allowedTypes.includes(ext)) {
          return response(res, false, 400, 'Invalid file type. Only PDF, DOC, and DOCX are allowed.');
        }

        // Validate file size
        if (req.file.size > 5 * 1024 * 1024) {
          return response(res, false, 400, 'File size exceeds maximum limit of 5 MB.');
        }

        data.resume = '/uploads/' + req.file.filename;
        data.original_resume = '/uploads/' + req.file.filename;
        data.original_resume_name = req.file.originalname;
      }

      // If this is an evaluation update (Shortlisted or Rejected)
      if (data.status && (data.status === 'Shortlisted' || data.status === 'Rejected')) {
        const existing = await CandidateService.getById(req.params.id);
        const finalizedStatuses = ['shortlisted', 'rejected', 'interview scheduled', 'interview completed', 'selected', 'hired', 'withdrawn'];
        if (existing && finalizedStatuses.includes(String(existing.status).toLowerCase())) {
          return res.status(400).json({
            success: false,
            message: 'This candidate has already received a final evaluation.',
            status: existing.status
          });
        }
      }

      await CandidateService.update(req.params.id, data, userId);
      return response(res, true, 200, 'Candidate updated successfully');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update candidate', null, err.message);
    }
  }

  /**
   * Dedicated Evaluate endpoint: POST /app/candidates/:id/evaluate
   */
  static async evaluate(req, res) {
    try {
      const userId = req.user?.id || 1;
      const candidateId = req.params.id;
      const payload = req.body || {};

      const result = await CandidateService.evaluateCandidate(candidateId, payload, userId);
      return res.status(200).json({
        success: true,
        message: `Candidate successfully evaluated and moved to ${result.status}`,
        data: result
      });
    } catch (err) {
      console.error('[CandidateController.evaluate] Error:', err);
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.message || 'Failed to submit candidate evaluation',
        status: err.status || undefined
      });
    }
  }

  /**
   * Live ATS Evaluation endpoint: GET /app/candidates/:id/ats-evaluation
   */
  static async getAtsEvaluation(req, res) {
    try {
      const candidateId = req.params.id;
      const evaluation = await CandidateService.getAtsEvaluation(candidateId);
      return res.status(200).json(evaluation);
    } catch (err) {
      console.error('[CandidateController.getAtsEvaluation] Error:', err);
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.message || 'Failed to generate ATS evaluation for candidate'
      });
    }
  }

  static async delete(req, res) {
    try {
      await CandidateService.delete(req.params.id);
      return response(res, true, 200, 'Candidate deleted successfully');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to delete candidate', null, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const candidate = await CandidateService.getById(req.params.id);
      if (!candidate) {
        return response(res, false, 404, 'Candidate not found');
      }
      return response(res, true, 200, 'Candidate retrieved successfully', candidate);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to retrieve candidate', null, err.message);
    }
  }

  static async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || '',
        department_id: req.query.department_id || null,
        status: req.query.status || null,
        gender: req.query.gender || null,
        experience: req.query.experience || null,
        has_resume: req.query.has_resume !== undefined ? req.query.has_resume : undefined
      };

      const result = await CandidateService.list(filters, pagination);
      return response(res, true, 200, 'Candidates list retrieved successfully', {
        candidates: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch candidates list', null, err.message);
    }
  }

  static async dropdown(req, res) {
    try {
      const candidates = await CandidateService.dropdown();
      return response(res, true, 200, 'Candidate dropdown list retrieved successfully', candidates);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch candidate dropdown', null, err.message);
    }
  }

  /**
   * Convert Candidate to Employee endpoint
   * POST /app/candidates/:id/convert-to-employee
   */
  static async convertToEmployee(req, res) {
    try {
      const userId = req.user?.id || 1;
      const candidateId = req.params.id;
      const options = req.body || {};

      const result = await CandidateService.convertToEmployee(candidateId, options, userId);
      return response(res, true, 200, 'Candidate successfully converted to Employee with previous experience preserved', result);
    } catch (err) {
      console.error('Candidate conversion error:', err);
      const status = err.statusCode || 500;
      return response(res, false, status, err.message || 'Failed to convert candidate to employee', null, err.message);
    }
  }

  /**
   * Get Candidate Experiences
   * GET /app/candidates/:id/experiences
   */
  static async getCandidateExperiences(req, res) {
    try {
      const candidateId = req.params.id;
      const experiences = await CandidateService.getCandidateExperiences(candidateId);
      return response(res, true, 200, 'Candidate experiences retrieved successfully', experiences);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to retrieve candidate experiences', null, err.message);
    }
  }

  /**
   * Add Candidate Experience
   * POST /app/candidates/:id/experiences
   */
  static async addCandidateExperience(req, res) {
    try {
      const candidateId = req.params.id;
      const expId = await CandidateService.addCandidateExperience(candidateId, req.body);
      return response(res, true, 201, 'Candidate experience added successfully', { id: expId });
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to add candidate experience', null, err.message);
    }
  }
}

module.exports = CandidateController;
