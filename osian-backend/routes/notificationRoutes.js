const express = require('express');
const router = express.Router();
const { sendNotification, getNotifications, markAsRead } = require('../controllers/notificationController');
const { protect, superadmin } = require('../middleware/authMiddleware');

// @route   POST /api/notifications/send
// @desc    Send a notification to a group of users
// @access  Private/Superadmin
router.post('/send', protect, superadmin, sendNotification);

// @route   GET /api/notifications
// @desc    Get all notifications for the logged-in user
// @access  Private
router.get('/', protect, getNotifications);

// @route   POST /api/notifications/read
// @desc    Mark one or more notifications as read
// @access  Private
router.post('/read', protect, markAsRead);

module.exports = router;