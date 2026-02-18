const Discount = require('../models/Discount');

// Create Discount (Admin/Vendor)
exports.createDiscount = async (req, res) => {
    try {
        let { code, percentage, expiryDate, applicableTo, targetId, minOrderValue } = req.body;

        // Basic validation for targetId based on applicableTo is handled by Mongoose schema 'required' function mostly,
        // but we can add extra checks if needed.
        let targetModel = undefined;
        if (applicableTo === 'product') targetModel = 'Product';
        if (applicableTo === 'category') targetModel = 'Category';

        // Ensure targetId is undefined if empty string (to avoid CastError) or not applicable
        if (targetId === '' || (applicableTo !== 'product' && applicableTo !== 'category')) {
            targetId = undefined;
        }

        // If Vendor, ensure target belongs to them
        if (req.user.role === 'vendor' && applicableTo === 'product' && targetId) {
            const Product = require('../models/Product');
            const product = await Product.findById(targetId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            if (product.vendor.toString() !== req.user.id) {
                return res.status(403).json({ message: 'You can only create discounts for your own products' });
            }
        }

        const discount = await Discount.create({
            code,
            percentage,
            expiryDate,
            applicableTo,
            targetId,
            targetModel,
            minOrderValue,
            vendor: req.user.id
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

// Get Vendor Discounts
exports.getVendorDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.find({ vendor: req.user.id });
        res.status(200).json({
            success: true,
            discounts
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get All Discounts (Admin)
exports.getAllDiscounts = async (req, res) => {
    try {
        // Admin sees all? Or should we filter? Admin dashboard likely expects all.
        const discounts = await Discount.find().populate('vendor', 'username');
        res.status(200).json({
            success: true,
            discounts
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Discount (Admin/Vendor)
exports.updateDiscount = async (req, res) => {
    try {
        let discount = await Discount.findById(req.params.id);

        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }

        // Check ownership
        if (discount.vendor && discount.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this discount' });
        }

        // If trying to update targetId, handle empty string same as create
        if (req.body.targetId === '' || (req.body.applicableTo && req.body.applicableTo !== 'product' && req.body.applicableTo !== 'category')) {
            req.body.targetId = undefined;
        }

        // Logic for vendor updating target product ownership
        if (req.user.role === 'vendor' && req.body.applicableTo === 'product' && req.body.targetId) {
            const Product = require('../models/Product');
            const product = await Product.findById(req.body.targetId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            if (product.vendor.toString() !== req.user.id) {
                return res.status(403).json({ message: 'You can only create/update discounts for your own products' });
            }
        }

        // Handle logic where applicableTo changes (e.g. from product to all), make sure targetId/Model are updated/cleared if needed
        if (req.body.applicableTo) {
            if (req.body.applicableTo === 'product') req.body.targetModel = 'Product';
            else if (req.body.applicableTo === 'category') req.body.targetModel = 'Category';
            else {
                req.body.targetModel = undefined;
                req.body.targetId = undefined;
            }
        }

        discount = await Discount.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });

        res.status(200).json({
            success: true,
            discount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Discount (Admin/Vendor)
exports.deleteDiscount = async (req, res) => {
    try {
        const discount = await Discount.findById(req.params.id);
        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }

        // Check ownership
        if (discount.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this discount' });
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

        // Calculate discount amount
        let discountAmount = 0;
        let applicableTotal = cartTotal;

        // If Vendor Discount, only apply to their products
        if (discount.vendor) {
            if (!req.body.cartItems || req.body.cartItems.length === 0) {
                return res.status(400).json({ message: 'Cart items required for validation' });
            }

            const Product = require('../models/Product');
            const productIds = req.body.cartItems.map(item => item.product);
            const vendorProducts = await Product.find({
                _id: { $in: productIds },
                vendor: discount.vendor
            });

            const vendorProductIds = vendorProducts.map(p => p._id.toString());

            // Calculate total for eligible items
            let eligibleItemsTotal = 0;
            req.body.cartItems.forEach(item => {
                if (vendorProductIds.includes(item.product)) {
                    eligibleItemsTotal += item.price * item.quantity;
                }
            });

            if (eligibleItemsTotal === 0) {
                return res.status(400).json({ message: 'This coupon is not applicable to any items in your cart' });
            }

            if (eligibleItemsTotal < discount.minOrderValue) {
                return res.status(400).json({ message: `Minimum order value for this vendor's products is ₹${discount.minOrderValue}` });
            }

            discountAmount = (eligibleItemsTotal * discount.percentage) / 100;
        } else {
            // Admin Discount (Apply to total for now, or improve logic later)
            if (cartTotal < discount.minOrderValue) {
                return res.status(400).json({ message: `Minimum order value of ₹${discount.minOrderValue} required` });
            }
            discountAmount = (cartTotal * discount.percentage) / 100;
        }

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
