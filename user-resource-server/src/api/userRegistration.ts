
import express from 'express';
import bcrypt from 'bcrypt';
import { UserModel } from './models';
import { sendUserVerificationEmail } from './emailService';
import { PendingUser } from './interfaces';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { createClient, RedisClientOptions } from 'redis';

// Setup Redis client with RedisClientOptions
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6380', 10);
const redisUsername = process.env.REDIS_USERNAME || undefined;
const redisPassword = process.env.REDIS_PASSWORD || undefined;

const redisOptions: RedisClientOptions = {
  username: redisUsername,
  password: redisPassword,
  socket: {
    host: redisHost,
    port: redisPort,
  },
};

const redisClient = createClient(redisOptions);
redisClient.connect()
  .then(() => {
    console.log('✅ Redis client connected!');
  })
  .catch((err) => {
    console.error('❌ Redis client connection error:', err);
    process.exit(1);
  });

const router = express.Router();

// 1. Initiate user creation (send verification email)
router.post('/create-user/request', async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    // Check if user already exists
    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    // Generate a token
    const token = crypto.randomBytes(32).toString('hex');
    // Prepare PendingUser object
    const pendingUser: PendingUser = {
      emailAddress: email.toLowerCase(),
      username: (name || email).toLowerCase(),
      password,
      createdOn: new Date().toISOString(),
      authorities: [] // Add authorities if needed
    };
    // Store PendingUser in Redis
    const redisKey = `pending_user:${token}`;
    await redisClient.setEx(
      redisKey,
      60 * 10, // 10 min expiration
      JSON.stringify(pendingUser)
    );
    // Send verification email
    const verifyUrl = `${process.env.CLIENT_BASE_URL || 'http://localhost:3008'}/verify?token=${token}`;
    await sendUserVerificationEmail(email, verifyUrl, name);
    return res.status(200).json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to initiate user creation', details: err.message });
  }
});

// 2. Verify user creation token (check if valid)
router.get('/create-user/verify', async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token is required' });
  }
  const data = await redisClient.get(`pending_user:${token}`);
  const valid = !!data;
  return res.status(200).json({ timestamp: new Date(), valid });
});

// 3. Confirm user creation (finalize registration)
router.post('/create-user/confirm', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token is required' });
  }
  const redisKey = `pending_user:${token}`;
  const dataStr = await redisClient.get(redisKey);
  if (!dataStr) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }
  const pendingUser: PendingUser = JSON.parse(dataStr);
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(pendingUser.password, 10);
    // Create user
    const user = await UserModel.create({
      email: pendingUser.emailAddress,
      name: pendingUser.username,
      password: hashedPassword,
      // Add Stripe or other fields as needed
    });
    await redisClient.del(redisKey);
    return res.status(201).json({
      timestamp: new Date(),
      message: `User has been created for ${user.email}`
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
});

export default router;
