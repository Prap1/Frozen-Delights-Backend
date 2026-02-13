const express = require('express');
const router = express.Router();
const { newOrder, getSingleOrder, myOrders, getAllOrders, updateOrder, deleteOrder, getVendorOrders } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/new').post(protect, newOrder);
router.route('/me').get(protect, myOrders);
router.route('/vendor/orders').get(protect, authorize('vendor'), getVendorOrders);

router.route('/:id')
    .get(protect, getSingleOrder)
    .delete(protect, authorize('admin'), deleteOrder);

// Admin / Vendor route for status update
router.route('/admin/:id')
    .put(protect, authorize('admin', 'vendor'), updateOrder);

router.route('/admin/all').get(protect, authorize('admin'), getAllOrders);

module.exports = router;
