const express = require('express');
const router = express.Router();
const db = require('../database/db');

// ============================================
// GET all shop orders
// ============================================
router.get('/', async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT * FROM shop_orders ORDER BY created_at DESC LIMIT 500'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /shop-orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ============================================
// GET shop menu items  (must be BEFORE /:id)
// ============================================
router.get('/menu/items', async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT category, name, price
       FROM shop_menu_items
       WHERE is_active = TRUE
       ORDER BY
         CASE category
           WHEN 'MAINS'     THEN 1
           WHEN 'SIDES'     THEN 2
           WHEN 'BUTTY'     THEN 3
           WHEN 'KIDS MENU' THEN 4
           WHEN 'DRINKS'    THEN 5
           WHEN 'BURGERS'   THEN 6
           ELSE 99
         END,
         sort_order,
         name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /shop-orders/menu/items error:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// ============================================
// GET single shop order
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT * FROM shop_orders WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /shop-orders/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ============================================
// CREATE new shop order
// ============================================
router.post('/', async (req, res) => {
  const { items, total_price, customer_name, notes } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }
  if (typeof total_price !== 'number' || total_price < 0) {
    return res.status(400).json({ error: 'valid total_price is required' });
  }

  try {
    const result = await db.pool.query(
      `INSERT INTO shop_orders (items, total_price, customer_name, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [JSON.stringify(items), total_price, customer_name || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /shop-orders error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ============================================
// UPDATE shop order
// ============================================
router.put('/:id', async (req, res) => {
  const { items, total_price, customer_name, notes, status } = req.body;

  try {
    const result = await db.pool.query(
      `UPDATE shop_orders
       SET items = $1,
           total_price = $2,
           customer_name = $3,
           notes = $4,
           status = COALESCE($5, status)
       WHERE id = $6
       RETURNING *`,
      [
        JSON.stringify(items),
        total_price,
        customer_name || null,
        notes || null,
        status || null,
        req.params.id,
      ]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /shop-orders/:id error:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ============================================
// DELETE shop order
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.pool.query(
      'DELETE FROM shop_orders WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted', order: result.rows[0] });
  } catch (err) {
    console.error('DELETE /shop-orders/:id error:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;