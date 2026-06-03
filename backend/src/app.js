const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Root Health Check Route
app.get('/', (req, res) => {
    res.json({ message: "RentHub API is running and ready!" });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err.stack);
    res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi hệ thống trên server. Vui lòng liên hệ quản trị viên.",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;
