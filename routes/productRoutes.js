const express = require('express');
const router = express.Router();
const { getAllProducts, createProduct, updateProduct, deleteProduct, getProductDetails, getVendorProducts } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

const upload = require('../middleware/upload');

router.route('/').get(getAllProducts);
router.route('/vendor').get(protect, authorize('vendor', 'admin'), getVendorProducts);
router.route('/new').post(protect, authorize('admin', 'vendor'), upload.single('image'), createProduct);
router.route('/:id')
    .get(getProductDetails)
    .put(protect, authorize('admin', 'vendor'), upload.single('image'), updateProduct)
    .delete(protect, authorize('admin', 'vendor'), deleteProduct);

module.exports = router;
