const { pool } = require('../db');

exports.createOrder = async (req, res) => {
  const { items, total } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO orders (items, total_price) VALUES ($1, $2) RETURNING *',
      [JSON.stringify(items), total]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const { items, total } = req.body;
  try {
    const result = await pool.query(
      'UPDATE orders SET items = $1, total_price = $2 WHERE id = $3 RETURNING *',
      [JSON.stringify(items), total, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};