const express = require('express');
const stockLedgerModel = require('../models/stockLedgerModel');
const router = express.Router();

// Helper to handle common movement logic
const handleMovement = async (req, res, movementType, referenceType) => {
    try {
        const { product_id, location_id, qty, reference_id, note, created_by } = req.body;
        
        let qtyChange = parseInt(qty, 10);
        
        // Receipts/Adjustments+ add to stock, Deliveries/Adjustments- remove stock.
        // For standard receipts: qty > 0 -> + qty
        // For standard deliveries: qty > 0 -> - qty (user inputs positive, we make it negative)
        if (movementType === 'delivery') {
            qtyChange = -Math.abs(qtyChange);
        }

        const qty_after = await stockLedgerModel.applyMovement({
            product_id,
            location_id,
            movement_type: movementType,
            reference_type: referenceType,
            reference_id,
            qty_change: qtyChange,
            note,
            created_by
        });

        res.json({ success: true, message: `${movementType} processed successfully`, qty_after });
    } catch (err) {
        console.error(`Error processing ${movementType}:`, err);
        res.status(500).json({ success: false, message: `Failed to process ${movementType}` });
    }
};

// Movement Endpoints
router.post('/receipt',    (req, res) => handleMovement(req, res, 'receipt', 'receipt'));
router.post('/delivery',   (req, res) => handleMovement(req, res, 'delivery', 'delivery'));
router.post('/adjustment', (req, res) => handleMovement(req, res, 'adjustment', 'adjustment'));

// Transfers require two movements (out of A, into B)
router.post('/transfer', async (req, res) => {
    try {
        const { product_id, from_location_id, to_location_id, qty, reference_id, note, created_by } = req.body;
        const qtyChange = Math.abs(parseInt(qty, 10));

        // Note: we can't easily transaction wrap two separate `applyMovement` calls out of the box unless we expose the connection
        // For now, we will do sequential calls and risk partial failure if the DB crashes between the two. 
        // In a production app, we would add an `applyTransfer` method in the model that shares the transaction.
        
        // 1. Transfer Out
        await stockLedgerModel.applyMovement({
            product_id, location_id: from_location_id,
            movement_type: 'transfer_out', reference_type: 'transfer', reference_id,
            qty_change: -qtyChange, note, created_by
        });

        // 2. Transfer In
        const final_qty_b = await stockLedgerModel.applyMovement({
            product_id, location_id: to_location_id,
            movement_type: 'transfer_in', reference_type: 'transfer', reference_id,
            qty_change: qtyChange, note, created_by
        });

        res.json({ success: true, message: 'Transfer successful', destination_qty: final_qty_b });
    } catch (err) {
        console.error('Error processing transfer:', err);
        res.status(500).json({ success: false, message: 'Failed to process transfer' });
    }
});

// Get History for a Product
router.get('/history/:productId', async (req, res) => {
    try {
        const history = await stockLedgerModel.getByProduct(req.params.productId);
        res.json(history);
    } catch (err) {
        console.error('Error fetching history:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Dashboard: Recent Activity
router.get('/dashboard-recent', async (req, res) => {
    try {
        const recent = await stockLedgerModel.getRecent(15);
        res.json(recent);
    } catch (err) {
        console.error('Error fetching recent activity:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Dashboard: Summary KPIs
router.get('/dashboard-summary', async (req, res) => {
    try {
        const summary = await stockLedgerModel.getSummary();
        res.json(summary);
    } catch (err) {
        console.error('Error fetching summary:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
