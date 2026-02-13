const express = require('express');
const router = express.Router();
const { createDiscount, getAllDiscounts, deleteDiscount, validateDiscount } = require('../controllers/discountController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'vendor'), getAllDiscounts)
    .post(protect, authorize('admin', 'vendor'), createDiscount);

router.route('/:id')
    .delete(protect, authorize('admin', 'vendor'), deleteDiscount);

router.route('/validate').post(validateDiscount); // Public or Protected depending on flow

module.exports = router;
