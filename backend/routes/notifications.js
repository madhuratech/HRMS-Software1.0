const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const { authenticateJWT } = require('../middlewares/auth');

router.get('/', authenticateJWT, NotificationController.getNotifications);
router.put('/:id/read', authenticateJWT, NotificationController.markAsRead);
router.post('/mark-all-read', authenticateJWT, NotificationController.markAllRead);

module.exports = router;
