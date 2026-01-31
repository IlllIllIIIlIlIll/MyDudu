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

            // 1. Check if user exists
            let user = await this.prisma.user.findUnique({
                where: { email: email },
            });

            if (!user) {
                // Determine logic: Do we auto-create? 
                // User request: "user that has status = PENDING, INACTIVE, or dont have the email registered are not be able to login"
                // So we do NOT create a user. We throw an error.
                throw new UnauthorizedException('Email belum terdaftar. Silakan hubungi admin.');
            }

            // 2. Check User Status
            if (user.status === 'PENDING') {
                throw new UnauthorizedException('Akun menunggu persetujuan admin.');
            }

            if (user.status === 'SUSPENDED') { // Using SUSPENDED as equivalent to INACTIVE based on schema
                throw new UnauthorizedException('Akun dinonaktifkan. Silakan hubungi admin.');
            }

            // 3. Update Last Login
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLogin: new Date(),
                    profilePicture: (decoded as any).picture || user.profilePicture // Optional: Update metadata if needed
                }
            });

            await this.systemLogsService.logEvent(SystemLogAction.USER_LOGIN, {
                email: user.email,
                role: user.role
            }, user.id);

            return user;
        } catch (error) {
            console.error("Auth Error", error);
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Invalid Token');
        }
    }
    async verifyPhone(phoneNumber: string) {
        // 1. Check if user exists with this phone number
        const user = await this.prisma.user.findFirst({
            where: { phoneNumber: phoneNumber },
            include: {
                parentProfile: {
                    include: {
                        children: {
                            include: {
                                sessions: {
                                    orderBy: { recordedAt: 'desc' },
                                    take: 5, // Get latest 5 sessions for history
                                    include: {
                                        device: {
                                            include: {
                                                posyandu: true
                                            }
                                        },
                                        validationRecords: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            // "if it is not then dont login, saying the phone number hasnt been registered yet in bahasa indonesia"
            throw new UnauthorizedException('Nomor telepon belum terdaftar');
        }

        // 2. Check User Status
        if (user.status === 'PENDING') {
            throw new UnauthorizedException('Akun menunggu persetujuan admin.');
        }

        if (user.status === 'SUSPENDED') {
            throw new UnauthorizedException('Akun dinonaktifkan. Silakan hubungi admin.');
        }

        // 3. Update Last Login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        return user;
    }
}
