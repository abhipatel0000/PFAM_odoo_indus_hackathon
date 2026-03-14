import express from 'express';
const router = express.Router();
import adjustmentModel from '../models/adjustmentModel.js';

// Get all adjustments
router.get('/', async (req, res) => {
    try {
        const adjustments = await adjustmentModel.getAll();
        res.json(adjustments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single adjustment
router.get('/:id', async (req, res) => {
    try {
        const adjustment = await adjustmentModel.getById(req.params.id);
        if (!adjustment) return res.status(404).json({ error: 'Adjustment not found' });
        res.json(adjustment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Apply adjustment
router.post('/', async (req, res) => {
    try {
        const { reference, location_id, created_by, items } = req.body;
        const result = await adjustmentModel.applyAdjustment({
            reference, location_id, created_by, items
        });
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
