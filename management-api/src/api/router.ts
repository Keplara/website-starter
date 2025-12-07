import express from 'express';
import usersRouter from './users';
import productsRouter from './products';
import { verifyAccessToken } from '../util/tokenVerifier';
import policyRouter from './policy';
import { PolicyModel, GroupModel } from './models';
import groupsRouter from './groups';

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
      roles?: string[];
      scopes?: string[];
      authorities?: string[];
    }
  }
}

const router = express.Router();
console.log("loading api router");

// Helper to check if an action matches a pattern (case-sensitive, supports *)
function actionMatches(userAction: string, requiredAction: string): boolean {
  // Exact match
  if (userAction === requiredAction) return true;

  // Wildcard match: "policy:Update*" matches "policy:Update" and "policy:UpdateName"
  if (userAction.includes('*')) {
    const pattern = userAction.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(requiredAction);
  }

  return false;
}

// Helper to check if a resource matches a pattern (case-sensitive, supports *)
function resourceMatches(policyResource: string, requestedResource: string): boolean {
  if (policyResource === requestedResource) return true;
  if (policyResource.includes('*')) {
    const pattern = policyResource.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(requestedResource);
  }
  return false;
}

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

    // Attach user info to request
    req.iam = {
      userId: payload.userId,
      actions: [],
      deniedActions: [],
      allowStatements: [],
      denyStatements: []
    };
    req.roles = payload.roles;
    req.scopes = payload.scope;
    req.authorities = payload.authorities;

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

// Resolve permissions from groups by database lookup
async function resolvePermissions(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = req.iam?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'userId not found' });
  }

  try {
    const allowedActions = new Set<string>();
    const deniedActions = new Set<string>();
    const allowStatements: { action: string; resource: string }[] = [];
    const denyStatements: { action: string; resource: string }[] = [];

    // Get user's groups from database
    const userGroups = await GroupModel.find({ members: userId });

    // Guard: if user has no groups, no permissions
    if (userGroups.length === 0) {
      req.iam!.actions = [];
      req.iam!.deniedActions = [];
      console.log(`✓ No groups found for user ${userId}`);
      return next();
    }

    // Collect all policy IDs from groups
    const allPolicyIds = userGroups.flatMap(g => g.policies || []);

    if (allPolicyIds.length === 0) {
      req.iam!.actions = [];
      req.iam!.deniedActions = [];
      console.log(`✓ No policies found for user ${userId}`);
      return next();
    }

    // Get all policies and separate Allow/Deny actions with resources
    const allPolicies = await PolicyModel.find({ _id: { $in: allPolicyIds } });
    allPolicies.forEach(policy => {
      if (policy.action && Array.isArray(policy.action)) {
        const resources: string[] = Array.isArray(policy.resource) && policy.resource.length > 0 ? policy.resource : ['*'];

        if (policy.effect.toLowerCase() === 'allow') {
          policy.action.forEach((action: string) => {
            allowedActions.add(action);
            resources.forEach(resource => allowStatements.push({ action, resource }));
          });
        } else if (policy.effect.toLowerCase() === 'deny') {
          policy.action.forEach((action: string) => {
            deniedActions.add(action);
            resources.forEach(resource => denyStatements.push({ action, resource }));
          });
        }
      }
    });

    // Remove denied actions from allowed actions (action-level convenience set)
    deniedActions.forEach(denied => allowedActions.delete(denied));

    // Attach resolved permissions to request
    req.iam!.actions = Array.from(allowedActions);
    req.iam!.deniedActions = Array.from(deniedActions);
    req.iam!.allowStatements = allowStatements;
    req.iam!.denyStatements = denyStatements;
    console.log(`✓ Resolved permissions for user ${userId}:`, req.iam!.actions);

    next();
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to resolve permissions', details: error.message });
  }
}

export function requireAction(action: string | string[], resource?: string | ((req: express.Request) => string)) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = req.iam?.userId;
    const allowStatements = req.iam?.allowStatements || [];
    const denyStatements = req.iam?.denyStatements || [];
    const roles = req.roles;

    if (!userId) {
      return res.status(401).json({ error: 'UserId not found' });
    }

    const requiredActions = Array.isArray(action) ? action : [action];
    const requestedResource = typeof resource === 'function' ? resource(req) : resource || '*';

    const hasAction = requiredActions.some(requiredAction => {
      // Explicit deny if any deny statement matches action AND resource
      const isDenied = denyStatements.some(stmt =>
        actionMatches(stmt.action, requiredAction) && resourceMatches(stmt.resource, requestedResource)
      );
      if (isDenied) {
        console.log(`✗ Action ${requiredAction} on ${requestedResource} is denied for user ${userId}`);
        return false;
      }

      // Allow if any allow statement matches action AND resource
      const isAllowed = allowStatements.some(stmt =>
        actionMatches(stmt.action, requiredAction) && resourceMatches(stmt.resource, requestedResource)
      );

      if (isAllowed) {
        console.log(`✓ Action ${requiredAction} on ${requestedResource} is allowed for user ${userId}`);
      }

      return isAllowed;
    });

    if (!hasAction) {
      return res.status(403).json({ error: `Insufficient permissions: ${requiredActions.join(', ')} on ${requestedResource} required` });
    }

    return next();
  };
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
router.use(resolvePermissions);

router.use(usersRouter);
router.use(productsRouter);
router.use(policyRouter);
router.use(groupsRouter);

export default router;
