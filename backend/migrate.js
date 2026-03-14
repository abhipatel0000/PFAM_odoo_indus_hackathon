import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import pool from './config/db.js';

async function migrate() {
    console.log('Running migration...');
    try {
        await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE NULL AFTER reorder_level`);
        console.log('  ✓ Added expiry_date column');

        await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS last_sold_at DATETIME NULL AFTER expiry_date`);
        console.log('  ✓ Added last_sold_at column');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                user_id     INT NULL,
                action      VARCHAR(50) NOT NULL,
                entity_type VARCHAR(30) NOT NULL,
                entity_id   INT NULL,
                description TEXT NULL,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('  ✓ Created activity_log table');

        console.log('Migration complete!');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrate();
