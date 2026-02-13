const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getSingleUser,
    updateUserRole,
    deleteUser,
    requestVendorDetails,
    getAllVendorRequests,
    updateVendorStatus
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// User routes
router.post('/become-vendor', requestVendorDetails);

// Admin routes
router.get('/admin/vendor-requests', authorize('admin'), getAllVendorRequests);
router.put('/admin/vendor-status/:id', authorize('admin'), updateVendorStatus);

router.route('/')
    .get(authorize('admin'), getAllUsers);

router.route('/:id')
    .get(authorize('admin'), getSingleUser)
    .put(authorize('admin'), updateUserRole)
    .delete(authorize('admin'), deleteUser);

module.exports = router;
