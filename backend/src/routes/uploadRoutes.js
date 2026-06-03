const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { upload } = require('../config/cloudinaryConfig');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, upload.array('images', 10), uploadController.uploadImages);

module.exports = router;
