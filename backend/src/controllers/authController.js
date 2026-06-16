const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, password, email, phone } = req.body;
        if (!username || !password || !phone) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ các trường bắt buộc" });
        }
        
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: "Username hoặc Email đã tồn tại" });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({
            username,
            password: hashedPassword,
            email,
            phone,
            role: 'USER',
            is_active: true
        });
        
        await newUser.save();
        
        res.status(201).json({ success: true, message: "Đăng ký tài khoản thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server khi đăng ký", error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ username và password" });
        }
        
        const user = await User.findOne({ $or: [{ username }, { email: username }] });
        
        if (!user) {
            return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không đúng" });
        }
        
        if (user.is_active === false) {
            return res.status(403).json({ message: "Tài khoản đã bị khóa" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không đúng" });
        }
        
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'renthub_secret_key',
            { expiresIn: '24h' }
        );
        
        res.status(200).json({
            success: true,
            token,
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email, 
                phone: user.phone, 
                role: user.role 
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server khi đăng nhập", error: error.message });
    }
};
