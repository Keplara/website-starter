import express from 'express';
import { PolicyModel } from './models';
import type { Policy } from './interfaces';
import { requireAction } from './router';

const router = express.Router();

// Create Policy (resource: policy:*)
router.post('/policies', requireAction('policy:Create', 'policy:*'), async (req, res) => {
  try {
    const policy: Policy = req.body;
    if (!policy.name || !Array.isArray(policy.action)) {
      return res.status(400).json({ error: 'Invalid policy: name and actions are required.' });
    }

    const created = await PolicyModel.create(policy);
    return res.status(201).json({ message: 'Policy created', data: created });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create policy', details: err.message });
  }
});

// Read all Policies (resource: policy:*)
router.get('/policies', requireAction('policy:Read', 'policy:*'), async (req, res) => {
  try {
    const policies = await PolicyModel.find();
    return res.json(policies);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve policies', details: err.message });
  }
});

// Read single Policy (resource: policy:<id>)
router.get('/policies/:id', requireAction('policy:Read', req => `policy:${req.params.id}`), async (req, res) => {
  try {
    const policy = await PolicyModel.findById(req.params.id);
    if (!policy) return res.status(404).json({ error: 'Policy not found' });
    return res.json(policy);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve policy', details: err.message });
  }
});

// Update entire policy (broad) resource: policy:<id>
router.put('/policies/:id', requireAction('policy:Update', req => `policy:${req.params.id}`), async (req, res) => {
  try {
    const result = await PolicyModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!result) return res.status(404).json({ error: 'Policy not found' });
    return res.json({ message: 'Policy updated', data: result });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update policy', details: err.message });
  }
});

// Update name only (narrow) resource: policy:<id>
router.patch('/policies/:id/name', requireAction('policy:UpdateName', req => `policy:${req.params.id}`), async (req, res) => {
  try {
    const { name } = req.body;
    const result = await PolicyModel.findByIdAndUpdate(
      req.params.id,
      { $set: { name } },
      { new: true }
    );
    if (!result) return res.status(404).json({ error: 'Policy not found' });
    return res.json({ message: 'Policy name updated', data: result });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update policy', details: err.message });
  }
});


// Delete Policy (resource: policy:<id>)
router.delete('/policies/:id', requireAction('policy:Delete', req => `policy:${req.params.id}`), async (req, res) => {
  try {
    const result = await PolicyModel.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Policy not found' });
    return res.json({ message: 'Policy deleted', id: req.params.id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete policy', details: err.message });
  }
});

export default router;
