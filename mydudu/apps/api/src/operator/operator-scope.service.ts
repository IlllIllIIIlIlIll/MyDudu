import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

export type OperatorScope = {
    userId: number;
    role: UserRole;
    posyanduIds: number[];
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
                posyanduIds = user.village.posyandus.map((p) => p.id);
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

    getDeviceWhere(scope: OperatorScope) {
        if (scope.isAdmin) return {};
        if (scope.posyanduIds.length === 0) {
            return { posyanduId: { in: [-1] } };
        }
        return { posyanduId: { in: scope.posyanduIds } };
    }

    getSessionWhere(scope: OperatorScope) {
        if (scope.isAdmin) return {};
        if (scope.posyanduIds.length === 0) {
            // Return a condition that matches nothing if no posyandus are in scope
            return { device: { posyanduId: { in: [-1] } } };
        }
        return { device: { posyanduId: { in: scope.posyanduIds } } };
    }
}
