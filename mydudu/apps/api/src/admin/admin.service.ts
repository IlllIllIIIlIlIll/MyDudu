import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        const [
            totalUsers,
            pendingUsers,
            usersByRole,
            totalDevices,
            activeDevices,
            totalSessions,
            todaySessions,
            sessionByStatus,
            nutritionStats,
            openIncidents,
            recentIncidents,
            recentLogs,
            unreadNotifications,
            tokenStatsTotal,
            tokenStatsHour
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { status: 'PENDING' } }),
            this.prisma.user.groupBy({
                by: ['role'],
                _count: true,
            }),
            this.prisma.device.count(),
            this.prisma.device.count({ where: { status: { in: ['AVAILABLE', 'WAITING'] } } }),
            this.prisma.session.count(),
            this.prisma.session.count({
                where: {
                    recordedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            }),
            this.prisma.session.groupBy({
                by: ['status'],
                _count: true,
            }),
            this.prisma.nutritionStatus.groupBy({
                by: ['category'],
                _count: true,
            }),
            this.prisma.incident.count({ where: { status: 'OPEN' } }),
            this.prisma.incident.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            this.prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            this.prisma.notification.count({
                where: { status: 'SENT' },
            }),
            this.prisma.aITokenLog.aggregate({
                _sum: { totalTokens: true }
            }),
            this.prisma.aITokenLog.aggregate({
                _sum: { totalTokens: true },
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 60 * 60 * 1000) // Last 1 hour
                    }
                }
            }),
        ]);

        return {
            users: {
                total: totalUsers,
                pending: pendingUsers,
                byRole: usersByRole,
            },
            devices: {
                total: totalDevices,
                active: activeDevices,
                inactive: totalDevices - activeDevices,
            },
            sessions: {
                total: totalSessions,
                today: todaySessions,
                byStatus: sessionByStatus,
            },
            nutrition: nutritionStats,
            incidents: {
                open: openIncidents,
                recent: recentIncidents,
            },
            logs: recentLogs,
            notifications: {
                unread: unreadNotifications,
            },
            aiUsage: {
                totalTokensSpent: tokenStatsTotal._sum.totalTokens || 0,
                tokensSpentLastHour: tokenStatsHour._sum.totalTokens || 0,
                dailyQuotaLimit: 1000000, // Gemini Free Tier 1M TPM assumed as safety limit
                remainingTokens: 1000000 - (tokenStatsTotal._sum.totalTokens || 0)
            }
        };
    }
}
