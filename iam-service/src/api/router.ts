import express from 'express';
import { verifyAccessToken } from '../util/tokenVerifier';
import { PolicyModel, GroupModel } from './models';
import policyRouter from './policy';
import groupsRouter from './groups';
import usersRouter from './users';
import rolesRouter from './roles';
import assumeRoleRouter from './assume-role/index';

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
console.log("loading iam-service router");

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

// assess token will contain userId to grab groups and policies tied to user
// assumed role token will contain assumedRole and will be validated and retrieve permissions via db lookup
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

    // Detect assumed-role token via "temporary" flag and assumedRole field
    const isAssumedRoleToken = typeof payload.assumedRole === 'string';

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
    req.userId = payload.userId;
    req.usernameOrEmail = payload.sub;

    // Attach assumed role token metadata for downstream checks
    (req as any).assumedRole = isAssumedRoleToken ? payload.assumedRole : undefined;
    (req as any).isAssumedRoleToken = isAssumedRoleToken;

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

  // If this is an assumed-role token, skip group/policy resolution and rely on the token’s authorities/roles
  const isAssumedRoleToken = (req as any).isAssumedRoleToken === true;
  const assumedRoleName = (req as any).assumedRole as string | undefined;

  if (isAssumedRoleToken) {
    // In assumed-role mode, actions should be derived from the role’s policies if present in token,
    // otherwise leave actions empty and let route-specific guards check the assumed role name.
    // Here, we simply avoid DB lookups to keep assumed-role tokens lightweight.
    req.iam!.actions = [];
    req.iam!.deniedActions = [];
    req.iam!.allowStatements = [];
    req.iam!.denyStatements = [];
    console.log(`✓ Assumed-role token detected for user ${userId}, role: ${assumedRoleName}. Skipping permission resolution.`);
    return next();
  }

  try {
    const allowedActions = new Set<string>();
    const deniedActions = new Set<string>();
    const allowStatements: { action: string; resource: string }[] = [];
    const denyStatements: { action: string; resource: string }[] = [];


    // Get user's groups from database
    const userGroups = await GroupModel.find({ members: userId });
    const userGroupNames = userGroups.map(g => g.name);

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
    // Only apply policies where principal matches userId or user's groups, or is empty (wildcard)
    const principalMatches = (principal: any) => {
      if (!principal || principal.length === 0) return true; // wildcard
      if (Array.isArray(principal)) {
        return principal.includes(userId) || principal.some((p: any) => userGroupNames.includes(p));
      }
      return principal === userId || userGroupNames.includes(principal);
    };
    allPolicies.forEach(policy => {
      if (!principalMatches(policy.principal)) return;
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
    const roles = Array.isArray(req.roles) ? req.roles : [];
    const userAuthorities = req.authorities || [];
    const normalizedAuthorities = userAuthorities.map((a) => a.replace('.', ':'));

    if (!userId) {
      return res.status(401).json({ error: 'UserId not found' });
    }

    // Root bypass: if the user has ROOT role or root authority, grant access
    const hasRootRole = roles.some((r) => r.toUpperCase() === 'ROOT');
    const hasRootAuthority = normalizedAuthorities.includes('root:*') || normalizedAuthorities.includes('root:all') || normalizedAuthorities.includes('iam:root');
    if (hasRootRole || hasRootAuthority) {
      console.log(`✓ Root access bypass for user ${userId}`);
      return next();
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

// Validate permission against client scopes and user authorities
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

// Mount routers
router.use(usersRouter);
router.use(rolesRouter);
router.use(policyRouter);
router.use(groupsRouter);
router.use('/assume-role', assumeRoleRouter);

// Verify action endpoint for external resource servers
router.post('/verify-action', async (req, res) => {
  const { action, resource = '*' } = req.body;
  const userId = req.iam?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'UserId not found' });
  }

  // Step 1: Query database for user's groups
  const userGroups = await GroupModel.find({ members: userId });

  // Step 2: Get all policies from those groups
  const policyIds = userGroups.flatMap(g => g.policies);
  const policies = await PolicyModel.find({ _id: { $in: policyIds } });

  // Step 3: Check deny statements first (deny wins)
  const denied = policies.some(policy =>
    policy.effect === 'Deny' &&
    policy.action.some((act: string) => actionMatches(act, action)) &&
    resourceMatches(policy.resource.join(','), resource)
  );

  if (denied) {
    return res.json({ allowed: false, reason: 'Explicit deny' });
  }

  // Step 4: Check allow statements
  const allowed = policies.some(policy =>
    policy.effect === 'Allow' &&
    policy.action.some((act: string) => actionMatches(act, action)) &&
    resourceMatches(policy.resource.join(','), resource)
  );

  return res.json({ allowed, action, resource, userId });
});

export default router;


// import express from 'express';
// import usersRouter from './users';
// import productsRouter from './products';
// import { verifyAccessToken } from '../util/tokenVerifier';
// import policyRouter from './policy';
// import { PolicyModel, GroupModel } from './models';
// import groupsRouter from './groups';

// // Extend Express Request to include IAM
// declare global {
//   namespace Express {
//     interface Request {
//       iam?: {
//         userId: string;
//         actions: string[];
//         deniedActions: string[];
//         allowStatements: { action: string; resource: string }[];
//         denyStatements: { action: string; resource: string }[];
//       };
//       roles?: string[];
//       scopes?: string[];
//       authorities?: string[];
//     }
//   }
// }

// const router = express.Router();
// console.log("loading api router");

// // Helper to check if an action matches a pattern (case-sensitive, supports *)
// function actionMatches(userAction: string, requiredAction: string): boolean {
//   // Exact match
//   if (userAction === requiredAction) return true;

//   // Wildcard match: "policy:Update*" matches "policy:Update" and "policy:UpdateName"
//   // if (userAction.includes('*')) {
//     // const pattern = userAction.replace(/\*/g, //'.*');
//     const regex = new RegExp(`^${pattern}$`);
// return regex.test(requiredAction);
//   }

// return false;
// }

// // Helper to check if a resource matches a pattern (case-sensitive, supports *)
// function resourceMatches(policyResource: string, requestedResource: string): boolean {
//   if (policyResource === requestedResource) return true;
//   if (policyResource.includes('*')) {
//     const pattern = policyResource.replace(/\*/g, '.*');
//     const regex = new RegExp(`^${pattern}$`);
//     return regex.test(requestedResource);
//   }
//   return false;
// }

// async function validateAccessToken(req: express.Request, res: express.Response, next: express.NextFunction) {
//   const token = req.headers.authorization?.replace('Bearer ', '');

//   if (!token) {
//     return res.status(401).json({ error: 'No access token provided' });
//   }

//   try {
//     // Verify token signature and decode payload
//     const payload: any = await verifyAccessToken(token);
//     console.log('✓ Access token verified:', payload);
//     if (!payload) {
//       return res.status(403).json({ error: 'Invalid access token' });
//     }

//     // Attach user info to request
//     req.iam = {
//       userId: payload.userId,
//       actions: [],
//       deniedActions: [],
//       allowStatements: [],
//       denyStatements: []
//     };
//     req.roles = payload.roles;
//     req.scopes = payload.scope;
//     req.authorities = payload.authorities;

//     // Token is valid, continue
//     next();
//   } catch (error: any) {
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ error: 'Access token has expired' });
//     } else if (error.name === 'JsonWebTokenError') {
//       return res.status(403).json({ error: 'Invalid access token' });
//     }
//     return res.status(403).json({ error: 'Token verification failed' });
//   }
// }

