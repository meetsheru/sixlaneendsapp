const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { pool } = require("../database/db");

// ============================================
// Multer setup for receipt uploads
// ============================================
const uploadDir = path.join(__dirname, "..", "uploads", "expense-receipts");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `expense_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /image\/(jpeg|png|gif|webp)|application\/pdf/.test(file.mimetype);
    cb(ok ? null : new Error("Only images and PDFs allowed"), ok);
  },
});

// ============================================
// GET all expenses (with their line items)
// ============================================
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;
    let query = "SELECT * FROM expenses";
    let params = [];

    if (date) {
      query += " WHERE date = $1 ORDER BY time DESC";
      params.push(date);
    } else {
      query += " ORDER BY date DESC, time DESC";
    }

    const result = await pool.query(query, params);

    // Fetch line items for each expense
    const expenses = result.rows;
    for (const exp of expenses) {
      const items = await pool.query(
        "SELECT * FROM expense_line_items WHERE expense_id = $1 ORDER BY id",
        [exp.id]
      );
      exp.items = items.rows;
    }

    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// ============================================
// CREATE expense (with line items + receipt)
// ============================================
router.post("/", upload.single("receipt"), async (req, res) => {
  try {
    console.log("Received expense:", req.body);

    // When multipart/form-data, all fields come as strings
    const { date, amount, reason } = req.body;
    const amountNum = parseFloat(amount);
    const items = req.body.items ? JSON.parse(req.body.items) : [];

    if (!date || !amountNum || !reason) {
      return res
        .status(400)
        .json({ error: "Date, amount, and reason are required" });
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      return res
        .status(400)
        .json({ error: "Amount must be a positive number" });
    }

    // ---- Balance check ----
    const earningsResult = await pool.query(
      "SELECT COALESCE(SUM(total_price), 0) AS total FROM shop_orders"
    );
    const expensesResult = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses"
    );
    const totalEarnings = parseFloat(earningsResult.rows[0].total);
    const totalExpenses = parseFloat(expensesResult.rows[0].total);
    const balance = totalEarnings - totalExpenses;

    if (amountNum > balance) {
      // Clean up uploaded file if rejection
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        error: "Insufficient balance",
        balance: balance,
        requested: amountNum,
        message: `You need £${amountNum.toFixed(2)} but only have £${balance.toFixed(2)} available`,
      });
    }

    const now = new Date();
    const time = now.toTimeString().slice(0, 8);

    // ---- Insert expense ----
    const result = await pool.query(
      `INSERT INTO expenses (date, time, amount, reason, receipt_filename, receipt_path)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        date,
        time,
        amountNum,
        reason,
        req.file ? req.file.filename : null,
        req.file ? req.file.path : null,
      ]
    );

    const expenseId = result.rows[0].id;

    // ---- Insert line items ----
    const savedItems = [];
    for (const item of items) {
      if (!item.name || !item.amount) continue;
      const itemAmount = parseFloat(item.amount);
      if (isNaN(itemAmount) || itemAmount <= 0) continue;

      const li = await pool.query(
        `INSERT INTO expense_line_items (expense_id, item_id, item_name, amount)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [expenseId, item.item_id || null, item.name.trim(), itemAmount]
      );
      savedItems.push(li.rows[0]);
    }

    // ---- Updated balance ----
    const newEarningsResult = await pool.query(
      "SELECT COALESCE(SUM(total_price), 0) AS total FROM shop_orders"
    );
    const newExpensesResult = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses"
    );
    const newBalance =
      parseFloat(newEarningsResult.rows[0].total) -
      parseFloat(newExpensesResult.rows[0].total);

    res.status(201).json({
      expense: { ...result.rows[0], items: savedItems },
      remaining_balance: newBalance,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// ============================================
// DELETE expense
// ============================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deleting expense ID:", id);

    // Delete receipt file if any
    const existing = await pool.query(
      "SELECT receipt_path FROM expenses WHERE id = $1",
      [id]
    );
    if (existing.rows.length && existing.rows[0].receipt_path) {
      fs.unlink(existing.rows[0].receipt_path, () => {});
    }

    const result = await pool.query(
      "DELETE FROM expenses WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;