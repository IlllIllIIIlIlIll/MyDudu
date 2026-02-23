import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

export type OperatorScope = {
    userId: number;
    role: UserRole;
    villageIds: number[];
    isAdmin: boolean;
    villageId?: number | null;
    districtId?: number | null;
};

@Injectable()
export class OperatorScopeService {
    constructor(private readonly prisma: PrismaService) { }

    async resolveScope(userId: number): Promise<OperatorScope> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                village: {
                    include: {
                        district: true,
                    },
                },
                district: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isAdmin = user.role === UserRole.ADMIN;
        let villageIds: number[] = [];

        if (user.role === UserRole.POSYANDU && user.villageId) {
            villageIds = [user.villageId];
        } else if (user.role === UserRole.PUSKESMAS && user.districtId) {
            const villages = await this.prisma.village.findMany({
                where: { districtId: user.districtId },
                select: { id: true },
            });
            villageIds = villages.map((v) => v.id);
        }

        return {
            userId: user.id,
            role: user.role,
            villageIds,
            isAdmin,
            villageId: user.villageId,
            districtId: user.districtId,
        };
    }

    getDeviceWhere(scope: OperatorScope) {
        if (scope.isAdmin) return {};
        if (scope.villageIds.length === 0) {
            return { villageId: { in: [-1] } };
        }
        return { villageId: { in: scope.villageIds } };
    }

    getSessionWhere(scope: OperatorScope) {
        if (scope.isAdmin) return {};
        if (scope.villageIds.length === 0) {
            // Return a condition that matches nothing if no villages are in scope
            return { device: { villageId: { in: [-1] } } };
        }
        return { device: { villageId: { in: scope.villageIds } } };
    }
}
