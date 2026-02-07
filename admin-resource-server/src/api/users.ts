import express from 'express';
import { requirePermission } from './router';

const router = express.Router();
// MOVE TO RESOURCE SERVER FOR PUBLIC ACCESS.

// Get current user details including resolved actions and denied actions
router.get('/user-details', requirePermission("user:read"), async (req, res) => {
  console.log('[RESOURCE/user] 200: Returning user details with permissions');

  try {
    const userId = (req as any).userId;
    const roles = req.roles || [];
    const scopesRaw = (req as any).scopes;
    const authoritiesRaw = (req as any).authorities || [];
    const scopes: string[] = Array.isArray(scopesRaw)
      ? scopesRaw
      : typeof scopesRaw === 'string'
        ? scopesRaw.split(/\s+/).filter(Boolean)
        : [];
    const authorities: string[] = (authoritiesRaw as string[]).map(a => a.replace('.', ':'));
    const effectivePermissions = authorities.filter(a => scopes.includes(a));

    return res.json({
      userId,
      roles,  
      scopes,
      authorities,
      permissions: effectivePermissions,
      assumedRole: (req as any).assumedRole || null,
      isAssumedRoleToken: (req as any).isAssumedRoleToken === true
    });
  } catch (error) {
    console.error('[RESOURCE/user] Error fetching user info:', error);
    return res.status(500).json({ error: 'Failed to fetch user information' });
  }
});

// Lightweight endpoint focused on permissions for UI gating
router.get('/permissions', async (req, res) => {
  try {
    const scopesRaw = (req as any).scopes;
    const authoritiesRaw = (req as any).authorities || [];
    const scopes: string[] = Array.isArray(scopesRaw)
      ? scopesRaw
      : typeof scopesRaw === 'string'
        ? scopesRaw.split(/\s+/).filter(Boolean)
        : [];
    const authorities: string[] = (authoritiesRaw as string[]).map(a => a.replace('.', ':'));
    const permissions = authorities.filter(a => scopes.includes(a));

    return res.json({
      permissions,
      roles: (req as any).roles || [],
      assumedRole: (req as any).assumedRole || null
    });
  } catch (error) {
    console.error('[RESOURCE/user] Error generating permissions:', error);
    return res.status(500).json({ error: 'Failed to compute permissions' });
  }
});



export default router;
