const jwt = require('jsonwebtoken');
const User = require('../models/User');

/* ===================== PROTECT ===================== */
exports.protect = async (req, res, next) => {
    let token;

    // 1️⃣ Get token
    if (req.cookies?.token) {
        token = req.cookies.token;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2️⃣ No token
    if (!token) {
        return res.status(401).json({
            message: 'Not authorized'
        });
    }

    try {
        // 3️⃣ Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4️⃣ Get user (exclude password)
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (user.isBlocked) {
            return res.status(401).json({ message: 'Your account has been blocked. Please contact support.' });
        }

        // 5️⃣ Attach user to request
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Not authorized'
        });
    }
};

/* ===================== AUTHORIZE (ROLE BASED) ===================== */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role ${req.user?.role} not authorized`
            });
        }
        next();
    };
};
