const pool = require('../config/db');

const productModel = {
    /**
     * Get all products with optional filter by category_id
     */
    async getAll({ category_id } = {}) {
        let sql = `
            SELECT p.id, p.name, p.sku, p.unit_of_measure, p.reorder_level,
                   c.name AS category,
                   COALESCE(SUM(sb.quantity), 0) AS total_stock
            FROM products p
            LEFT JOIN categories c  ON c.id = p.category_id
            LEFT JOIN stock_balance sb ON sb.product_id = p.id
        `;
        const params = [];
        if (category_id) {
            sql += ' WHERE p.category_id = ?';
            params.push(category_id);
        }
        sql += ' GROUP BY p.id ORDER BY p.name';
        const [rows] = await pool.query(sql, params);
        return rows;
    },

    /**
     * Get a single product by ID including its stock per location
     */
    async getById(id) {
        const [rows] = await pool.query(
            `SELECT p.*, c.name AS category,
                    COALESCE(SUM(sb.quantity), 0) AS total_stock
             FROM products p
             LEFT JOIN categories c  ON c.id = p.category_id
             LEFT JOIN stock_balance sb ON sb.product_id = p.id
             WHERE p.id = ?
             GROUP BY p.id`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Get product by SKU
     */
    async getBySku(sku) {
        const [rows] = await pool.query(
            'SELECT * FROM products WHERE sku = ? LIMIT 1',
            [sku]
        );
        return rows[0] || null;
    },

    /**
     * Create a new product
     */
    async create({ name, sku, category_id, unit_of_measure = 'Unit', reorder_level = 10 }) {
        const [result] = await pool.query(
            `INSERT INTO products (name, sku, category_id, unit_of_measure, reorder_level)
             VALUES (?, ?, ?, ?, ?)`,
            [name, sku, category_id || null, unit_of_measure, reorder_level]
        );
        return this.getById(result.insertId);
    },

    /**
     * Update a product
     */
    async update(id, { name, sku, category_id, unit_of_measure, reorder_level }) {
        await pool.query(
            `UPDATE products
             SET name = COALESCE(?, name),
                 sku  = COALESCE(?, sku),
                 category_id = COALESCE(?, category_id),
                 unit_of_measure = COALESCE(?, unit_of_measure),
                 reorder_level = COALESCE(?, reorder_level)
             WHERE id = ?`,
            [name, sku, category_id, unit_of_measure, reorder_level, id]
        );
        return this.getById(id);
    },

    /**
     * Delete a product
     */
    async delete(id) {
        const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    /**
     * Get products at or below their reorder level (low stock / out of stock)
     */
    async getLowStock() {
        const [rows] = await pool.query(
            `SELECT p.id, p.name, p.sku, p.reorder_level,
                    COALESCE(SUM(sb.quantity), 0) AS total_stock
             FROM products p
             LEFT JOIN stock_balance sb ON sb.product_id = p.id
             GROUP BY p.id
             HAVING total_stock <= p.reorder_level
             ORDER BY total_stock ASC`
        );
        return rows;
    },

    /**
     * Get all categories
     */
    async getCategories() {
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
        return rows;
    }
};

module.exports = productModel;
