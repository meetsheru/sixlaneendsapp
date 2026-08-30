const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');

router.get('/', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = 'SELECT COUNT(*) as total_entries, COALESCE(SUM(amount), 0) as total_earnings, COALESCE(AVG(amount), 0) as average_earning, COALESCE(MIN(amount), 0) as min_earning, COALESCE(MAX(amount), 0) as max_earning FROM earnings';
        let params = [];
        let conditions = [];

        if (startDate) {
            conditions.push('date >= $' + (params.length + 1));
            params.push(startDate);
        }
        if (endDate) {
            conditions.push('date <= $' + (params.length + 1));
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

module.exports = router;