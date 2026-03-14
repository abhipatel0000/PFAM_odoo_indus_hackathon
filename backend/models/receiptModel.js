import pool from '../config/db.js';
import stockLedgerModel from './stockLedgerModel.js';

const receiptModel = {
    /**
     * Get all receipts with optional status filter
     */
    async getAll({ status } = {}) {
        let sql = `
            SELECT r.*, l.name AS location_name, u.name AS creator_name
            FROM receipts r
            LEFT JOIN locations l ON l.id = r.location_id
            LEFT JOIN users u ON u.id = r.created_by
        `;
        const params = [];
        if (status) {
            sql += ' WHERE r.status = ?';
            params.push(status);
        }
        sql += ' ORDER BY r.created_at DESC';
        const [rows] = await pool.query(sql, params);
        return rows;
    },

    /**
     * Get a single receipt with its items
     */
    async getById(id) {
        const [receiptRows] = await pool.query(
            `SELECT r.*, l.name AS location_name, u.name AS creator_name
             FROM receipts r
             LEFT JOIN locations l ON l.id = r.location_id
             LEFT JOIN users u ON u.id = r.created_by
             WHERE r.id = ?`,
            [id]
        );

        if (receiptRows.length === 0) return null;

        const [itemRows] = await pool.query(
            `SELECT ri.*, p.name AS product_name, p.sku, p.unit_of_measure
             FROM receipt_items ri
             JOIN products p ON p.id = ri.product_id
             WHERE ri.receipt_id = ?`,
            [id]
        );

        return {
            ...receiptRows[0],
            items: itemRows
        };
    },

    /**
     * Create a new receipt in draft status
     */
    async create({ reference, supplier_name, location_id, created_by, items }) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [result] = await conn.query(
                `INSERT INTO receipts (reference, supplier_name, location_id, created_by, status)
                 VALUES (?, ?, ?, ?, 'draft')`,
                [reference, supplier_name, location_id, created_by]
            );

            const receiptId = result.insertId;

            if (items && items.length > 0) {
                const itemValues = items.map(item => [receiptId, item.product_id, item.qty_ordered, 0]);
                await conn.query(
                    `INSERT INTO receipt_items (receipt_id, product_id, qty_ordered, qty_done)
                     VALUES ?`,
                    [itemValues]
                );
            }

            await conn.commit();
            return this.getById(receiptId);
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    /**
     * Validate a receipt (mark as done and update stock)
     */
    async validate(id, validated_by) {
        const receipt = await this.getById(id);
        if (!receipt) throw new Error('Receipt not found');
        if (receipt.status === 'done') throw new Error('Receipt already validated');
        if (receipt.status === 'cancelled') throw new Error('Cancelled receipt cannot be validated');

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Update receipt status
            await conn.query(
                `UPDATE receipts
                 SET status = 'done', validated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [id]
            );

            // 2. Update qty_done for all items (assume all ordered are received if not specified)
            // In a real system, we'd take the actual received counts
            await conn.query(
                `UPDATE receipt_items SET qty_done = qty_ordered WHERE receipt_id = ?`,
                [id]
            );

            // 3. Apply stock movement for each item
            for (const item of receipt.items) {
                await stockLedgerModel.applyMovement({
                    product_id: item.product_id,
                    location_id: receipt.location_id,
                    qty_change: item.qty_ordered,
                    movement_type: 'receipt',
                    reference_type: 'receipt',
                    reference_id: id,
                    note: `Receipt ${receipt.reference}`,
                    created_by: validated_by
                }, conn);
            }

            await conn.commit();
            return this.getById(id);
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    /**
     * Cancel a receipt
     */
    async cancel(id) {
        const [result] = await pool.query(
            `UPDATE receipts SET status = 'cancelled' WHERE id = ? AND status != 'done'`,
            [id]
        );
        return result.affectedRows > 0;
    }
};

export default receiptModel;
