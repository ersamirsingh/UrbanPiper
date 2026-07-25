import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let redisReady = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export function isRedisReady(): boolean {
  return redisReady && redisClient !== null && (redisClient as RedisClientType).isOpen;
}

export function getRedisClient(): RedisClientType | null {
  if (!isRedisReady()) return null;
  return redisClient as RedisClientType;
}

const connectRedis = async (): Promise<RedisClientType | null> => {
  if (redisClient && (redisClient as RedisClientType).isOpen) {
    return redisClient as RedisClientType;
  }
  const rawUrl = process.env.REDIS_URL ? process.env.REDIS_URL.trim() : '';
  const validRedisUrl = rawUrl.startsWith('redis://') || rawUrl.startsWith('rediss://') ? rawUrl : undefined;

  const host = process.env.REDIS_HOST && process.env.REDIS_HOST.trim() !== '' ? process.env.REDIS_HOST.trim() : (validRedisUrl ? undefined : 'localhost');
  const port = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;

  if (!validRedisUrl && !process.env.REDIS_HOST) {
    console.warn('[Redis] Neither REDIS_URL nor REDIS_HOST provided. Running without cache.');
    return null;
  }

  try {
    if (!redisClient) {
      const clientConfig: any = validRedisUrl
        ? { url: validRedisUrl }
        : {
            username: process.env.REDIS_USERNAME || undefined,
            password: process.env.REDIS_PASSWORD || undefined,
            socket: {
              host,
              port,
            },
          };

      clientConfig.socket = {
        ...(clientConfig.socket || {}),
        reconnectStrategy: (retries: number) => {
          reconnectAttempts = retries;
          if (retries >= MAX_RECONNECT_ATTEMPTS) {
            console.error(`[Redis] Giving up after ${MAX_RECONNECT_ATTEMPTS} reconnect attempts. Cache disabled.`);
            redisReady = false;
            return false;
          }
          const delay = Math.min(retries * 200, 5000);
          console.warn(`[Redis] Reconnecting in ${delay}ms (attempt ${retries + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
          return delay;
        },
      };

      redisClient = createClient(clientConfig);

      redisClient.on('error', (err: Error) => {
        console.error('[Redis] Client error:', err.message);
        redisReady = false;
      });

      redisClient.on('connect', () => {
        console.log('[Redis] TCP connection established.');
      });

      redisClient.on('ready', () => {
        reconnectAttempts = 0;
        redisReady = true;
        console.log('[Redis] Client ready — cache is active.');
      });

      redisClient.on('reconnecting', () => {
        redisReady = false;
        console.warn('[Redis] Attempting to reconnect...');
      });

      redisClient.on('end', () => {
        redisReady = false;
        console.warn('[Redis] Connection ended.');
      });
    }

    if (!(redisClient as RedisClientType).isOpen) {
      await (redisClient as RedisClientType).connect();
    }

    return redisClient as RedisClientType;
  } catch (err: any) {
    redisReady = false;
    console.error('[Redis] Initial connection failed:', err.message);
    console.warn('[Redis] Server will continue without cache (degraded mode).');
    return null;
  }
};

export default connectRedis;
