import express from 'express';
import usersRouter from './users';
import productsRouter from './products';
import { verifyAccessToken } from '../util/tokenVerifier';

// Extend Express Request to include IAM
declare global {
  namespace Express {
    interface Request {
      iam?: {
        userId: string;
        actions: string[];
        deniedActions: string[];
        allowStatements: { action: string; resource: string }[];
        denyStatements: { action: string; resource: string }[];
      };
      usernameOrEmail: string;
      userId: string;
      roles?: string[];
      scopes?: string[];
      authorities?: string[];
    }
  }
}

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

export function requirePermission(permission: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientScopes = req.scopes || [];
    const userAuthorities = req.authorities || [];

    // Normalize naming differences (":" vs ".")
    const normalizedAuthorities = userAuthorities.map(authority => authority.replace(".", ":"));

    // Check if both client scope and user authority allow this permission
    const clientHas = clientScopes.includes(permission);
    const userHas = normalizedAuthorities.includes(permission);
    console.log("clientScopes:", clientScopes, "userAuthorities:", normalizedAuthorities, "checking permission:", permission);
    if (clientHas && userHas) {
      return next();
    }

    return res.status(403).json({
      error: "Forbidden",
      missing: {
        clientScope: !clientHas,
        userAuthority: !userHas,
      },
    });
  };
}

router.use(validateAccessToken);

router.use(usersRouter);
router.use(productsRouter);

export default router;
