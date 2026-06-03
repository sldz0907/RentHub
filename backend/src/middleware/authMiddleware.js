const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Bạn cần đăng nhập để thực hiện" });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'renthub_secret_key');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Phiên đăng nhập hết hạn hoặc không hợp lệ" });
    }
};
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: "Không có quyền truy cập. Chỉ dành cho Admin." });
    }
};

module.exports = { protect, adminOnly };
