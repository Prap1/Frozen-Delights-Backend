const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const User = require('../models/User');

/**
 * ============================
 * PROCESS PAYMENT
 * ============================
 * Creates PaymentIntent
 * Saves card for future payments
 */
exports.processPayment = catchAsyncErrors(async (req, res, next) => {
    const { amount, shippingInfo } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid payment amount',
        });
    }

    let customerId = req.user.stripeCustomerId;

    // Create Stripe Customer if not exists
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: req.user.email,
            name: shippingInfo?.name || req.user.name,
            address: {
                line1: shippingInfo?.address || '123 Test St',
                city: shippingInfo?.city || 'New Delhi',
                state: shippingInfo?.state || 'Delhi',
                postal_code: shippingInfo?.pinCode || '110001',
                country: 'IN',
            },
        });

        customerId = customer.id;

        // Save customerId in DB
        await User.findByIdAndUpdate(req.user.id, {
            stripeCustomerId: customerId,
        });
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // Backend receives amount in paise/cents from frontend
        currency: 'inr',
        payment_method_types: ['card'],
        description: 'Food Items Purchase', // Required for Indian regulations
        customer: customerId,
        // setup_future_usage: 'off_session', // Commented out to simplify testing
        metadata: {
            company: 'Frozen Delight',
        },
    });

    res.status(200).json({
        success: true,
        client_secret: paymentIntent.client_secret,
    });
});

/**
 * ============================
 * SEND STRIPE PUBLIC API KEY
 * ============================
 */
exports.sendStripeApiKey = catchAsyncErrors(async (req, res, next) => {
    res.status(200).json({
        stripeApiKey: process.env.STRIPE_API_KEY,
    });
});

/**
 * ============================
 * GET SAVED CARDS
 * ============================
 */
exports.getSavedCards = catchAsyncErrors(async (req, res, next) => {
    if (!req.user.stripeCustomerId) {
        return res.status(200).json({
            success: true,
            cards: [],
        });
    }

    const paymentMethods = await stripe.paymentMethods.list({
        customer: req.user.stripeCustomerId,
        type: 'card',
    });

    res.status(200).json({
        success: true,
        cards: paymentMethods.data,
    });
});
