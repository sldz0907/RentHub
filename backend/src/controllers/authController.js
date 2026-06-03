const { mssql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, password, email, phone } = req.body;
        if (!username || !password || !phone) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ các trường bắt buộc" });
        }
        
        // Use parameterized query to verify existing user safely
        const checkUser = await mssql.query`SELECT id FROM Users WHERE username = ${username} OR email = ${email}`;
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: "Username hoặc Email đã tồn tại" });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Use parameterized query to insert user securely
        await mssql.query`
            INSERT INTO Users (username, password, email, phone, role, is_active) 
            VALUES (${username}, ${hashedPassword}, ${email}, ${phone}, 'USER', 1)
        `;
        
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
        
        // Use parameterized query to fetch user safely
        const result = await mssql.query`SELECT * FROM Users WHERE username = ${username} OR email = ${username}`;
        const user = result.recordset[0];
        
        if (!user) {
            return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không đúng" });
        }
        
        if (user.is_active === false || user.is_active === 0) {
            return res.status(403).json({ message: "Tài khoản đã bị khóa" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không đúng" });
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'renthub_secret_key',
            { expiresIn: '24h' }
        );
        
        res.status(200).json({
            success: true,
            token,
            user: { 
                id: user.id, 
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
