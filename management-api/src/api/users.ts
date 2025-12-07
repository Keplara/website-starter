import express from 'express';
import { requirePermission } from './router';

const router = express.Router();
// MOVE TO RESOURCE SERVER FOR PUBLIC ACCESS.

// Get current user details including resolved actions and denied actions
router.get('/user', requirePermission("user:read"), (req, res) => {
  console.log('[RESOURCE/user] 200: Returning user details with permissions');
  return res.json({
    userId: req.iam?.userId,
    actions: req.iam?.actions || [],
    deniedActions: req.iam?.deniedActions || [],
    allowStatements: req.iam?.allowStatements || [],
    denyStatements: req.iam?.denyStatements || [],
    roles: req.roles || []
  });
});



export default router;
