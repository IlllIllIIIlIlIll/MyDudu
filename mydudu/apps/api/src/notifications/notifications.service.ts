import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotifType, NotifStatus } from '@prisma/client';

@Injectable()
export class NotificationService {
    constructor(private readonly prisma: PrismaService) { }

    async createNotification(userId: number, type: NotifType, message: string) {
        return this.prisma.notification.create({
            data: {
                userId,
                type,
                message,
                status: NotifStatus.SENT,
            }
        });
    }

    async getNotifications(userId: number, limit: number = 20) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async markAsRead(id: number) {
        return this.prisma.notification.update({
            where: { id },
            data: { status: NotifStatus.READ }
        });
    }

    async markAllAsRead(userId: number) {
        return this.prisma.notification.updateMany({
            where: { userId, status: NotifStatus.SENT },
            data: { status: NotifStatus.READ }
        });
    }

    // --- Specific Role Helpers ---

    async notifyAdmin(message: string) {
        // Find all admins
        const admins = await this.prisma.user.findMany({
            where: { role: 'ADMIN' }
        });

        for (const admin of admins) {
            await this.createNotification(admin.id, NotifType.SYSTEM, message);
        }
    }

    async notifyDoctor(message: string, districtId?: number) {
        // If districtId is provided, notify Puskesmas in that district
        // For simplified logic, notify all Puskesmas users
        const doctors = await this.prisma.user.findMany({
            where: { role: 'PUSKESMAS' }
        });

        for (const doctor of doctors) {
            await this.createNotification(doctor.id, NotifType.SYSTEM, message);
        }
    }

    async notifyOperator(userId: number, message: string, type: NotifType = NotifType.SYSTEM) {
        await this.createNotification(userId, type, message);
    }
}
