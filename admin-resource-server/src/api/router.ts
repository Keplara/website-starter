import express from 'express';
import usersRouter from './users';
import productsRouter from './products';
import { verifyAccessToken } from '../util/tokenVerifier';
import { getAssumedRoleSession } from '../util/redisClient';


// check assumed role session id in header

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
    // Access token should not carry assumed-role state; handled separately
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

async function loadAssumedRoleSession(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const header = req.headers['x-assumed-role-session'];
    const sessionId = Array.isArray(header) ? header[0] : header;
    if (!sessionId || typeof sessionId !== 'string') {
      return next();
    }

    const userId = (req as any).userId;
    const session = await getAssumedRoleSession(sessionId);
    if (session && session.userId === userId) {
      // If stored with EX TTL, presence implies not expired
      (req as any).assumedRole = session.roleName;
      (req as any).isAssumedRoleToken = true;
    } else {
      (req as any).assumedRole = undefined;
      (req as any).isAssumedRoleToken = false;
    }
    return next();
  } catch (error) {
    (req as any).assumedRole = undefined;
    (req as any).isAssumedRoleToken = false;
    return next();
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

export function requireAssumedRole(roleName: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const isAssumed = (req as any).isAssumedRoleToken === true;
    const roleFromAssumed = (req as any).assumedRole as string | undefined;
    const rolesFromAccess = Array.isArray(req.roles) ? req.roles : [];
    const match = (val?: string) => typeof val === 'string' && val.toLowerCase() === roleName.toLowerCase();

    // Prefer explicit assumed-role token validation
    if (isAssumed && match(roleFromAssumed)) {
      return next();
    }

    // Fallback: allow if access token carries matching role claim
    if (rolesFromAccess.some(r => match(r))) {
      return next();
    }

    return res.status(403).json({
      error: 'Assumed role required',
      requiredRole: roleName,
      providedRole: roleFromAssumed || rolesFromAccess.join(',') || null
    });
  };
}

// Ensure the access token itself carries the Admin role
function ensureAdminRoleFromAccessToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const rolesFromAccess = Array.isArray(req.roles) ? req.roles : [];

  const isAdminRole = (val?: string) => {
    if (!val || typeof val !== 'string') return false;
    const v = val.toLowerCase();
    return v === 'admin' || v === 'role_admin' || v === 'role:admin';
  };

  const hasAdminRole = rolesFromAccess.some(r => isAdminRole(String(r)));
  if (hasAdminRole) {
    return next();
  }

  return res.status(403).json({
    error: 'Admin role required on access token',
    requiredRole: 'Admin'
  });
}

router.use(validateAccessToken);
// Ensure the access token itself carries the Admin role
router.use(ensureAdminRoleFromAccessToken);
router.use(loadAssumedRoleSession);
router.use(usersRouter);
router.use(productsRouter);

export default router;
