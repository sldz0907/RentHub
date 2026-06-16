const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/notifications', protect, userController.getNotifications);
router.put('/notifications/read', protect, userController.markNotificationsAsRead);

module.exports = router;
