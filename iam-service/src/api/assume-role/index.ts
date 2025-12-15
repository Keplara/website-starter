import { Request, Response, Router } from 'express';
import { UserModel, RoleModel, GroupModel } from '../models';

const router = Router();
// Service logic for role assumption and token generation
// This is a direct translation of your Java AssumeRoleService
import jwt from 'jsonwebtoken';
import { Role, User } from '../interfaces';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export function generateAssumedRoleToken(user: User, assumedRole: Role, durationSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);

  // Cap duration by role.maxSessionDuration if provided
  const max = assumedRole.maxSessionDuration && assumedRole.maxSessionDuration > 0
    ? assumedRole.maxSessionDuration
    : durationSeconds;
  const exp = now + Math.min(durationSeconds, max || durationSeconds);

  const payload = {
    iss: 'self',
    iat: now,
    exp,
    sub: user.userId,
    userId: user.userId,
    roleId: assumedRole.roleId,
    assumedRole: assumedRole.name
    };

  return jwt.sign(payload, JWT_SECRET);
}

// POST /api/assume-role
router.post('/', async (req: Request, res: Response) => {
  try {
    const { roleToAssume, durationSeconds } = req.body;
    const userId = req.iam?.userId || req.userId;
    const actions = req.iam?.actions || [];

    if (!userId) {
      return res.status(401).json({ error: 'userId not found on request' });
    }
    if (!roleToAssume) {
      return res.status(400).json({ error: 'roleToAssume is required' });
    }

    // Permission check via resolved actions
    const assumeAction = `assume:${roleToAssume}`;
    let canAssume = actions.includes(assumeAction) || actions.includes('assume:*');

    // Additionally: check if any group the user belongs to has the role directly
    // This avoids repeating heavy policy logic, but ensures group-attached roles are honored.
    if (!canAssume) {
      const hasGroupWithRole = await GroupModel.exists({ members: userId, roles: roleToAssume });
      canAssume = Boolean(hasGroupWithRole);
    }

    if (!canAssume) {
      return res.status(403).json({ error: 'User does not have permission to assume this role' });
    }

    // Lookup user and role from MongoDB
    const user = await UserModel.findOne({ userId });
    const role = await RoleModel.findOne({ name: roleToAssume });
    if (!user || !role) {
      return res.status(404).json({ error: 'User or role not found' });
    }

    const userObj = user.toObject() as User;
    const roleObj = role.toObject() as Role;

    const token = generateAssumedRoleToken(userObj, roleObj, durationSeconds || 3600);
    return res.status(200).json({
      token,
      expiresIn: durationSeconds || 3600,
      assumedRole: roleObj.name,
      userId: userObj.userId,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to assume role', details: err.message });
  }
});

export default router;
