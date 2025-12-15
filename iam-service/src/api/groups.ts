import express from 'express';
import { GroupModel } from './models';
import type { Group } from './interfaces';
import { requireAction } from './router';

const router = express.Router();

// Create Group
router.post('/groups', requireAction('group:Create', 'group:*'), async (req, res) => {
  try {
    const group: Group = req.body;
    if (!group.name) {
      return res.status(400).json({ error: 'Invalid group: name is required.' });
    }

    const created = await GroupModel.create(group);
    return res.status(201).json({ message: 'Group created', data: created });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create group', details: err.message });
  }
});

// Read all Groups
router.get('/groups', requireAction('group:Read', 'group:*'), async (req, res) => {
  try {
    const groups = await GroupModel.find().populate('policies');
    return res.json(groups);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve groups', details: err.message });
  }
});

// Read single Group
router.get('/groups/:id', requireAction('group:Read', req => `group:${req.params.id}`), async (req, res) => {
  try {
    const group = await GroupModel.findById(req.params.id).populate('policies');
    if (!group) return res.status(404).json({ error: 'Group not found' });
    return res.json(group);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve group', details: err.message });
  }
});

// Update Group
router.put('/groups/:id', requireAction('group:Update', req => `group:${req.params.id}`), async (req, res) => {
  try {
    const result = await GroupModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('policies');
    if (!result) return res.status(404).json({ error: 'Group not found' });
    return res.json({ message: 'Group updated', data: result });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update group', details: err.message });
  }
});

// Delete Group
router.delete('/groups/:id', requireAction('group:Delete', req => `group:${req.params.id}`), async (req, res) => {
  try {
    const result = await GroupModel.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Group not found' });
    return res.json({ message: 'Group deleted', id: req.params.id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete group', details: err.message });
  }
});

// Add member to group
router.post('/groups/:id/members', requireAction('group:Update', req => `group:${req.params.id}`), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const group = await GroupModel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: userId } },
      { new: true }
    ).populate('policies');

    if (!group) return res.status(404).json({ error: 'Group not found' });
    return res.json({ message: 'Member added to group', data: group });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add member', details: err.message });
  }
});

// Remove member from group
router.delete('/groups/:id/members/:userId', requireAction('group:Update', req => `group:${req.params.id}`), async (req, res) => {
  try {
    const { id, userId } = req.params;

    const group = await GroupModel.findByIdAndUpdate(
      id,
      { $pull: { members: userId } },
      { new: true }
    ).populate('policies');

    if (!group) return res.status(404).json({ error: 'Group not found' });
    return res.json({ message: 'Member removed from group', data: group });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to remove member', details: err.message });
  }
});

// Add policy to group
router.post('/groups/:id/policies', requireAction('group:Update', req => `group:${req.params.id}`), async (req, res) => {
  try {
    const { policyId } = req.body;
    if (!policyId) return res.status(400).json({ error: 'policyId is required' });

    const group = await GroupModel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { policies: policyId } },
      { new: true }
    ).populate('policies');

    if (!group) return res.status(404).json({ error: 'Group not found' });
    return res.json({ message: 'Policy added to group', data: group });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add policy', details: err.message });
  }
});

// Remove policy from group
router.delete('/groups/:id/policies/:policyId', requireAction('group:Update', req => `group:${req.params.id}`), async (req, res) => {
  try {
    const { id, policyId } = req.params;

    const group = await GroupModel.findByIdAndUpdate(
      id,
      { $pull: { policies: policyId } },
      { new: true }
    ).populate('policies');

    if (!group) return res.status(404).json({ error: 'Group not found' });
    return res.json({ message: 'Policy removed from group', data: group });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to remove policy', details: err.message });
  }
});

export default router;