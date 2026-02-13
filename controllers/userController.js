const User = require('../models/User');

// Get all users (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({
            success: true,
            users
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get single user (Admin)
exports.getSingleUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update user role (Admin)
exports.updateUserRole = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = req.body.role || user.role;
        user.isVerified = req.body.isVerified === undefined ? user.isVerified : req.body.isVerified;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'User role updated successfully'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete user (Admin)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
