const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Create New Review
exports.createReview = async (req, res) => {
    try {
        const { rating, comment, productId } = req.body;

        // 1. Verify Verified Purchase (Delivered Order)
        const order = await Order.findOne({
            user: req.user._id,
            "orderItems.product": productId,
            orderStatus: 'Delivered'
        });

        if (!order) {
            return res.status(400).json({
                message: 'You can only review products you have purchased and received.'
            });
        }

        // 2. Check if user already reviewed this product
        const existingReview = await Review.findOne({
            user: req.user._id,
            product: productId
        });

        if (existingReview) {
            return res.status(400).json({
                message: 'You have already reviewed this product.'
            });
        }

        // 3. Create Review
        const review = await Review.create({
            user: req.user._id,
            product: productId,
            rating: Number(rating),
            comment
        });

        // 4. Update Product (Push review & Recalculate Rating)
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const newReview = {
            user: req.user._id,
            name: req.user.username || 'User', // Fallback if username missing
            rating: Number(rating),
            comment,
        };

        product.reviews.push(newReview);
        product.numOfReviews = product.reviews.length;

        // Calculate Average
        let avg = 0;
        product.reviews.forEach((rev) => {
            avg += rev.rating;
        });
        product.ratings = avg / product.reviews.length;

        await product.save({ validateBeforeSave: false });

        res.status(201).json({
            success: true,
            review
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get All Reviews (Admin)
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'username email')
            .populate('product', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            reviews
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Reviews for a Product
exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate('user', 'username') // changed name to username based on User model
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            reviews
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Vendor Reviews
exports.getVendorReviews = async (req, res) => {
    try {
        // Find all products by this vendor
        const products = await Product.find({ vendor: req.user.id });
        const productIds = products.map(product => product._id);

        // Find reviews for these products
        const reviews = await Review.find({ product: { $in: productIds } })
            .populate('user', 'username')
            .populate('product', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            reviews
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Review (Admin)
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Also remove from Product reviews array
        const product = await Product.findById(review.product);
        if (product) {
            const reviews = product.reviews.filter(
                (rev) => rev.user.toString() !== review.user.toString()
            );

            let avg = 0;
            reviews.forEach((rev) => {
                avg += rev.rating;
            });

            let ratings = 0;
            if (reviews.length === 0) {
                ratings = 0;
            } else {
                ratings = avg / reviews.length;
            }

            const numOfReviews = reviews.length;

            await Product.findByIdAndUpdate(
                review.product,
                {
                    reviews,
                    ratings,
                    numOfReviews,
                },
                {
                    new: true,
                    runValidators: true,
                    useFindAndModify: false,
                }
            );
        }

        await review.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Review Deleted Successfully'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
