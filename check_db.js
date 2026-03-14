const pool = require('./backend/config/db');

async function checkUsers() {
    try {
        console.log('Checking users in database...');
        const [rows] = await pool.query('SELECT id, name, username, email, role, password_hash FROM users');
        console.log('Users found:', JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error checking users:', err);
        process.exit(1);
    }
}

checkUsers();
