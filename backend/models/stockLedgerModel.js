import pool from '../config/db.js';

const stockLedgerModel = {
    /**
     * Add a new ledger entry — called by every operation that changes stock
     * @param {Object} entry
     * @param {number} entry.product_id
     * @param {number} entry.location_id
     * @param {string} entry.movement_type  - receipt|delivery|transfer_in|transfer_out|adjustment
     * @param {string} entry.reference_type - receipt|delivery|transfer|adjustment
     * @param {number} entry.reference_id   - ID of parent document
     * @param {number} entry.qty_change     - positive=increase, negative=decrease
     * @param {number} entry.qty_after      - balance after this movement
     * @param {string} [entry.note]
     * @param {number} [entry.created_by]
     */
    async addEntry({
        product_id, location_id,
        movement_type, reference_type, reference_id,
        qty_change, qty_after,
        note = null, created_by = null,
        conn = null  // optional transaction connection
    }) {
        const db = conn || pool;
        const [result] = await db.query(
            `INSERT INTO stock_ledger
             (product_id, location_id, movement_type, reference_type, reference_id,
              qty_change, qty_after, note, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [product_id, location_id, movement_type, reference_type, reference_id,
             qty_change, qty_after, note, created_by]
        );
        return result.insertId;
    },

    /**
     * Update stock_balance table and insert ledger entry atomically
     * This is the core function called by receipts, deliveries, transfers, adjustments
     */
    async applyMovement({ product_id, location_id, qty_change, ...ledgerData }, externalConn = null) {
        let conn = externalConn;
        let isInternalConn = false;

        if (!conn) {
            conn = await pool.getConnection();
            await conn.beginTransaction();
            isInternalConn = true;
        }

        try {
            // 1. Upsert stock_balance
            await conn.query(
                `INSERT INTO stock_balance (product_id, location_id, quantity)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
                [product_id, location_id, qty_change]
            );

            // 2. Read the new balance
            const [[balance]] = await conn.query(
                'SELECT quantity FROM stock_balance WHERE product_id = ? AND location_id = ?',
                [product_id, location_id]
            );
            const qty_after = balance.quantity;

            // 3. Write ledger entry
            await this.addEntry({
                product_id, location_id, qty_change, qty_after,
                ...ledgerData, conn
            });

            // 4. If this is a delivery/transfer_out, update last_sold_at
            if (['delivery', 'transfer_out'].includes(ledgerData.movement_type)) {
                await conn.query(
                    'UPDATE products SET last_sold_at = NOW() WHERE id = ?',
                    [product_id]
                );
            }

            if (isInternalConn) {
                await conn.commit();
            }
            return qty_after;
        } catch (err) {
            if (isInternalConn) {
                await conn.rollback();
            }
            throw err;
        } finally {
            if (isInternalConn) {
                conn.release();
            }
        }
    },

    /**
     * Get full movement history for a product
     */
    async getByProduct(productId, limit = 100) {
        const [rows] = await pool.query(
            `SELECT sl.*, l.name AS location_name, w.name AS warehouse_name
             FROM stock_ledger sl
             JOIN locations l  ON l.id  = sl.location_id
             JOIN warehouses w ON w.id  = l.warehouse_id
             WHERE sl.product_id = ?
             ORDER BY sl.created_at DESC
             LIMIT ?`,
            [productId, limit]
        );
        return rows;
    },

    /**
     * Get recent movements for the dashboard activity feed
     */
    async getRecent(limit = 20) {
        const [rows] = await pool.query(
            `SELECT sl.id, sl.movement_type, sl.reference_type, sl.reference_id,
                    sl.qty_change, sl.qty_after, sl.created_at,
                    p.name AS product_name, p.sku,
                    l.name AS location_name
             FROM stock_ledger sl
             JOIN products  p ON p.id = sl.product_id
             JOIN locations l ON l.id = sl.location_id
             ORDER BY sl.created_at DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    },

    /**
     * Get comprehensive summary for dashboard KPIs
     */
    async getSummary() {
        const [kpis] = await pool.query(`
            SELECT
                (SELECT COALESCE(SUM(quantity), 0) FROM stock_balance) AS total_stock,
                (SELECT COALESCE(SUM(ABS(qty_change)), 0) FROM stock_ledger 
                 WHERE movement_type = 'delivery' AND DATE(created_at) = CURDATE()) AS today_dispense,
                (SELECT 
                    CASE WHEN COUNT(*) = 0 THEN 100 ELSE
                        ROUND(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1)
                    END
                 FROM (
                    SELECT status FROM receipts
                    UNION ALL
                    SELECT status FROM deliveries
                    UNION ALL
                    SELECT status FROM transfers
                 ) AS all_moves
                ) AS efficiency,
                (SELECT
                    CASE WHEN COUNT(*) = 0 THEN 100 ELSE
                        ROUND((COUNT(*) - SUM(CASE WHEN sb.quantity <= p.reorder_level THEN 1 ELSE 0 END)) * 100.0 / COUNT(*), 1)
                    END
                 FROM products p
                 LEFT JOIN (
                    SELECT product_id, SUM(quantity) as quantity 
                    FROM stock_balance 
                    GROUP BY product_id
                 ) sb ON sb.product_id = p.id
                ) AS system_health
        `);
        
        const [movements] = await pool.query(
            `SELECT movement_type, COUNT(*) AS count, SUM(ABS(qty_change)) AS total_qty
             FROM stock_ledger
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY movement_type`
        );

        return {
            kpis: kpis[0],
            movements
        };
    }
};

export default stockLedgerModel;
