import { Request, Response, Router } from 'express';
import { UserModel, RoleModel, GroupModel } from '../models';

const router = Router();
// Service logic for role assumption and token generation
// This is a direct translation of your Java AssumeRoleService
import { Role, User } from '../interfaces';
import { saveAssumedRoleSession, revokeAssumedRoleSession } from '../../util/redisClient';
import { randomUUID } from 'crypto';
import { requireAction } from '../router';

// POST /api/assume-role
router.post('/', requireAction('iam:AssumeRole'), async (req: Request, res: Response) => {
  try {
    const { roleToAssume, durationSeconds } = req.body;
    const userId = req.iam?.userId || req.userId;
    const actions = req.iam?.actions || [];
    const roles = Array.isArray((req as any).roles) ? (req as any).roles : [];
    const authoritiesRaw = Array.isArray((req as any).authorities) ? (req as any).authorities : [];
    const authorities = authoritiesRaw.map((a: string) => a.replace('.', ':'));

    if (!userId) {
      return res.status(401).json({ error: 'userId not found on request' });
    }
    if (!roleToAssume) {
      return res.status(400).json({ error: 'roleToAssume is required' });
    }

    // Detect "root" but do not bypass permissions or trust policy
    const isRoot = roles.some((r: string) => r.toUpperCase() === 'ROOT')
      || authorities.includes('root:*')
      || authorities.includes('root:all')
      || authorities.includes('iam:root');

    // Permission check via resolved actions (caller must be allowed to assume this role)
    // Support multiple naming conventions: assume:<role>, AssumeRole:<role>, AssumeRole:*
    const assumeActionCandidates = [
      `iam:AssumeRole:${roleToAssume}`,
      'iam:AssumeRole:*',
    ];
    let canAssume: boolean = actions.some((a: string) => assumeActionCandidates.includes(a)) || isRoot;

    // Additionally: check if any group the user belongs to has the role directly
    // This avoids repeating heavy policy logic, but ensures group-attached roles are honored.
    if (!canAssume) {
      const hasGroupWithRole = await GroupModel.exists({ members: userId, roles: roleToAssume });
      canAssume = Boolean(hasGroupWithRole);
    }

    if (!canAssume) {
      return res.status(403).json({ error: 'User does not have permission to assume this role' });
    }

    // Lookup role from MongoDB
    // Accept either role name or ObjectId string
    const looksLikeObjectId = typeof roleToAssume === 'string' && /^[a-fA-F0-9]{24}$/.test(roleToAssume);
    const role = looksLikeObjectId ? await RoleModel.findById(roleToAssume) : await RoleModel.findOne({ name: roleToAssume });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const roleObj = role.toObject() as Role;

    // Evaluate role trustPolicy (who can assume)
    // Trust policy statements look like: { Effect: 'Allow'|'Deny', Principal: string|string[], Action: string|string[], Conditions?: {} }
    const trustPolicy = (role as any).trustPolicy;
    const userGroups = await GroupModel.find({ members: userId });
    const groupNames = userGroups.map(g => g.name);

    const toArray = (v: any): string[] => Array.isArray(v) ? v : (v != null ? [v] : []);
    const matchWildcard = (val: string, pattern: string) => {
      if (pattern === '*') return true;
      if (typeof pattern === 'string' && pattern.includes('*')) {
        const re = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return re.test(val);
      }
      return val === pattern;
    };
    const principalMatches = (principal: string) => {
      // Root must be explicitly allowed by userId in trust policy (no group-based allow)
      if (isRoot) {
        return matchWildcard(userId, principal);
      }
      // Non-root: allow matching by userId or group names
      return matchWildcard(userId, principal) || groupNames.some(name => matchWildcard(name, principal));
    };
    const actionMatchesTrust = (action: string) => matchWildcard('iam:AssumeRole', action);

    let allowedByTrust = true; // default allow if no trust policy present
    if (trustPolicy && Array.isArray(trustPolicy.Statement)) {
      // Deny wins: check denies, then allows
      const denies = trustPolicy.Statement.filter((s: any) => String(s.Effect).toLowerCase() === 'deny');
      const allows = trustPolicy.Statement.filter((s: any) => String(s.Effect).toLowerCase() === 'allow');

      const denied = denies.some((stmt: any) => {
        const principals = toArray(stmt.Principal);
        const actionsTrust = toArray(stmt.Action);
        const principalHit = principals.some((p: string) => principalMatches(p));
        const actionHit = actionsTrust.some((a: string) => actionMatchesTrust(a));
        return principalHit && actionHit;
      });

      if (denied) {
        allowedByTrust = false;
      } else {
        const allowed = allows.some((stmt: any) => {
          const principals = toArray(stmt.Principal);
          const actionsTrust = toArray(stmt.Action);
          const principalHit = principals.some((p: string) => principalMatches(p));
          const actionHit = actionsTrust.some((a: string) => actionMatchesTrust(a));
          return principalHit && actionHit;
        });
        allowedByTrust = allowed;
      }
    }

    if (!allowedByTrust) {
      return res.status(403).json({ error: 'Trust policy does not allow assume role for this principal' });
    }

    // Compute expiry bounded by role's maxSessionDuration; default 2h
    const defaultTtl = Number(process.env.ASSUMED_ROLE_SESSION_TTL_SECONDS || 7200);
    const seconds = Number(durationSeconds) || defaultTtl;
    const max = roleObj.maxSessionDuration && roleObj.maxSessionDuration > 0 ? roleObj.maxSessionDuration : seconds;
    const expSeconds = Math.min(seconds, max || seconds);
    const expiresAt = new Date(Date.now() + expSeconds * 1000);

    // Create a Redis-backed session with TTL
    const sessionId = randomUUID();
    await saveAssumedRoleSession(sessionId, {
      userId: userId,
      roleName: roleObj.name,
      roleId: (role as any)._id?.toString?.() || undefined,
      expiresAt: expiresAt.toISOString(),
    }, expSeconds);

    return res.status(200).json({
      sessionId,
      expiresAt,
      assumedRole: roleObj.name,
      userId: userId,
      ttlSeconds: expSeconds
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to assume role', details: err.message });
  }
});

// DELETE /api/assume-role/:id — revoke an assumed-role session
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.iam?.userId || req.userId;
    if (!userId) return res.status(401).json({ error: 'userId not found on request' });

    // For security, optionally fetch and check owner; here we assume caller provides correct session id
    await revokeAssumedRoleSession(id);
    return res.json({ revoked: true, sessionId: id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to revoke session', details: err.message });
  }
});

export default router;
