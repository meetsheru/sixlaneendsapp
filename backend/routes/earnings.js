const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');

// Get all earnings
router.get('/', async (req, res) => {
    try {
        const { date } = req.query;
        let query = 'SELECT * FROM earnings';
        let params = [];

        if (date) {
            query += ' WHERE date = $1 ORDER BY time DESC';
            params.push(date);
        } else {
            query += ' ORDER BY date DESC, time DESC';
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching earnings:', error);
        res.status(500).json({ error: 'Failed to fetch earnings' });
    }
});

// Get earnings for a specific date
router.get('/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const result = await pool.query(
            'SELECT * FROM earnings WHERE date = $1 ORDER BY time DESC',
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

// Create or update earnings
router.post('/', async (req, res) => {
    try {
        console.log('📥 Received earnings:', req.body);
        
        let { id, date, time, amount, description } = req.body;
        
        if (description === '') {
            description = null;
        }
        
        if (id) {
            id = parseInt(id);
            console.log('🔄 UPDATING by ID:', id);
            
            if (amount === undefined || amount === null) {
                return res.status(400).json({ error: 'Amount is required' });
            }
            
            const checkExists = await pool.query(
                'SELECT * FROM earnings WHERE id = $1',
                [id]
            );
            
            if (checkExists.rows.length === 0) {
                return res.status(404).json({ error: 'Earning not found' });
            }
            
            const result = await pool.query(
                'UPDATE earnings SET amount = $1, description = $2, time = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
                [amount, description, time, id]
            );
            
            console.log('✅ UPDATE successful!');
            return res.json(result.rows[0]);
        }
        
        console.log('➕ CREATING new entry');
        
        if (!time) {
            const now = new Date();
            time = now.toTimeString().slice(0, 8);
        }
        
        if (!date || amount === undefined || amount === null) {
            return res.status(400).json({ error: 'Date and amount are required' });
        }

        if (isNaN(amount) || amount < 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        const result = await pool.query(
            'INSERT INTO earnings (date, time, amount, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [date, time, amount, description]
        );
        console.log('✅ INSERT successful!');

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete earnings
router.delete('/:date/:time', async (req, res) => {
    try {
        const { date, time } = req.params;
        console.log('🗑️ Deleting earnings:', date, time);
        
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

module.exports = router;