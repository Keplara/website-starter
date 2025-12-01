import express from 'express';

const router = express.Router();

// Example: Get user details
router.get('/user', (req, res) => {
  // In a real app, fetch user details from DB or session
  console.log('[RESOURCE/user] SessionID:', req.sessionID, '| accessToken:', !!(req.session && (req.session as any).accessToken), '| scopes:', (req.session && (req.session as any).scopes));
  if (!req.session || !(req.session as any).accessToken) {
    console.warn('[RESOURCE/user] 401: Not authenticated');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Check for user:read scope in session (assume scopes are space-separated in req.session.scopes)
  const scopes = ((req.session as any).scopes || '').split(' ').filter(Boolean);
  if (!scopes.includes('user:read')) {
    console.warn('[RESOURCE/user] 403: Insufficient scope. Scopes:', scopes);
    return res.status(403).json({ error: 'Insufficient scope: user:read required' });
  }
  // Get roles from session if available, always lowercase
  let roles = (req.session && (req.session as any).roles) ? (req.session as any).roles : ['user'];
  if (Array.isArray(roles)) {
    roles = roles.map((r: string) => r.toLowerCase());
  } else if (typeof roles === 'string') {
    roles = [roles.toLowerCase()];
  }
  // Example user data will come from resource server not itself
  console.log('[RESOURCE/user] 200: Returning user details');
  return res.json({
    id: 'user-123',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    roles,
    scopes
  });
});

// Example: Get products list
router.get('/products', (req, res) => {
  // In a real app, fetch products from DB
  if (!req.session || !(req.session as any).accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Check for product:read scope
  const scopes = ((req.session as any).scopes || '').split(' ');
  if (!scopes.includes('product:read')) {
    return res.status(403).json({ error: 'Insufficient scope: product:read required' });
  }
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
  if (!req.session || !(req.session as any).accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Check for product:read scope
  const scopes = ((req.session as any).scopes || '').split(' ');
  if (!scopes.includes('product:read')) {
    return res.status(403).json({ error: 'Insufficient scope: product:read required' });
  }
  // In a real app, fetch product from DB
  const product = {
    id,
    name: `Product ${id}`,
    price: 19.99 + id.length // Just a placeholder
  };
  return res.json(product);
});

export default router;
