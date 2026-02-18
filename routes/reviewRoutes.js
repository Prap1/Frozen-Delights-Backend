const express = require('express');
const router = express.Router();
const { createReview, getAllReviews, getProductReviews, deleteReview, getVendorReviews } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').post(protect, createReview);
router.route('/admin/all').get(protect, authorize('admin'), getAllReviews);
router.route('/vendor/all').get(protect, authorize('vendor'), getVendorReviews);
router.route('/product/:productId').get(getProductReviews);
router.route('/:id').delete(protect, authorize('admin'), deleteReview);

module.exports = router;
