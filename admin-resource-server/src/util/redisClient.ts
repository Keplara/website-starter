import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);

let client: ReturnType<typeof createClient> | null = null;

export function getRedisClient() {
  if (client) return client;
  client = REDIS_URL ? createClient({ url: REDIS_URL }) : createClient({ socket: { host: REDIS_HOST, port: REDIS_PORT } });
  client.on('error', (err: any) => console.error('Redis Client Error', err));
  client.connect().catch((err: any) => console.error('Redis connect error', err));
  return client;
}

export async function getAssumedRoleSession(sessionId: string): Promise<any | null> {
  const redis = getRedisClient();
  const key = `assume:session:${sessionId}`;
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
