const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const userModel = {
    /**
     * Find a user by their username
     */
    async findByUsername(username) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE username = ? LIMIT 1',
            [username]
        );
        return rows[0] || null;
    },

    /**
     * Find a user by their ID
     */
    async findById(id) {
        const [rows] = await pool.query(
            'SELECT id, name, username, email, phone, role, is_verified, created_at FROM users WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Find a user by email
     */
    async findByEmail(email) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [email]
        );
        return rows[0] || null;
    },

    /**
     * Find a user by phone
     */
    async findByPhone(phone) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE phone = ? LIMIT 1',
            [phone]
        );
        return rows[0] || null;
    },

    /**
     * Find a user by email OR phone (for login / forgot-password)
     */
    async findByEmailOrPhone(identifier) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1',
            [identifier, identifier]
        );
        return rows[0] || null;
    },

    /**
     * Create a new user (password is hashed here, account starts unverified)
     */
    async createUser({ name, username, email, phone, password, role = 'Staff' }) {
        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            `INSERT INTO users (name, username, email, phone, password_hash, role, is_verified)
             VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
            [name, username, email, phone || null, password_hash, role]
        );
        return { id: result.insertId, name, username, email, phone, role };
    },

    /**
     * Verify a plain-text password against the stored hash
     */
    async verifyPassword(plainPassword, hash) {
        return bcrypt.compare(plainPassword, hash);
    },

    /**
     * Store OTP for a user
     */
    async setOtp(userId, otp, expiresAt) {
        await pool.query(
            'UPDATE users SET otp_code = ?, otp_expires = ?, otp_attempts = 0 WHERE id = ?',
            [otp, expiresAt, userId]
        );
    },

    /**
     * Increment OTP verification attempts
     */
    async incrementOtpAttempts(userId) {
        await pool.query(
            'UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = ?',
            [userId]
        );
    },

    /**
     * Clear OTP after successful use
     */
    async clearOtp(userId) {
        await pool.query(
            'UPDATE users SET otp_code = NULL, otp_expires = NULL, otp_attempts = 0 WHERE id = ?',
            [userId]
        );
    },

    /**
     * Mark user email/phone as verified
     */
    async markVerified(userId) {
        await pool.query(
            'UPDATE users SET is_verified = TRUE WHERE id = ?',
            [userId]
        );
    },

    /**
     * Update password (used after OTP reset)
     */
    async updatePassword(userId, newPassword) {
        const password_hash = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [password_hash, userId]
        );
    }
};

module.exports = userModel;
