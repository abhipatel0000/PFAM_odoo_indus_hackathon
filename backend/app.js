const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

// ── Initialise DB connection pool (tests connection on load) ──
require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static('../frontend'));
app.use(express.static('../')); // Root for index.html

// Root Route
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '../' });
});

// ── Routes ──
const authRoutes    = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const stockLedgerRoutes = require('./routes/stockLedgerRoutes');

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/stock', stockLedgerRoutes);

// ── Global error handler ──
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
