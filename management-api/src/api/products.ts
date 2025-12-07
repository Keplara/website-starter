import express from 'express';
import { requireAction } from './router';

const router = express.Router();


// Auth middleware for all product routes

// Example: Get products list
router.get('/products', requireAction("product:read"), (req, res) => {
	const products = [
		{ id: 'prod-1', name: 'Product One', price: 19.99 },
		{ id: 'prod-2', name: 'Product Two', price: 29.99 },
		{ id: 'prod-3', name: 'Product Three', price: 39.99 }
	];
	return res.json(products);
});

// Example: Get a single product by ID
router.get('/products/:id', requireAction("product:read"), (req, res) => {
	const { id } = req.params;
	// In a real app, fetch product from DB
	const product = {
		id,
		name: `Product ${id}`,
		price: 19.99 + id.length
	};
	return res.json(product);
});

// Example: Get a single product by ID
router.post('/products', requireAction("ProductUpdate"), (req, res) => {
	const { id } = req.params;
	// In a real app, fetch product from DB
	const product = {
		id,
		name: `Product ${id}`,
		price: 19.99 + id.length
	};
	return res.json(product);
});
export default router;

