const Notification = require('../models/Notification');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

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

exports.updateProfile = async (req, res) => {
    try {
        const { phone, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
        
        let isUpdated = false;

        // Cập nhật số điện thoại
        if (phone && phone !== user.phone) {
            user.phone = phone;
            isUpdated = true;
        }

        // Cập nhật mật khẩu
        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác" });
            }
            
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            isUpdated = true;
        }

        if (isUpdated) {
            await user.save();
            return res.status(200).json({ 
                success: true, 
                message: "Cập nhật thông tin thành công!",
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                }
            });
        }

        res.status(200).json({ success: true, message: "Không có thông tin nào được thay đổi" });

    } catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật thông tin", error: error.message });
    }
};
