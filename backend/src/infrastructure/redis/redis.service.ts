import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD', undefined),
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });

    this.client.on('connect', () => console.log('🔴 Redis connected'));
    this.client.on('error', (err) => console.warn('Redis error:', err.message));
  }

  getClient(): Redis {
    return this.client;
  }

  // Key-Value operations
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // JSON helpers
  async getJSON<T>(key: string): Promise<T | null> {
    const val = await this.get(key);
    return val ? JSON.parse(val) : null;
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // Set operations (for online users, typing users, etc.)
  async sadd(key: string, ...members: string[]): Promise<void> {
    await this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<void> {
    await this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  // Pub/Sub for horizontal scaling
  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }

  createSubscriber(): Redis {
    return this.client.duplicate();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
