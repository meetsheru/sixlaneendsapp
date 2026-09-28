const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import routes
const earningsRoutes = require('./routes/earnings');
const expensesRoutes = require('./routes/expenses');
const inventoryRoutes = require('./routes/inventory');
const balanceRoutes = require('./routes/balance');
const statisticsRoutes = require('./routes/statistics');
const auditRoutes = require('./routes/audit');
const shopOrdersRouter = require('./routes/shopOrders');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files (receipts)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads/receipts');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ============================================
// ROUTES
// ============================================
app.use('/api/earnings', earningsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/shop-orders', shopOrdersRouter);   // ← ADDED

// ============================================
// START SERVER
// ============================================
app.listen(port, () => {
    console.log(`🚀 Backend running on port ${port}`);
    console.log(`📊 Health: http://localhost:${port}/api/health`);
    console.log(`📎 Uploads: http://localhost:${port}/uploads/`);
});