const express = require('express');
const router = express.Router();
const db = require('../database/db');

// ============================================
// GET /balance
// Returns:
//   total_earnings  = sum of ALL shop orders (never decreases)
//   total_expenses  = sum of ALL expenses
//   balance         = total_earnings - total_expenses (can decrease)
// ============================================
router.get('/', async (req, res) => {
  try {
    // All-time earnings = sum of every shop order total
    const earningsResult = await db.pool.query(
      'SELECT COALESCE(SUM(total_price), 0) AS total FROM shop_orders'
    );
    const totalEarnings = parseFloat(earningsResult.rows[0].total) || 0;

    // All-time expenses
    const expensesResult = await db.pool.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses'
    );
    const totalExpenses = parseFloat(expensesResult.rows[0].total) || 0;

    const balance = totalEarnings - totalExpenses;

    res.json({
      total_earnings: totalEarnings,
      total_expenses: totalExpenses,
      balance: balance,
    });
  } catch (err) {
    console.error('GET /balance error:', err);
    res.status(500).json({ error: 'Failed to calculate balance' });
  }
});

module.exports = router;