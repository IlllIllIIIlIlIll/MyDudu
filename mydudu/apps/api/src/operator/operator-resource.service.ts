import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GrowthService } from '../growth/growth.service';
import { OperatorScopeService } from './operator-scope.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class OperatorResourceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly scopeService: OperatorScopeService,
        private readonly growthService: GrowthService,
    ) { }

    async getChildren(userId: number) {
        const scope = await this.scopeService.resolveScope(userId);

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

        return Promise.all(children.map(async (child) => {
            const lastSession = child.sessions?.[0];
            let growthAnalysis = null;

            if (lastSession && (lastSession.weight || lastSession.height)) {
                // Calculate age
                const recordDate = lastSession.recordedAt || new Date();
                const birthDate = child.birthDate;
                const diffTime = Math.abs(recordDate.getTime() - birthDate.getTime());
                const ageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const weight = lastSession.weight ? Number(lastSession.weight) : undefined;
                const height = lastSession.height ? Number(lastSession.height) : undefined;
                const gender = child.gender || 'M';

                try {
                    growthAnalysis = await this.growthService.analyzeGrowth(
                        child.id,
                        gender,
                        ageDays,
                        weight,
                        height
                    );
                } catch (e) {
                    console.error(`Failed to analyze growth for child ${child.id}:`, e);
                }
            }

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
                        growthAnalysis, // Enhanced data
                        deviceName: lastSession.device?.name || null,
                        deviceUuid: lastSession.device?.deviceUuid || null,
                        posyanduName: lastSession.device?.posyandu?.name || null,
                        villageName: lastSession.device?.posyandu?.village?.name || null,
                        districtName: lastSession.device?.posyandu?.village?.district?.name || null,
                    }
                    : null,
            };
        }));
    }

    async getDevices(userId: number) {
        const scope = await this.scopeService.resolveScope(userId);
        const deviceWhere = this.scopeService.getDeviceWhere(scope);

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
        const scope = await this.scopeService.resolveScope(userId);

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
        const scope = await this.scopeService.resolveScope(userId);
        const where: any = {};

        if (!scope.isAdmin) {
            if (scope.role === UserRole.POSYANDU && scope.villageId) {
                where.villageId = scope.villageId;
            } else if (scope.role === UserRole.PUSKESMAS && scope.districtId) {
                where.village = { districtId: scope.districtId };
            } else {
                return [];
            }
        }

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
        const scope = await this.scopeService.resolveScope(userId);
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
}
