import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricType, ProviderType, Prisma } from '@prisma/client';

@Injectable()
export class MetricDerivationService {
    private readonly logger = new Logger(MetricDerivationService.name);

    constructor(private prisma: PrismaService) { }

    async computeAnalysis() {
        this.logger.log('Starting metric analysis...');

        // Analyze distinct (Type, Source) pairs from the last 24 hours
        // For simplicity, we manually iterate known critical types
        const criticalTypes = [
            { type: MetricType.NEON_STORAGE, provider: ProviderType.NEON },
            { type: MetricType.VERCEL_BANDWIDTH, provider: ProviderType.VERCEL },
            { type: MetricType.AUTH_MAU, provider: ProviderType.FIREBASE }
        ];

        for (const { type, provider } of criticalTypes) {
            await this.analyzeMetric(type, provider);
        }
    }

    private async analyzeMetric(type: MetricType, provider: ProviderType) {
        // 1. Get last 7 days of data
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const history = await this.prisma.systemMetric.findMany({
            where: {
                type,
                provider,
                timestamp: { gte: sevenDaysAgo },
                status: 'VALID'
            },
            orderBy: { timestamp: 'asc' }
        });

        if (history.length < 2) return;

        // 2. Compute Linear Regression (slope) -> Velocity
        // y = mx + b
        // x = timestamp (days from start), y = value
        const firstTime = history[0].timestamp.getTime();
        const dataPoints = history.map(h => ({
            x: (h.timestamp.getTime() - firstTime) / (1000 * 3600 * 24), // days
            y: Number(h.value)
        }));

        const n = dataPoints.length;
        const sumX = dataPoints.reduce((acc, p) => acc + p.x, 0);
        const sumY = dataPoints.reduce((acc, p) => acc + p.y, 0);
        const sumXY = dataPoints.reduce((acc, p) => acc + (p.x * p.y), 0);
        const sumXX = dataPoints.reduce((acc, p) => acc + (p.x * p.x), 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        // Slope = units per day

        // 3. Last Value & Limit
        const lastRecord = history[history.length - 1];
        const currentVal = Number(lastRecord.value);
        const limit = lastRecord.limit ? Number(lastRecord.limit) : null;

        let daysRemaining: number | null = null;
        let anomalyScore = 0;

        // 4. Calculate Days Remaining
        if (limit && slope > 0) {
            const remainingCapacity = limit - currentVal;
            daysRemaining = remainingCapacity / slope;
        }

        // 5. Detect Anomaly (Z-Score of last point vs history mean/stddev)
        const values = dataPoints.map(p => p.y);
        const mean = sumY / n;
        const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);

        if (stdDev > 0) {
            const zScore = Math.abs((currentVal - mean) / stdDev);
            // Normalize Z-score to 0-1 confidence roughly
            // If Z > 3, highly anomalous.
            if (zScore > 2.0) anomalyScore = Math.min(1.0, (zScore - 2.0) / 2.0); // Simple scaling
        }

        // 6. Save Derived Metric
        await this.prisma.systemMetricDerived.create({
            data: {
                metricType: type,
                provider,
                source: lastRecord.source,
                daysRemaining: daysRemaining ? new Prisma.Decimal(daysRemaining) : null,
                anomalyScore: new Prisma.Decimal(anomalyScore),
                predictionConfidence: new Prisma.Decimal(Math.max(0, 1 - (1 / n))), // More points = more confidence
            }
        });
    }
}
