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

// Update user profile (User/Admin/Vendor)
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;
        user.address = req.body.address || user.address;

        if (req.file) {
            user.profileImage = req.file.path; // Or construct full URL if needed
        }

        // If vendor, allow updating brand info if needed, or keep separate
        if (user.role === 'vendor') {
            user.brandName = req.body.brandName || user.brandName;
            user.contactNumber = req.body.contactNumber || user.contactNumber;
        }

        const updatedUser = await user.save();

        res.status(200).json({
            success: true,
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                address: updatedUser.address,
                profileImage: updatedUser.profileImage,
                // Add other fields as necessary for frontend state
            }
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

// Request to become a vendor (User)
exports.requestVendorDetails = async (req, res) => {
    try {
        const { brandName, contactNumber, address } = req.body;

        if (!brandName || !contactNumber || !address) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findById(req.user.id);

        if (user.role === 'vendor') {
            return res.status(400).json({ message: 'You are already a vendor' });
        }

        if (user.vendorStatus === 'pending') {
            return res.status(400).json({ message: 'Verification pending' });
        }

        user.brandName = brandName;
        user.contactNumber = contactNumber;
        user.address = address;
        user.vendorStatus = 'pending';

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Vendor request submitted successfully'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all vendor requests (Admin)
exports.getAllVendorRequests = async (req, res) => {
    try {
        const users = await User.find({ vendorStatus: 'pending' });
        res.status(200).json({
            success: true,
            users
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Approve/Reject Vendor (Admin)
exports.updateVendorStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        user.vendorStatus = status;

        if (status === 'approved') {
            user.role = 'vendor';
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: `Vendor request ${status}`
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Toggle Block Status (Admin)
exports.toggleBlockStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User has been ${user.isBlocked ? 'blocked' : 'unblocked'}`,
            user
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
