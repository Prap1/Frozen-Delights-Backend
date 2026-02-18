const User = require('../models/User');
const OTP = require('../models/OTP');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate 6 digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================
// REGISTER - SEND OTP
// ============================
exports.registerInitiate = async (req, res) => {
    const { username, email, password } = req.body;

    // ✅ REQUIRED VALIDATION
    if (!username || !email || !password) {
        return res.status(400).json({
            message: 'Username, email and password are required'
        });
    }

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: 'User with this email already exists'
            });
        }

        const otp = generateOTP();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Remove old OTPs for this email
        await OTP.deleteMany({ email });

        await OTP.create({
            email,
            otp,
            password: hashedPassword
        });

        await sendEmail({
            email,
            subject: 'Frozen Delight - Email Verification',
            message: `Your OTP for registration is: ${otp}`
        });

        res.status(200).json({
            message: 'OTP sent to email. Please verify.'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }

};

// ============================
// VERIFY OTP & CREATE USER
// ============================
exports.verifyOTPAndRegister = async (req, res) => {
    const { username, email, otp } = req.body;

    if (!username || !email || !otp) {
        return res.status(400).json({
            message: 'All fields are required'
        });
    }

    try {
        const otpRecord = await OTP.findOne({ email });

        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        // ✅ SAFETY CHECK
        if (!otpRecord.password) {
            await OTP.deleteMany({ email });
            return res.status(400).json({
                message: 'Password missing. Please register again.'
            });
        }

        if (otpRecord.attempts >= 5) {
            await OTP.deleteMany({ email });
            return res.status(429).json({ message: 'Too many attempts. Try again.' });
        }

        if (otpRecord.otp !== otp) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const user = await User.create({
            username,
            email,
            password: otpRecord.password,
            isVerified: true,
            role: 'user'
        });

        await OTP.deleteMany({ email });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ============================
// LOGIN
// ============================
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email first' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};


// ============================
// LOGOUT
// ============================
exports.logout = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0)
    });

    res.status(200).json({ message: 'Logged out successfully' });
};

// ============================
// FORGOT PASSWORD
// ============================
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        // Do NOT reveal user existence
        if (!user) {
            return res.status(200).json({
                message: 'If the email exists, OTP has been sent'
            });
        }

        const otp = generateOTP();
        await OTP.deleteMany({ email });

        await OTP.create({ email, otp });

        await sendEmail({
            email,
            subject: 'Frozen Delight - Password Reset',
            message: `Your OTP for password reset is: ${otp}`
        });

        res.status(200).json({
            message: 'If the email exists, OTP has been sent'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ============================
// RESET PASSWORD
// ============================
exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const otpRecord = await OTP.findOne({ email });

        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        if (otpRecord.attempts >= 5) {
            await OTP.deleteMany({ email });
            return res.status(429).json({ message: 'Too many attempts' });
        }

        if (otpRecord.otp !== otp) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        await OTP.deleteMany({ email });

        res.status(200).json({
            message: 'Password reset successful. Please login.'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
// ============================
// UPDATE PASSWORD (LOGGED IN)
// ============================
exports.updatePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide both old and new passwords' });
    }

    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
