import express from 'express';
import activityLogModel from '../models/activityLogModel.js';
const router = express.Router();

// GET /api/activity — recent activities
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const activities = await activityLogModel.getRecent(limit);
        res.json({ success: true, data: activities });
    } catch (err) {
        console.error('Error fetching activity log:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch activity log' });
    }
});

// GET /api/activity/:entityType/:entityId — activity for specific entity
router.get('/:entityType/:entityId', async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const activities = await activityLogModel.getByEntity(entityType, entityId);
        res.json({ success: true, data: activities });
    } catch (err) {
        console.error('Error fetching entity activity:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch entity activity' });
    }
});

export default router;
