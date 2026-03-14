import express from 'express';
import expiryModel from '../models/expiryModel.js';
const router = express.Router();

// GET /api/expiry/alerts — near-expiry + expired products
router.get('/alerts', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const [expiringSoon, expired] = await Promise.all([
            expiryModel.getExpiringSoon(days),
            expiryModel.getExpired()
        ]);
        res.json({ success: true, data: { expiringSoon, expired } });
    } catch (err) {
        console.error('Error fetching expiry alerts:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch expiry alerts' });
    }
});

// GET /api/expiry/stats — bucket counts for dashboard
router.get('/stats', async (req, res) => {
    try {
        const stats = await expiryModel.getExpiryStats();
        res.json({ success: true, data: stats });
    } catch (err) {
        console.error('Error fetching expiry stats:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch expiry stats' });
    }
});

export default router;
