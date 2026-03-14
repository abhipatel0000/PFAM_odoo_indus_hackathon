import pool from '../config/db.js';

const deadStockModel = {
    /**
     * Products with no sales in N days AND stock still on hand
     */
    async getDeadStock(daysSinceLastSale = 90) {
        const [rows] = await pool.query(`
            SELECT p.id, p.name, p.sku, p.last_sold_at, p.unit_of_measure,
                   c.name AS category_name,
                   COALESCE(sb.qty_on_hand, 0) AS qty_on_hand,
                   DATEDIFF(CURDATE(), COALESCE(p.last_sold_at, p.created_at)) AS days_since_last_sale
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN stock_balance sb ON sb.product_id = p.id
            WHERE COALESCE(sb.qty_on_hand, 0) > 0
              AND (p.last_sold_at IS NULL OR p.last_sold_at < DATE_SUB(NOW(), INTERVAL ? DAY))
            ORDER BY days_since_last_sale DESC
        `, [daysSinceLastSale]);
        return rows;
    },

    /**
     * Total value locked in dead stock
     */
    async getDeadStockSummary(daysSinceLastSale = 90) {
        const [rows] = await pool.query(`
            SELECT
                COUNT(*) AS dead_stock_count,
                COALESCE(SUM(sb.qty_on_hand), 0) AS total_dead_units
            FROM products p
            LEFT JOIN stock_balance sb ON sb.product_id = p.id
            WHERE COALESCE(sb.qty_on_hand, 0) > 0
              AND (p.last_sold_at IS NULL OR p.last_sold_at < DATE_SUB(NOW(), INTERVAL ? DAY))
        `, [daysSinceLastSale]);
        return rows[0];
    }
};

export default deadStockModel;
