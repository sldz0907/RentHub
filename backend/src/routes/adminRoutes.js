const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/stats/revenue', adminController.getRevenueStats);
router.get('/stats/properties', adminController.getPropertyStats);
router.get('/reports', adminController.getPendingReports);
router.put('/reports/:id', adminController.resolveReport);

module.exports = router;
