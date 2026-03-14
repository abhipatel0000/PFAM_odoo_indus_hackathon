const express = require('express');
const warehouseModel = require('../models/warehouseModel');
const router = express.Router();

// Get all warehouses
router.get('/', async (req, res) => {
    try {
        const warehouses = await warehouseModel.getAll();
        res.json(warehouses);
    } catch (err) {
        console.error('Error fetching warehouses:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get locations for a specific warehouse
router.get('/:id/locations', async (req, res) => {
    try {
        const locations = await warehouseModel.getLocations(req.params.id);
        res.json(locations);
    } catch (err) {
        console.error('Error fetching locations:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create a new location
router.post('/locations', async (req, res) => {
    try {
        const newLocationId = await warehouseModel.createLocation(req.body);
        res.status(201).json({ success: true, id: newLocationId, message: 'Location created' });
    } catch (err) {
        console.error('Error creating location:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Location name must be unique within warehouse' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
