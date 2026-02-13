const Review = require('../models/Review');
const Product = require('../models/Product');

// Create New Review
exports.createReview = async (req, res) => {
    try {
        const { rating, comment, productId } = req.body;

        const review = await Review.create({
            user: req.user.id,
            product: productId,
            rating: Number(rating),
            comment
        });

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
            .populate('user', 'name email')
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
            .populate('user', 'name')
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

        await review.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Review Deleted Successfully'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
