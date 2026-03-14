import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

// Create a connection pool for better performance and concurrency
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'coreinventory',
    waitForConnections: true,   // Queue requests if all connections are busy
    connectionLimit: 10,     // Max 10 simultaneous connections
    queueLimit: 0,      // Unlimited queued requests
    decimalNumbers: true    // Return DECIMAL columns as JS numbers
});

console.log(`📡 Connecting to MySQL: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306} (${process.env.DB_NAME || 'coreinventory'}) as ${process.env.DB_USER || 'root'}`);

// Test the connection on first load
pool.getConnection()
    .then(conn => {
        console.log('✅ MySQL connected successfully (coreinventory)');
        conn.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection failed:', err.message);
        console.error('   Check your .env DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
        process.exit(1);
    });

export default pool;
