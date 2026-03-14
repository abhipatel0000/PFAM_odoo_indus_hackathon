require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkUsers() {
    try {
        console.log('Connecting to MySQL...');
        console.log('Env info:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            pass: process.env.DB_PASS ? 'SET' : 'NOT SET',
            db: process.env.DB_NAME
        });

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'core_inventory'
        });

        console.log('Connected! Fetching users...');
        const [rows] = await connection.query('SELECT id, name, username, email, role FROM users');
        console.log('Users found:', JSON.stringify(rows, null, 2));
        
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkUsers();
