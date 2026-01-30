import { Global, Module } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: () => {
                const url = process.env.REDIS_URL;

                const client = url
                    ? new Redis(url, {
                        tls: {}, // WAJIB untuk rediss:// (Upstash / Redis Cloud)
                        connectTimeout: 10000,
                        retryStrategy: (times) => Math.min(times * 500, 5000),
                    })
                    : new Redis({
                        host: '127.0.0.1',
                        port: 6379,
                        connectTimeout: 10000,
                        retryStrategy: (times) => Math.min(times * 500, 5000),
                    });

                client.on('connect', () => {
                    console.log('Redis connected');
                });

                client.on('error', (err) => {
                    console.error('Redis connection error:', err.message);
                });

                return client;
                },
        },
        RedisService,
    ],
    exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule { }
