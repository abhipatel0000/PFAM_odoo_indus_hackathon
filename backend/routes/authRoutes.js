const express = require('express');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { generateOTP, getOtpExpiry, isOtpExpired } = require('../utils/otpUtils');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds

// ─────────────────────────────────────
// POST /api/auth/register
// Step 1 of signup: create unverified user, generate OTP
// ─────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, username, email, phone, password, confirmPassword } = req.body;

        if (!name || !username || !email || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format.' });
        }
        if (phone && !/^\+?[0-9]{7,15}$/.test(phone)) {
            return res.status(400).json({ success: false, message: 'Invalid phone format.' });
        }

        const existingUser = await userModel.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already taken.' });
        }
        const existingEmail = await userModel.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }

        const newUser = await userModel.createUser({ name, username, email, phone, password, role: 'Staff' });

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = getOtpExpiry();
        await userModel.setOtp(newUser.id, otp, expiresAt);

        // Log OTP to console (dev mode — replace with email/SMS service in production)
        console.log(`\n📱 SIGNUP OTP for ${email}: ${otp} (expires in 5 min)\n`);

        res.status(201).json({
            success: true,
            message: 'Account created. OTP sent for verification.',
            userId: newUser.id,
            email: newUser.email
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
});

// ─────────────────────────────────────
// POST /api/auth/verify-signup
// Step 2 of signup: verify OTP, mark user verified, return JWT
// ─────────────────────────────────────
router.post('/verify-signup', async (req, res) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) {
            return res.status(400).json({ success: false, message: 'User ID and OTP are required.' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Re-fetch full user data with OTP fields
        const [rows] = await require('../config/db').query('SELECT * FROM users WHERE id = ?', [userId]);
        const fullUser = rows[0];

        if (!fullUser.otp_code) {
            return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
        }
        if (fullUser.otp_attempts >= MAX_OTP_ATTEMPTS) {
            await userModel.clearOtp(userId);
            return res.status(429).json({ success: false, message: 'Max OTP attempts exceeded. Please request a new OTP.' });
        }
        if (isOtpExpired(fullUser.otp_expires)) {
            await userModel.clearOtp(userId);
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        if (fullUser.otp_code !== otp) {
            await userModel.incrementOtpAttempts(userId);
            const remaining = MAX_OTP_ATTEMPTS - fullUser.otp_attempts - 1;
            return res.status(400).json({ success: false, message: `Invalid OTP. ${remaining} attempts remaining.` });
        }

        // OTP correct — mark verified, clear OTP, return JWT
        await userModel.markVerified(userId);
        await userModel.clearOtp(userId);

        const token = jwt.sign({ id: userId, username: fullUser.username, role: fullUser.role }, JWT_SECRET, { expiresIn: '8h' });

        res.json({
            success: true,
            message: 'Account verified successfully.',
            token,
            user: { id: userId, name: fullUser.name, username: fullUser.username, email: fullUser.email, role: fullUser.role }
        });
    } catch (err) {
        console.error('Verify signup error:', err);
        res.status(500).json({ success: false, message: 'Server error during verification.' });
    }
});

// ─────────────────────────────────────
// POST /api/auth/login
// Step 1 of login: validate credentials, generate OTP
// ─────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Email/phone and password are required.' });
        }

        const user = await userModel.findByEmailOrPhone(identifier) || await userModel.findByUsername(identifier);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const isMatch = await userModel.verifyPassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = getOtpExpiry();
        await userModel.setOtp(user.id, otp, expiresAt);

        console.log(`\n🔐 LOGIN OTP for ${user.email}: ${otp} (expires in 5 min)\n`);

        res.json({
            success: true,
            message: 'Credentials verified. OTP sent.',
            userId: user.id,
            email: user.email
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

// ─────────────────────────────────────
// POST /api/auth/verify-login
// Step 2 of login: verify OTP, return JWT
// ─────────────────────────────────────
router.post('/verify-login', async (req, res) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) {
            return res.status(400).json({ success: false, message: 'User ID and OTP are required.' });
        }

        const [rows] = await require('../config/db').query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (!user.otp_code) {
            return res.status(400).json({ success: false, message: 'No OTP found. Please login again.' });
        }
        if (user.otp_attempts >= MAX_OTP_ATTEMPTS) {
            await userModel.clearOtp(userId);
            return res.status(429).json({ success: false, message: 'Max OTP attempts exceeded. Please login again.' });
        }
        if (isOtpExpired(user.otp_expires)) {
            await userModel.clearOtp(userId);
            return res.status(400).json({ success: false, message: 'OTP has expired. Please login again.' });
        }

        if (user.otp_code !== otp) {
            await userModel.incrementOtpAttempts(userId);
            const remaining = MAX_OTP_ATTEMPTS - user.otp_attempts - 1;
            return res.status(400).json({ success: false, message: `Invalid OTP. ${remaining} attempts remaining.` });
        }

        // OTP correct
        await userModel.clearOtp(userId);

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Verify login error:', err);
        res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
    }
});

