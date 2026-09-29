const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    user: process.env.DB_USER || 'takeaway_user',
    password: process.env.DB_PASSWORD || 'takeaway_password',
    database: process.env.DB_NAME || 'takeaway_db',
    port: process.env.DB_PORT || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Database connected successfully');
    }
});

module.exports = { pool };