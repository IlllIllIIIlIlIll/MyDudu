import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';
import { NotifType } from '@prisma/client';

@Injectable()
export class ValidationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService
    ) { }

    async validateSession(sessionId: number, validatorId: number, remarks?: string) {
        // 1. Create Validation Record
        const validation = await this.prisma.validationRecord.create({
            data: {
                sessionId,
                validatorId,
                remarks,
            }
        });

        // 2. Fetch Session to get Operator details
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: { operator: true }
        });

        if (!session) return validation;

        // 3. Trigger: [RESULT] Data tervalidasi dokter
        if (session.operatorId) {
            await this.notificationService.notifyOperator(
                session.operatorId,
                `Data sesi #${session.id} telah divalidasi oleh Dokter.`,
                NotifType.RESULT
            );

            // Removed FAIL logic as ValidationStatus was requested to be removed
        }

        return validation;
    }
}
