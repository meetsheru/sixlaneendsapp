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
           WHEN 'EXTRAS'    THEN 3
           WHEN 'BUTTY'     THEN 4
           WHEN 'KIDS MENU' THEN 5
           WHEN 'DRINKS'    THEN 6
           WHEN 'BURGERS'   THEN 7
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
// GET item sales report (aggregates items across all orders)
// Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
// ============================================
router.get('/reports/items', async (req, res) => {
  try {
    const { from, to } = req.query;

    // Build WHERE clause for date filtering
    const conditions = [];
    const params = [];
    if (from) {
      params.push(from);
      conditions.push(`created_at >= $${params.length}::date`);
    }
    if (to) {
      params.push(to);
      conditions.push(`created_at < ($${params.length}::date + INTERVAL '1 day')`);
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    // Expand items JSONB into rows, then aggregate
    const query = `
      SELECT
        item->>'name'   AS item_name,
        item->>'category' AS category,
        SUM((item->>'qty')::int) AS qty_sold,
        SUM((item->>'qty')::numeric * (item->>'price')::numeric) AS revenue
      FROM shop_orders,
           jsonb_array_elements(items) AS item
      ${where}
      GROUP BY item->>'name', item->>'category'
      ORDER BY qty_sold DESC, item_name ASC
    `;

    const result = await db.pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /shop-orders/reports/items error:', err);
    res.status(500).json({ error: 'Failed to generate item report' });
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
  const { items, total_price, customer_name, notes, payment_method } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }
  if (typeof total_price !== 'number' || total_price < 0) {
    return res.status(400).json({ error: 'valid total_price is required' });
  }

  const method = payment_method === 'card' ? 'card' : 'cash';

  try {
    const result = await db.pool.query(
      `INSERT INTO shop_orders (items, total_price, customer_name, notes, payment_method)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [JSON.stringify(items), total_price, customer_name || null, notes || null, method]
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
  const { items, total_price, customer_name, notes, status, payment_method } = req.body;

  const method = payment_method === 'card' ? 'card' : 'cash';

  try {
    const result = await db.pool.query(
      `UPDATE shop_orders
       SET items = $1,
           total_price = $2,
           customer_name = $3,
           notes = $4,
           status = COALESCE($5, status),
           payment_method = $6
       WHERE id = $7
       RETURNING *`,
      [
        JSON.stringify(items),
        total_price,
        customer_name || null,
        notes || null,
        status || null,
        method,
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

// ============================================
// GET component/ingredient sales report
// Counts how many times each tagged component appears across all orders
// Query params: from, to
// ============================================
router.get('/reports/components', async (req, res) => {
  try {
    const { from, to } = req.query;

    const conditions = [];
    const params = [];
    if (from) {
      params.push(from);
      conditions.push(`so.created_at >= $${params.length}::date`);
    }
    if (to) {
      params.push(to);
      conditions.push(`so.created_at < ($${params.length}::date + INTERVAL '1 day')`);
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const query = `
      SELECT
        comp.value AS component,
        SUM((item->>'qty')::int) AS qty_sold
      FROM shop_orders so,
           jsonb_array_elements(so.items) AS item
      LEFT JOIN shop_menu_items smi
             ON smi.name = item->>'name'
            AND smi.category = item->>'category'
      CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(smi.components, '[]'::jsonb)) AS comp(value)
      ${where}
      GROUP BY comp.value
      ORDER BY qty_sold DESC, component ASC
    `;

    const result = await db.pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /shop-orders/reports/components error:', err);
    res.status(500).json({ error: 'Failed to generate component report' });
  }
});

module.exports = router;