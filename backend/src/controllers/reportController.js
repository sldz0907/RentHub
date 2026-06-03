const { mssql } = require('../config/db');

exports.createReport = async (req, res) => {
    try {
        const { property_id, reason } = req.body;
        const reporter_id = req.user.id;

        if (!property_id || !reason) {
            return res.status(400).json({ message: "Thiếu thông tin báo cáo" });
        }

        await mssql.query`
            INSERT INTO Reports (reporter_id, property_id, reason, status)
            VALUES (${reporter_id}, ${property_id}, ${reason}, 'PENDING')
        `;

        res.status(201).json({ success: true, message: "Gửi báo cáo thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server khi gửi báo cáo", error: error.message });
    }
};
