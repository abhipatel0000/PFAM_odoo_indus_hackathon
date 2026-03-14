import express from 'express';
const router = express.Router();
import receiptModel from '../models/receiptModel.js';

// Get all receipts
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const receipts = await receiptModel.getAll({ status });
        res.json(receipts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single receipt
router.get('/:id', async (req, res) => {
    try {
        const receipt = await receiptModel.getById(req.params.id);
        if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
        res.json(receipt);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create receipt
router.post('/', async (req, res) => {
    try {
        const { reference, supplier_name, location_id, created_by, items } = req.body;
        const newReceipt = await receiptModel.create({
            reference, supplier_name, location_id, created_by, items
        });
        res.status(201).json(newReceipt);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Validate receipt
router.post('/:id/validate', async (req, res) => {
    try {
        const { validated_by } = req.body;
        const result = await receiptModel.validate(req.params.id, validated_by);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Cancel receipt
router.post('/:id/cancel', async (req, res) => {
    try {
        const success = await receiptModel.cancel(req.params.id);
        res.json({ success });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
