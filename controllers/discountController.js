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

// Validate Discount (User/Checkout) - Optional helper
exports.validateDiscount = async (req, res) => {
    const { code, cartTotal, productIds, categoryIds, isFirstOrder } = req.body;
    try {
        const discount = await Discount.findOne({ code: code.toUpperCase(), isActive: true });

        if (!discount) {
            return res.status(404).json({ message: 'Invalid discount code' });
        }

        if (new Date() > discount.expiryDate) {
            return res.status(400).json({ message: 'Discount code expired' });
        }

        if (cartTotal < discount.minOrderValue) {
            return res.status(400).json({ message: `Minimum order value of $${discount.minOrderValue} required` });
        }

        // Logic check for applicableTo (simplified)
        // This is where you'd implement the complex logic checking productIds vs targetId
        let isValid = true;
        if (discount.applicableTo === 'first_order' && !isFirstOrder) {
            isValid = false;
        }
        // ... more checks for product/category

        if (!isValid) {
            return res.status(400).json({ message: 'Discount code not applicable to this order' });
        }

        res.status(200).json({
            success: true,
            discount
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
