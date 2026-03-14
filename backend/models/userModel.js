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
     * Find a user by their ID (used by auth middleware)
     */
    async findById(id) {
        const [rows] = await pool.query(
            'SELECT id, name, username, email, role, created_at FROM users WHERE id = ? LIMIT 1',
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
     * Create a new user (password is hashed here)
     */
    async createUser({ name, username, email, password, role = 'Staff' }) {
        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            `INSERT INTO users (name, username, email, password_hash, role)
             VALUES (?, ?, ?, ?, ?)`,
            [name, username, email, password_hash, role]
        );
        return { id: result.insertId, name, username, email, role };
    },

    /**
     * Verify a plain-text password against the stored hash
     */
    async verifyPassword(plainPassword, hash) {
        return bcrypt.compare(plainPassword, hash);
    },

    /**
     * Store OTP for password reset
     */
    async setOtp(userId, otp, expiresAt) {
        await pool.query(
            'UPDATE users SET otp_code = ?, otp_expires = ? WHERE id = ?',
            [otp, expiresAt, userId]
        );
    },

    /**
     * Clear OTP after use
     */
    async clearOtp(userId) {
        await pool.query(
            'UPDATE users SET otp_code = NULL, otp_expires = NULL WHERE id = ?',
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
