const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    createUser,
    getSingleUser,
    updateUserRole,
    deleteUser,
    requestVendorDetails,
    getAllVendorRequests,
    updateVendorStatus,
    updateUserProfile,
    toggleBlockStatus
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.use(protect);

// User routes
router.put('/profile/update', upload.single('profileImage'), updateUserProfile);
router.post('/become-vendor', requestVendorDetails);

// Admin routes
router.get('/admin/vendor-requests', authorize('admin'), getAllVendorRequests);
router.put('/admin/vendor-status/:id', authorize('admin'), updateVendorStatus);
router.put('/admin/users/:id/block', authorize('admin'), toggleBlockStatus);

router.route('/')
    .get(authorize('admin'), getAllUsers)
    .post(authorize('admin'), createUser);

router.route('/:id')
    .get(authorize('admin'), getSingleUser)
    .put(authorize('admin'), updateUserRole)
    .delete(authorize('admin'), deleteUser);

module.exports = router;
