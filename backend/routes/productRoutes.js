import express from 'express';
import productModel from '../models/productModel.js';
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await productModel.getAll(req.query);
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
});

// Get low stock products (must be placed before /:id)
router.get('/low-stock', async (req, res) => {
    try {
        const products = await productModel.getLowStock();
        res.json(products);
    } catch (err) {
        console.error('Error fetching low stock:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch low stock products' });
    }
});

// Get categories (must be placed before /:id)
router.get('/categories', async (req, res) => {
    try {
        const categories = await productModel.getCategories();
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await productModel.getById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json(product);
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create product
router.post('/', async (req, res) => {
    try {
        const newProduct = await productModel.create(req.body);
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('Error creating product:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'SKU must be unique' });
        }
        res.status(500).json({ success: false, message: 'Failed to create product' });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const updatedProduct = await productModel.update(req.params.id, req.body);
        res.json(updatedProduct);
    } catch (err) {
        console.error('Error updating product:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'SKU must be unique' });
        }
        res.status(500).json({ success: false, message: 'Failed to update product' });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const success = await productModel.delete(req.params.id);
        if (!success) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        console.error('Error deleting product:', err);
        // e.g. foreign key constraint failure
        res.status(500).json({ success: false, message: 'Failed to delete product. Is it used in movements?' });
    }
});

export default router;
