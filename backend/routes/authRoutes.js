const express = require('express');
const router = express.Router();

// Mock Auth Controller
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
        res.json({ success: true, token: 'mock-jwt-token', user: { name: 'Admin', role: 'Manager' } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

router.post('/register', (req, res) => {
    res.json({ success: true, message: 'User registered successfully' });
});

module.exports = router;
