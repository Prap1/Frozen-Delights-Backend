const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['feature', 'announcement', 'about', 'faq'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    subtitle: {
        type: String // Used as Category for FAQs
    },
    image: {
        type: String // For About Us or other visual content
    },
    icon: {
        type: String // For features (emoji or icon class)
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Content', contentSchema);
