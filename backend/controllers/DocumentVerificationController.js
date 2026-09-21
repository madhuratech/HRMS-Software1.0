const DocumentVerificationService = require('../services/DocumentVerificationService');
const response = require('../utils/response');
const getPagination = require('../utils/pagination');

class DocumentVerificationController {
  static async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };

      // Map uploaded files to their respective field paths
      if (req.files) {
        const fields = [
          'aadhaar_card', 'pan_card', 'resume', 'passport',
          'degree_certificate', 'experience_certificate', 'relieving_letter',
          'photo', 'bank_passbook', 'driving_license'
        ];
        fields.forEach(field => {
          if (req.files[field] && req.files[field][0]) {
            data[field] = '/uploads/' + req.files[field][0].filename;
          }
        });
      }

      const result = await DocumentVerificationService.create(data, userId);
      return response(res, true, 201, 'Document Verification created successfully.', result);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to create document verification', null, err.message);
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };

      // Map uploaded files to their respective field paths
      if (req.files) {
        const fields = [
          'aadhaar_card', 'pan_card', 'resume', 'passport',
          'degree_certificate', 'experience_certificate', 'relieving_letter',
          'photo', 'bank_passbook', 'driving_license'
        ];
        fields.forEach(field => {
          if (req.files[field] && req.files[field][0]) {
            data[field] = '/uploads/' + req.files[field][0].filename;
          }
        });
      }

      await DocumentVerificationService.update(req.params.id, data, userId);
      return response(res, true, 200, 'Document Verification updated successfully.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update document verification', null, err.message);
    }
  }

  static async delete(req, res) {
    try {
      await DocumentVerificationService.delete(req.params.id);
      return response(res, true, 200, 'Document Verification deleted successfully.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to delete document verification', null, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const result = await DocumentVerificationService.getById(req.params.id);
      if (!result) {
        return response(res, false, 404, 'Document Verification not found');
      }
      return response(res, true, 200, 'Document Verification retrieved successfully', result);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to retrieve document verification details', null, err.message);
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

      const result = await DocumentVerificationService.list(filters, pagination);
      return response(res, true, 200, 'Document Verifications list retrieved successfully', {
        verifications: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch document verifications list', null, err.message);
    }
  }

  static async complete(req, res) {
    try {
      const userId = req.user?.id || 1;
      await DocumentVerificationService.completeVerification(req.params.id, userId);
      return response(res, true, 200, 'Document Verification completed successfully.');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to complete document verification', null, err.message);
    }
  }

  static async getStats(req, res) {
    try {
      const stats = await DocumentVerificationService.getDashboardStats();
      return response(res, true, 200, 'Document verification stats retrieved successfully', stats);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to fetch verification stats', null, err.message);
    }
  }
}

module.exports = DocumentVerificationController;
