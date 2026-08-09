const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

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

app.get('/api/health', (req, res) => {
    pool.query('SELECT 1', (err) => {
        if (err) {
            res.json({ status: 'error', database: 'disconnected', message: err.message });
        } else {
            res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
        }
    });
});

app.get('/api/earnings', async (req, res) => {
    try {
        const { date } = req.query;
        let query = 'SELECT * FROM earnings';
        let params = [];

        if (date) {
            query += ' WHERE date = $1 ORDER BY date DESC, time ASC';
            params.push(date);
        } else {
            query += ' ORDER BY date DESC, time ASC';
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching earnings:', error);
        res.status(500).json({ error: 'Failed to fetch earnings', details: error.message });
    }
});

app.get('/api/earnings/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const result = await pool.query(
            'SELECT * FROM earnings WHERE date = $1 ORDER BY time ASC',
            [date]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No earnings found for this date' });
        }
        
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching earning:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST - Handle both CREATE and UPDATE
app.post('/api/earnings', async (req, res) => {
    try {
        console.log('📥 ========================================');
        console.log('📥 POST /api/earnings');
        console.log('📥 Received data:', JSON.stringify(req.body, null, 2));
        
        let { id, date, time, amount, description } = req.body;
        
        // IMPORTANT: Convert id to integer if provided
        if (id) {
            id = parseInt(id);
            console.log('🔄 ID provided - UPDATING by ID:', id);
            
            if (amount === undefined || amount === null) {
                return res.status(400).json({ error: 'Amount is required' });
            }
            
            // First check if the entry exists
            const checkExists = await pool.query(
                'SELECT * FROM earnings WHERE id = $1',
                [id]
            );
            
            if (checkExists.rows.length === 0) {
                console.log('❌ No entry found with ID:', id);
                return res.status(404).json({ error: 'Earning not found' });
            }
            
            console.log('✅ Found existing entry:', checkExists.rows[0]);
            
            // UPDATE the entry
            const result = await pool.query(
                'UPDATE earnings SET amount = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
                [amount, description || null, id]
            );
            
            console.log('✅ UPDATE by ID successful!');
            console.log('📊 Updated row:', JSON.stringify(result.rows[0], null, 2));
            console.log('📥 ========================================');
            return res.json(result.rows[0]);
        }
        
        // No ID - CREATE new entry
        console.log('➕ No ID provided - CREATING new entry');
        
        if (!time) {
            const now = new Date();
            time = now.toTimeString().slice(0, 8);
            console.log('⏰ Time not provided, using server time:', time);
        }
        
        if (!date || amount === undefined || amount === null) {
            console.log('❌ Missing date or amount');
            return res.status(400).json({ error: 'Date and amount are required' });
        }

        if (isNaN(amount) || amount < 0) {
            console.log('❌ Invalid amount:', amount);
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        // Check if entry exists for this date and time
        console.log('🔍 Checking if entry exists for:', date, time);
        const existing = await pool.query(
            'SELECT * FROM earnings WHERE date = $1 AND time = $2',
            [date, time]
        );

        console.log('📊 Existing rows found:', existing.rows.length);

        let result;
        if (existing.rows.length > 0) {
            // UPDATE existing entry by date/time
            console.log('🔄 UPDATING existing entry for:', date, time);
            result = await pool.query(
                'UPDATE earnings SET amount = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE date = $3 AND time = $4 RETURNING *',
                [amount, description || null, date, time]
            );
            console.log('✅ UPDATE successful!');
        } else {
            // INSERT new entry
            console.log('➕ INSERTING new entry for:', date, time);
            result = await pool.query(
                'INSERT INTO earnings (date, time, amount, description) VALUES ($1, $2, $3, $4) RETURNING *',
                [date, time, amount, description || null]
            );
            console.log('✅ INSERT successful!');
        }

        console.log('📊 Result:', JSON.stringify(result.rows[0], null, 2));
        console.log('📥 ========================================');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error adding earning:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.delete('/api/earnings/:date/:time', async (req, res) => {
    try {
        const { date, time } = req.params;
        console.log('🗑️ Deleting:', date, time);
        
        const result = await pool.query(
            'DELETE FROM earnings WHERE date = $1 AND time = $2 RETURNING *',
            [date, time]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Earning not found' });
        }

        res.json({ message: 'Earning deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting earning:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/statistics', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = 'SELECT COUNT(*) as total_entries, COALESCE(SUM(amount), 0) as total_earnings, COALESCE(AVG(amount), 0) as average_earning, COALESCE(MIN(amount), 0) as min_earning, COALESCE(MAX(amount), 0) as max_earning FROM earnings';
        let params = [];
        let conditions = [];

        if (startDate) {
            conditions.push(`date >= $${params.length + 1}`);
            params.push(startDate);
        }
        if (endDate) {
            conditions.push(`date <= $${params.length + 1}`);
            params.push(endDate);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error fetching statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Backend running on port ${port}`);
    console.log(`📊 Health: http://localhost:${port}/api/health`);
});