// ─────────────────────────────────────
// POST /api/auth/forgot-password
// Start password reset: generate OTP
// ─────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            return res.status(400).json({ success: false, message: 'Email or phone is required.' });
        }

        const user = await userModel.findByEmailOrPhone(identifier);
        if (!user) {
            // Don't reveal whether the user exists
            return res.json({ success: true, message: 'If account exists, OTP has been sent.' });
        }

        const otp = generateOTP();
        const expiresAt = getOtpExpiry();
        await userModel.setOtp(user.id, otp, expiresAt);

        console.log(`\n🔑 RESET OTP for ${user.email}: ${otp} (expires in 5 min)\n`);

        res.json({
            success: true,
            message: 'If account exists, OTP has been sent.',
            userId: user.id,
            email: user.email
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ─────────────────────────────────────
// POST /api/auth/verify-reset-otp
// Verify password-reset OTP, return temp token
// ─────────────────────────────────────
router.post('/verify-reset-otp', async (req, res) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) {
            return res.status(400).json({ success: false, message: 'User ID and OTP are required.' });
        }

        const [rows] = await require('../config/db').query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (!user.otp_code) {
            return res.status(400).json({ success: false, message: 'No OTP found. Please request again.' });
        }
        if (user.otp_attempts >= MAX_OTP_ATTEMPTS) {
            await userModel.clearOtp(userId);
            return res.status(429).json({ success: false, message: 'Max attempts exceeded. Please request a new OTP.' });
        }
        if (isOtpExpired(user.otp_expires)) {
            await userModel.clearOtp(userId);
            return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
        }

        if (user.otp_code !== otp) {
            await userModel.incrementOtpAttempts(userId);
            const remaining = MAX_OTP_ATTEMPTS - user.otp_attempts - 1;
            return res.status(400).json({ success: false, message: `Invalid OTP. ${remaining} attempts remaining.` });
        }

        await userModel.clearOtp(userId);

        // Issue a short-lived token just for password reset
        const resetToken = jwt.sign({ id: user.id, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '10m' });

        res.json({ success: true, message: 'OTP verified. You can now reset your password.', resetToken });
    } catch (err) {
        console.error('Verify reset OTP error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ─────────────────────────────────────
// POST /api/auth/reset-password
// Set new password using reset token
// ─────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword, confirmPassword } = req.body;
        if (!resetToken || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(resetToken, JWT_SECRET);
        } catch (e) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        }

        if (decoded.purpose !== 'password-reset') {
            return res.status(400).json({ success: false, message: 'Invalid reset token.' });
        }

        await userModel.updatePassword(decoded.id, newPassword);

        res.json({ success: true, message: 'Password updated successfully. You can now login.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ─────────────────────────────────────
// POST /api/auth/resend-otp
// Resend OTP (rate-limited with 30s cooldown)
// ─────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        const [rows] = await require('../config/db').query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Check cooldown — if OTP was set less than 30s ago, reject
        if (user.otp_expires) {
            const otpSetTime = new Date(user.otp_expires).getTime() - 5 * 60 * 1000; // when OTP was set
            if (Date.now() - otpSetTime < RESEND_COOLDOWN_MS) {
                return res.status(429).json({ success: false, message: 'Please wait 30 seconds before requesting a new OTP.' });
            }
        }

        const otp = generateOTP();
        const expiresAt = getOtpExpiry();
        await userModel.setOtp(user.id, otp, expiresAt);

        console.log(`\n🔄 RESEND OTP for ${user.email}: ${otp} (expires in 5 min)\n`);

        res.json({ success: true, message: 'New OTP sent successfully.' });
    } catch (err) {
        console.error('Resend OTP error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
