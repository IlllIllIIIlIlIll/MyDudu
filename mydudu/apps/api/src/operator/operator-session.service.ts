import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OperatorScopeService } from './operator-scope.service';
import { CancelSessionDto, DiagnoseSessionDto, ReleaseLockDto, RenewLockDto } from './dto/pemeriksaan.dto';
import { GrowthService } from '../growth/growth.service';
import { DiagnosisCode, ExamOutcome } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class OperatorSessionService {
    private readonly LOCK_TTL_MS = 5 * 60 * 1000;

    constructor(
        private readonly prisma: PrismaService,
        private readonly scopeService: OperatorScopeService,
        private readonly growthService: GrowthService,
    ) { }

    private isLockExpired(lockedAt?: Date | null) {
        if (!lockedAt) return true;
        return lockedAt.getTime() < Date.now() - this.LOCK_TTL_MS;
    }

    private async toQueueItem(session: any) {
        const lockExpired = this.isLockExpired(session.lockedAt);
        const isLockedByOther = !!session.lockedByOperatorId && !lockExpired;
        const staleThresholdMs = 6 * 60 * 60 * 1000;
        const isStale = !!session.recordedAt && session.recordedAt.getTime() <= Date.now() - staleThresholdMs;
        const ttlSecondsRemaining = session.lockedAt
            ? Math.max(0, Math.ceil((session.lockedAt.getTime() + this.LOCK_TTL_MS - Date.now()) / 1000))
            : 0;

        let growthAnalysis = null;
        if (session.child && (session.weight || session.height)) {
            try {
                const recordDate = session.recordedAt || new Date();
                const birthDate = session.child.birthDate;
                const diffTime = Math.abs(recordDate.getTime() - birthDate.getTime());
                const ageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const weight = session.weight ? Number(session.weight) : undefined;
                const height = session.height ? Number(session.height) : undefined;
                const gender = session.child.gender || 'M';

                growthAnalysis = await this.growthService.analyzeGrowth(
                    session.child.id,
                    gender,
                    ageDays,
                    weight,
                    height
                );
            } catch (e) {
                // Silently fail specific growth calc if data is bad, don't block queue
            }
        }


        return {
            sessionId: session.id,
            sessionUuid: session.sessionUuid,
            recordedAt: session.recordedAt,
            version: session.version,
            weight: session.weight ? Number(session.weight) : null,
            height: session.height ? Number(session.height) : null,
            temperature: session.temperature ? Number(session.temperature) : null,
            heartRate: session.heartRate ? Number(session.heartRate) : null,
            noiseLevel: session.noiseLevel ? Number(session.noiseLevel) : null,
            child: {
                id: session.child?.id,
                childUuid: session.child?.childUuid,
                fullName: session.child?.fullName || null,
                birthDate: session.child?.birthDate || null,
                gender: session.child?.gender || null,
                parentName: session.child?.parent?.user?.fullName || null,
            },
            device: {
                id: session.device?.id,
                name: session.device?.name || null,
                deviceUuid: session.device?.deviceUuid || null,
                posyanduName: null,
                villageName: session.device?.village?.name || null,
            },
            lock: {
                lockedByOperatorId: session.lockedByOperatorId,
                lockedAt: session.lockedAt,
                lockExpired,
                ttlSecondsRemaining,
            },
            claimable: !isLockedByOther,
            isStale,
            growthAnalysis,
        };
    }

    private async getScopedSession(userId: number, sessionId: number) {
        const scope = await this.scopeService.resolveScope(userId);
        const sessionWhere = this.scopeService.getSessionWhere(scope);

        const session = await this.prisma.session.findFirst({
            where: {
                id: sessionId,
                ...sessionWhere,
            },
            include: {
                child: {
                    include: {
                        parent: {
                            include: {
                                user: {
                                    select: { fullName: true },
                                },
                            },
                        },
                    },
                },
                device: {
                    include: {
                        village: true,
                    },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found in your scope');
        }

        return session;
    }

    async getPemeriksaanQueue(userId: number) {
        const scope = await this.scopeService.resolveScope(userId);
        const sessionWhere = this.scopeService.getSessionWhere(scope);

        const sessions = await this.prisma.session.findMany({
            where: {
                ...sessionWhere,
                examOutcome: ExamOutcome.PENDING,
                measurementCompleted: true,
            },
            orderBy: [{ recordedAt: 'asc' }, { id: 'asc' }],
            include: {
                child: {
                    include: {
                        parent: {
                            include: {
                                user: {
                                    select: { fullName: true },
                                },
                            },
                        },
                    },
                },
                device: {
                    include: {
                        village: true,
                    },
                },
            },
        });

        return Promise.all(sessions.map((session) => this.toQueueItem(session)));
    }

    async claimPemeriksaanSession(userId: number, sessionId: number) {
        let attempts = 0;
        while (attempts < 3) {
            attempts++;
            const session = await this.getScopedSession(userId, sessionId);

            if (session.examOutcome !== ExamOutcome.PENDING) {
                throw new ConflictException('Session is no longer pending');
            }

            const lockExpired = this.isLockExpired(session.lockedAt);
            const lockOwnedByOther = !!session.lockedByOperatorId && session.lockedByOperatorId !== userId && !lockExpired;
            if (lockOwnedByOther) {
                throw new HttpException('Session locked by another operator', 423);
            }

            const now = new Date();
            const lockToken = randomUUID();

            const updated = await this.prisma.session.updateMany({
                where: {
                    id: session.id,
                    version: session.version,
                },
                data: {
                    lockedByOperatorId: userId,
                    lockedAt: now,
                    lockToken,
                    version: { increment: 1 },
                },
            });

            if (updated.count === 1) {
                const fresh = await this.getScopedSession(userId, sessionId);
                return {
                    ...(await this.toQueueItem(fresh)),
                    lockToken: fresh.lockToken,
                };
            }
        }

        throw new ConflictException('Session changed, please retry');
    }

    async renewPemeriksaanLock(userId: number, sessionId: number, dto: RenewLockDto) {
        const session = await this.getScopedSession(userId, sessionId);

        if (session.examOutcome !== ExamOutcome.PENDING) {
            throw new ConflictException('Session is no longer pending');
        }
        if (session.lockedByOperatorId !== userId || session.lockToken !== dto.lockToken) {
            throw new HttpException('Session lock is not owned by this operator', 423);
        }
        if (this.isLockExpired(session.lockedAt)) {
            throw new HttpException('Session lock expired, claim again', 423);
        }

        const now = new Date();
        await this.prisma.session.update({
            where: { id: session.id },
            data: { lockedAt: now },
        });

        const fresh = await this.getScopedSession(userId, sessionId);
        return await this.toQueueItem(fresh);
    }

    async releasePemeriksaanLock(userId: number, sessionId: number, dto: ReleaseLockDto) {
        const session = await this.getScopedSession(userId, sessionId);

        if (session.examOutcome !== ExamOutcome.PENDING) {
            return { success: true, sessionId, released: false };
        }
        if (session.lockedByOperatorId !== userId || session.lockToken !== dto.lockToken) {
            throw new HttpException('Session lock is not owned by this operator', 423);
        }

        await this.prisma.session.update({
            where: { id: session.id },
            data: {
                lockedByOperatorId: null,
                lockedAt: null,
                lockToken: null,
                version: { increment: 1 },
            },
        });

        return { success: true, sessionId, released: true };
    }

    async diagnosePemeriksaanSession(userId: number, sessionId: number, dto: DiagnoseSessionDto) {
        if (dto.diagnosisCode !== DiagnosisCode.OTHER && dto.diagnosisText) {
            dto.diagnosisText = undefined;
        }
        if (dto.diagnosisCode === DiagnosisCode.OTHER && !dto.diagnosisText) {
            throw new ConflictException('diagnosisText is required when diagnosisCode is OTHER');
        }
        const stepKeys = new Set<number>();
        for (const step of dto.quizSteps) {
            if (stepKeys.has(step.stepOrder)) {
                throw new ConflictException('quizSteps stepOrder must be unique per session');
            }
            stepKeys.add(step.stepOrder);
        }

        await this.prisma.$transaction(async (tx) => {
            const txClient = tx as any;
            const session = await tx.session.findFirst({
                where: {
                    id: sessionId,
                    examOutcome: ExamOutcome.PENDING,
                    lockedByOperatorId: userId,
                    lockToken: dto.lockToken,
                    version: dto.version,
                },
                select: { id: true },
            });

            if (!session) {
                throw new ConflictException('Diagnose failed due to stale version/lock/session state');
            }

            await txClient.sessionQuizStep.deleteMany({
                where: { sessionId },
            });

            await txClient.sessionQuizStep.createMany({
                data: dto.quizSteps
                    .slice()
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map((step) => ({
                        sessionId,
                        stepOrder: step.stepOrder,
                        nodeId: step.nodeId,
                        question: step.question,
                        answerYes: step.answerYes,
                        nextNodeId: step.nextNodeId ?? null,
                        treeVersion: step.treeVersion || 'decision-tree-v1',
                    })),
            });

            await tx.session.update({
                where: { id: sessionId },
                data: {
                    examOutcome: ExamOutcome.DIAGNOSED,
                    diagnosisCode: dto.diagnosisCode,
                    diagnosisText: dto.diagnosisCode === DiagnosisCode.OTHER ? dto.diagnosisText : null,
                    lockedByOperatorId: null,
                    lockedAt: null,
                    lockToken: null,
                    version: { increment: 1 },
                },
            });
        });

        return { success: true, sessionId };
    }

    async cancelPemeriksaanSession(userId: number, sessionId: number, dto: CancelSessionDto) {
        const existing = await this.getScopedSession(userId, sessionId);
        if (existing.examOutcome === ExamOutcome.CANCELED) {
            return { success: true, sessionId, alreadyCanceled: true };
        }

        const update = await this.prisma.session.updateMany({
            where: {
                id: sessionId,
                examOutcome: ExamOutcome.PENDING,
                lockedByOperatorId: userId,
                lockToken: dto.lockToken,
                version: dto.version,
            },
            data: {
                examOutcome: ExamOutcome.CANCELED,
                diagnosisCode: null,
                diagnosisText: null,
                lockedByOperatorId: null,
                lockedAt: null,
                lockToken: null,
                version: { increment: 1 },
            },
        });

        if (update.count !== 1) {
            throw new ConflictException('Cancel failed due to stale version/lock/session state');
        }

        return { success: true, sessionId };
    }
}
