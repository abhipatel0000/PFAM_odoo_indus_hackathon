import express from 'express';
import deadStockModel from '../models/deadStockModel.js';
const router = express.Router();

// GET /api/dead-stock — list + summary
router.get('/', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 90;
        const [items, summary] = await Promise.all([
            deadStockModel.getDeadStock(days),
            deadStockModel.getDeadStockSummary(days)
        ]);
        res.json({ success: true, data: { items, summary } });
    } catch (err) {
        console.error('Error fetching dead stock:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch dead stock data' });
    }
});

export default router;
