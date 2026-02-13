const express = require('express');
const router = express.Router();
const { processPayment, sendStripeApiKey, getSavedCards } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/process').post(protect, processPayment);
router.route('/stripeapikey').get(protect, sendStripeApiKey);
router.route('/payment/saved-cards').get(protect, getSavedCards);

module.exports = router;
