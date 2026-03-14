const pool = require('../config/db');

const warehouseModel = {
    /**
     * Get all warehouses
     */
    async getAll() {
        const [rows] = await pool.query(
            'SELECT * FROM warehouses ORDER BY name'
        );
        return rows;
    },

    /**
     * Get a warehouse by ID
     */
    async getById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM warehouses WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Get all locations for a specific warehouse
     */
    async getLocations(warehouseId) {
        const [rows] = await pool.query(
            'SELECT * FROM locations WHERE warehouse_id = ? ORDER BY name',
            [warehouseId]
        );
        return rows;
    },

    /**
     * Get all locations across all warehouses (with warehouse name)
     */
    async getAllLocations() {
        const [rows] = await pool.query(
            `SELECT l.id, l.name, l.warehouse_id, w.name AS warehouse_name
             FROM locations l
             JOIN warehouses w ON w.id = l.warehouse_id
             ORDER BY w.name, l.name`
        );
        return rows;
    },

    /**
     * Create a new warehouse
     */
    async create({ name, address }) {
        const [result] = await pool.query(
            'INSERT INTO warehouses (name, address) VALUES (?, ?)',
            [name, address || null]
        );
        return this.getById(result.insertId);
    },

    /**
     * Create a new location within a warehouse
     */
    async createLocation({ warehouse_id, name }) {
        const [result] = await pool.query(
            'INSERT INTO locations (warehouse_id, name) VALUES (?, ?)',
            [warehouse_id, name]
        );
        const [rows] = await pool.query(
            'SELECT * FROM locations WHERE id = ?',
            [result.insertId]
        );
        return rows[0];
    },

    /**
     * Get stock summary for a warehouse (all products + their quantities)
     */
    async getStockSummary(warehouseId) {
        const [rows] = await pool.query(
            `SELECT p.id AS product_id, p.name AS product_name, p.sku,
                    l.id AS location_id, l.name AS location_name,
                    COALESCE(sb.quantity, 0) AS quantity
             FROM locations l
             CROSS JOIN products p
             LEFT JOIN stock_balance sb ON sb.product_id = p.id AND sb.location_id = l.id
             WHERE l.warehouse_id = ?
             AND COALESCE(sb.quantity, 0) > 0
             ORDER BY p.name, l.name`,
            [warehouseId]
        );
        return rows;
    }
};

module.exports = warehouseModel;
