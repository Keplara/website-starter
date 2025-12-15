import express from 'express';
import mongoose from 'mongoose';
import { requireAction } from './router';
import bcrypt from 'bcrypt';
import { IAMUserModel } from './models';
// move user creation from authorization service to public-resource-server
// move iam user creation to iam-service

const router = express.Router();

// Create User (admin action)
router.post('/users', requireAction('user:Create', 'user:*'), async (req, res) => {
  try {
    const { userId, username, email, password, roles, groups } = req.body;

    if (!userId || !username || !email || !password) {
      return res.status(400).json({ error: 'userId, username, email, and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await IAMUserModel.create({
      userId,
      username,
      email,
      password: hashedPassword,
      roles: roles || [],
      groups: groups || [],
    });

    return res.status(201).json({ message: 'User created', data: user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
});

// Read all Users
router.get('/users', requireAction('user:Read', 'user:*'), async (req, res) => {
  try {
    const users = await IAMUserModel.find().populate('groups');
    // Exclude password from all users
    const usersNoPassword = users.map(u => {
      const obj = u.toObject() as { [key: string]: any };
      delete obj.password;
      return obj;
    });
    return res.json(usersNoPassword);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve users', details: err.message });
  }
});

// Read single User by ID
router.get('/users/:userId', requireAction('user:Read', req => `user:${req.params.userId}`), async (req, res) => {
  try {
    const user = await IAMUserModel.findOne({ userId: req.params.userId }).populate('groups');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userObj = user.toObject() as { [key: string]: any };
    delete userObj.password;
    return res.json(userObj);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve user', details: err.message });
  }
});

// Update User
router.put('/users/:userId', requireAction('user:Update', req => `user:${req.params.userId}`), async (req, res) => {
  try {
    const { username, email, roles, groups, isActive, metadata } = req.body;
    const updateData: any = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (roles) updateData.roles = roles;
    if (groups) updateData.groups = groups;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (metadata) updateData.metadata = metadata;

    const user = await IAMUserModel.findOneAndUpdate(
      { userId: req.params.userId },
      updateData,
      { new: true }
    ).populate('groups');

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User updated', data: user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
});

// Delete User
router.delete('/users/:userId', requireAction('user:Delete', req => `user:${req.params.userId}`), async (req, res) => {
  try {
    const user = await IAMUserModel.findOneAndDelete({ userId: req.params.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted', data: user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
});

// Add user to group
router.post('/users/:userId/groups/:groupId', requireAction('user:Update', req => `user:${req.params.userId}`), async (req, res) => {
  try {
    const user = await IAMUserModel.findOneAndUpdate(
      { userId: req.params.userId },
      { $addToSet: { groups: req.params.groupId } },
      { new: true }
    ).populate('groups');

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User added to group', data: user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add user to group', details: err.message });
  }
});

// Remove user from group
router.delete('/users/:userId/groups/:groupId', requireAction('user:Update', req => `user:${req.params.userId}`), async (req, res) => {
  try {
    const user = await IAMUserModel.findOneAndUpdate(
      { userId: req.params.userId },
      { $pull: { groups: req.params.groupId } },
      { new: true }
    ).populate('groups');

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User removed from group', data: user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to remove user from group', details: err.message });
  }
});

// Assign role to user
router.post('/users/:userId/roles/:role', requireAction('user:Update', req => `user:${req.params.userId}`), async (req, res) => {
  try {
    const user = await IAMUserModel.findOneAndUpdate(
      { userId: req.params.userId },
      { $addToSet: { roles: req.params.role } },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'Role assigned to user', data: user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to assign role', details: err.message });
  }
});

// Remove role from user
router.delete('/users/:userId/roles/:role', requireAction('user:Update', req => `user:${req.params.userId}`), async (req, res) => {
  try {
    const user = await IAMUserModel.findOneAndUpdate(
      { userId: req.params.userId },
      { $pull: { roles: req.params.role } },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'Role removed from user', data: user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to remove role', details: err.message });
  }
});

export default router;
