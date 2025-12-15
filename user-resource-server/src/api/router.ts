import express from 'express';

import usersRouter from './users';
import productsRouter from './products';
import userRegistrationRouter from './userRegistration';
import { verifyAccessToken } from '../util/tokenVerifier';



const router = express.Router();
console.log("loading api router");

async function validateAccessToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  try {
    // Verify token signature and decode payload
    const payload: any = await verifyAccessToken(token);
    console.log('✓ Access token verified:', payload);
    if (!payload) {
      return res.status(403).json({ error: 'Invalid access token' });
    }

    req.roles = payload.roles;
    req.scopes = payload.scope;
    req.authorities = payload.authorities;
    req.userId = payload.userId;
    req.usernameOrEmail = payload.sub;
    // Token is valid, continue
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token has expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid access token' });
    }
    return res.status(403).json({ error: 'Token verification failed' });
  }
}




// Public registration endpoints (no auth required)
router.use(userRegistrationRouter);

// All other routes require access token
router.use(validateAccessToken);
router.use(usersRouter);
router.use(productsRouter);

export default router;
