const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');

// Get all expenses
router.get('/', async (req, res) => {
    try {
        const { date } = req.query;
        let query = 'SELECT * FROM expenses';
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
        console.error('❌ Error fetching expenses:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// Create expense
router.post('/', async (req, res) => {
    try {
        console.log('📥 Received expense:', req.body);
        
        const { date, amount, reason } = req.body;
        
        if (!date || !amount || !reason) {
            return res.status(400).json({ error: 'Date, amount, and reason are required' });
        }

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        // Check balance
        const earningsResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM earnings');
        const expensesResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');
        
        const totalEarnings = parseFloat(earningsResult.rows[0].total);
        const totalExpenses = parseFloat(expensesResult.rows[0].total);
        const balance = totalEarnings - totalExpenses;
        
        if (amount > balance) {
            return res.status(400).json({ 
                error: 'Insufficient balance',
                balance: balance,
                requested: amount,
                message: `You need £${amount.toFixed(2)} but only have £${balance.toFixed(2)} available`
            });
        }

        const now = new Date();
        const time = now.toTimeString().slice(0, 8);

        const result = await pool.query(
            'INSERT INTO expenses (date, time, amount, reason) VALUES ($1, $2, $3, $4) RETURNING *',
            [date, time, amount, reason]
        );
        
        console.log('✅ Expense created successfully!');
        
        // Get updated balance
        const newEarningsResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM earnings');
        const newExpensesResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');
        const newBalance = parseFloat(newEarningsResult.rows[0].total) - parseFloat(newExpensesResult.rows[0].total);

        res.status(201).json({
            expense: result.rows[0],
            remaining_balance: newBalance
        });
    } catch (error) {
        console.error('❌ Error creating expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting expense ID:', id);
        
        const result = await pool.query(
            'DELETE FROM expenses WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;