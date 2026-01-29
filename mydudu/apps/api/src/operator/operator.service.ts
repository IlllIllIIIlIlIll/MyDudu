import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionStatus, UserRole } from '@prisma/client';

type OperatorScope = {
  userId: number;
  role: UserRole;
  posyanduIds: number[];
  isAdmin: boolean;
};

@Injectable()
export class OperatorService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveScope(userId: number): Promise<OperatorScope> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
        district: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = user.role === UserRole.ADMIN;
    let posyanduIds: number[] = [];

    if (user.role === UserRole.POSYANDU && user.posyanduId) {
      posyanduIds = [user.posyanduId];
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
        this.prisma.device.count({ where: { ...deviceWhere, isActive: true } }),
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
          select: { id: true, posyanduId: true, isActive: true },
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
        if (device.isActive) {
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
    const sessionWhere = this.getSessionWhere(scope);

    const sessions = await this.prisma.session.findMany({
      where: sessionWhere,
      orderBy: { recordedAt: 'desc' },
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

    const childMap = new Map<number, any>();

    sessions.forEach((session) => {
      if (!session.child) return;
      if (childMap.has(session.child.id)) return;

      childMap.set(session.child.id, {
        id: session.child.id,
        fullName: session.child.fullName,
        birthDate: session.child.birthDate,
        gender: session.child.gender,
        parentName: session.child.parent?.user?.fullName || null,
        lastSession: {
          id: session.id,
          recordedAt: session.recordedAt,
          status: session.status,
          weight: session.weight,
          height: session.height,
          temperature: session.temperature,
          nutritionCategory: session.nutritionStatuses?.[0]?.category || null,
          deviceName: session.device?.name || null,
          deviceUuid: session.device?.deviceUuid || null,
          posyanduName: session.device?.posyandu?.name || null,
          villageName: session.device?.posyandu?.village?.name || null,
          districtName: session.device?.posyandu?.village?.district?.name || null,
        },
      });
    });

    return Array.from(childMap.values());
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
      isActive: device.isActive,
      posyanduName: device.posyandu?.name || null,
      villageName: device.posyandu?.village?.name || null,
      districtName: device.posyandu?.village?.district?.name || null,
      lastSessionAt: device.sessions?.[0]?.recordedAt || null,
      sessionsCount: device._count?.sessions || 0,
    }));
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
