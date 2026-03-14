import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkUsers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await connection.execute('SELECT username, role, password_hash FROM users');
        console.log('Users in DB:');
        rows.forEach(user => {
            console.log(`- Username: ${user.username}, Role: ${user.role}, Hash: ${user.password_hash}`);
        });
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await connection.end();
    }
}

checkUsers();
