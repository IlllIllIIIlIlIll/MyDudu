import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
    constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) { }

    async get(key: string): Promise<string | null> {
        return this.redis.get(key);
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
        if (ttlSeconds) {
            return this.redis.set(key, value, 'EX', ttlSeconds);
        }
        return this.redis.set(key, value);
    }

    async del(key: string): Promise<number> {
        return this.redis.del(key);
    }

    async publish(channel: string, message: string): Promise<number> {
        return this.redis.publish(channel, message);
    }

    async hset(key: string, field: string | Record<string, any>, value?: any): Promise<number> {
        if (typeof field === 'object') {
            return this.redis.hset(key, field);
        }
        return this.redis.hset(key, field, value);
    }

    async hget(key: string, field: string): Promise<string | null> {
        return this.redis.hget(key, field);
    }

    async hgetall(key: string): Promise<Record<string, string>> {
        return this.redis.hgetall(key);
    }

    getClient(): Redis {
        return this.redis;
    }
}
