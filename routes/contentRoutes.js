const express = require('express');
const router = express.Router();
const {
    getBanners, getAllBanners, createBanner, updateBanner, deleteBanner,
    getContent, getAllContent, createContent, updateContent, deleteContent
} = require('../controllers/contentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public
router.get('/banners', getBanners);
router.get('/items', getContent);

// Admin Routes
router.use(protect, authorize('admin'));

router.route('/admin/banners')
    .get(getAllBanners)
    .post(createBanner);

router.route('/admin/banners/:id')
    .put(updateBanner)
    .delete(deleteBanner);

router.route('/admin/items')
    .get(getAllContent)
    .post(createContent);

router.route('/admin/items/:id')
    .put(updateContent)
    .delete(deleteContent);

module.exports = router;
