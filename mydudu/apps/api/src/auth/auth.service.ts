import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: admin.app.App,
        private readonly prisma: PrismaService,
    ) { }

    async syncUser(token: string) {
        try {
            const decoded = await this.firebaseAdmin.auth().verifyIdToken(token);
            const { email, name, uid } = decoded;

            // Upsert user in database
            const user = await this.prisma.user.upsert({
                where: { email: email || `no-email-${uid}@mydudu.id` },
                update: { lastLogin: new Date() },
                create: {
                    email: email || `no-email-${uid}@mydudu.id`,
                    fullName: name || 'Operator',
                    passwordHash: 'firebase-managed',
                    role: 'OPERATOR', // Default role
                    lastLogin: new Date(),
                },
            });

            return user;
        } catch (error) {
            console.error("Auth Error", error);
            throw new UnauthorizedException('Invalid Token');
        }
    }
}
