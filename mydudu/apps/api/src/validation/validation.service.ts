import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class ValidationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService
    ) { }

    async validateSession(
        sessionId: number,
        validatorId: number,
        remarks?: string,
        decision: 'approve' | 'reject' = 'approve'
    ) {
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

        // 2b. Update session status based on decision
        const nextStatus =
            decision === 'approve'
                ? 'CLINICALLY_DONE'  // Doctor approved → finalized
                : 'MEASURED';         // Doctor rejected → back to measured, needs re-exam

        await this.prisma.session.update({
            where: { id: sessionId },
            data: { status: nextStatus }
        });

        // 3. Trigger: [RESULT] Data tervalidasi dokter
        if (session.operatorId) {
            const message =
                decision === 'approve'
                    ? `Data sesi #${session.id} telah disetujui oleh Dokter.`
                    : `Data sesi #${session.id} ditolak oleh Dokter. Perlu pemeriksaan ulang.`;

            await this.notificationService.notifyOperator(
                session.operatorId,
                message,
                'RESULT' as any
            );
        }

        return validation;
    }
}
