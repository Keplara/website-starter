import express from 'express';
import { requirePermission } from './router';
import { GroupModel, PolicyModel } from './models';

const router = express.Router();
// MOVE TO RESOURCE SERVER FOR PUBLIC ACCESS.

// Get current user details including resolved actions and denied actions
router.get('/user-details', requirePermission("user:read"), async (req, res) => {
  console.log('[RESOURCE/user] 200: Returning user details with permissions');

  try {
    const userId = (req as any).userId;
    const allowStatements: any[] = [];
    const denyStatements: any[] = [];
    const actions = new Set<string>();
    const deniedActions = new Set<string>();

    // Fetch groups that contain this user
    const groups = await GroupModel.find({
      members: userId
    }).populate('policies');

    // Aggregate policies from all groups
    groups.forEach((group: any) => {
      if (group.policies && Array.isArray(group.policies)) {
        group.policies.forEach((policy: any) => {
          const stmt = {
            effect: policy.effect.toLowerCase(),
            action: policy.action || [],
            resource: policy.resource || [],
            conditions: policy.conditions || {}
          };

          if (policy.effect.toLowerCase() === 'allow') {
            allowStatements.push(stmt);
            policy.action?.forEach((a: string) => actions.add(a));
          } else if (policy.effect.toLowerCase() === 'deny') {
            denyStatements.push(stmt);
            policy.action?.forEach((a: string) => deniedActions.add(a));
          }
        });
      }
    });

    return res.json({
      userId,
      actions: Array.from(actions),
      deniedActions: Array.from(deniedActions),
      allowStatements,
      denyStatements,
      roles: req.roles || []
    });
  } catch (error) {
    console.error('[RESOURCE/user] Error fetching user info:', error);
    return res.status(500).json({ error: 'Failed to fetch user information' });
  }
});



export default router;
