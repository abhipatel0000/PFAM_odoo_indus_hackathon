import pool from '../config/db.js';

const expiryModel = {
    /**
     * Get products expiring within N days (not yet expired)
     */
    async getExpiringSoon(daysThreshold = 30) {
        const [rows] = await pool.query(`
            SELECT p.id, p.name, p.sku, p.expiry_date, p.unit_of_measure,
                   c.name AS category_name,
                   COALESCE(sb.qty_on_hand, 0) AS qty_on_hand,
                   DATEDIFF(p.expiry_date, CURDATE()) AS days_until_expiry
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN stock_balance sb ON sb.product_id = p.id
            WHERE p.expiry_date IS NOT NULL
              AND p.expiry_date > CURDATE()
              AND p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
            ORDER BY p.expiry_date ASC
        `, [daysThreshold]);
        return rows;
    },

    /**
     * Get products already past expiry with stock still on hand
     */
    async getExpired() {
        const [rows] = await pool.query(`
            SELECT p.id, p.name, p.sku, p.expiry_date, p.unit_of_measure,
                   c.name AS category_name,
                   COALESCE(sb.qty_on_hand, 0) AS qty_on_hand,
                   DATEDIFF(CURDATE(), p.expiry_date) AS days_past_expiry
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN stock_balance sb ON sb.product_id = p.id
            WHERE p.expiry_date IS NOT NULL
              AND p.expiry_date < CURDATE()
              AND COALESCE(sb.qty_on_hand, 0) > 0
            ORDER BY p.expiry_date ASC
        `);
        return rows;
    },

    /**
     * Bucket counts for dashboard: expired, ≤7d, ≤30d, ≤90d
     */
    async getExpiryStats() {
        const [rows] = await pool.query(`
            SELECT
                SUM(CASE WHEN p.expiry_date < CURDATE() AND COALESCE(sb.qty_on_hand, 0) > 0 THEN 1 ELSE 0 END) AS expired_count,
                SUM(CASE WHEN p.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS expiring_7d,
                SUM(CASE WHEN p.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS expiring_30d,
                SUM(CASE WHEN p.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY) THEN 1 ELSE 0 END) AS expiring_90d
            FROM products p
            LEFT JOIN stock_balance sb ON sb.product_id = p.id
            WHERE p.expiry_date IS NOT NULL
        `);
        return rows[0];
    }
};

export default expiryModel;
