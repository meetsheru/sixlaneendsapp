const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const orderRoutes = require('./routes/orders');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database
initDb();

// Routes
app.use('/api/orders', orderRoutes);

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});