const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user_id: req.user.id })
            .sort({ created_at: -1 })
            .lean();
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy thông báo", error: error.message });
    }
};

exports.markNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user_id: req.user.id, is_read: false },
            { is_read: true }
        );
        res.status(200).json({ success: true, message: "Đã đánh dấu tất cả là đã đọc" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật thông báo", error: error.message });
    }
};
