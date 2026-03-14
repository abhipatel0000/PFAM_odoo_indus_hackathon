import pool from '../config/db.js';

const reorderModel = {
    /**
     * Get products below reorder level with consumption-rate analysis
     * Suggests reorder qty based on avg daily consumption over last 30 days
     */
    async getSuggestions() {
        const [rows] = await pool.query(`
            SELECT
                p.id, p.name, p.sku, p.reorder_level, p.unit_of_measure,
                c.name AS category_name,
                COALESCE(sb.qty_on_hand, 0) AS qty_on_hand,
                p.reorder_level - COALESCE(sb.qty_on_hand, 0) AS deficit,
                COALESCE(consumption.avg_daily, 0) AS avg_daily_consumption,
                CASE
                    WHEN COALESCE(sb.qty_on_hand, 0) <= 0 THEN 'CRITICAL'
                    WHEN COALESCE(sb.qty_on_hand, 0) <= p.reorder_level * 0.5 THEN 'URGENT'
                    ELSE 'LOW'
                END AS urgency,
                -- Suggest enough stock for 30 days + cover the deficit
                GREATEST(
                    p.reorder_level - COALESCE(sb.qty_on_hand, 0),
                    CEIL(COALESCE(consumption.avg_daily, 1) * 30)
                ) AS suggested_reorder_qty
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN stock_balance sb ON sb.product_id = p.id
            LEFT JOIN (
                SELECT product_id,
                       ABS(SUM(qty_change)) / 30.0 AS avg_daily
                FROM stock_ledger
                WHERE movement_type IN ('delivery', 'transfer_out')
                  AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY product_id
            ) consumption ON consumption.product_id = p.id
            WHERE COALESCE(sb.qty_on_hand, 0) < p.reorder_level
            ORDER BY
                CASE
                    WHEN COALESCE(sb.qty_on_hand, 0) <= 0 THEN 0
                    WHEN COALESCE(sb.qty_on_hand, 0) <= p.reorder_level * 0.5 THEN 1
                    ELSE 2
                END,
                deficit DESC
        `);
        return rows;
    }
};

export default reorderModel;
