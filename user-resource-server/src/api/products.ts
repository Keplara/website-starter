
import express from 'express';
// No IAM concepts needed
import { ProductModel } from './models';

const router = express.Router();


// Auth middleware for all product routes

// Example: Get products list
router.get('/products', (req, res) => {
	const products = [
		{ id: 'prod-1', name: 'Product One', price: 19.99 },
		{ id: 'prod-2', name: 'Product Two', price: 29.99 },
		{ id: 'prod-3', name: 'Product Three', price: 39.99 }
	];
	return res.json(products);
});

// Example: Get a single product by ID
router.get('/products/:id', (req, res) => {
	const { id } = req.params;
	// In a real app, fetch product from DB
	const product = {
		id,
		name: `Product ${id}`,
		price: 19.99 + id.length
	};
	return res.json(product);
});



// PATCH: Update product note (requires product:update)
router.patch('/products/:id/note', async (req, res) => {
	const { id } = req.params;
	const { note } = req.body;
	try {
		const product = await ProductModel.findByIdAndUpdate(
			id,
			{ note },
			{ new: true }
		);
		if (!product) {
			return res.status(404).json({ error: 'Product not found' });
		}
		return res.json({
			id: product.id,
			message: `Note updated for product ${id}`,
			note: product.note
		});
	} catch (err: any) {
		return res.status(500).json({ error: 'Failed to update product note', details: err.message });
	}
});


export default router;

