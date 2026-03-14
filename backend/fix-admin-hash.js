import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fixHash() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const newHash = '$2b$10$CHaX/wE.F8yGmYWIjLNRQe0tlof620e.0gNXVquju9CQ4EELusvLy';
        await connection.execute('UPDATE users SET password_hash = ? WHERE username = ?', [newHash, 'admin']);
        console.log('Successfully updated admin password hash.');
    } catch (err) {
        console.error('Error updating DB:', err);
    } finally {
        await connection.end();
    }
}

fixHash();
