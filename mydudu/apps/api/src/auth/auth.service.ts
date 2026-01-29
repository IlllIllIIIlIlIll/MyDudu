import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService, SystemLogAction } from '../system-logs/system-logs.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
    constructor(
        @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: admin.app.App,
        private readonly prisma: PrismaService,
        private readonly systemLogsService: SystemLogsService,
        private readonly notificationService: NotificationService
    ) { }

    async syncUser(token: string) {
        try {
            const decoded = await this.firebaseAdmin.auth().verifyIdToken(token);
            const { email, name, uid } = decoded;

            // Upsert user in database
            const user = await this.prisma.user.upsert({
                where: { email: email || `no-email-${uid}@mydudu.id` },
                update: {
                    lastLogin: new Date(),
                    // Do NOT update role here, preserve existing
                },
                create: {
                    email: email || `no-email-${uid}@mydudu.id`,
                    fullName: name || 'Operator',
                    phoneNumber: (decoded as any).phone_number || null, // Map from Firebase if available
                    role: 'POSYANDU', // Default role for new users
                    status: 'PENDING', // Default to PENDING for security
                    lastLogin: new Date(),
                },
            });

            // 3.1 [SYSTEM] User baru daftar (Status PENDING)
            if (user.status === 'PENDING') {
                await this.notificationService.notifyAdmin(`User ${user.email} menunggu persetujuan.`);
            }

            await this.systemLogsService.logEvent(SystemLogAction.USER_LOGIN, {
                email: user.email,
                role: user.role
            }, user.id);

            return user;
        } catch (error) {
            console.error("Auth Error", error);
            throw new UnauthorizedException('Invalid Token');
        }
    }
}
