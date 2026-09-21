const DocumentService = require('../services/DocumentService');
const response = require('../utils/response');
const mammoth = require('mammoth');
const path = require('path');

class DocumentController {
  // ─── EMPLOYEE DOCUMENTS ───
  static async createEmployeeDoc(req, res) {
    try {
      const userId = req.user?.id || 1;
      const fileUrl = req.file ? `uploads/documents/employee/${req.file.filename}` : req.body.file;
      const docData = { ...req.body, file: fileUrl };
      const result = await DocumentService.createEmployeeDoc(docData, userId);
      return response(res, true, 201, 'Employee document created successfully.', result);
    } catch (err) {
      return response(res, false, 500, 'Failed to save employee document.', null, err.message);
    }
  }

  static async updateEmployeeDoc(req, res) {
    try {
      const userId = req.user?.id || 1;
      const fileUrl = req.file ? `uploads/documents/employee/${req.file.filename}` : req.body.file;
      const docData = { ...req.body, file: fileUrl };
      await DocumentService.updateEmployeeDoc(req.params.id, docData, userId);
      return response(res, true, 200, 'Employee document updated successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to update employee document.', null, err.message);
    }
  }

  static async deleteEmployeeDoc(req, res) {
    try {
      await DocumentService.deleteEmployeeDoc(req.params.id);
      return response(res, true, 200, 'Employee document deleted successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to delete employee document.', null, err.message);
    }
  }

  static async listEmployeeDocs(req, res) {
    try {
      const result = await DocumentService.listEmployeeDocs(req.query);
      return response(res, true, 200, 'Employee documents retrieved successfully.', result);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve employee documents.', null, err.message);
    }
  }

  // ─── COMPANY DOCUMENTS ───
  static async createCompanyDoc(req, res) {
    try {
      const userId = req.user?.id || 1;
      const fileUrl = req.file ? `uploads/company_documents/${req.file.filename}` : req.body.document_path;
      const docData = {
        company_id: req.body.company_id ? parseInt(req.body.company_id) : null,
        document_name: req.body.document_name,
        document_category: req.body.document_category,
        document_path: fileUrl,
        status: req.body.status || 'Active'
      };
      const result = await DocumentService.createCompanyDoc(docData, userId);
      return response(res, true, 201, 'Company document uploaded successfully.', result);
    } catch (err) {
      return response(res, false, 500, 'Failed to save company document.', null, err.message);
    }
  }

  static async updateCompanyDoc(req, res) {
    try {
      const userId = req.user?.id || 1;
      const fileUrl = req.file ? `uploads/company_documents/${req.file.filename}` : req.body.document_path;
      const docData = {
        company_id: req.body.company_id ? parseInt(req.body.company_id) : null,
        document_name: req.body.document_name,
        document_category: req.body.document_category,
        document_path: fileUrl,
        status: req.body.status
      };
      await DocumentService.updateCompanyDoc(req.params.id, docData, userId);
      return response(res, true, 200, 'Company document updated successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to update company document.', null, err.message);
    }
  }

  static async deleteCompanyDoc(req, res) {
    try {
      await DocumentService.deleteCompanyDoc(req.params.id);
      return response(res, true, 200, 'Company document deleted successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to delete company document.', null, err.message);
    }
  }

  static async listCompanyDocs(req, res) {
    try {
      const result = await DocumentService.listCompanyDocs(req.query);
      return response(res, true, 200, 'Company documents retrieved successfully.', result);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve company documents.', null, err.message);
    }
  }

  // ─── HR POLICIES ───
  static async createPolicy(req, res) {
    try {
      const userId = req.user?.id || 1;
      const result = await DocumentService.createPolicy(req.body, userId);
      return response(res, true, 201, 'HR Policy created successfully.', result);
    } catch (err) {
      return response(res, false, 500, 'Failed to save HR Policy.', null, err.message);
    }
  }

  static async updatePolicy(req, res) {
    try {
      const userId = req.user?.id || 1;
      await DocumentService.updatePolicy(req.params.id, req.body, userId);
      return response(res, true, 200, 'HR Policy updated successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to update HR Policy.', null, err.message);
    }
  }

  static async deletePolicy(req, res) {
    try {
      await DocumentService.deletePolicy(req.params.id);
      return response(res, true, 200, 'HR Policy deleted successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to delete HR Policy.', null, err.message);
    }
  }

