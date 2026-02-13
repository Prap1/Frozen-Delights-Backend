const Product = require('../models/Product');
const cloudinary = require('../utils/cloudinary');
const fs = require('fs');

// Create Product -- Admin / Vendor
exports.createProduct = async (req, res) => {
    try {
        req.body.vendor = req.user.id;

        // Verify if req.body.images is NOT present then use file upload
        // If image uploaded
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'frozen_delight/products',
                });

                // Remove file from local uploads folder after successful upload
                fs.unlinkSync(req.file.path);

                req.body.images = [
                    {
                        public_id: result.public_id,
                        url: result.secure_url
                    }
                ];
            } catch (error) {
                // Remove file from local uploads folder even if upload fails
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({ message: 'Image upload failed', error: error.message });
            }
        } else if (!req.body.images) {
            // If no image uploaded and no images in body, provide a default or empty
            req.body.images = [];
        }

        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            product
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const ApiFeatures = require('../utils/apifeatures');

// Get All Products
exports.getAllProducts = async (req, res) => {
    try {
        const resultPerPage = 8;
        const productsCount = await Product.countDocuments();

        const apiFeature = new ApiFeatures(Product.find(), req.query)
            .search()
            .filter()
            .sort();

        let products = await apiFeature.query;
        let filteredProductsCount = products.length;

        apiFeature.pagination(resultPerPage);

        // We need to clone the query for pagination or handle it differently if we want exact count after filter
        // For simplicity reusing the query but Mongoose queries are distinct.
        // Let's re-run for pagination or just slice if dataset is small.
        // Actually ApiFeatures modifies the query object.
        // To get paginated results, we need to run pagination on the ALREADY filtered query.
        // But to get total count after filter, we need to execute before pagination.

        // Re-instantiating for safe pagination execution
        const apiFeaturePagination = new ApiFeatures(Product.find(), req.query)
            .search()
            .filter()
            .sort()
            .pagination(resultPerPage);

        const paginatedProducts = await apiFeaturePagination.query;


        res.status(200).json({
            success: true,
            products: paginatedProducts,
            productsCount,
            resultPerPage,
            filteredProductsCount,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Vendor Products
exports.getVendorProducts = async (req, res) => {
    try {
        const products = await Product.find({ vendor: req.user.id });
        res.status(200).json({
            success: true,
            products
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Product Details
exports.getProductDetails = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Product -- Admin / Vendor
exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check verification: Only owner (vendor) or admin can update
        if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this product' });
        }

        // Handle Image Update
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'frozen_delight/products',
                });

                // Remove file from local uploads folder after successful upload
                fs.unlinkSync(req.file.path);

                req.body.images = [
                    {
                        public_id: result.public_id,
                        url: result.secure_url
                    }
                ];
            } catch (error) {
                // Remove file from local uploads folder even if upload fails
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({ message: 'Image upload failed', error: error.message });
            }
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });

        res.status(200).json({
            success: true,
            product
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Product -- Admin / Vendor
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check verification: Only owner (vendor) or admin can delete
        if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this product' });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Product Delete Successfully'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
