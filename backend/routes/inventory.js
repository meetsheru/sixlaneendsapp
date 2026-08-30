const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../database/db');

// Configure multer
const uploadDir = path.join(__dirname, '../uploads/receipts');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

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

// Get all inventory purchases
router.get('/', async (req, res) => {
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
// Get stock with cost per unit
router.get('/stock', async (req, res) => {
    try {
        const { category } = req.query;
        let query = `
            SELECT 
                s.*,
                COALESCE(p.cost_per_unit, 0) as cost_per_unit
            FROM inventory_stock s
            LEFT JOIN (
                SELECT DISTINCT ON (LOWER(item_name)) 
                    item_name,
                    cost_per_unit 
                FROM inventory_purchases 
                ORDER BY LOWER(item_name), date DESC, time DESC
            ) p ON LOWER(s.item_name) = LOWER(p.item_name)
        `;
        let params = [];
        
        if (category) {
            query += ' WHERE s.category = $1';
            params.push(category);
        }
        
        query += ' ORDER BY s.last_updated DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching stock:', error);
        res.status(500).json({ error: 'Failed to fetch stock' });
    }
});

// Create inventory purchase
router.post('/', upload.single('receipt'), async (req, res) => {
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete inventory purchase
router.delete('/:id', async (req, res) => {
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
            const filePath = path.join(__dirname, '../', purchase.receipt_path);
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

// Get purchase history for a specific item
router.get('/item/:itemName', async (req, res) => {
    try {
        const { itemName } = req.params;
        const result = await pool.query(
            `SELECT * FROM inventory_purchases 
             WHERE LOWER(item_name) = LOWER($1) 
             ORDER BY date DESC, time DESC`,
            [itemName]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching item history:', error);
        res.status(500).json({ error: 'Failed to fetch item history' });
    }
});

// Get current stock for a specific item
router.get('/item/:itemName/stock', async (req, res) => {
    try {
        const { itemName } = req.params;
        const result = await pool.query(
            `SELECT * FROM inventory_stock 
             WHERE LOWER(item_name) = LOWER($1)`,
            [itemName]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found in stock' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error fetching item stock:', error);
        res.status(500).json({ error: 'Failed to fetch item stock' });
    }
});

module.exports = router;