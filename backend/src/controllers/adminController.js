const Payment = require('../models/Payment');
const Property = require('../models/Property');
const Report = require('../models/Report');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getRevenueStats = async (req, res) => {
    try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Total Revenue
        const totalResult = await Payment.aggregate([
            {
                $match: {
                    status: 'COMPLETED',
                    created_at: {
                        $gte: startOfMonth,
                        $lte: endOfMonth
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total_revenue: { $sum: '$amount' }
                }
            }
        ]);
        const totalRevenue = totalResult.length > 0 ? totalResult[0].total_revenue : 0;

        // Chart Data (Group by Month for current year)
        const currentYear = currentDate.getFullYear();
        const chartResult = await Payment.aggregate([
            { 
                $match: { 
                    status: 'COMPLETED',
                    created_at: {
                        $gte: new Date(currentYear, 0, 1),
                        $lte: new Date(currentYear, 11, 31, 23, 59, 59)
                    }
                } 
            },
            { 
                $group: { 
                    _id: { $month: "$created_at" },
                    revenue: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        const chartData = [];
        for (let i = 1; i <= 12; i++) {
            const monthData = chartResult.find(item => item._id === i);
            chartData.push({
                date: `Tháng ${i}`,
                revenue: monthData ? monthData.revenue : 0
            });
        }

        // Recent Transactions
        const recentTransactionsRaw = await Payment.find({ status: 'COMPLETED' })
            .populate('user_id', 'username email')
            .sort({ created_at: -1 })
            .limit(10)
            .lean();

        const recentTransactions = recentTransactionsRaw.map(t => ({
            id: t._id,
            user: t.user_id ? t.user_id.username : 'Ẩn danh',
            email: t.user_id ? t.user_id.email : '',
            amount: t.amount,
            date: t.created_at
        }));

        res.status(200).json({ 
            success: true, 
            data: { 
                revenue: totalRevenue,
                chartData: chartData,
                recentTransactions 
            } 
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi thống kê doanh thu", error: error.message });
    }
};

exports.getPropertyStats = async (req, res) => {
    try {
        const result = await Property.aggregate([
            {
                $group: {
                    _id: '$property_type',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    property_type: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ message: "Lỗi thống kê bất động sản", error: error.message });
    }
};

exports.getPendingReports = async (req, res) => {
    try {
        const reports = await Report.find({ status: 'PENDING' })
            .populate('reporter_id', 'username')
            .populate('property_id', 'title _id')
            .sort({ created_at: -1 })
            .lean();
            
        const formattedReports = reports.map(r => ({
            id: r._id,
            reason: r.reason,
            status: r.status,
            created_at: r.created_at,
            reporter: r.reporter_id ? r.reporter_id.username : null,
            property: r.property_id ? r.property_id.title : null,
            propertyId: r.property_id ? r.property_id._id : null
        }));
            
        res.status(200).json({ success: true, data: formattedReports });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách báo cáo", error: error.message });
    }
};

exports.resolveReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body; // 'ban' or 'dismiss'
        
        if (!id || !action) {
            return res.status(400).json({ message: "Thiếu thông tin" });
        }

        if (action === 'ban') {
            if (!reason) return res.status(400).json({ message: "Vui lòng nhập lý do khóa bài" });
            const report = await Report.findByIdAndUpdate(id, { status: 'RESOLVED_BANNED' });
            if (report && report.property_id) {
                const property = await Property.findByIdAndUpdate(report.property_id, { status: 'BANNED' });
                if (property) {
                    await Notification.create({
                        user_id: property.owner_id,
                        message: `Bài đăng "${property.title}" của bạn đã bị khóa do bị tố cáo vi phạm. Lý do: ${reason}`,
                        type: 'ERROR'
                    });
                }
            }
        } else if (action === 'dismiss') {
            await Report.findByIdAndUpdate(id, { status: 'DISMISSED' });
        }

        res.status(200).json({ success: true, message: "Đã xử lý báo cáo" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi xử lý báo cáo", error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.aggregate([
            { $match: { role: { $ne: 'ADMIN' } } },
            {
                $lookup: {
                    from: 'properties',
                    localField: '_id',
                    foreignField: 'owner_id',
                    as: 'properties'
                }
            },
            {
                $addFields: {
                    post_count: { $size: '$properties' }
                }
            },
            {
                $project: {
                    password: 0,
                    properties: 0
                }
            },
            { $sort: { created_at: -1 } }
        ]);
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách người dùng", error: error.message });
    }
};

exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

        // Admin shouldn't ban themselves
        if (user.role === 'ADMIN' && req.user.id === user._id.toString()) {
            return res.status(400).json({ message: "Bạn không thể khóa tài khoản của chính mình" });
        }

        user.is_active = !user.is_active;
        await user.save();
        
        res.status(200).json({ 
            success: true, 
            message: "Cập nhật trạng thái thành công", 
            data: { is_active: user.is_active } 
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật trạng thái", error: error.message });
    }
};

exports.getAdminProperties = async (req, res) => {
    try {
        const properties = await Property.find()
            .populate('owner_id', 'username email')
            .sort({ created_at: -1 })
            .lean();
        res.status(200).json({ success: true, data: properties });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách tin đăng", error: error.message });
    }
};

exports.togglePropertyStatus = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: "Không tìm thấy tin đăng" });

        const { reason } = req.body;
        const isBanning = property.status !== 'BANNED';

        if (isBanning && !reason) {
            return res.status(400).json({ message: "Vui lòng cung cấp lý do khóa bài đăng" });
        }

        // Toggle between ACTIVE and BANNED
        property.status = isBanning ? 'BANNED' : 'ACTIVE';
        await property.save();
        
        // Create Notification
        if (isBanning) {
            await Notification.create({
                user_id: property.owner_id,
                message: `Bài đăng "${property.title}" của bạn đã bị khóa. Lý do: ${reason}`,
                type: 'ERROR'
            });
        } else {
            await Notification.create({
                user_id: property.owner_id,
                message: `Bài đăng "${property.title}" của bạn đã được Admin mở khóa.`,
                type: 'SUCCESS'
            });
        }
        
        res.status(200).json({ 
            success: true, 
            message: "Cập nhật trạng thái tin đăng thành công", 
            data: { status: property.status } 
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật trạng thái tin đăng", error: error.message });
    }
};
