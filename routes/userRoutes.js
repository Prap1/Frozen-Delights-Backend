const express = require('express');
const router = express.Router();
const { getAllUsers, getSingleUser, updateUserRole, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getAllUsers);
router.route('/:id')
    .get(getSingleUser)
    .put(updateUserRole)
    .delete(deleteUser);

module.exports = router;
