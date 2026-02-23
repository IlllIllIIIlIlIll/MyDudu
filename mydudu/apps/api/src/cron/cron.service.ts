import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';
import { NotifType } from '@prisma/client';

@Injectable()
export class CronService {
    private readonly logger = new Logger(CronService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
    ) { }

    // 1.2 [REMINDER] Jadwal posyandu besok (Daily at 07:00 AM)
    @Cron('0 7 * * *')
    async checkUpcomingSchedules() {
        this.logger.log('Checking upcoming schedules...');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const nextDay = new Date(tomorrow);
        nextDay.setDate(tomorrow.getDate() + 1);

        const schedules = await this.prisma.schedule.findMany({
            where: {
                eventDate: {
                    gte: tomorrow,
                    lt: nextDay
                }
            },
            include: { village: { include: { users: true } } }
        });

        for (const schedule of schedules) {
            // Updated Path: Schedule -> Village -> Users
            if (schedule.village?.users) {
                for (const user of schedule.village.users) {
                    await this.notificationService.notifyOperator(
                        user.id,
                        `Jadwal Posyandu ${schedule.posyanduName || schedule.village.name} besok: ${schedule.title}`,
                        NotifType.REMINDER
                    );
                }
            }
        }
    }

    // 2.2 [REMINDER] Pending Validations (Every 2 hours)
    @Cron('0 */2 * * *')
    async checkPendingValidations() {
        this.logger.log('Checking pending validations...');

        // Count sessions in progress for more than 24 hours (example threshold) maybe? 
        // Or just pending sessions in general. User said "Session.status = IN_PROGRESS > X jam"

        const offsetTime = new Date();
        offsetTime.setHours(offsetTime.getHours() - 2); // Sessions older than 2 hours

        const pendingCount = await this.prisma.session.count({
            where: {
                status: 'IN_PROGRESS', // Or whatever status implies pending validation if different
                recordedAt: { lt: offsetTime }
            }
        });

        if (pendingCount > 0) {
            await this.notificationService.notifyDoctor(
                `Anda memiliki ${pendingCount} sesi lama yang menunggu validasi medis.`
            );
        }
    }

    // 3.5 [SYSTEM] DB hampir penuh (Daily) - MOCKED
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async checkDbHealth() {
        // Mock check
        const isFull = false;
        if (isFull) {
            await this.notificationService.notifyAdmin("Database hampir penuh (>80%)");
        }
    }
    // 4. Cleanup [SYSTEM] Hapus notifikasi yang sudah dibaca > 1 hari
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupOldNotifications() {
        this.logger.log('Cleaning up old read notifications...');

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const deleted = await this.prisma.notification.deleteMany({
            where: {
                status: 'READ',
                createdAt: {
                    lt: oneDayAgo
                }
            }
        });

        this.logger.log(`Deleted ${deleted.count} old read notifications.`);
    }
}
