const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// ============================================
// IMPORT ROUTES
// ============================================
const earningsRoutes = require("./routes/earnings");
const expensesRoutes = require("./routes/expenses");
const inventoryRoutes = require("./routes/inventory");
const balanceRoutes = require("./routes/balance");
const statisticsRoutes = require("./routes/statistics");
const auditRoutes = require("./routes/audit");
const shopOrdersRouter = require("./routes/shopOrders");
const expenseItemsRoutes = require("./routes/expenseItems");

const app = express();
const port = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Serve static files (receipts)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, "uploads", "receipts"),
  path.join(__dirname, "uploads", "expense-receipts"),
];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================
// ROUTES
// ============================================
app.use("/api/earnings", earningsRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/expense-items", expenseItemsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/balance", balanceRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/shop-orders", shopOrdersRouter);

// ============================================
// START SERVER
// ============================================
app.listen(port, () => {
  console.log(`🚀 Backend running on port ${port}`);
  console.log(`📊 Health: http://localhost:${port}/api/health`);
  console.log(`📎 Uploads: http://localhost:${port}/uploads/`);
});