const { mssql } = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAllProperties = async (req, res) => {
    try {
        const { city, district, property_type, minPrice, maxPrice } = req.query;
        
        // Build a dynamic and parameterized query using mssql.Request to prevent SQL injection
        const request = new mssql.Request();
        let queryStr = `
            SELECT p.*, u.username as owner_username, u.phone as owner_phone 
            FROM Properties p 
            JOIN Users u ON p.owner_id = u.id 
            WHERE p.status = 'ACTIVE'
        `;
        
        if (city) {
            request.input('city', mssql.NVarChar, `%${city}%`);
            queryStr += ` AND (p.city LIKE @city OR p.district LIKE @city OR p.address LIKE @city)`;
        }
        
        if (property_type && property_type !== 'all') {
            request.input('property_type', mssql.NVarChar, property_type);
            queryStr += ` AND p.property_type = @property_type`;
        }
        
        if (minPrice) {
            request.input('minPrice', mssql.Decimal(18, 2), parseFloat(minPrice));
            queryStr += ` AND p.price >= @minPrice`;
        }
        
        if (maxPrice) {
            request.input('maxPrice', mssql.Decimal(18, 2), parseFloat(maxPrice));
            queryStr += ` AND p.price <= @maxPrice`;
        }
        
        queryStr += ` ORDER BY p.created_at DESC`;
        
        const result = await request.query(queryStr);
        const properties = result.recordset;
        
        // Attach associated images to each property in the list (Avoid N+1 queries by pulling all images and mapping them)
        if (properties.length > 0) {
            const imagesResult = await mssql.query`SELECT property_id, url FROM Images`;
            const imageMap = {};
            imagesResult.recordset.forEach(img => {
                if (!imageMap[img.property_id]) {
                    imageMap[img.property_id] = [];
                }
                imageMap[img.property_id].push(img.url);
            });
            
            properties.forEach(p => {
                p.images = imageMap[p.id] || [];
            });
        }
        
        res.status(200).json({ 
            success: true, 
            count: properties.length, 
            data: properties 
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
        
        // Parameterized query to fetch the property details securely
        const propResult = await mssql.query`
            SELECT p.*, u.username as owner_username, u.email as owner_email, u.phone as owner_phone
            FROM Properties p
            JOIN Users u ON p.owner_id = u.id
            WHERE p.id = ${id}
        `;
        
        const property = propResult.recordset[0];
        if (!property) {
            return res.status(404).json({ message: "Không tìm thấy bất động sản" });
        }
        
        // Parameterized query to fetch associated images securely
        const imgResult = await mssql.query`SELECT url FROM Images WHERE property_id = ${id}`;
        property.images = imgResult.recordset.map(img => img.url);
        
        // Parameterized query to fetch associated features securely
        const featResult = await mssql.query`SELECT feature_id FROM PropertyFeatures WHERE property_id = ${id}`;
        property.features = featResult.recordset.map(f => f.feature_id);
        
        res.status(200).json({ 
            success: true, 
            data: property 
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
        
        const transaction = new mssql.Transaction();
        await transaction.begin();
        
        try {
            // Bước A: INSERT vào bảng Properties
            const request = new mssql.Request(transaction);
            const result = await request.query`
                INSERT INTO Properties (owner_id, title, description, price, area, address, city, district, property_type, video_url, status)
                OUTPUT INSERTED.id
                VALUES (${owner_id}, ${title}, ${description}, ${price}, ${area}, ${address}, ${city}, ${district}, ${property_type}, ${video_url || null}, 'ACTIVE')
            `;
            
            const newPropertyId = result.recordset[0].id;
            
            // Bước B: Chạy vòng lặp INSERT các URL ảnh vào bảng Images
            if (images && images.length > 0) {
                for (let imgUrl of images) {
                    if (imgUrl && imgUrl.trim() !== '') {
                        const imgReq = new mssql.Request(transaction);
                        await imgReq.query`INSERT INTO Images (property_id, url) VALUES (${newPropertyId}, ${imgUrl})`;
                    }
                }
            }
            
            // Bước C: Chạy vòng lặp INSERT các mã tiện ích vào bảng PropertyFeatures
            if (features && features.length > 0) {
                for (let featureId of features) {
                    if (featureId && featureId.trim() !== '') {
                        const featReq = new mssql.Request(transaction);
                        await featReq.query`INSERT INTO PropertyFeatures (property_id, feature_id) VALUES (${newPropertyId}, ${featureId})`;
                    }
                }
            }
            
            await transaction.commit();
            
            res.status(201).json({ 
                success: true, 
                message: "Tạo bài đăng bất động sản thành công!", 
                propertyId: newPropertyId 
            });
        } catch (txError) {
            await transaction.rollback();
            throw txError;
        }
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
        
        // Fetch properties owned by the user
        const result = await mssql.query`
            SELECT p.* 
            FROM Properties p 
            WHERE p.owner_id = ${owner_id}
            ORDER BY p.created_at DESC
        `;
        const properties = result.recordset;
        
        // Attach images
        if (properties.length > 0) {
            const imagesResult = await mssql.query`SELECT property_id, url FROM Images`;
            const imageMap = {};
            imagesResult.recordset.forEach(img => {
                if (!imageMap[img.property_id]) {
                    imageMap[img.property_id] = [];
                }
                imageMap[img.property_id].push(img.url);
            });
            
            properties.forEach(p => {
                p.images = imageMap[p.id] || [];
            });
        }
        
        res.status(200).json({
            success: true,
            count: properties.length,
            data: properties
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
        
        // Check ownership
        const propCheck = await mssql.query`SELECT owner_id FROM Properties WHERE id = ${id}`;
        if (propCheck.recordset.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy bất động sản" });
        }
        if (propCheck.recordset[0].owner_id !== owner_id) {
            return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa bất động sản này" });
        }
        
        await mssql.query`
            UPDATE Properties 
            SET status = ${status} 
            WHERE id = ${id}
        `;
        
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
        
        // Fetch user password hash
        const userRes = await mssql.query`SELECT password FROM Users WHERE id = ${owner_id}`;
        if (userRes.recordset.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy thông tin tài khoản" });
        }
        
        const userPass = userRes.recordset[0].password;
        const isMatch = await bcrypt.compare(password, userPass);
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu xác minh không chính xác!" });
        }
        
        // Check ownership
        const propCheck = await mssql.query`SELECT owner_id FROM Properties WHERE id = ${id}`;
        if (propCheck.recordset.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy bất động sản" });
        }
        if (propCheck.recordset[0].owner_id !== owner_id) {
            return res.status(403).json({ message: "Bạn không có quyền xóa bất động sản này" });
        }
        
        const transaction = new mssql.Transaction();
        await transaction.begin();
        
        try {
            // Delete dependent records
            const imgReq = new mssql.Request(transaction);
            await imgReq.query`DELETE FROM Images WHERE property_id = ${id}`;
            
            const featReq = new mssql.Request(transaction);
            await featReq.query`DELETE FROM PropertyFeatures WHERE property_id = ${id}`;
            
            const repReq = new mssql.Request(transaction);
            await repReq.query`DELETE FROM Reports WHERE property_id = ${id}`;
            
            const propReq = new mssql.Request(transaction);
            await propReq.query`DELETE FROM Properties WHERE id = ${id}`;
            
            await transaction.commit();
            
            res.status(200).json({
                success: true,
                message: "Xóa bài đăng thành công!"
            });
        } catch (txError) {
            await transaction.rollback();
            throw txError;
        }
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
        
        // Check ownership
        const propCheck = await mssql.query`SELECT owner_id FROM Properties WHERE id = ${id}`;
        if (propCheck.recordset.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy bất động sản" });
        }
        if (propCheck.recordset[0].owner_id !== owner_id) {
            return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa bất động sản này" });
        }
        
        const transaction = new mssql.Transaction();
        await transaction.begin();
        
        try {
            const reqProp = new mssql.Request(transaction);
            await reqProp.query`
                UPDATE Properties 
                SET title = ${title},
                    description = ${description},
                    price = ${price},
                    area = ${area},
                    address = ${address},
                    city = ${city},
                    district = ${district},
                    property_type = ${property_type},
                    video_url = ${video_url || null},
                    status = ${status || 'ACTIVE'}
                WHERE id = ${id}
            `;
            
            // Update images (delete old, insert new)
            if (images !== undefined) {
                const reqDelImg = new mssql.Request(transaction);
                await reqDelImg.query`DELETE FROM Images WHERE property_id = ${id}`;
                
                if (images && images.length > 0) {
                    for (let imgUrl of images) {
                        if (imgUrl && imgUrl.trim() !== '') {
                            const imgReq = new mssql.Request(transaction);
                            await imgReq.query`INSERT INTO Images (property_id, url) VALUES (${id}, ${imgUrl})`;
                        }
                    }
                }
            }
            
            // Update features (delete old, insert new)
            if (features !== undefined) {
                const reqDelFeat = new mssql.Request(transaction);
                await reqDelFeat.query`DELETE FROM PropertyFeatures WHERE property_id = ${id}`;
                
                if (features && features.length > 0) {
                    for (let featureId of features) {
                        if (featureId && featureId.trim() !== '') {
                            const featReq = new mssql.Request(transaction);
                            await featReq.query`INSERT INTO PropertyFeatures (property_id, feature_id) VALUES (${id}, ${featureId})`;
                        }
                    }
                }
            }
            
            await transaction.commit();
            res.status(200).json({ success: true, message: "Cập nhật bài đăng thành công!" });
        } catch (txError) {
            await transaction.rollback();
            throw txError;
        }
    } catch (error) {
        res.status(500).json({ 
            message: "Lỗi khi cập nhật bài đăng", 
            error: error.message 
        });
    }
};

