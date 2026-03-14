import express from 'express';
import cronService from '../services/cronService.js';
const router = express.Router();

router.get('/trigger-email', async (req, res) => {
    try {
        await cronService.sendDailyAlerts();
        res.json({ success: true, message: 'Email alert job logic executed.' });
    } catch (err) {
        console.error('Error triggering email:', err);
        res.status(500).json({ success: false, message: 'Failed to trigger email alerts' });
    }
});

export default router;
