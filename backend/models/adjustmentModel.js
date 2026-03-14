import pool from '../config/db.js';
import stockLedgerModel from './stockLedgerModel.js';

const adjustmentModel = {
    /**
     * Get all stock adjustments
     */
    async getAll() {
        const [rows] = await pool.query(
            `SELECT a.*, l.name AS location_name, u.name AS creator_name
             FROM inventory_adjustments a
             LEFT JOIN locations l ON l.id = a.location_id
             LEFT JOIN users u ON u.id = a.created_by
             ORDER BY a.created_at DESC`
        );
        return rows;
    },

    /**
     * Get single adjustment with items
     */
    async getById(id) {
        const [adjRows] = await pool.query(
            `SELECT a.*, l.name AS location_name, u.name AS creator_name
             FROM inventory_adjustments a
             LEFT JOIN locations l ON l.id = a.location_id
             LEFT JOIN users u ON u.id = a.created_by
             WHERE a.id = ?`,
            [id]
        );

        if (adjRows.length === 0) return null;

        const [itemRows] = await pool.query(
            `SELECT ai.*, p.name AS product_name, p.sku, p.unit_of_measure
             FROM adjustment_items ai
             JOIN products p ON p.id = ai.product_id
             WHERE ai.adjustment_id = ?`,
            [id]
        );

        return {
            ...adjRows[0],
            items: itemRows
        };
    },

    /**
     * Create and Validate in one go for adjustments (usually simple corrections)
     */
    async applyAdjustment({ reference, location_id, created_by, items }) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Create adjustment header
            const [result] = await conn.query(
                `INSERT INTO inventory_adjustments (reference, location_id, status, created_by)
                 VALUES (?, ?, 'done', ?)`,
                [reference, location_id, created_by]
            );
            const adjustmentId = result.insertId;

            // 2. Process each item
            for (const item of items) {
                // Get current stock
                const [[stock]] = await conn.query(
                    'SELECT quantity FROM stock_balance WHERE product_id = ? AND location_id = ? FOR UPDATE',
                    [item.product_id, location_id]
                );
                const qty_theoretical = stock ? stock.quantity : 0;
                const qty_change = item.qty_real - qty_theoretical;

                // Insert item record
                await conn.query(
                    `INSERT INTO adjustment_items (adjustment_id, product_id, qty_theoretical, qty_real)
                     VALUES (?, ?, ?, ?)`,
                    [adjustmentId, item.product_id, qty_theoretical, item.qty_real]
                );

                // Apply stock movement
                if (qty_change !== 0) {
                    await stockLedgerModel.applyMovement({
                        product_id: item.product_id,
                        location_id: location_id,
                        qty_change: qty_change,
                        movement_type: 'adjustment',
                        reference_type: 'adjustment',
                        reference_id: adjustmentId,
                        note: `Adjustment ${reference}: corrected ${qty_theoretical} -> ${item.qty_real}`,
                        created_by: created_by
                    }, conn);
                }
            }

            await conn.commit();
            return this.getById(adjustmentId);
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
};

export default adjustmentModel;
