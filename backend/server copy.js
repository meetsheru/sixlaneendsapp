const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ============================================
// SERVE STATIC FILES (RECEIPTS) - MUST BE BEFORE ROUTES
// ============================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// ENSURE UPLOADS DIRECTORY EXISTS
// ============================================
const uploadDir = path.join(__dirname, 'uploads/receipts');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images and PDF files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    user: process.env.DB_USER || 'takeaway_user',
    password: process.env.DB_PASSWORD || 'takeaway_password',
    database: process.env.DB_NAME || 'takeaway_db',
    port: process.env.DB_PORT || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Database connected successfully');
    }
});

app.get('/api/health', (req, res) => {
    pool.query('SELECT 1', (err) => {
        if (err) {
            res.json({ status: 'error', database: 'disconnected', message: err.message });
        } else {
            res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
        }
    });
});

// ============================================
// EARNINGS API
// ============================================

app.get('/api/earnings', async (req, res) => {
    try {
        const { date } = req.query;
        let query = 'SELECT * FROM earnings';
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
        console.error('❌ Error fetching earnings:', error);
        res.status(500).json({ error: 'Failed to fetch earnings', details: error.message });
    }
});

app.get('/api/earnings/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const result = await pool.query(
            'SELECT * FROM earnings WHERE date = $1 ORDER BY time DESC',
            [date]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No earnings found for this date' });
        }
        
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching earning:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/earnings', async (req, res) => {
    try {
        console.log('📥 Received earnings:', req.body);
        
        let { id, date, time, amount, description } = req.body;
        
        if (description === '') {
            description = null;
        }
        
        if (id) {
            id = parseInt(id);
            console.log('🔄 UPDATING by ID:', id);
            
            if (amount === undefined || amount === null) {
                return res.status(400).json({ error: 'Amount is required' });
            }
            
            const checkExists = await pool.query(
                'SELECT * FROM earnings WHERE id = $1',
                [id]
            );
            
            if (checkExists.rows.length === 0) {
                return res.status(404).json({ error: 'Earning not found' });
            }
            
            const result = await pool.query(
                'UPDATE earnings SET amount = $1, description = $2, time = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
                [amount, description, time, id]
            );
            
            console.log('✅ UPDATE successful!');
            return res.json(result.rows[0]);
        }
        
        console.log('➕ CREATING new entry');
        
        if (!time) {
            const now = new Date();
            time = now.toTimeString().slice(0, 8);
        }
        
        if (!date || amount === undefined || amount === null) {
            return res.status(400).json({ error: 'Date and amount are required' });
        }

        if (isNaN(amount) || amount < 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        const result = await pool.query(
            'INSERT INTO earnings (date, time, amount, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [date, time, amount, description]
        );
        console.log('✅ INSERT successful!');

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.delete('/api/earnings/:date/:time', async (req, res) => {
    try {
        const { date, time } = req.params;
        console.log('🗑️ Deleting earnings:', date, time);
        
        const result = await pool.query(
            'DELETE FROM earnings WHERE date = $1 AND time = $2 RETURNING *',
            [date, time]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Earning not found' });
        }

        res.json({ message: 'Earning deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting earning:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// EXPENSES API
// ============================================

app.get('/api/expenses', async (req, res) => {
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
        res.status(500).json({ error: 'Failed to fetch expenses', details: error.message });
    }
});

app.get('/api/balance', async (req, res) => {
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

app.post('/api/expenses', async (req, res) => {
    try {
        console.log('📥 Received expense:', req.body);
        
        const { date, amount, reason } = req.body;
        
        if (!date || !amount || !reason) {
            return res.status(400).json({ error: 'Date, amount, and reason are required' });
        }

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

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
                message: 'You need £' + amount.toFixed(2) + ' but only have £' + balance.toFixed(2) + ' available'
            });
        }

        const now = new Date();
        const time = now.toTimeString().slice(0, 8);

        const result = await pool.query(
            'INSERT INTO expenses (date, time, amount, reason) VALUES ($1, $2, $3, $4) RETURNING *',
            [date, time, amount, reason]
        );
        
        console.log('✅ Expense created successfully!');
        
        const newEarningsResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM earnings');
        const newExpensesResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');
        const newBalance = parseFloat(newEarningsResult.rows[0].total) - parseFloat(newExpensesResult.rows[0].total);

        res.status(201).json({
            expense: result.rows[0],
            remaining_balance: newBalance
        });
    } catch (error) {
        console.error('❌ Error creating expense:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.delete('/api/expenses/:id', async (req, res) => {
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

// ============================================
// INVENTORY API
// ============================================

app.get('/api/inventory', async (req, res) => {
    try {
        const { date, category } = req.query;
        let query = 'SELECT * FROM inventory_purchases';
        let params = [];
        let conditions = [];

        if (date) {
            conditions.push('date = $' + (params.length + 1));
            params.push(date);
        }
        if (category) {
            conditions.push('category = $' + (params.length + 1));
            params.push(category);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY date DESC, time DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

app.get('/api/inventory/stock', async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM inventory_stock';
        let params = [];
        
        if (category) {
            query += ' WHERE category = $1 ORDER BY item_name';
            params.push(category);
        } else {
            query += ' ORDER BY item_name';
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching stock:', error);
        res.status(500).json({ error: 'Failed to fetch stock' });
    }
});

app.post('/api/inventory', upload.single('receipt'), async (req, res) => {
    try {
        console.log('📥 Received inventory purchase:', req.body);
        console.log('📎 File:', req.file);

        const { date, item_name, quantity, unit, cost_per_unit, total_cost, supplier, category, notes } = req.body;
        
        if (!date || !item_name || !quantity || !unit || !cost_per_unit || !total_cost) {
            return res.status(400).json({ error: 'Date, item, quantity, unit, cost per unit, and total cost are required' });
        }

        const now = new Date();
        const time = now.toTimeString().slice(0, 8);

        let receipt_filename = null;
        let receipt_path = null;

        if (req.file) {
            receipt_filename = req.file.filename;
            receipt_path = '/uploads/receipts/' + req.file.filename;
        }

        const result = await pool.query(
            `INSERT INTO inventory_purchases 
             (date, time, item_name, quantity, unit, cost_per_unit, total_cost, supplier, category, notes, receipt_filename, receipt_path) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
             RETURNING *`,
            [date, time, item_name, quantity, unit, cost_per_unit, total_cost, supplier || null, category || null, notes || null, receipt_filename, receipt_path]
        );

        console.log('✅ Inventory purchase created:', result.rows[0]);
        res.status(201).json({
            message: 'Inventory purchase added successfully',
            purchase: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Error creating inventory purchase:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.delete('/api/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting inventory purchase ID:', id);
        
        const purchaseResult = await pool.query(
            'SELECT * FROM inventory_purchases WHERE id = $1',
            [id]
        );

        if (purchaseResult.rows.length === 0) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        const purchase = purchaseResult.rows[0];

        if (purchase.receipt_path) {
            const filePath = path.join(__dirname, purchase.receipt_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('📎 Receipt file deleted:', filePath);
            }
        }

        const result = await pool.query(
            'DELETE FROM inventory_purchases WHERE id = $1 RETURNING *',
            [id]
        );

        res.json({ message: 'Purchase deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting inventory purchase:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// STATISTICS API
// ============================================

app.get('/api/statistics', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = 'SELECT COUNT(*) as total_entries, COALESCE(SUM(amount), 0) as total_earnings, COALESCE(AVG(amount), 0) as average_earning, COALESCE(MIN(amount), 0) as min_earning, COALESCE(MAX(amount), 0) as max_earning FROM earnings';
        let params = [];
        let conditions = [];

        if (startDate) {
            conditions.push('date >= $' + (params.length + 1));
            params.push(startDate);
        }
        if (endDate) {
            conditions.push('date <= $' + (params.length + 1));
            params.push(endDate);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error fetching statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// AUDIT API
// ============================================

app.get('/api/audit', async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        const result = await pool.query(
            `SELECT a.*, e.date as entry_date 
             FROM earnings_audit a 
             LEFT JOIN earnings e ON a.entry_id = e.id 
             ORDER BY a.changed_at DESC 
             LIMIT $1`,
            [limit]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching audit:', error);
        res.status(500).json({ error: 'Failed to fetch audit history' });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(port, () => {
    console.log('🚀 Backend running on port ' + port);
    console.log('📊 Health: http://localhost:' + port + '/api/health');
    console.log('📎 Uploads: http://localhost:' + port + '/uploads/');
});