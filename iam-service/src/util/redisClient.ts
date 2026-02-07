import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();
// on the client admin side you need to create assume role with account profile page and dropdown where logout it.

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const REDIS_USER = process.env.REDIS_USER || 'Supervisor';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || 'Supervisor';
let client: ReturnType<typeof createClient> | null = null;

export function getRedisClient() {
  if (client) return client;
  client = REDIS_URL
    ? createClient({ url: REDIS_URL, username: REDIS_USER, password: REDIS_PASSWORD })
    : createClient({ socket: { host: REDIS_HOST, port: REDIS_PORT }, username: REDIS_USER, password: REDIS_PASSWORD });
  client.on('error', (err) => console.error('[IAM] Redis Client Error', err));
  client.connect().catch(err => console.error('[IAM] Redis connect error', err));
  return client;
}

export async function saveAssumedRoleSession(sessionId: string, payload: any, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();
  const key = `assume:session:${sessionId}`;
  await redis.set(key, JSON.stringify(payload), { EX: ttlSeconds });
}

export async function revokeAssumedRoleSession(sessionId: string): Promise<void> {
  const redis = getRedisClient();
  const key = `assume:session:${sessionId}`;
  await redis.del(key);
}
