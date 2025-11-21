const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * @desc    Send a notification to users/admins
 * @route   POST /api/notifications/send
 * @access  Private (Superadmin)
 */
exports.sendNotification = async (req, res) => {
    try {
        const { recipient, subject, message } = req.body;

        if (!recipient || !subject || !message) {
            return res.status(400).json({ message: 'Recipient, subject, and message are required.' });
        }

        let query = {};
        if (recipient === 'users') {
            query = { role: 'user' };
        } else if (recipient === 'admins') {
            query = { role: { $in: ['admin', 'superadmin'] } };
        }
        // 'all' means an empty query, which finds everyone.

        const targetUsers = await User.find(query).select('_id');

        if (targetUsers.length === 0) {
            return res.status(404).json({ message: 'No recipients found for the selected group.' });
        }

        const notifications = targetUsers.map(user => ({
            user: user._id,
            subject,
            message
        }));

        await Notification.insertMany(notifications);

        res.status(201).json({ message: `Notification sent successfully to ${targetUsers.length} recipients.` });

    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ message: 'Server error while sending notification.' });
    }
};

/**
 * @desc    Get notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private (All logged-in users)
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 0; // 0 means no limit

        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json(notifications);

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error while fetching notifications.' });
    }
};

/**
 * @desc    Mark notifications as read
 * @route   POST /api/notifications/read
 * @access  Private (User)
 */
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationIds } = req.body; // Expects an array of notification IDs

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({ message: 'notificationIds must be an array.' });
        }

        const result = await Notification.updateMany(
            { _id: { $in: notificationIds }, user: userId }, // Security check: only update user's own notifications
            { $set: { isRead: true } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ message: 'No matching notifications found to update.' });
        }

        res.status(200).json({ message: 'Notifications marked as read.' });

    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};