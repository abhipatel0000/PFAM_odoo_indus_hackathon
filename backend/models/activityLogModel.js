import pool from '../config/db.js';

const activityLogModel = {
    /**
     * Insert a new activity log entry
     */
    async log({ action, entity_type, entity_id, description, user_id = null }) {
        const [result] = await pool.query(
            `INSERT INTO activity_log (user_id, action, entity_type, entity_id, description)
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, action, entity_type, entity_id, description]
        );
        return result.insertId;
    },

    /**
     * Get recent activity log entries with user info
     */
    async getRecent(limit = 20) {
        const [rows] = await pool.query(`
            SELECT al.*, u.name AS user_name
            FROM activity_log al
            LEFT JOIN users u ON u.id = al.user_id
            ORDER BY al.created_at DESC
            LIMIT ?
        `, [limit]);
        return rows;
    },

    /**
     * Get activity for a specific entity
     */
    async getByEntity(entityType, entityId) {
        const [rows] = await pool.query(`
            SELECT al.*, u.name AS user_name
            FROM activity_log al
            LEFT JOIN users u ON u.id = al.user_id
            WHERE al.entity_type = ? AND al.entity_id = ?
            ORDER BY al.created_at DESC
        `, [entityType, entityId]);
        return rows;
    }
};

export default activityLogModel;
