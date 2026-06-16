const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/stats/revenue', adminController.getRevenueStats);
router.get('/stats/properties', adminController.getPropertyStats);
router.get('/reports', adminController.getPendingReports);
router.put('/reports/:id', adminController.resolveReport);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.get('/properties/list', adminController.getAdminProperties);
router.put('/properties/:id/status', adminController.togglePropertyStatus);

module.exports = router;
