import express from 'express';
const router = express.Router();
import deliveryModel from '../models/deliveryModel.js';

// Get all deliveries
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const deliveries = await deliveryModel.getAll({ status });
        res.json(deliveries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single delivery
router.get('/:id', async (req, res) => {
    try {
        const delivery = await deliveryModel.getById(req.params.id);
        if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
        res.json(delivery);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create delivery
router.post('/', async (req, res) => {
    try {
        const { reference, customer_name, location_id, created_by, items } = req.body;
        const newDelivery = await deliveryModel.create({
            reference, customer_name, location_id, created_by, items
        });
        res.status(201).json(newDelivery);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Validate delivery
router.post('/:id/validate', async (req, res) => {
    try {
        const { validated_by } = req.body;
        const result = await deliveryModel.validate(req.params.id, validated_by);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Cancel delivery
router.post('/:id/cancel', async (req, res) => {
    try {
        const success = await deliveryModel.cancel(req.params.id);
        res.json({ success });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
