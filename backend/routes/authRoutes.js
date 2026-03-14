import express from 'express';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// User Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await userModel.findByUsername(username);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await userModel.verifyPassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Create JWT payload
        const payload = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, username: user.username, role: user.role }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { name, username, email, password, role } = req.body;

        const existingUser = await userModel.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        const existingEmail = await userModel.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const newUser = await userModel.createUser({ name, username, email, password, role });
        
        res.status(201).json({ success: true, message: 'User registered successfully', user: newUser });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
});

export default router;
