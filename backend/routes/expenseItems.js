const express = require("express");
const router = express.Router();
const { pool } = require("../database/db");

// GET all active expense items
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM expense_items WHERE is_active = TRUE ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /expense-items error:", err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// CREATE new expense item
router.post("/", async (req, res) => {
  try {
    const { name, category, default_supplier } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const result = await pool.query(
      `INSERT INTO expense_items (name, category, default_supplier)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET is_active = TRUE
       RETURNING *`,
      [name.trim(), category || null, default_supplier || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /expense-items error:", err);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// DELETE (soft-delete)
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE expense_items SET is_active = FALSE WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Item deactivated", item: result.rows[0] });
  } catch (err) {
    console.error("DELETE /expense-items/:id error:", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

module.exports = router;