const express = require("express");
const router = express.Router();
const leavesController = require("../controllers/leavesController");
const { authenticateJWT, checkPermission } = require("../middlewares/auth");

router.use(authenticateJWT);

router.get("/dashboard-stats", checkPermission("leave", "leave_dashboard", "view"), leavesController.getDashboardStats);
router.get("/types", leavesController.getTypes);
router.post("/types", checkPermission("leave", "leave_types", "create"), leavesController.createType);
router.put("/types/:id", checkPermission("leave", "leave_types", "edit"), leavesController.updateType);
router.delete("/types/:id", checkPermission("leave", "leave_types", "delete"), leavesController.deleteType);
router.get("/all-balances", checkPermission("leave", "leave_balance", "view"), leavesController.getAllBalances);
router.get("/balances/:employee_id", checkPermission("leave", "leave_balance", "view"), leavesController.getBalances);
router.get("/applications", checkPermission("leave", "my_leave", "view"), leavesController.getApplications);
router.post("/applications", checkPermission("leave", "my_leave", "create"), leavesController.submitApplication);
router.put("/applications/:id", checkPermission("leave", "leave_approval", "edit"), leavesController.updateStatus);
router.put("/applications/:id/status", checkPermission("leave", "leave_approval", "edit"), leavesController.updateStatus);
router.get("/comp-off", checkPermission("leave", "comp_off", "view"), leavesController.getCompOffRequests);
router.post("/comp-off", checkPermission("leave", "comp_off", "create"), leavesController.submitCompOffRequest);
router.put("/comp-off/:id/status", checkPermission("leave", "leave_approval", "edit"), leavesController.updateCompOffStatus);

module.exports = router;
