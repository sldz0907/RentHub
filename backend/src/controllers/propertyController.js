const Property = require('../models/Property');
const User = require('../models/User');
const Report = require('../models/Report');
const Payment = require('../models/Payment');
const bcrypt = require('bcryptjs');

exports.getAllProperties = async (req, res) => {
    try {
        const { city, district, property_type, minPrice, maxPrice } = req.query;
        
        const filter = { status: 'ACTIVE' };
        
        if (city) {
            filter.$or = [
                { city: { $regex: city, $options: 'i' } },
                { district: { $regex: city, $options: 'i' } },
                { address: { $regex: city, $options: 'i' } }
            ];
        }
        
        if (property_type && property_type !== 'all') {
            filter.property_type = property_type;
        }
        
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        
        const properties = await Property.find(filter)
            .populate('owner_id', 'username phone')
            .sort({ created_at: -1 })
            .lean();
            
        // Map _id to id and owner_id to flattened owner fields for backward compatibility
        const formattedProperties = properties.map(p => ({
            ...p,
            id: p._id,
            owner_username: p.owner_id ? p.owner_id.username : null,
            owner_phone: p.owner_id ? p.owner_id.phone : null,
            owner_id: p.owner_id ? p.owner_id._id : null
        }));
        
        res.status(200).json({ 
            success: true, 
            count: formattedProperties.length, 
            data: formattedProperties 
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Lỗi khi tải danh sách bất động sản", 
            error: error.message 
        });
    }
};

exports.getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Thiếu ID bất động sản" });
        }
        
        const property = await Property.findById(id)
            .populate('owner_id', 'username email phone')
            .lean();
            
        if (!property) {
            return res.status(404).json({ message: "Không tìm thấy bất động sản" });
        }
        
        // Format for backward compatibility
        const formattedProperty = {
            ...property,
            id: property._id,
            owner_username: property.owner_id ? property.owner_id.username : null,
            owner_email: property.owner_id ? property.owner_id.email : null,
            owner_phone: property.owner_id ? property.owner_id.phone : null,
            owner_id: property.owner_id ? property.owner_id._id : null
        };
        
        res.status(200).json({ 
            success: true, 
            data: formattedProperty 
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Lỗi khi lấy chi tiết bất động sản", 
            error: error.message 
        });
    }
};

exports.createProperty = async (req, res) => {
    try {
        const { title, description, price, area, address, city, district, property_type, images, video_url, features } = req.body;
        const owner_id = req.user.id; 
        
        if (!title || !price || !area || !address || !city || !district) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ các thông tin bắt buộc" });
        }
        
        const newProperty = await Property.create({
            owner_id,
            title,
            description,
            price,
            area,
            address,
            city,
            district,
            property_type,
            video_url,
            images: images || [],
            features: features || [],
            status: 'ACTIVE'
        });
        
        // Record the payment
        await Payment.create({
            user_id: owner_id,
            amount: 10000,
            status: 'COMPLETED'
        });
        
        res.status(201).json({ 
            success: true, 
            message: "Tạo bài đăng bất động sản thành công!", 
            propertyId: newProperty._id 
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Lỗi khi tạo bài đăng", 
            error: error.message 
        });
    }
};

exports.getMyProperties = async (req, res) => {
    try {
        const owner_id = req.user.id;
        
        const properties = await Property.find({ owner_id })
            .sort({ created_at: -1 })
            .lean();
            
        const formattedProperties = properties.map(p => ({
            ...p,
            id: p._id
        }));
        
        res.status(200).json({
            success: true,
            count: formattedProperties.length,
            data: formattedProperties
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi khi tải danh sách bài đăng của bạn",
            error: error.message
        });
    }
};

exports.updatePropertyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const owner_id = req.user.id;
        
        if (!status) {
            return res.status(400).json({ message: "Thiếu thông tin trạng thái" });
        }
        
        const property = await Property.findById(id);
        if (!property) {
            return res.status(404).json({ message: "Không tìm thấy bất động sản" });
        }
        
        if (property.owner_id.toString() !== owner_id) {
            return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa bất động sản này" });
        }
        
        property.status = status;
        await property.save();
        
        res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái thành công!"
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi khi cập nhật trạng thái",
            error: error.message
        });
    }
};

exports.deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        const owner_id = req.user.id;
        
        if (!password) {
            return res.status(400).json({ message: "Vui lòng nhập mật khẩu xác nhận" });
        }
        
        const user = await User.findById(owner_id);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy thông tin tài khoản" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu xác minh không chính xác!" });
        }
        
        const property = await Property.findById(id);
        if (!property) {
            return res.status(404).json({ message: "Không tìm thấy bất động sản" });
        }
        
        if (property.owner_id.toString() !== owner_id) {
            return res.status(403).json({ message: "Bạn không có quyền xóa bất động sản này" });
        }
        
        // Delete related reports
        await Report.deleteMany({ property_id: id });
        
        // Delete property
        await Property.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: "Xóa bài đăng thành công!"
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi khi xóa bài đăng",
            error: error.message
        });
    }
};

exports.updateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const owner_id = req.user.id;
        const { title, description, price, area, address, city, district, property_type, video_url, status, images, features } = req.body;
        
        const property = await Property.findById(id);
        if (!property) {
            return res.status(404).json({ message: "Không tìm thấy bất động sản" });
        }
        
        if (property.owner_id.toString() !== owner_id) {
            return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa bất động sản này" });
        }
        
        const updateData = {
            title,
            description,
            price,
            area,
            address,
            city,
            district,
            property_type,
            video_url,
            status: status || property.status
        };
        
        if (images !== undefined) updateData.images = images;
        if (features !== undefined) updateData.features = features;
        
        await Property.findByIdAndUpdate(id, updateData, { new: true });
        
        res.status(200).json({ success: true, message: "Cập nhật bài đăng thành công!" });
    } catch (error) {
        res.status(500).json({ 
            message: "Lỗi khi cập nhật bài đăng", 
            error: error.message 
        });
    }
};
