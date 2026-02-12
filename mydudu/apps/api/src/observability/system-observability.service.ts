import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MetricType, ProviderType, MetricStatus, Prisma } from '@prisma/client';
import { MetricDerivationService } from './metric-derivation.service';
import * as crypto from 'crypto';

@Injectable()
export class SystemObservabilityService {
    private readonly logger = new Logger(SystemObservabilityService.name);

    // Buffer for high-frequency internal metrics (middleware)
    private requestCountBuffer = 0;
    private errorCountBuffer = 0;
    private latencySumBuffer = 0;
    private latencyCountBuffer = 0;

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
        private derivationService: MetricDerivationService,
    ) { }

    @Cron(CronExpression.EVERY_HOUR)
    async collectHourlySnapshot() {
        this.logger.log('Starting hourly observability snapshot...');
        const start = Date.now();

        try {
            // 1. Collect Provider Metrics
            await Promise.all([
                this.collectNeonMetrics(),
                this.collectVercelMetrics(), // Placeholder
                this.collectUpstashMetrics(), // Placeholder
                this.collectFirebaseMetrics(),
            ]);

            // 2. Flush Internal Metrics (Requests, Errors, etc.)
            await this.flushInternalMetrics();

            // 3. Mark Data Freshness
            await this.recordMetric(
                MetricType.DATA_FRESHNESS,
                ProviderType.INTERNAL,
                'observability-service',
                MetricStatus.VALID,
                new Prisma.Decimal(Date.now()),
                'timestamp'
            );

            // 4. Trigger Analysis
            await this.derivationService.computeAnalysis();

        } catch (error) {
            this.logger.error('Failed to collect hourly snapshot', error);
        } finally {
            this.logger.log(`Snapshot completed in ${Date.now() - start}ms`);
        }
    }

    // --- Public Methods for Middleware ---

    trackRequest(durationMs: number, isError: boolean) {
        this.requestCountBuffer++;
        if (isError) this.errorCountBuffer++;
        this.latencySumBuffer += durationMs;
        this.latencyCountBuffer++;
    }

    recordColdStart() {
        this.recordMetric(
            MetricType.APP_COLD_STARTS,
            ProviderType.RENDER,
            'render:production',
            MetricStatus.VALID,
            new Prisma.Decimal(1),
            'count'
        ).catch(e => this.logger.error('Failed to record cold start', e));
    }

    // --- Collectors ---

    private async collectNeonMetrics() {
        const start = Date.now();
        try {
            // Real check: DB Query Logic
            // We can query internal pg_stat_database or similar if user had permissions,
            // but for "free tier overview", we mostly check connectivity + storage size if possible.
            // Since Neon separates storage, `pg_database_size` is a good proxy.

            const distinctUsers = await this.prisma.user.count(); // Activity Proxy
            await this.recordMetric(MetricType.APP_REQUEST_COUNT, ProviderType.NEON, 'neon:primary', MetricStatus.VALID, new Prisma.Decimal(distinctUsers), 'users', undefined, Date.now() - start);

            // We can try to get DB size if permission allows
            const dbSizeResult = await this.prisma.$queryRaw<{ verify: bigint }[]>`SELECT pg_database_size(current_database()) as size`;
            // Check if result is array and has size. Postgres returns bigint.
            // Cast to number (MB)
            const sizeBytes = Number(dbSizeResult[0]['size']);
            const sizeMB = sizeBytes / (1024 * 1024);

            await this.recordMetric(
                MetricType.NEON_STORAGE,
                ProviderType.NEON,
                'neon:primary',
                MetricStatus.VALID,
                new Prisma.Decimal(sizeMB),
                'MB',
                new Prisma.Decimal(500), // Free tier limit 500MB
                Date.now() - start
            );

        } catch (error) {
            this.logger.error('Failed to collect Neon metrics', error);
            await this.recordMetric(MetricType.NEON_STORAGE, ProviderType.NEON, 'neon:primary', MetricStatus.FAILED_FETCH, new Prisma.Decimal(0), 'MB', undefined, Date.now() - start);
        }
    }

    private async collectVercelMetrics() {
        // Placeholder: Without API Key, we assume "VALID" but estimated or 0
        // In future: fetch https://api.vercel.com/v2/usage
        await this.recordMetric(
            MetricType.VERCEL_BANDWIDTH,
            ProviderType.VERCEL,
            'vercel:prod',
            MetricStatus.ESTIMATED,
            new Prisma.Decimal(0),
            'GB',
            new Prisma.Decimal(100) // 100GB Limit
        );
    }

    private async collectUpstashMetrics() {
        // Placeholder
        await this.recordMetric(
            MetricType.UPSTASH_COMMANDS,
            ProviderType.UPSTASH,
            'upstash:primary',
            MetricStatus.ESTIMATED,
            new Prisma.Decimal(0),
            'count',
            new Prisma.Decimal(10000) // 10k daily limit
        );
    }

    private async collectFirebaseMetrics() {
        const start = Date.now();
        // We can count users in our DB who use google auth maybe? 
        // Or just general users.
        const userCount = await this.prisma.user.count();

        await this.recordMetric(
            MetricType.AUTH_MAU,
            ProviderType.FIREBASE,
            'firebase:auth',
            MetricStatus.VALID,
            new Prisma.Decimal(userCount),
            'users',
            new Prisma.Decimal(50000), // 50k MAU limit
            Date.now() - start
        );
    }

    private async flushInternalMetrics() {
        const start = Date.now();

        // Request Count
        await this.recordMetric(
            MetricType.APP_REQUEST_COUNT,
            ProviderType.INTERNAL,
            'api:main',
            MetricStatus.VALID,
            new Prisma.Decimal(this.requestCountBuffer),
            'count',
            undefined,
            undefined,
            null,
            start, // Window Start (approx 1 hr ago in reality, but for simplicity using snapshot time)
            Date.now()
        );

        // Error Count
        await this.recordMetric(
            MetricType.APP_ERROR_COUNT,
            ProviderType.INTERNAL,
            'api:main',
            MetricStatus.VALID,
            new Prisma.Decimal(this.errorCountBuffer),
            'count'
        );

        // Latency
        const avgLatency = this.latencyCountBuffer > 0 ? this.latencySumBuffer / this.latencyCountBuffer : 0;
        await this.recordMetric(
            MetricType.APP_AVG_LATENCY,
            ProviderType.INTERNAL,
            'api:main',
            MetricStatus.VALID,
            new Prisma.Decimal(avgLatency),
            'ms'
        );

        // Reset Buffers
        this.requestCountBuffer = 0;
        this.errorCountBuffer = 0;
        this.latencySumBuffer = 0;
        this.latencyCountBuffer = 0;
    }

    // --- Helper ---

    private async recordMetric(
        type: MetricType,
        provider: ProviderType,
        source: String, // using String object wrapper to match Prisma type if needed, but string primitive is fine
        status: MetricStatus,
        value: Prisma.Decimal,
        unit: string,
        limit?: Prisma.Decimal,
        durationMs?: number,
        payload?: any,
        windowStart?: number,
        windowEnd?: number
    ) {
        const hash = payload ? crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex') : null;

        return this.prisma.systemMetric.create({
            data: {
                type,
                provider,
                source: source as string,
                status,
                value,
                limit,
                unit,
                collectionDurationMs: durationMs,
                payloadHash: hash,
                windowStart: windowStart ? new Date(windowStart) : undefined,
                windowEnd: windowEnd ? new Date(windowEnd) : undefined,
                meta: payload ? (payload as Prisma.InputJsonValue) : undefined,
            },
        });
    }
    // --- Retrieval for Dashboard ---

    async getLatestMetrics() {
        // 1. Get latest snapshot for each critical metric type
        // We can just fetch the latest 50 metrics ordered by timestamp desc
        const latestMetrics = await this.prisma.systemMetric.findMany({
            take: 50,
            orderBy: { timestamp: 'desc' },
            distinct: ['type', 'provider', 'source']
        });

        // 2. Get latest Derived Analysis
        const latestDerived = await this.prisma.systemMetricDerived.findMany({
            take: 50,
            orderBy: { computedAt: 'desc' },
            distinct: ['metricType', 'provider', 'source']
        });

        return {
            metrics: latestMetrics,
            analysis: latestDerived,
            lastCollectedAt: latestMetrics[0]?.timestamp || null
        };
    }
}
