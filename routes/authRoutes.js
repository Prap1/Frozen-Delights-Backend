const express = require('express');
const router = express.Router();

const {
    registerInitiate,
    verifyOTPAndRegister,
    login,
    logout,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

/* ===================== AUTH ROUTES ===================== */
router.post('/register-initiate', registerInitiate);
router.post('/register-verify', verifyOTPAndRegister);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

/* ===================== CHECK AUTH (VERY IMPORTANT) ===================== */
router.get('/me', protect, (req, res) => {
    res.status(200).json({
        user: req.user
    });
});

module.exports = router;
