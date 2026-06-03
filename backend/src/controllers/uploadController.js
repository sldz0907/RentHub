exports.uploadImages = (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "Không tìm thấy file nào để upload" });
        }

        const urls = req.files.map(file => file.path); // Cloudinary URL
        res.status(200).json({ success: true, urls });
    } catch (error) {
        res.status(500).json({ message: "Lỗi upload ảnh", error: error.message });
    }
};
