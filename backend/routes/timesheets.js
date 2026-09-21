const express = require('express');
const router = express.Router();
const TimesheetController = require('../controllers/TimesheetController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateTimesheet } = require('../validators/timesheetValidator');

router.get('/', authenticateJWT, checkPermission('projects', 'timesheets', 'view'), TimesheetController.list);
router.get('/summary', authenticateJWT, checkPermission('projects', 'timesheets', 'view'), TimesheetController.getSummary);
router.get('/:id', authenticateJWT, checkPermission('projects', 'timesheets', 'view'), TimesheetController.getById);

router.post('/', authenticateJWT, checkPermission('projects', 'timesheets', 'create'), validationMiddleware(validateTimesheet), TimesheetController.create);
router.put('/:id', authenticateJWT, checkPermission('projects', 'timesheets', 'edit'), validationMiddleware(validateTimesheet), TimesheetController.update);
router.delete('/:id', authenticateJWT, checkPermission('projects', 'timesheets', 'delete'), TimesheetController.delete);

module.exports = router;