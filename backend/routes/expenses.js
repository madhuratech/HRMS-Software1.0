const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/ExpenseController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');

// Metadata & Dashboard & Reports
router.get('/meta', authenticateJWT, checkPermission('expenses', 'expense_claims', 'view'), ExpenseController.getMeta);
router.get('/dashboard', authenticateJWT, checkPermission('expenses', 'expense_claims', 'view'), ExpenseController.getDashboard);
router.get('/reports', authenticateJWT, checkPermission('expenses', 'expense_reports', 'view'), ExpenseController.getReports);

// Expense Categories
router.get('/categories', authenticateJWT, checkPermission('expenses', 'expense_categories', 'view'), ExpenseController.listCategories);
router.post('/categories', authenticateJWT, checkPermission('expenses', 'expense_categories', 'create'), ExpenseController.createCategory);
router.put('/categories/:id', authenticateJWT, checkPermission('expenses', 'expense_categories', 'edit'), ExpenseController.updateCategory);
router.delete('/categories/:id', authenticateJWT, checkPermission('expenses', 'expense_categories', 'delete'), ExpenseController.deleteCategory);

// Expense Claims
router.get('/claims', authenticateJWT, checkPermission('expenses', 'expense_claims', 'view'), ExpenseController.listClaims);
router.post('/claims', authenticateJWT, checkPermission('expenses', 'expense_claims', 'create'), ExpenseController.createClaim);
router.put('/claims/:id', authenticateJWT, checkPermission('expenses', 'expense_claims', 'edit'), ExpenseController.updateClaim);
router.delete('/claims/:id', authenticateJWT, checkPermission('expenses', 'expense_claims', 'delete'), ExpenseController.deleteClaim);
router.put('/claims/:id/approve', authenticateJWT, checkPermission('expenses', 'expense_approval', 'edit'), ExpenseController.approveClaim);

// Reimbursements
router.get('/reimbursements', authenticateJWT, checkPermission('expenses', 'expense_reimbursements', 'view'), ExpenseController.listReimbursements);
router.put('/reimbursements/:id/process', authenticateJWT, checkPermission('expenses', 'expense_reimbursements', 'edit'), ExpenseController.processReimbursement);

module.exports = router;
