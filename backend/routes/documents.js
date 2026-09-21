const express = require('express');
const router = express.Router();
const DocumentController = require('../controllers/DocumentController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const upload = require('../utils/fileUpload');

// Metadata & Dashboard
router.get('/meta', authenticateJWT, checkPermission('documents', 'doc_employee', 'view'), DocumentController.getMeta);
router.get('/dashboard', authenticateJWT, checkPermission('documents', 'doc_employee', 'view'), DocumentController.getDashboard);

// Employee Documents (Supporting File Uploads)
router.get('/employee', authenticateJWT, checkPermission('documents', 'doc_employee', 'view'), DocumentController.listEmployeeDocs);
router.post('/employee', authenticateJWT, checkPermission('documents', 'doc_employee', 'create'), upload.single('file'), DocumentController.createEmployeeDoc);
router.put('/employee/:id', authenticateJWT, checkPermission('documents', 'doc_employee', 'edit'), upload.single('file'), DocumentController.updateEmployeeDoc);
router.delete('/employee/:id', authenticateJWT, checkPermission('documents', 'doc_employee', 'delete'), DocumentController.deleteEmployeeDoc);

// Company Documents
router.get('/company', authenticateJWT, checkPermission('documents', 'doc_company', 'view'), DocumentController.listCompanyDocs);
router.post('/company', authenticateJWT, checkPermission('documents', 'doc_company', 'create'), upload.single('file'), DocumentController.createCompanyDoc);
router.put('/company/:id', authenticateJWT, checkPermission('documents', 'doc_company', 'edit'), upload.single('file'), DocumentController.updateCompanyDoc);
router.delete('/company/:id', authenticateJWT, checkPermission('documents', 'doc_company', 'delete'), DocumentController.deleteCompanyDoc);

// HR Policies
router.get('/policies', authenticateJWT, checkPermission('documents', 'doc_policies', 'view'), DocumentController.listPolicies);
router.post('/policies', authenticateJWT, checkPermission('documents', 'doc_policies', 'create'), DocumentController.createPolicy);
router.put('/policies/:id', authenticateJWT, checkPermission('documents', 'doc_policies', 'edit'), DocumentController.updatePolicy);
router.delete('/policies/:id', authenticateJWT, checkPermission('documents', 'doc_policies', 'delete'), DocumentController.deletePolicy);

// Templates
router.get('/templates', authenticateJWT, checkPermission('documents', 'doc_templates', 'view'), DocumentController.listTemplates);
router.post('/templates', authenticateJWT, checkPermission('documents', 'doc_templates', 'create'), upload.single('file'), DocumentController.createTemplate);
router.put('/templates/:id', authenticateJWT, checkPermission('documents', 'doc_templates', 'edit'), upload.single('file'), DocumentController.updateTemplate);
router.delete('/templates/:id', authenticateJWT, checkPermission('documents', 'doc_templates', 'delete'), DocumentController.deleteTemplate);

// Digital Signatures
router.get('/signatures', authenticateJWT, checkPermission('documents', 'doc_signatures', 'view'), DocumentController.listSignatures);
router.post('/signatures', authenticateJWT, checkPermission('documents', 'doc_signatures', 'create'), DocumentController.createSignature);
router.put('/signatures/:id', authenticateJWT, checkPermission('documents', 'doc_signatures', 'edit'), DocumentController.updateSignature);
router.delete('/signatures/:id', authenticateJWT, checkPermission('documents', 'doc_signatures', 'delete'), DocumentController.deleteSignature);

module.exports = router;