// // Resolve permissions from groups by database lookup
// async function resolvePermissions(req: express.Request, res: express.Response, next: express.NextFunction) {
//   const userId = req.iam?.userId;
//   if (!userId) {
//     return res.status(401).json({ error: 'userId not found' });
//   }

//   try {
//     const allowedActions = new Set<string>();
//     const deniedActions = new Set<string>();
//     const allowStatements: { action: string; resource: string }[] = [];
//     const denyStatements: { action: string; resource: string }[] = [];

//     // Get user's groups from database
//     const userGroups = await GroupModel.find({ members: userId });

//     // Guard: if user has no groups, no permissions
//     if (userGroups.length === 0) {
//       req.iam!.actions = [];
//       req.iam!.deniedActions = [];
//       console.log(`✓ No groups found for user ${userId}`);
//       return next();
//     }

//     // Collect all policy IDs from groups
//     const allPolicyIds = userGroups.flatMap(g => g.policies || []);

//     if (allPolicyIds.length === 0) {
//       req.iam!.actions = [];
//       req.iam!.deniedActions = [];
//       console.log(`✓ No policies found for user ${userId}`);
//       return next();
//     }

//     // Get all policies and separate Allow/Deny actions with resources
//     const allPolicies = await PolicyModel.find({ _id: { $in: allPolicyIds } });
//     allPolicies.forEach(policy => {
//       if (policy.action && Array.isArray(policy.action)) {
//         const resources: string[] = Array.isArray(policy.resource) && policy.resource.length > 0 ? policy.resource : ['*'];