  static async listPolicies(req, res) {
    try {
      const result = await DocumentService.listPolicies(req.query);
      return response(res, true, 200, 'HR Policies retrieved successfully.', result);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve HR Policies.', null, err.message);
    }
  }

  // ─── TEMPLATES ───
  static async createTemplate(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };

      if (req.file) {
        data.template_source_type = 'file';
        data.original_file_name = req.file.originalname;
        data.file_path = `uploads/templates/${req.file.filename}`;
        data.file_type = path.extname(req.file.originalname).toLowerCase();
        data.file_size = req.file.size;

        if (data.file_type === '.docx') {
          try {
            const extracted = await mammoth.extractRawText({ path: req.file.path });
            if (extracted && extracted.value && !data.content) {
              data.content = extracted.value.trim();
            }
          } catch (mErr) {
            console.warn('[Mammoth extraction error]', mErr.message);
          }
        }
      } else {
        data.template_source_type = data.template_source_type || 'editor';
      }

      const result = await DocumentService.createTemplate(data, userId);
      return response(res, true, 201, 'Template created successfully.', result);
    } catch (err) {
      return response(res, false, 500, 'Failed to save Template.', null, err.message);
    }
  }

  static async updateTemplate(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };

      if (req.file) {
        data.template_source_type = 'file';
        data.original_file_name = req.file.originalname;
        data.file_path = `uploads/templates/${req.file.filename}`;
        data.file_type = path.extname(req.file.originalname).toLowerCase();
        data.file_size = req.file.size;

        if (data.file_type === '.docx') {
          try {
            const extracted = await mammoth.extractRawText({ path: req.file.path });
            if (extracted && extracted.value && !data.content) {
              data.content = extracted.value.trim();
            }
          } catch (mErr) {
            console.warn('[Mammoth extraction error]', mErr.message);
          }
        }
      }

      await DocumentService.updateTemplate(req.params.id, data, userId);
      return response(res, true, 200, 'Template updated successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to update Template.', null, err.message);
    }
  }

  static async deleteTemplate(req, res) {
    try {
      await DocumentService.deleteTemplate(req.params.id);
      return response(res, true, 200, 'Template deleted successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to delete Template.', null, err.message);
    }
  }

  static async listTemplates(req, res) {
    try {
      const result = await DocumentService.listTemplates(req.query);
      return response(res, true, 200, 'Templates retrieved successfully.', result);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve Templates.', null, err.message);
    }
  }

  // ─── DIGITAL SIGNATURES ───
  static async createSignature(req, res) {
    try {
      const userId = req.user?.id || 1;
      const result = await DocumentService.createSignature(req.body, userId);
      return response(res, true, 201, 'Signature request created successfully.', result);
    } catch (err) {
      return response(res, false, 500, 'Failed to save signature request.', null, err.message);
    }
  }

  static async updateSignature(req, res) {
    try {
      const userId = req.user?.id || 1;
      await DocumentService.updateSignature(req.params.id, req.body, userId);
      return response(res, true, 200, 'Signature request updated successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to update signature request.', null, err.message);
    }
  }

  static async deleteSignature(req, res) {
    try {
      await DocumentService.deleteSignature(req.params.id);
      return response(res, true, 200, 'Signature request deleted successfully.');
    } catch (err) {
      return response(res, false, 500, 'Failed to delete signature request.', null, err.message);
    }
  }

  static async listSignatures(req, res) {
    try {
      const result = await DocumentService.listSignatures(req.query);
      return response(res, true, 200, 'Signature requests retrieved successfully.', result);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve signature requests.', null, err.message);
    }
  }

  // ─── META & DASHBOARD ───
  static async getMeta(req, res) {
    try {
      const meta = await DocumentService.getMeta();
      return response(res, true, 200, 'Metadata retrieved successfully.', meta);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve metadata.', null, err.message);
    }
  }

  static async getDashboard(req, res) {
    try {
      const dashboard = await DocumentService.getDashboard();
      return response(res, true, 200, 'Dashboard statistics retrieved successfully.', dashboard);
    } catch (err) {
      return response(res, false, 500, 'Failed to retrieve dashboard statistics.', null, err.message);
    }
  }
}

module.exports = DocumentController;
