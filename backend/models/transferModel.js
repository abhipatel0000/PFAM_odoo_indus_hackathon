import pool from '../config/db.js';
import stockLedgerModel from './stockLedgerModel.js';

const transferModel = {
    /**
     * Get all transfers
     */
    async getAll({ status } = {}) {
        let sql = `
            SELECT t.*, 
                   sl.name AS source_location_name, 
                   dl.name AS dest_location_name, 
                   u.name AS creator_name
            FROM internal_transfers t
            LEFT JOIN locations sl ON sl.id = t.source_location_id
            LEFT JOIN locations dl ON dl.id = t.dest_location_id
            LEFT JOIN users u ON u.id = t.created_by
        `;
        const params = [];
        if (status) {
            sql += ' WHERE t.status = ?';
            params.push(status);
        }
        sql += ' ORDER BY t.created_at DESC';
        const [rows] = await pool.query(sql, params);
        return rows;
    },

    /**
     * Get a single transfer with its items
     */
    async getById(id) {
        const [transferRows] = await pool.query(
            `SELECT t.*, 
                    sl.name AS source_location_name, 
                    dl.name AS dest_location_name, 
                    u.name AS creator_name
             FROM internal_transfers t
             LEFT JOIN locations sl ON sl.id = t.source_location_id
             LEFT JOIN locations dl ON dl.id = t.dest_location_id
             LEFT JOIN users u ON u.id = t.created_by
             WHERE t.id = ?`,
            [id]
        );

        if (transferRows.length === 0) return null;

        const [itemRows] = await pool.query(
            `SELECT ti.*, p.name AS product_name, p.sku, p.unit_of_measure
             FROM transfer_items ti
             JOIN products p ON p.id = ti.product_id
             WHERE ti.transfer_id = ?`,
            [id]
        );

        return {
            ...transferRows[0],
            items: itemRows
        };
    },

    /**
     * Create a new transfer in draft status
     */
    async create({ reference, source_location_id, dest_location_id, created_by, items }) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [result] = await conn.query(
                `INSERT INTO internal_transfers (reference, source_location_id, dest_location_id, created_by, status)
                 VALUES (?, ?, ?, ?, 'draft')`,
                [reference, source_location_id, dest_location_id, created_by]
            );

            const transferId = result.insertId;

            if (items && items.length > 0) {
                const itemValues = items.map(item => [transferId, item.product_id, item.qty_transferred]);
                await conn.query(
                    `INSERT INTO transfer_items (transfer_id, product_id, qty_transferred)
                     VALUES ?`,
                    [itemValues]
                );
            }

            await conn.commit();
            return this.getById(transferId);
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    /**
     * Validate a transfer (mark as done and move stock)
     */
    async validate(id, validated_by) {
        const transfer = await this.getById(id);
        if (!transfer) throw new Error('Transfer not found');
        if (transfer.status === 'done') throw new Error('Transfer already validated');

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Check stock availability at source for all items
            for (const item of transfer.items) {
                const [[stock]] = await conn.query(
                    'SELECT quantity FROM stock_balance WHERE product_id = ? AND location_id = ? FOR UPDATE',
                    [item.product_id, transfer.source_location_id]
                );
                
                const currentQty = stock ? stock.quantity : 0;
                if (currentQty < item.qty_transferred) {
                    throw new Error(`Insufficient source stock for product ${item.product_name}. Available: ${currentQty}, Required: ${item.qty_transferred}`);
                }
            }

            // 2. Update status
            await conn.query(
                `UPDATE internal_transfers
                 SET status = 'done', validated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [id]
            );

            // 3. Apply movements (Out from source, In to destination)
            for (const item of transfer.items) {
                // Outbound from source
                await stockLedgerModel.applyMovement({
                    product_id: item.product_id,
                    location_id: transfer.source_location_id,
                    qty_change: -item.qty_transferred,
                    movement_type: 'transfer_out',
                    reference_type: 'transfer',
                    reference_id: id,
                    note: `Transfer ${transfer.reference} to ${transfer.dest_location_name}`,
                    created_by: validated_by
                }, conn);

                // Inbound to destination
                await stockLedgerModel.applyMovement({
                    product_id: item.product_id,
                    location_id: transfer.dest_location_id,
                    qty_change: item.qty_transferred,
                    movement_type: 'transfer_in',
                    reference_type: 'transfer',
                    reference_id: id,
                    note: `Transfer ${transfer.reference} from ${transfer.source_location_name}`,
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
    }
};

export default transferModel;
