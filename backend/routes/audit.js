const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');

// Get earnings audit
router.get('/', async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        const result = await pool.query(
            `SELECT a.*, e.date as entry_date 
             FROM earnings_audit a 
             LEFT JOIN earnings e ON a.entry_id = e.id 
             ORDER BY a.changed_at DESC 
             LIMIT $1`,
            [limit]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching audit:', error);
        res.status(500).json({ error: 'Failed to fetch audit history' });
    }
});

// Get audit for a specific entry
router.get('/:entryId', async (req, res) => {
    try {
        const { entryId } = req.params;
        const result = await pool.query(
            `SELECT a.*, e.date as entry_date 
             FROM earnings_audit a 
             LEFT JOIN earnings e ON a.entry_id = e.id 
             WHERE a.entry_id = $1 
             ORDER BY a.changed_at DESC`,
            [entryId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching audit for entry:', error);
        res.status(500).json({ error: 'Failed to fetch audit history for entry' });
    }
});

// Get inventory audit
router.get('/inventory', async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        const result = await pool.query(
            `SELECT * FROM inventory_audit 
             ORDER BY changed_at DESC 
             LIMIT $1`,
            [limit]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching inventory audit:', error);
        res.status(500).json({ error: 'Failed to fetch inventory audit history' });
    }
});

module.exports = router;