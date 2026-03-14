import express from 'express';
import reorderModel from '../models/reorderModel.js';
const router = express.Router();

// GET /api/reorder/suggestions — products below reorder level + suggested qty
router.get('/suggestions', async (req, res) => {
    try {
        const suggestions = await reorderModel.getSuggestions();
        res.json({ success: true, data: suggestions });
    } catch (err) {
        console.error('Error fetching reorder suggestions:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch reorder suggestions' });
    }
});

export default router;
