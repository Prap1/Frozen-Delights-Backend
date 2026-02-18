const express = require('express');
const router = express.Router();
const { createDiscount, getAllDiscounts, deleteDiscount, validateDiscount, getVendorDiscounts, updateDiscount } = require('../controllers/discountController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin'), getAllDiscounts) // Keep root for Admin
    .post(protect, authorize('admin', 'vendor'), createDiscount);

router.route('/vendor')
    .get(protect, authorize('vendor'), getVendorDiscounts);

router.route('/:id')
    .put(protect, authorize('admin', 'vendor'), updateDiscount)
    .delete(protect, authorize('admin', 'vendor'), deleteDiscount);

router.route('/validate').post(validateDiscount); // Public or Protected depending on flow

module.exports = router;
