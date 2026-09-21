const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");
const { authenticateJWT, checkPermission } = require("../middlewares/auth");

// Enforce JWT authentication on all payroll endpoints
router.use(authenticateJWT);

// 1. Listing & Personal Payslips
router.get("/", checkPermission("payroll", "generate_payslips", "view"), payrollController.list);
router.get("/payslips", checkPermission("payroll", "generate_payslips", "view"), payrollController.list);
router.get("/my-payroll", payrollController.getMyPayroll);

// 2. Generation & Bulk Actions (HR / Admin only)
router.post("/generate", checkPermission("payroll", "payroll_processing", "create"), payrollController.generate);
router.post("/bulk-approve", checkPermission("payroll", "payroll_processing", "edit"), payrollController.bulkApprove);
router.post("/bulk-mark-paid", checkPermission("payroll", "payroll_processing", "edit"), payrollController.bulkMarkPaid);

// 3. Salary Structures
router.get("/structures", checkPermission("payroll", "salary_structure", "view"), payrollController.getStructures);
router.get("/structures/:id", checkPermission("payroll", "salary_structure", "view"), payrollController.getStructureById);
router.post("/structures", checkPermission("payroll", "salary_structure", "create"), payrollController.createStructure);
router.put("/structures/:id", checkPermission("payroll", "salary_structure", "edit"), payrollController.updateStructure);
router.delete("/structures/:id", checkPermission("payroll", "salary_structure", "delete"), payrollController.deleteStructure);
router.post("/structures/assign", checkPermission("payroll", "salary_structure", "create"), payrollController.assignStructure);

// 4. Salary Components
router.get("/components", checkPermission("payroll", "salary_components", "view"), payrollController.getComponents);
router.post("/components", checkPermission("payroll", "salary_components", "create"), payrollController.createComponent);
router.put("/components/:id", checkPermission("payroll", "salary_components", "edit"), payrollController.updateComponent);
router.delete("/components/:id", checkPermission("payroll", "salary_components", "delete"), payrollController.deleteComponent);

// 5. Bonuses & Incentives
router.get("/bonuses", checkPermission("payroll", "bonus_incentives", "view"), payrollController.getBonuses);
router.post("/bonuses", checkPermission("payroll", "bonus_incentives", "create"), payrollController.createBonus);
router.put("/bonuses/:id/status", checkPermission("payroll", "bonus_incentives", "edit"), payrollController.updateBonusStatus);

// 6. Expense Reimbursements
router.get("/reimbursements", checkPermission("payroll", "reimbursements", "view"), payrollController.getReimbursements);
router.post("/reimbursements", checkPermission("payroll", "reimbursements", "create"), payrollController.createReimbursement);
router.put("/reimbursements/:id/status", checkPermission("payroll", "reimbursements", "edit"), payrollController.updateReimbursementStatus);

// 7. Loans & Advances
router.get("/loans", checkPermission("payroll", "loans_advances", "view"), payrollController.getLoans);
router.post("/loans", checkPermission("payroll", "loans_advances", "create"), payrollController.createLoan);
router.put("/loans/:id/status", checkPermission("payroll", "loans_advances", "edit"), payrollController.updateLoanStatus);

// 8. Tax Management
router.get("/taxes", checkPermission("payroll", "tax_management", "view"), payrollController.getTaxes);
router.post("/taxes", checkPermission("payroll", "tax_management", "create"), payrollController.createTax);
router.put("/taxes/:id/verify", checkPermission("payroll", "tax_management", "edit"), payrollController.verifyTax);

// 9. Runs & Reports
router.get("/runs", checkPermission("payroll", "payroll_processing", "view"), payrollController.getRuns);
router.post("/runs", checkPermission("payroll", "payroll_processing", "create"), payrollController.initializeRun);
router.get("/reports", checkPermission("payroll", "payroll_processing", "view"), payrollController.getReports);

// 10. Individual Record Actions (Parameterized :id at the bottom to prevent route collisions)
router.get("/:id", payrollController.getById);
router.put("/:id", checkPermission("payroll", "payroll_processing", "edit"), payrollController.update);
router.post("/:id/approve", checkPermission("payroll", "payroll_processing", "edit"), payrollController.approve);
router.post("/:id/mark-paid", checkPermission("payroll", "payroll_processing", "edit"), payrollController.markPaid);
router.get("/:id/payslip", payrollController.getPayslip);
router.get("/:id/download-pdf", payrollController.downloadPayslipPdf);
router.get("/:id/pdf", payrollController.downloadPayslipPdf);

module.exports = router;
