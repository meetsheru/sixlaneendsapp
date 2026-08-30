const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');

router.get('/', async (req, res) => {
    try {
        const earningsResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM earnings');
        const expensesResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');
        
        const totalEarnings = parseFloat(earningsResult.rows[0].total);
        const totalExpenses = parseFloat(expensesResult.rows[0].total);
        const balance = totalEarnings - totalExpenses;
        
        res.json({
            total_earnings: totalEarnings,
            total_expenses: totalExpenses,
            balance: balance,
            can_spend: balance > 0
        });
    } catch (error) {
        console.error('❌ Error fetching balance:', error);
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

module.exports = router;