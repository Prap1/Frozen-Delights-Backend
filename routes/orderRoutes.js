const express = require('express');
const router = express.Router();
const { newOrder, getSingleOrder, myOrders, getAllOrders, updateOrder, deleteOrder, getVendorOrders, cancelOrder, requestReturn, handleReturnRequest } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.route('/new').post(protect, newOrder);
router.route('/me').get(protect, myOrders);
router.route('/vendor/orders').get(protect, authorize('vendor'), getVendorOrders);

router.route('/:id')
    .get(protect, getSingleOrder)
    .delete(protect, authorize('admin', 'vendor'), deleteOrder);

// User cancel order
router.route('/:id/cancel').put(protect, cancelOrder);

// Admin / Vendor route for status update
router.route('/admin/:id')
    .put(protect, authorize('admin', 'vendor'), updateOrder);

router.route('/admin/all').get(protect, authorize('admin'), getAllOrders);

// Return Request Routes
router.route('/:id/return').post(protect, upload.array('images', 5), requestReturn);
router.route('/admin/:id/return').put(protect, authorize('admin', 'vendor'), handleReturnRequest);

module.exports = router;
