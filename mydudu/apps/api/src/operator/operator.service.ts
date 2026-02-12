import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiagnosisCode, ExamOutcome, SessionStatus, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CancelSessionDto, DiagnoseSessionDto, ReleaseLockDto, RenewLockDto } from './dto/pemeriksaan.dto';

type OperatorScope = {
  userId: number;
  role: UserRole;
  posyanduIds: number[];
  isAdmin: boolean;
  villageId?: number | null;
  districtId?: number | null;
};

@Injectable()
export class OperatorService {
  private readonly LOCK_TTL_MS = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) { }

  private isLockExpired(lockedAt?: Date | null) {
    if (!lockedAt) return true;
    return lockedAt.getTime() < Date.now() - this.LOCK_TTL_MS;
  }

  private async resolveScope(userId: number): Promise<OperatorScope> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        village: {
          include: {
            district: true,
            posyandus: true, // Fetch all posyandus in the village
          },
        },
        district: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = user.role === UserRole.ADMIN;
    let posyanduIds: number[] = [];

    if (user.role === UserRole.POSYANDU && user.villageId) {
      // Operator is assigned to a Village, so they manage ALL Posyandus in that village
      if (user.village?.posyandus) {
        posyanduIds = user.village.posyandus.map(p => p.id);
      }
    } else if (user.role === UserRole.PUSKESMAS && user.districtId) {
      const posyandus = await this.prisma.posyandu.findMany({
        where: { village: { districtId: user.districtId } },
        select: { id: true },
      });
      posyanduIds = posyandus.map((posyandu) => posyandu.id);
    }

    return {
      userId: user.id,
      role: user.role,
      posyanduIds,
      isAdmin,
      villageId: user.villageId,
      districtId: user.districtId,
    };
  }

  private getDeviceWhere(scope: OperatorScope) {
    if (scope.isAdmin) return {};
    if (scope.posyanduIds.length === 0) {
      return { posyanduId: { in: [-1] } };
    }
    return { posyanduId: { in: scope.posyanduIds } };
  }

  private getSessionWhere(scope: OperatorScope) {
    if (scope.isAdmin) return {};
    if (scope.posyanduIds.length === 0) {
      return { device: { posyanduId: { in: [-1] } } };
    }
    return { device: { posyanduId: { in: scope.posyanduIds } } };
  }

  async getOverview(userId: number) {
    const scope = await this.resolveScope(userId);
    const deviceWhere = this.getDeviceWhere(scope);
    const sessionWhere = this.getSessionWhere(scope);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(startOfDay);
    startOfMonth.setDate(1);

    const [devicesTotal, devicesActive, sessionsToday, pendingValidations, reportsThisMonth] =
      await Promise.all([
        this.prisma.device.count({ where: deviceWhere }),
        this.prisma.device.count({ where: { ...deviceWhere, status: { in: ['AVAILABLE', 'WAITING'] } } }),
        this.prisma.session.count({
          where: {
            ...sessionWhere,
            recordedAt: { gte: startOfDay },
          },
        }),
        this.prisma.session.count({
          where: {
            ...sessionWhere,
            status: SessionStatus.IN_PROGRESS,
            validationRecords: { none: {} },
          },
        }),
        this.prisma.report.count({
          where: {
            generatedAt: { gte: startOfMonth },
            ...(scope.isAdmin ? {} : { session: sessionWhere }),
          },
        }),
      ]);

    let uniqueChildren = 0;
    if (scope.isAdmin) {
      uniqueChildren = await this.prisma.child.count();
    } else {
      const distinctChildren = await this.prisma.session.findMany({
        where: sessionWhere,
        distinct: ['childId'],
        select: { childId: true },
      });
      uniqueChildren = distinctChildren.length;
    }

    const recentSessions = await this.prisma.session.findMany({
      where: sessionWhere,
      orderBy: { recordedAt: 'desc' },
      take: 6,
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
            posyandu: {
              include: {
                village: {
                  include: {
                    district: true,
                  },
                },
              },
            },
          },
        },
        nutritionStatuses: {
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
    });

    const upcomingSchedules =
      scope.isAdmin || scope.posyanduIds.length > 0
        ? await this.prisma.schedule.findMany({
          where: {
            ...(scope.isAdmin ? {} : { posyanduId: { in: scope.posyanduIds } }),
            eventDate: { gte: startOfDay },
          },
          include: {
            posyandu: {
              include: {
                village: {
                  include: {
                    district: true,
                  },
                },
              },
            },
          },
          orderBy: { eventDate: 'asc' },
          take: 5,
        })
        : [];

    let posyanduSummary: any[] = [];
    if (scope.role === UserRole.PUSKESMAS && scope.posyanduIds.length > 0) {
      const [posyandus, devices, sessions] = await Promise.all([
        this.prisma.posyandu.findMany({
          where: { id: { in: scope.posyanduIds } },
          include: { village: { include: { district: true } } },
        }),
        this.prisma.device.findMany({
          where: deviceWhere,
          select: { id: true, posyanduId: true, status: true },
        }),
        this.prisma.session.findMany({
          where: sessionWhere,
          select: {
            childId: true,
            device: { select: { posyanduId: true } },
            nutritionStatuses: {
              orderBy: { id: 'desc' },
              take: 1,
              select: { category: true },
            },
          },
        }),
      ]);

      const summaryMap = new Map<number, any>();
      posyandus.forEach((posyandu) => {
        summaryMap.set(posyandu.id, {
          posyanduId: posyandu.id,
          posyanduName: posyandu.name,
          villageName: posyandu.village?.name || null,
          districtName: posyandu.village?.district?.name || null,
          childrenCount: 0,
          devicesCount: 0,
          activeDevicesCount: 0,
          nutrition: {
            NORMAL: 0,
            STUNTED: 0,
            WASTED: 0,
            OBESE: 0,
          },
        });
      });

      devices.forEach((device) => {
        if (!device.posyanduId) return;
        const entry = summaryMap.get(device.posyanduId);
        if (!entry) return;
        entry.devicesCount += 1;
        if (device.status === 'AVAILABLE' || device.status === 'WAITING') {
          entry.activeDevicesCount += 1;
        }
      });

      const childrenByPosyandu = new Map<number, Set<number>>();
      sessions.forEach((session) => {
        const posyanduId = session.device?.posyanduId;
        if (!posyanduId) return;
        if (!childrenByPosyandu.has(posyanduId)) {
          childrenByPosyandu.set(posyanduId, new Set());
        }
        childrenByPosyandu.get(posyanduId)?.add(session.childId);

        const category = session.nutritionStatuses?.[0]?.category;
        const entry = summaryMap.get(posyanduId);
        if (entry && category) {
          entry.nutrition[category] = (entry.nutrition[category] || 0) + 1;
        }
      });

      summaryMap.forEach((entry, posyanduId) => {
        entry.childrenCount = childrenByPosyandu.get(posyanduId)?.size || 0;
      });

      posyanduSummary = Array.from(summaryMap.values());
    }

    return {
      counts: {
        uniqueChildren,
        sessionsToday,
        devicesTotal,
        devicesActive,
        pendingValidations,
        reportsThisMonth,
      },
      recentSessions: recentSessions.map((session) => ({
        id: session.id,
        recordedAt: session.recordedAt,
        status: session.status,
        weight: session.weight,
        height: session.height,
        temperature: session.temperature,
        heartRate: session.heartRate,
        noiseLevel: session.noiseLevel,
        child: {
          id: session.child?.id,
          fullName: session.child?.fullName,
          birthDate: session.child?.birthDate,
          gender: session.child?.gender,
          parentName: session.child?.parent?.user?.fullName || null,
        },
        device: {
          id: session.device?.id,
          name: session.device?.name,
          deviceUuid: session.device?.deviceUuid,
          posyanduName: session.device?.posyandu?.name || null,
          villageName: session.device?.posyandu?.village?.name || null,
          districtName: session.device?.posyandu?.village?.district?.name || null,
        },
        nutritionCategory: session.nutritionStatuses?.[0]?.category || null,
      })),
      upcomingSchedules: upcomingSchedules.map((schedule) => ({
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        eventDate: schedule.eventDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        posyanduName: schedule.posyandu?.name || null,
        villageName: schedule.posyandu?.village?.name || null,
        districtName: schedule.posyandu?.village?.district?.name || null,
      })),
      posyanduSummary,
    };
  }

  async getChildren(userId: number) {
    const scope = await this.resolveScope(userId);

    // Filter by location scope
    const where: any = {};
    if (!scope.isAdmin) {
      if (scope.role === UserRole.POSYANDU && scope.villageId) {
        where.parent = { villageId: scope.villageId };
      } else if (scope.role === UserRole.PUSKESMAS && scope.districtId) {
        where.parent = { village: { districtId: scope.districtId } };
      } else {
        // If strict location scoping is required but missing, return empty
        return [];
      }
    }

    const children = await this.prisma.child.findMany({
      where,
      orderBy: { fullName: 'asc' },
      include: {
        parent: {
          include: {
            user: {
              select: { fullName: true },
            },
          },
        },
        sessions: {
          take: 1,
          orderBy: { recordedAt: 'desc' },
          include: {
            nutritionStatuses: {
              take: 1,
              orderBy: { id: 'desc' },
            },
            device: {
              include: {
                posyandu: {
                  include: {
                    village: {
                      include: {
                        district: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return children.map((child) => {
      const lastSession = child.sessions?.[0];

      return {
        id: child.id,
        fullName: child.fullName,
        birthDate: child.birthDate,
        gender: child.gender,
        parentName: child.parent?.user?.fullName || null,
        bloodType: child.bloodType,
        lastSession: lastSession
          ? {
            id: lastSession.id,
            recordedAt: lastSession.recordedAt,
            status: lastSession.status,
            weight: lastSession.weight,
            height: lastSession.height,
            temperature: lastSession.temperature,
            nutritionCategory: lastSession.nutritionStatuses?.[0]?.category || null,
            deviceName: lastSession.device?.name || null,
            deviceUuid: lastSession.device?.deviceUuid || null,
            posyanduName: lastSession.device?.posyandu?.name || null,
            villageName: lastSession.device?.posyandu?.village?.name || null,
            districtName: lastSession.device?.posyandu?.village?.district?.name || null,
          }
          : null,
      };
    });
  }

  async getDevices(userId: number) {
    const scope = await this.resolveScope(userId);
    const deviceWhere = this.getDeviceWhere(scope);

    const devices = await this.prisma.device.findMany({
      where: deviceWhere,
      orderBy: { id: 'desc' },
      include: {
        posyandu: {
          include: {
            village: {
              include: {
                district: true,
              },
            },
          },
        },
        sessions: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
          select: { recordedAt: true },
        },
        _count: {
          select: { sessions: true },
        },
      },
    });

    return devices.map((device) => ({
      id: device.id,
      deviceUuid: device.deviceUuid,
      name: device.name,
      status: device.status,
      posyanduName: device.posyandu?.name || null,
      villageName: device.posyandu?.village?.name || null,
      districtName: device.posyandu?.village?.district?.name || null,
      lastSessionAt: device.sessions?.[0]?.recordedAt || null,
      sessionsCount: device._count?.sessions || 0,
    }));
  }

  async getDevicesByVillage(userId: number, villageId: number, query = '') {
    const scope = await this.resolveScope(userId);

    if (!scope.isAdmin) {
      if (scope.role === UserRole.POSYANDU && scope.villageId !== villageId) {
        return [];
      }
      if (scope.role === UserRole.PUSKESMAS && scope.districtId) {
        const village = await this.prisma.village.findUnique({
          where: { id: villageId },
          select: { districtId: true },
        });
        if (!village || village.districtId !== scope.districtId) {
          return [];
        }
      }
    }

    const where: any = {
      posyandu: { villageId },
    };
    if (!scope.isAdmin) {
      where.posyanduId = { in: scope.posyanduIds.length ? scope.posyanduIds : [-1] };
    }
    if (query.trim()) {
      where.OR = [
        { name: { contains: query.trim(), mode: 'insensitive' } },
        { deviceUuid: { contains: query.trim(), mode: 'insensitive' } },
      ];
    }

    const devices = await this.prisma.device.findMany({
      where,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      include: {
        posyandu: {
          include: {
            village: true,
          },
        },
      },
      take: 20,
    });

    return devices.map((device) => ({
      id: device.id,
      name: device.name,
      deviceUuid: device.deviceUuid,
      posyanduName: device.posyandu?.name || null,
      villageName: device.posyandu?.village?.name || null,
    }));
  }

  async getParents(userId: number) {
    const scope = await this.resolveScope(userId);
    const where: any = {};

    if (!scope.isAdmin) {
      if (scope.role === UserRole.POSYANDU && scope.villageId) {
        where.villageId = scope.villageId;
      } else if (scope.role === UserRole.PUSKESMAS && scope.districtId) {
        where.village = { districtId: scope.districtId };
      } else {
        console.log('getParents: No location scope found for role', scope.role);
        return [];
      }
    }

    console.log('getParents: querying with where', JSON.stringify(where));

    const parents = await this.prisma.parent.findMany({
      where,
      orderBy: { user: { fullName: 'asc' } },
      include: {
        user: {
          select: {
            fullName: true,
            phoneNumber: true,
          },
        },
        _count: {
          select: { children: true },
        },
        village: {
          include: {
            district: true,
          },
        },
      },
    });

    return parents.map((parent) => ({
      id: parent.id,
      fullName: parent.user.fullName,
      phoneNumber: parent.user.phoneNumber,
      villageName: parent.village?.name || null,
      districtName: parent.village?.district?.name || null,
      childrenCount: parent._count.children,
    }));
  }

  async getChildrenByParent(userId: number, parentId: number) {
    const scope = await this.resolveScope(userId);
    const where: any = { id: parentId };

    if (!scope.isAdmin) {
      if (scope.role === UserRole.POSYANDU && scope.villageId) {
        where.villageId = scope.villageId;
      } else if (scope.role === UserRole.PUSKESMAS && scope.districtId) {
        where.village = { districtId: scope.districtId };
      } else {
        return [];
      }
    }

    const parent = await this.prisma.parent.findFirst({
      where,
      include: {
        children: {
          orderBy: { fullName: 'asc' },
          select: {
            id: true,
            fullName: true,
            birthDate: true,
            gender: true,
          },
        },
      },
    });

    if (!parent) {
      return [];
    }

    return parent.children.map((child) => ({
      id: child.id,
      fullName: child.fullName,
      birthDate: child.birthDate,
      gender: child.gender,
    }));
  }

  private toQueueItem(session: any) {
    const lockExpired = this.isLockExpired(session.lockedAt);
    const isLockedByOther = !!session.lockedByOperatorId && !lockExpired;
    const staleThresholdMs = 6 * 60 * 60 * 1000;
    const isStale = !!session.recordedAt && session.recordedAt.getTime() <= Date.now() - staleThresholdMs;
    const ttlSecondsRemaining = session.lockedAt
      ? Math.max(0, Math.ceil((session.lockedAt.getTime() + this.LOCK_TTL_MS - Date.now()) / 1000))
      : 0;

    return {
      sessionId: session.id,
      recordedAt: session.recordedAt,
      version: session.version,
      weight: session.weight ? Number(session.weight) : null,
      height: session.height ? Number(session.height) : null,
      temperature: session.temperature ? Number(session.temperature) : null,
      heartRate: session.heartRate ? Number(session.heartRate) : null,
      noiseLevel: session.noiseLevel ? Number(session.noiseLevel) : null,
      child: {
        id: session.child?.id,
        fullName: session.child?.fullName || null,
        birthDate: session.child?.birthDate || null,
        gender: session.child?.gender || null,
        parentName: session.child?.parent?.user?.fullName || null,
      },
      device: {
        id: session.device?.id,
        name: session.device?.name || null,
        deviceUuid: session.device?.deviceUuid || null,
        posyanduName: session.device?.posyandu?.name || null,
      },
      lock: {
        lockedByOperatorId: session.lockedByOperatorId,
        lockedAt: session.lockedAt,
        lockExpired,
        ttlSecondsRemaining,
      },
      claimable: !isLockedByOther,
      isStale,
    };
  }

  private async getScopedSession(userId: number, sessionId: number) {
    const scope = await this.resolveScope(userId);
    const sessionWhere = this.getSessionWhere(scope);

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
            posyandu: true,
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
    const scope = await this.resolveScope(userId);
    const sessionWhere = this.getSessionWhere(scope);

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
            posyandu: true,
          },
        },
      },
    });

    return sessions.map((session) => this.toQueueItem(session));
  }

  async claimPemeriksaanSession(userId: number, sessionId: number) {
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

    if (updated.count !== 1) {
      throw new ConflictException('Session changed, please retry');
    }

    const fresh = await this.getScopedSession(userId, sessionId);
    return {
      ...this.toQueueItem(fresh),
      lockToken: fresh.lockToken,
    };
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
    return this.toQueueItem(fresh);
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

  async getValidations(userId: number) {
    const scope = await this.resolveScope(userId);
    const sessionWhere = this.getSessionWhere(scope);

    const sessions = await this.prisma.session.findMany({
      where: sessionWhere,
      orderBy: { recordedAt: 'desc' },
      include: {
        child: {
          select: {
            id: true,
            fullName: true,
            birthDate: true,
            gender: true,
          },
        },
        device: {
          include: {
            posyandu: {
              include: {
                village: {
                  include: {
                    district: true,
                  },
                },
              },
            },
          },
        },
        nutritionStatuses: {
          orderBy: { id: 'desc' },
          take: 1,
        },
        validationRecords: {
          orderBy: { id: 'desc' },
          take: 1,
          include: {
            validator: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    const validations = sessions
      .map((session) => {
        const category = session.nutritionStatuses?.[0]?.category || null;
        const status =
          session.status === SessionStatus.CLINICALLY_SUFFICIENT
            ? 'approved'
            : session.status === SessionStatus.INSUFFICIENT
              ? 'rejected'
              : 'pending';

        const shouldShow =
          category !== null && category !== 'NORMAL'
            ? true
            : session.status === SessionStatus.INSUFFICIENT ||
            session.status === SessionStatus.CLINICALLY_SUFFICIENT;

        if (!shouldShow) return null;

        return {
          sessionId: session.id,
          status,
          recordedAt: session.recordedAt,
          childId: session.child?.id,
          childName: session.child?.fullName || null,
          birthDate: session.child?.birthDate || null,
          gender: session.child?.gender || null,
          weight: session.weight,
          height: session.height,
          temperature: session.temperature,
          nutritionCategory: category,
          posyanduName: session.device?.posyandu?.name || null,
          villageName: session.device?.posyandu?.village?.name || null,
          districtName: session.device?.posyandu?.village?.district?.name || null,
          validatorName: session.validationRecords?.[0]?.validator?.fullName || null,
          remarks: session.validationRecords?.[0]?.remarks || null,
        };
      })
      .filter(Boolean);

    return validations;
  }

  async getReports(userId: number) {
    const scope = await this.resolveScope(userId);
    const sessionWhere = this.getSessionWhere(scope);

    const reports = await this.prisma.report.findMany({
      where: {
        ...(scope.isAdmin ? {} : { session: sessionWhere }),
      },
      orderBy: { generatedAt: 'desc' },
      include: {
        session: {
          include: {
            child: {
              select: {
                id: true,
                fullName: true,
                birthDate: true,
                gender: true,
              },
            },
            device: {
              include: {
                posyandu: {
                  include: {
                    village: {
                      include: {
                        district: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(startOfDay);
    startOfMonth.setDate(1);

    const uniqueChildren = new Set<number>();
    const reportsThisMonth = reports.filter((report) => {
      if (report.session?.childId) {
        uniqueChildren.add(report.session.childId);
      }
      return report.generatedAt && report.generatedAt >= startOfMonth;
    }).length;

    return {
      summary: {
        totalReports: reports.length,
        reportsThisMonth,
        uniqueChildren: uniqueChildren.size,
        latestReportAt: reports[0]?.generatedAt || null,
      },
      reports: reports.map((report) => ({
        id: report.id,
        sessionId: report.sessionId,
        fileUrl: report.fileUrl,
        generatedAt: report.generatedAt,
        childName: report.session?.child?.fullName || null,
        posyanduName: report.session?.device?.posyandu?.name || null,
        villageName: report.session?.device?.posyandu?.village?.name || null,
        districtName: report.session?.device?.posyandu?.village?.district?.name || null,
      })),
    };
  }
}
