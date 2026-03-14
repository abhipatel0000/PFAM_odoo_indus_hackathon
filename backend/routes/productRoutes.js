const express = require('express');
const router = express.Router();

// Mock Product Data
let products = [
    { id: 1, name: 'Steel Rod', sku: 'ST-001', category: 'Raw Material', stock: 50 },
    { id: 2, name: 'Office Chair', sku: 'CH-022', category: 'Furniture', stock: 12 }
];

router.get('/', (req, res) => {
    res.json(products);
});

router.post('/', (req, res) => {
    const newProduct = { id: products.length + 1, ...req.body };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

module.exports = router;
