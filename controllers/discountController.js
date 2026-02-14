const Discount = require('../models/Discount');

// Create Discount (Admin)
exports.createDiscount = async (req, res) => {
    try {
        const { code, percentage, expiryDate, applicableTo, targetId, minOrderValue } = req.body;

        // Basic validation for targetId based on applicableTo is handled by Mongoose schema 'required' function mostly,
        // but we can add extra checks if needed.
        let targetModel = undefined;
        if (applicableTo === 'product') targetModel = 'Product';
        if (applicableTo === 'category') targetModel = 'Category';

        const discount = await Discount.create({
            code,
            percentage,
            expiryDate,
            applicableTo,
            targetId,
            targetModel,
            minOrderValue
        });

        res.status(201).json({
            success: true,
            discount
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Discount code already exists' });
        }
        res.status(500).json({ message: err.message });
    }
};

// Get All Discounts (Admin)
exports.getAllDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.find();
        res.status(200).json({
            success: true,
            discounts
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Discount (Admin)
exports.deleteDiscount = async (req, res) => {
    try {
        const discount = await Discount.findById(req.params.id);
        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }

        await discount.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Discount deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Validate Discount (User/Checkout)
exports.validateDiscount = async (req, res) => {
    const { code, cartTotal } = req.body;

    try {
        if (!code) {
            return res.status(400).json({ message: 'Please provide a discount code' });
        }

        const discount = await Discount.findOne({ code: code.toUpperCase(), isActive: true });

        if (!discount) {
            return res.status(404).json({ message: 'Invalid or inactive discount code' });
        }

        if (new Date() > discount.expiryDate) {
            return res.status(400).json({ message: 'Discount code has expired' });
        }

        if (cartTotal < discount.minOrderValue) {
            return res.status(400).json({ message: `Minimum order value of ₹${discount.minOrderValue} required` });
        }

        // Calculate discount amount
        const discountAmount = (cartTotal * discount.percentage) / 100;

        res.status(200).json({
            success: true,
            discount: {
                code: discount.code,
                percentage: discount.percentage,
                amount: discountAmount
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
