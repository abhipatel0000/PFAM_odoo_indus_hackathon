import express from 'express';
const router = express.Router();
import transferModel from '../models/transferModel.js';

// Get all transfers
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const transfers = await transferModel.getAll({ status });
        res.json(transfers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single transfer
router.get('/:id', async (req, res) => {
    try {
        const transfer = await transferModel.getById(req.params.id);
        if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
        res.json(transfer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create transfer
router.post('/', async (req, res) => {
    try {
        const { reference, source_location_id, dest_location_id, created_by, items } = req.body;
        const newTransfer = await transferModel.create({
            reference, source_location_id, dest_location_id, created_by, items
        });
        res.status(201).json(newTransfer);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Validate transfer
router.post('/:id/validate', async (req, res) => {
    try {
        const { validated_by } = req.body;
        const result = await transferModel.validate(req.params.id, validated_by);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
