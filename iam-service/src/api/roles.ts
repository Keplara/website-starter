import express from 'express';
import mongoose from 'mongoose';
import { requireAction } from './router';
import { RoleModel } from './models';

const router = express.Router();

// Create Role (admin action)
router.post('/roles', requireAction('role:Create', 'role:*'), async (req, res) => {
  try {
    const { name, description, permissions, policies } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const role = await RoleModel.create({
      name,
      description: description || '',
      permissions: permissions || [],
      policies: policies || [],
    });

    return res.status(201).json({ message: 'Role created', data: role });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create role', details: err.message });
  }
});

// Read all Roles
router.get('/roles', requireAction('role:Read', 'role:*'), async (req, res) => {
  try {
    const roles = await RoleModel.find().populate('policies');
    return res.json(roles);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve roles', details: err.message });
  }
});

// Read single Role by ID
router.get('/roles/:id', requireAction('role:Read', req => `role:${req.params.id}`), async (req, res) => {
  try {
    const role = await RoleModel.findById(req.params.id).populate('policies');
    if (!role) return res.status(404).json({ error: 'Role not found' });
    return res.json(role);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve role', details: err.message });
  }
});

// Update Role
router.put('/roles/:id', requireAction('role:Update', req => `role:${req.params.id}`), async (req, res) => {
  try {
    const { name, description, permissions, policies, isActive } = req.body;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions) updateData.permissions = permissions;
    if (policies) updateData.policies = policies;
    if (isActive !== undefined) updateData.isActive = isActive;

    const role = await RoleModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('policies');

    if (!role) return res.status(404).json({ error: 'Role not found' });
    return res.json({ message: 'Role updated', data: role });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update role', details: err.message });
  }
});

// Delete Role
router.delete('/roles/:id', requireAction('role:Delete', req => `role:${req.params.id}`), async (req, res) => {
  try {
    const role = await RoleModel.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    return res.json({ message: 'Role deleted', data: role });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete role', details: err.message });
  }
});

// Add permission to role
router.post('/roles/:id/permissions/:permission', requireAction('role:Update', req => `role:${req.params.id}`), async (req, res) => {
  try {
    const role = await RoleModel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { permissions: req.params.permission } },
      { new: true }
    ).populate('policies');

    if (!role) return res.status(404).json({ error: 'Role not found' });
    return res.json({ message: 'Permission added to role', data: role });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add permission', details: err.message });
  }
});

// Remove permission from role
router.delete('/roles/:id/permissions/:permission', requireAction('role:Update', req => `role:${req.params.id}`), async (req, res) => {
  try {
    const role = await RoleModel.findByIdAndUpdate(
      req.params.id,
      { $pull: { permissions: req.params.permission } },
      { new: true }
    ).populate('policies');

    if (!role) return res.status(404).json({ error: 'Role not found' });
    return res.json({ message: 'Permission removed from role', data: role });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to remove permission', details: err.message });
  }
});

// Add policy to role
router.post('/roles/:id/policies/:policyId', requireAction('role:Update', req => `role:${req.params.id}`), async (req, res) => {
  try {
    const role = await RoleModel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { policies: req.params.policyId } },
      { new: true }
    ).populate('policies');

    if (!role) return res.status(404).json({ error: 'Role not found' });
    return res.json({ message: 'Policy added to role', data: role });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add policy', details: err.message });
  }
});

// Remove policy from role
router.delete('/roles/:id/policies/:policyId', requireAction('role:Update', req => `role:${req.params.id}`), async (req, res) => {
  try {
    const role = await RoleModel.findByIdAndUpdate(
      req.params.id,
      { $pull: { policies: req.params.policyId } },
      { new: true }
    ).populate('policies');

    if (!role) return res.status(404).json({ error: 'Role not found' });
    return res.json({ message: 'Policy removed from role', data: role });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to remove policy', details: err.message });
  }
});

export default router;
