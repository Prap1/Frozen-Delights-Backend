const express = require('express');
const router = express.Router();
const { createCategory, getAllCategories, getSingleCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getAllCategories)
    .post(protect, authorize('admin'), createCategory);

router.route('/:id')
    .get(getSingleCategory)
    .put(protect, authorize('admin'), updateCategory)
    .delete(protect, authorize('admin'), deleteCategory);

module.exports = router;
