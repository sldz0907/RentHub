const { mssql } = require('../config/db');

exports.getRevenueStats = async (req, res) => {
    try {
        const result = await mssql.query`
            SELECT SUM(amount) as total_revenue 
            FROM Payments 
            WHERE status = 'COMPLETED' 
            AND MONTH(created_at) = MONTH(GETDATE())
            AND YEAR(created_at) = YEAR(GETDATE())
        `;
        const revenue = result.recordset[0].total_revenue || 0;
        res.status(200).json({ success: true, data: { revenue } });
    } catch (error) {
        res.status(500).json({ message: "Lỗi thống kê doanh thu", error: error.message });
    }
};

exports.getPropertyStats = async (req, res) => {
    try {
        const result = await mssql.query`
            SELECT property_type, COUNT(*) as count 
            FROM Properties 
            GROUP BY property_type
        `;
        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ message: "Lỗi thống kê bất động sản", error: error.message });
    }
};

exports.getPendingReports = async (req, res) => {
    try {
        const result = await mssql.query`
            SELECT r.id, r.reason, r.status, r.created_at, u.username as reporter, p.title as property, p.id as propertyId
            FROM Reports r
            JOIN Users u ON r.reporter_id = u.id
            JOIN Properties p ON r.property_id = p.id
            WHERE r.status = 'PENDING'
            ORDER BY r.created_at DESC
        `;
        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách báo cáo", error: error.message });
    }
};

exports.resolveReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'ban' or 'dismiss'
        
        if (!id || !action) {
            return res.status(400).json({ message: "Thiếu thông tin" });
        }

        const transaction = new mssql.Transaction();
        await transaction.begin();

        try {
            if (action === 'ban') {
                const reportReq = new mssql.Request(transaction);
                await reportReq.query`UPDATE Reports SET status = 'RESOLVED_BANNED' WHERE id = ${id}`;
                
                const getPropReq = new mssql.Request(transaction);
                const reportRes = await getPropReq.query`SELECT property_id FROM Reports WHERE id = ${id}`;
                if (reportRes.recordset.length > 0) {
                    const property_id = reportRes.recordset[0].property_id;
                    const propReq = new mssql.Request(transaction);
                    await propReq.query`UPDATE Properties SET status = 'BANNED' WHERE id = ${property_id}`;
                }
            } else if (action === 'dismiss') {
                const reportReq = new mssql.Request(transaction);
                await reportReq.query`UPDATE Reports SET status = 'DISMISSED' WHERE id = ${id}`;
            }

            await transaction.commit();
            res.status(200).json({ success: true, message: "Đã xử lý báo cáo" });
        } catch (txError) {
            await transaction.rollback();
            throw txError;
        }
    } catch (error) {
        res.status(500).json({ message: "Lỗi xử lý báo cáo", error: error.message });
    }
};
