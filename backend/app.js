import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// ── Initialise DB connection pool (tests connection on load) ──
import './config/db.js';

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
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import stockLedgerRoutes from './routes/stockLedgerRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import adjustmentRoutes from './routes/adjustmentRoutes.js';
import expiryRoutes from './routes/expiryRoutes.js';
import deadStockRoutes from './routes/deadStockRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import reorderRoutes from './routes/reorderRoutes.js';

app.use('/api/auth',        authRoutes);
app.use('/api/products',    productRoutes);
app.use('/api/warehouses',  warehouseRoutes);
app.use('/api/stock',       stockLedgerRoutes);
app.use('/api/receipts',    receiptRoutes);
app.use('/api/deliveries',  deliveryRoutes);
app.use('/api/transfers',   transferRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/expiry',      expiryRoutes);
app.use('/api/dead-stock',  deadStockRoutes);
app.use('/api/activity',    activityLogRoutes);
app.use('/api/reorder',     reorderRoutes);

// ── Global error handler ──
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

export default app;