//         if (policy.effect.toLowerCase() === 'allow') {
//           policy.action.forEach((action: string) => {
//             allowedActions.add(action);
//             resources.forEach(resource => allowStatements.push({ action, resource }));
//           });
//         } else if (policy.effect.toLowerCase() === 'deny') {
//           policy.action.forEach((action: string) => {
//             deniedActions.add(action);
//             resources.forEach(resource => denyStatements.push({ action, resource }));
//           });
//         }
//       }
//     });

//     // Remove denied actions from allowed actions (action-level convenience set)
//     deniedActions.forEach(denied => allowedActions.delete(denied));

//     // Attach resolved permissions to request
//     req.iam!.actions = Array.from(allowedActions);
//     req.iam!.deniedActions = Array.from(deniedActions);
//     req.iam!.allowStatements = allowStatements;
//     req.iam!.denyStatements = denyStatements;
//     console.log(`✓ Resolved permissions for user ${userId}:`, req.iam!.actions);

//     next();
//   } catch (error: any) {
//     return res.status(500).json({ error: 'Failed to resolve permissions', details: error.message });
//   }
// }

// export function requireAction(action: string | string[], resource?: string | ((req: express.Request) => string)) {
//   return (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     const userId = req.iam?.userId;
//     const allowStatements = req.iam?.allowStatements || [];
//     const denyStatements = req.iam?.denyStatements || [];
//     const roles = req.roles;

//     if (!userId) {
//       return res.status(401).json({ error: 'UserId not found' });
//     }

//     const requiredActions = Array.isArray(action) ? action : [action];
//     // const requestedResource = typeof resource === 'function' ? resource(req) : resource || '*';

//     const hasAction = requiredActions.some(requiredAction => {
//       // Explicit deny if any deny statement matches action AND resource
//       const isDenied = denyStatements.some(stmt =>
//         actionMatches(stmt.action, requiredAction) && resourceMatches(stmt.resource, requestedResource)
//       );
//       if (isDenied) {
//         console.log(`✗ Action ${requiredAction} on ${requestedResource} is denied for user ${userId}`);
//         return false;
//       }

//       // Allow if any allow statement matches action AND resource
//       const isAllowed = allowStatements.some(stmt =>
//         actionMatches(stmt.action, requiredAction) && resourceMatches(stmt.resource, requestedResource)
//       );

//       if (isAllowed) {
//         console.log(`✓ Action ${requiredAction} on ${requestedResource} is allowed for user ${userId}`);
//       }

//       return isAllowed;
//     });

//     if (!hasAction) {
//       return res.status(403).json({ error: `Insufficient permissions: ${requiredActions.join(', ')} on ${requestedResource} required` });
//     }

//     return next();
//   };
// }

// export function requirePermission(permission: string) {
//   return (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     const clientScopes = req.scopes || [];
//     const userAuthorities = req.authorities || [];

//     // Normalize naming differences (":" vs ".")
//     // const normalizedAuthorities = userAuthorities.map(authority => authority.replace(".", ":"));

//     // Check if both client scope and user authority allow this permission
//     const clientHas = clientScopes.includes(permission);
//     const userHas = normalizedAuthorities.includes(permission);
//     if (clientHas && userHas) {
//       return next();
//     }

//     return res.status(403).json({
//       error: "Forbidden",
//       missing: {
//         clientScope: !clientHas,
//         userAuthority: !userHas,
//       },
//     });
//   };
// }

// router.use(validateAccessToken);
// router.use(resolvePermissions);

// router.use(productsRouter);
// router.use(policyRouter);
// router.use(groupsRouter);

// // is used by admin resource server to verify actions for users
// router.post('/verify-action', validateAccessToken, async (req, res) => {
//   const { action, resource = '*' } = req.body;
//   const userId = req.iam?.userId;

//   if (!userId) {
//     return res.status(401).json({ error: 'UserId not found' });
//   }

//   // Step 1: Query database for user's groups
//   const userGroups = await GroupModel.find({ members: userId });

//   // Step 2: Get all policies from those groups
//   const policyIds = userGroups.flatMap(g => g.policies);
//   const policies = await PolicyModel.find({ _id: { $in: policyIds } });

//   // Step 3: Check deny statements first (deny wins)
//   const denied = policies.some(policy =>
//     policy.effect === 'Deny' &&
//     actionMatches(policy.action, action) &&
//     resourceMatches(policy.resource, resource)
//   );

//   if (denied) {
//     return res.json({ allowed: false, reason: 'Explicit deny' });
//   }

//   // Step 4: Check allow statements
//   const allowed = policies.some(policy =>
//     policy.effect === 'Allow' &&
//     actionMatches(policy.action, action) &&
//     resourceMatches(policy.resource, resource)
//   );

//   return res.json({ allowed, action, resource, userId });
// });
// export default router;
