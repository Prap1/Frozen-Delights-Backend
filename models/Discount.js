const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please enter discount code'],
        unique: true,
        uppercase: true,
        trim: true
    },
    percentage: {
        type: Number,
        required: [true, 'Please enter discount percentage'],
        min: [1, 'Percentage must be at least 1'],
        max: [100, 'Percentage cannot exceed 100']
    },
    expiryDate: {
        type: Date,
        required: [true, 'Please enter expiry date']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applicableTo: {
        type: String,
        enum: ['all', 'product', 'category', 'first_order'],
        default: 'all'
    },
    targetId: {
        type: mongoose.Schema.ObjectId,
        refPath: 'targetModel', // Dynamic reference based on context
        required: function () {
            return this.applicableTo === 'product' || this.applicableTo === 'category';
        }
    },
    targetModel: {
        type: String,
        enum: ['Product', 'Category'],
        required: function () {
            return this.applicableTo === 'product' || this.applicableTo === 'category';
        }
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Discount', discountSchema);
