import pool from '../config/db.js';
import stockLedgerModel from './stockLedgerModel.js';

const deliveryModel = {
    /**
     * Get all deliveries
     */
    async getAll({ status } = {}) {
        let sql = `
            SELECT d.*, l.name AS location_name, u.name AS creator_name
            FROM deliveries d
            LEFT JOIN locations l ON l.id = d.location_id
            LEFT JOIN users u ON u.id = d.created_by
        `;
        const params = [];
        if (status) {
            sql += ' WHERE d.status = ?';
            params.push(status);
        }
        sql += ' ORDER BY d.created_at DESC';
        const [rows] = await pool.query(sql, params);
        return rows;
    },

    /**
     * Get a single delivery with its items
     */
    async getById(id) {
        const [deliveryRows] = await pool.query(
            `SELECT d.*, l.name AS location_name, u.name AS creator_name
             FROM deliveries d
             LEFT JOIN locations l ON l.id = d.location_id
             LEFT JOIN users u ON u.id = d.created_by
             WHERE d.id = ?`,
            [id]
        );

        if (deliveryRows.length === 0) return null;

        const [itemRows] = await pool.query(
            `SELECT di.*, p.name AS product_name, p.sku, p.unit_of_measure
             FROM delivery_items di
             JOIN products p ON p.id = di.product_id
             WHERE di.delivery_id = ?`,
            [id]
        );

        return {
            ...deliveryRows[0],
            items: itemRows
        };
    },

    /**
     * Create a new delivery in draft status
     */
    async create({ reference, customer_name, location_id, created_by, items }) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [result] = await conn.query(
                `INSERT INTO deliveries (reference, customer_name, location_id, created_by, status)
                 VALUES (?, ?, ?, ?, 'draft')`,
                [reference, customer_name, location_id, created_by]
            );

            const deliveryId = result.insertId;

            if (items && items.length > 0) {
                const itemValues = items.map(item => [deliveryId, item.product_id, item.qty_ordered, 0]);
                await conn.query(
                    `INSERT INTO delivery_items (delivery_id, product_id, qty_ordered, qty_done)
                     VALUES ?`,
                    [itemValues]
                );
            }

            await conn.commit();
            return this.getById(deliveryId);
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    /**
     * Validate a delivery (mark as done and update stock - DECREASE)
     */
    async validate(id, validated_by) {
        const delivery = await this.getById(id);
        if (!delivery) throw new Error('Delivery not found');
        if (delivery.status === 'done') throw new Error('Delivery already validated');
        if (delivery.status === 'cancelled') throw new Error('Cancelled delivery cannot be validated');

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Check stock availability for all items
            for (const item of delivery.items) {
                const [[stock]] = await conn.query(
                    'SELECT quantity FROM stock_balance WHERE product_id = ? AND location_id = ? FOR UPDATE',
                    [item.product_id, delivery.location_id]
                );
                
                const currentQty = stock ? stock.quantity : 0;
                if (currentQty < item.qty_ordered) {
                    throw new Error(`Insufficient stock for product ${item.product_name} at this location. Available: ${currentQty}, Required: ${item.qty_ordered}`);
                }
            }

            // 2. Update delivery status
            await conn.query(
                `UPDATE deliveries
                 SET status = 'done', validated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [id]
            );

            // 3. Update qty_done
            await conn.query(
                `UPDATE delivery_items SET qty_done = qty_ordered WHERE delivery_id = ?`,
                [id]
            );

            // 4. Apply stock movement (negative change)
            for (const item of delivery.items) {
                await stockLedgerModel.applyMovement({
                    product_id: item.product_id,
                    location_id: delivery.location_id,
                    qty_change: -item.qty_ordered,
                    movement_type: 'delivery',
                    reference_type: 'delivery',
                    reference_id: id,
                    note: `Delivery ${delivery.reference}`,
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
     * Cancel a delivery
     */
    async cancel(id) {
        const [result] = await pool.query(
            `UPDATE deliveries SET status = 'cancelled' WHERE id = ? AND status != 'done'`,
            [id]
        );
        return result.affectedRows > 0;
    }
};

export default deliveryModel;
